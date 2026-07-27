import { cloneGame } from './chessUtils';

export const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

function getRandomMove(moves) {
  return moves[Math.floor(Math.random() * moves.length)];
}

export function scoreMove(game, move) {
  const nextGame = cloneGame(game);
  nextGame.move(move.san);

  if (nextGame.in_checkmate()) return 100000;

  let score = move.captured ? PIECE_VALUES[move.captured] : 0;
  if (move.promotion) score += PIECE_VALUES[move.promotion] - PIECE_VALUES.p;
  if (nextGame.in_check()) score += 45;
  return score;
}

export function evaluatePosition(game, computerColor) {
  if (game.in_checkmate()) return game.turn() === computerColor ? -100000 : 100000;
  if (game.in_draw() || game.in_stalemate() || game.insufficient_material()) return 0;

  return game.board().flat().reduce((score, piece) => {
    if (!piece) return score;
    const pieceScore = PIECE_VALUES[piece.type];
    return piece.color === computerColor ? score + pieceScore : score - pieceScore;
  }, 0);
}

export function minimax(game, depth, alpha, beta, computerColor) {
  if (depth === 0 || game.game_over()) return evaluatePosition(game, computerColor);

  const isComputerTurn = game.turn() === computerColor;
  let bestScore = isComputerTurn ? -Infinity : Infinity;

  for (const move of game.moves({ verbose: true })) {
    game.move(move.san);
    const score = minimax(game, depth - 1, alpha, beta, computerColor);
    game.undo();

    if (isComputerTurn) {
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, bestScore);
    } else {
      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, bestScore);
    }
    if (beta <= alpha) break;
  }

  return bestScore;
}

export function getBestMove(game, difficulty, computerColor) {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;
  if (difficulty === 'easy') return getRandomMove(moves);

  if (difficulty === 'medium') {
    const scoredMoves = moves.map((move) => ({ move, score: scoreMove(game, move) }));
    const bestScore = Math.max(...scoredMoves.map(({ score }) => score));
    return getRandomMove(scoredMoves.filter(({ score }) => score === bestScore).map(({ move }) => move));
  }

  let bestScore = -Infinity;
  let bestMoves = [];
  moves.forEach((move) => {
    game.move(move.san);
    const score = minimax(game, 2, -Infinity, Infinity, computerColor);
    game.undo();
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  });
  return getRandomMove(bestMoves);
}
