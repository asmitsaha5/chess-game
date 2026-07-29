import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const gameSchema = z.object({
  mode: z.enum(['ai', 'local']),
  difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional(),
  playerColor: z.enum(['w', 'b']),
  result: z.enum(['white_win', 'black_win', 'draw', 'abandoned']),
  termination: z.string().trim().min(1).max(80),
  pgn: z.string().max(20000),
  finalFen: z.string().trim().min(1).max(200),
  moveCount: z.number().int().min(0).max(1000),
});

router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const game = gameSchema.parse(req.body);
    if (game.mode === 'ai' && !game.difficulty) return res.status(400).json({ error: 'Difficulty is required for AI games.' });
    const result = await pool.query(
      `INSERT INTO games (user_id, mode, difficulty, player_color, result, termination, pgn, final_fen, move_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, mode, difficulty, player_color, result, termination, pgn, final_fen, move_count, completed_at`,
      [req.user.sub, game.mode, game.difficulty || null, game.playerColor, game.result, game.termination, game.pgn, game.finalFen, game.moveCount]
    );
    return res.status(201).json({ game: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const result = await pool.query(
      `SELECT id, mode, difficulty, player_color, result, termination, pgn, final_fen, move_count, completed_at
       FROM games WHERE user_id = $1 ORDER BY completed_at DESC LIMIT $2`,
      [req.user.sub, limit]
    );
    return res.json({ games: result.rows });
  } catch (error) {
    return next(error);
  }
});

export default router;
