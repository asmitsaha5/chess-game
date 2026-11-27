const crypto = require('node:crypto');
const { Pool } = require('pg');
const { getFirestore } = require('firebase-admin/firestore');
const { isAuthInitialized } = require('./auth');

const useFirestore = process.env.USE_FIRESTORE === 'true';

let pgPool = null;
let firestoreDb = null;

function getPgPool() {
  if (!pgPool) {
    pgPool = new Pool(
      process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
          }
        : {
            host: process.env.PGHOST || 'localhost',
            port: Number(process.env.PGPORT || 5432),
            database: process.env.PGDATABASE || 'chess_game',
            user: process.env.PGUSER || 'chess',
            password: process.env.PGPASSWORD || 'chess',
          }
    );
  }
  return pgPool;
}

function getFirestoreDb() {
  if (!firestoreDb) {
    firestoreDb = getFirestore();
  }
  return firestoreDb;
}

async function initStore() {
  if (useFirestore) {
    console.log('Using Google Cloud Firestore for persistence (zero-cost serverless mode).');
    getFirestoreDb();
    return;
  }

  console.log('Using PostgreSQL for persistence.');
  const pool = getPgPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(128) PRIMARY KEY,
      email VARCHAR(255),
      display_name VARCHAR(64),
      photo_url TEXT,
      games_played INT DEFAULT 0,
      wins INT DEFAULT 0,
      losses INT DEFAULT 0,
      draws INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS games (
      id UUID PRIMARY KEY,
      user_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
      white_player VARCHAR(64) NOT NULL,
      black_player VARCHAR(64) NOT NULL,
      player_color VARCHAR(1),
      mode VARCHAR(8) NOT NULL CHECK (mode IN ('ai', 'local')),
      difficulty VARCHAR(8) CHECK (difficulty IN ('easy', 'medium', 'hard')),
      result VARCHAR(7) NOT NULL CHECK (result IN ('1-0', '0-1', '1/2-1/2')),
      outcome VARCHAR(8) CHECK (outcome IN ('win', 'loss', 'draw')),
      pgn TEXT NOT NULL,
      final_fen TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS games_created_at_idx ON games (created_at DESC);
    CREATE INDEX IF NOT EXISTS games_user_id_idx ON games (user_id, created_at DESC);
  `);
}

async function checkHealth() {
  if (useFirestore) {
    const db = getFirestoreDb();
    await db.collection('_health').doc('ping').get();
    return { driver: 'firestore', status: 'connected' };
  }
  const pool = getPgPool();
  await pool.query('SELECT 1');
  return { driver: 'postgres', status: 'connected' };
}

function calculateOutcome(playerColor, result) {
  if (!playerColor || !['w', 'b'].includes(playerColor)) return null;
  if (result === '1/2-1/2') return 'draw';
  if ((playerColor === 'w' && result === '1-0') || (playerColor === 'b' && result === '0-1')) {
    return 'win';
  }
  return 'loss';
}

async function saveGameRecord(payload, user) {
  const { whitePlayer, blackPlayer, playerColor, mode, difficulty, result, pgn, finalFen } = payload;
  const gameId = crypto.randomUUID();
  const userId = user ? user.uid : null;
  const outcome = calculateOutcome(playerColor, result);
  const now = new Date().toISOString();

  if (useFirestore) {
    const db = getFirestoreDb();
    const batch = db.batch();

    const gameRef = db.collection('games').doc(gameId);
    const gameDoc = {
      id: gameId,
      userId,
      whitePlayer: whitePlayer.trim(),
      blackPlayer: blackPlayer.trim(),
      playerColor: playerColor || null,
      mode,
      difficulty: mode === 'ai' ? difficulty : null,
      result,
      outcome,
      pgn,
      finalFen,
      createdAt: now,
    };
    batch.set(gameRef, gameDoc);

    if (userId) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      const currentStats = userDoc.exists
        ? userDoc.data()
        : { gamesPlayed: 0, wins: 0, losses: 0, draws: 0 };

      const incWin = outcome === 'win' ? 1 : 0;
      const incLoss = outcome === 'loss' ? 1 : 0;
      const incDraw = outcome === 'draw' ? 1 : 0;

      batch.set(
        userRef,
        {
          id: userId,
          email: user.email || null,
          displayName: user.name || user.displayName || whitePlayer || 'Player',
          photoUrl: user.picture || user.photoURL || null,
          gamesPlayed: (currentStats.gamesPlayed || 0) + 1,
          wins: (currentStats.wins || 0) + incWin,
          losses: (currentStats.losses || 0) + incLoss,
          draws: (currentStats.draws || 0) + incDraw,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    await batch.commit();
    return gameDoc;
  }

  // PostgreSQL mode
  const pool = getPgPool();
  if (userId) {
    const incWin = outcome === 'win' ? 1 : 0;
    const incLoss = outcome === 'loss' ? 1 : 0;
    const incDraw = outcome === 'draw' ? 1 : 0;
    const displayName = user.name || user.displayName || whitePlayer.trim() || 'Player';

    await pool.query(
      `INSERT INTO users (id, email, display_name, photo_url, games_played, wins, losses, draws, updated_at)
       VALUES ($1, $2, $3, $4, 1, $5, $6, $7, NOW())
       ON CONFLICT (id) DO UPDATE SET
         email = COALESCE(EXCLUDED.email, users.email),
         display_name = COALESCE(EXCLUDED.display_name, users.display_name),
         photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url),
         games_played = users.games_played + 1,
         wins = users.wins + EXCLUDED.wins,
         losses = users.losses + EXCLUDED.losses,
         draws = users.draws + EXCLUDED.draws,
         updated_at = NOW()`,
      [userId, user.email || null, displayName, user.picture || user.photoURL || null, incWin, incLoss, incDraw]
    );
  }

  const { rows } = await pool.query(
    `INSERT INTO games (id, user_id, white_player, black_player, player_color, mode, difficulty, result, outcome, pgn, final_fen)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id, user_id AS "userId", white_player AS "whitePlayer", black_player AS "blackPlayer",
               player_color AS "playerColor", mode, difficulty, result, outcome,
               pgn, final_fen AS "finalFen", created_at AS "createdAt"`,
    [
      gameId,
      userId,
      whitePlayer.trim(),
      blackPlayer.trim(),
      playerColor || null,
      mode,
      mode === 'ai' ? difficulty : null,
      result,
      outcome,
      pgn,
      finalFen,
    ]
  );
  return rows[0];
}

async function getRecentGames(limit = 10) {
  if (useFirestore) {
    const db = getFirestoreDb();
    const snapshot = await db
      .collection('games')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }

  const pool = getPgPool();
  const { rows } = await pool.query(
    `SELECT id, user_id AS "userId", white_player AS "whitePlayer", black_player AS "blackPlayer",
            player_color AS "playerColor", mode, difficulty, result, outcome,
            pgn, final_fen AS "finalFen", created_at AS "createdAt"
     FROM games
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

async function getUserGames(userId, limit = 20) {
  if (useFirestore) {
    const db = getFirestoreDb();
    const snapshot = await db
      .collection('games')
      .where('userId', '==', userId)
      .limit(limit)
      .get();
    const list = snapshot.docs.map((doc) => doc.data());
    // Sort in memory to avoid requiring a custom composite index in Firestore
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const pool = getPgPool();
  const { rows } = await pool.query(
    `SELECT id, user_id AS "userId", white_player AS "whitePlayer", black_player AS "blackPlayer",
            player_color AS "playerColor", mode, difficulty, result, outcome,
            pgn, final_fen AS "finalFen", created_at AS "createdAt"
     FROM games
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

async function getUserStats(userId) {
  if (useFirestore) {
    const db = getFirestoreDb();
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) {
      return { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, winRate: 0 };
    }
    const data = doc.data();
    const total = data.gamesPlayed || 0;
    const wins = data.wins || 0;
    return {
      ...data,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    };
  }

  const pool = getPgPool();
  const { rows } = await pool.query(
    `SELECT id, email, display_name AS "displayName", photo_url AS "photoUrl",
            games_played AS "gamesPlayed", wins, losses, draws, created_at AS "createdAt"
     FROM users WHERE id = $1`,
    [userId]
  );
  if (rows.length === 0) {
    return { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, winRate: 0 };
  }
  const user = rows[0];
  const total = user.gamesPlayed || 0;
  const wins = user.wins || 0;
  return {
    ...user,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
  };
}

async function getGameById(gameId) {
  if (useFirestore) {
    const db = getFirestoreDb();
    const doc = await db.collection('games').doc(gameId).get();
    return doc.exists ? doc.data() : null;
  }

  const pool = getPgPool();
  const { rows } = await pool.query(
    `SELECT id, user_id AS "userId", white_player AS "whitePlayer", black_player AS "blackPlayer",
            player_color AS "playerColor", mode, difficulty, result, outcome,
            pgn, final_fen AS "finalFen", created_at AS "createdAt"
     FROM games WHERE id = $1`,
    [gameId]
  );
  return rows.length ? rows[0] : null;
}

module.exports = {
  initStore,
  checkHealth,
  saveGameRecord,
  getRecentGames,
  getUserGames,
  getUserStats,
  getGameById,
};
