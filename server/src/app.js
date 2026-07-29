import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/games.js';

export const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '100kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }), authRoutes);
app.use('/api/games', gameRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use((error, _req, res, _next) => {
  if (error instanceof ZodError) return res.status(400).json({ error: 'Invalid request data.', details: error.flatten() });
  console.error(error);
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});
