import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
});
const registration = credentials.extend({ displayName: z.string().trim().min(2).max(40) });

function publicUser(user) {
  return { id: user.id, email: user.email, displayName: user.display_name, createdAt: user.created_at };
}
function tokenFor(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

router.post('/register', async (req, res, next) => {
  try {
    const input = registration.parse(req.body);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, created_at',
      [input.email, passwordHash, input.displayName]
    );
    const user = result.rows[0];
    return res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) {
    if (error?.code === '23505') return res.status(409).json({ error: 'An account already exists for this email.' });
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const input = credentials.parse(req.body);
    const result = await pool.query('SELECT id, email, password_hash, display_name, created_at FROM users WHERE email = $1', [input.email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    return res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, email, display_name, created_at FROM users WHERE id = $1', [req.user.sub]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Account not found.' });
    return res.json({ user: publicUser(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

export default router;
