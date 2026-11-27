require('dotenv').config();

const cors = require('cors');
const express = require('express');
const { initAuth, optionalAuth, requireAuth } = require('./auth');
const {
  initStore,
  checkHealth,
  saveGameRecord,
  getRecentGames,
  getUserGames,
  getUserStats,
  getGameById,
} = require('./store');

const app = express();
const port = Number(process.env.PORT || 5000);

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (!origin || allowedOrigins.includes(origin) || (isDevelopment && allowedOrigins.length === 0) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '256kb' }));

// Health check endpoint
app.get('/api/health', async (_request, response) => {
  try {
    const dbStatus = await checkHealth();
    response.json({ status: 'ok', database: dbStatus });
  } catch (error) {
    response.status(503).json({ status: 'error', database: 'unavailable', message: error.message });
  }
});

// Public recent games
app.get('/api/games', async (request, response, next) => {
  const requestedLimit = Number.parseInt(request.query.limit, 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 10;

  try {
    const games = await getRecentGames(limit);
    response.json({ games });
  } catch (error) {
    next(error);
  }
});

// Single game by ID (for match replay / sharing)
app.get('/api/games/:id', async (request, response, next) => {
  try {
    const game = await getGameById(request.params.id);
    if (!game) {
      response.status(404).json({ error: 'Game not found.' });
      return;
    }
    response.json({ game });
  } catch (error) {
    next(error);
  }
});

// Authenticated: Get my games
app.get('/api/me/games', requireAuth, async (request, response, next) => {
  const requestedLimit = Number.parseInt(request.query.limit, 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20;

  try {
    const games = await getUserGames(request.user.uid, limit);
    response.json({ games });
  } catch (error) {
    next(error);
  }
});

// Authenticated: Get my stats
app.get('/api/me/stats', requireAuth, async (request, response, next) => {
  try {
    const stats = await getUserStats(request.user.uid);
    response.json({ stats });
  } catch (error) {
    next(error);
  }
});

// Save a completed game (optional auth attaches to user account)
app.post('/api/games', optionalAuth, async (request, response, next) => {
  const { whitePlayer, blackPlayer, playerColor, mode, difficulty, result, pgn, finalFen } = request.body || {};
  const validName = (name) => typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 64;

  if (!validName(whitePlayer) || !validName(blackPlayer)) {
    response.status(400).json({ error: 'Player names must be between 1 and 64 characters.' });
    return;
  }
  if (!['ai', 'local'].includes(mode) || !['1-0', '0-1', '1/2-1/2'].includes(result)) {
    response.status(400).json({ error: 'Mode or result is invalid.' });
    return;
  }
  if (mode === 'ai' && !['easy', 'medium', 'hard'].includes(difficulty)) {
    response.status(400).json({ error: 'Difficulty is invalid.' });
    return;
  }
  if (playerColor && !['w', 'b'].includes(playerColor)) {
    response.status(400).json({ error: 'Player color is invalid.' });
    return;
  }
  if (typeof pgn !== 'string' || pgn.length < 1 || pgn.length > 50000 || typeof finalFen !== 'string' || finalFen.length > 128) {
    response.status(400).json({ error: 'Game notation is missing or too large.' });
    return;
  }

  try {
    const saved = await saveGameRecord(
      { whitePlayer, blackPlayer, playerColor, mode, difficulty, result, pgn, finalFen },
      request.user
    );
    response.status(201).json({ game: saved });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  if (error.message === 'Origin is not allowed by CORS') {
    response.status(403).json({ error: 'Origin is not allowed.' });
    return;
  }
  response.status(500).json({ error: 'The server could not complete the request.' });
});

async function start() {
  initAuth();
  app.listen(port, '0.0.0.0', () => {
    console.log(`Chess API listening on port ${port}`);
  });
  initStore().catch((error) => {
    console.warn('Storage initialization deferred:', error.message);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Failed to start Chess API:', error);
    process.exit(1);
  });
}

module.exports = { app, start };
