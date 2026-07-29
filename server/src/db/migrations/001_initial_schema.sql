CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_lowercase CHECK (email = lower(email)),
  CONSTRAINT users_display_name_length CHECK (char_length(display_name) BETWEEN 2 AND 40)
);

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('ai', 'local')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  player_color CHAR(1) NOT NULL CHECK (player_color IN ('w', 'b')),
  result TEXT NOT NULL CHECK (result IN ('white_win', 'black_win', 'draw', 'abandoned')),
  termination TEXT NOT NULL,
  pgn TEXT NOT NULL,
  final_fen TEXT NOT NULL,
  move_count INTEGER NOT NULL CHECK (move_count >= 0),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX games_user_completed_at_idx ON games (user_id, completed_at DESC);
