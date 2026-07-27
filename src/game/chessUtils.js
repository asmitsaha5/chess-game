import { Chess } from 'chess.js';

export function cloneGame(sourceGame) {
  const copy = new Chess();
  const pgn = sourceGame.pgn();
  if (pgn) copy.load_pgn(pgn);
  else copy.load(sourceGame.fen());
  return copy;
}

export function getGameStatus(game, isThinking, playerColor, mode) {
  const currentPlayer = game.turn() === 'w' ? 'White' : 'Black';
  if (!playerColor) return { isGameOver: false, title: 'Choose your side', detail: mode === 'local' ? 'Pick a color to start' : 'Pick a level and color to start' };
  if (game.in_checkmate()) return { isGameOver: true, title: 'Checkmate', detail: `${game.turn() === 'w' ? 'Black' : 'White'} wins` };
  if (game.in_stalemate()) return { isGameOver: true, title: 'Stalemate', detail: 'The game is a draw' };
  if (game.insufficient_material()) return { isGameOver: true, title: 'Draw', detail: 'Insufficient material' };
  if (game.in_threefold_repetition()) return { isGameOver: true, title: 'Draw', detail: 'Threefold repetition' };
  if (game.in_draw()) return { isGameOver: true, title: 'Draw', detail: 'No winner' };
  if (isThinking) return { isGameOver: false, title: 'Computer is thinking', detail: `${currentPlayer} to move` };
  if (game.in_check()) return { isGameOver: false, title: `${currentPlayer} is in check`, detail: `${currentPlayer} to move` };
  return { isGameOver: false, title: `${currentPlayer} to move`, detail: mode === 'local' ? `${currentPlayer}'s turn` : game.turn() === playerColor ? 'Your turn' : 'Computer turn' };
}

export function getCapturedPieces(game) {
  return game.history({ verbose: true }).reduce((captured, move) => {
    if (!move.captured) return captured;
    const capturedColor = move.color === 'w' ? 'black' : 'white';
    return { ...captured, [capturedColor]: [...captured[capturedColor], move.captured] };
  }, { white: [], black: [] });
}

export function getLegalMoves(game, square) {
  return game.moves({ square, verbose: true });
}

export function isPromotionMove(game, source, target, playerColor) {
  const promotionRank = playerColor === 'w' ? '8' : '1';
  return getLegalMoves(game, source).some((move) => move.piece === 'p' && move.color === playerColor && move.from === source && move.to === target && target[1] === promotionRank);
}

export function getMovePairs(moveHistory) {
  const pairs = [];
  for (let index = 0; index < moveHistory.length; index += 2) pairs.push({ turn: index / 2 + 1, white: moveHistory[index], black: moveHistory[index + 1] || '' });
  return pairs;
}

export function getLastMoveFromHistory(game) {
  const history = game.history({ verbose: true });
  const lastMove = history[history.length - 1];
  return lastMove ? { from: lastMove.from, to: lastMove.to } : null;
}
