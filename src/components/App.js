// App.js

import '../styles/App.css';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import logo from '../assets/logo.png';

const COLOR_OPTIONS = [
  { key: 'w', label: 'White' },
  { key: 'b', label: 'Black' },
];
const PIECE_NAMES = {
  p: 'Pawn',
  n: 'Knight',
  b: 'Bishop',
  r: 'Rook',
  q: 'Queen',
};
const PIECE_SYMBOLS = {
  white: {
    p: '♙',
    n: '♘',
    b: '♗',
    r: '♖',
    q: '♕',
  },
  black: {
    p: '♟',
    n: '♞',
    b: '♝',
    r: '♜',
    q: '♛',
  },
};
const PROMOTION_OPTIONS = [
  { piece: 'q', label: 'Queen' },
  { piece: 'r', label: 'Rook' },
  { piece: 'b', label: 'Bishop' },
  { piece: 'n', label: 'Knight' },
];
const DIFFICULTY_OPTIONS = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
];
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};
const BOARD_THEMES = {
  classic: {
    name: 'Classic',
    light: '#f0d9b5',
    dark: '#b58863',
    lastMove: 'rgba(244, 201, 93, 0.42)',
    selected: 'rgba(255, 214, 102, 0.72)',
    move: 'rgba(40, 56, 38, 0.32)',
    capture: 'rgba(183, 48, 48, 0.5)',
  },
  ocean: {
    name: 'Ocean',
    light: '#d5edf6',
    dark: '#4f8fa8',
    lastMove: 'rgba(244, 201, 93, 0.44)',
    selected: 'rgba(255, 214, 102, 0.76)',
    move: 'rgba(12, 70, 92, 0.32)',
    capture: 'rgba(187, 62, 62, 0.54)',
  },
  forest: {
    name: 'Forest',
    light: '#e3e1bd',
    dark: '#6f8f4e',
    lastMove: 'rgba(244, 201, 93, 0.44)',
    selected: 'rgba(255, 214, 102, 0.76)',
    move: 'rgba(38, 76, 48, 0.34)',
    capture: 'rgba(160, 50, 46, 0.56)',
  },
};

function cloneGame(sourceGame) {
  const copy = new Chess();
  const pgn = sourceGame.pgn();

  if (pgn) {
    copy.load_pgn(pgn);
  } else {
    copy.load(sourceGame.fen());
  }

  return copy;
}

function getGameStatus(game, isThinking, playerColor) {
  const currentPlayer = game.turn() === 'w' ? 'White' : 'Black';

  if (!playerColor) {
    return {
      isGameOver: false,
      title: 'Choose your side',
      detail: 'Pick a level and color to start',
    };
  }

  if (game.in_checkmate()) {
    const winner = game.turn() === 'w' ? 'Black' : 'White';
    return {
      isGameOver: true,
      title: 'Checkmate',
      detail: `${winner} wins`,
    };
  }

  if (game.in_stalemate()) {
    return {
      isGameOver: true,
      title: 'Stalemate',
      detail: 'The game is a draw',
    };
  }

  if (game.insufficient_material()) {
    return {
      isGameOver: true,
      title: 'Draw',
      detail: 'Insufficient material',
    };
  }

  if (game.in_threefold_repetition()) {
    return {
      isGameOver: true,
      title: 'Draw',
      detail: 'Threefold repetition',
    };
  }

  if (game.in_draw()) {
    return {
      isGameOver: true,
      title: 'Draw',
      detail: 'No winner',
    };
  }

  if (isThinking) {
    return {
      isGameOver: false,
      title: 'Computer is thinking',
      detail: `${currentPlayer} to move`,
    };
  }

  if (game.in_check()) {
    return {
      isGameOver: false,
      title: `${currentPlayer} is in check`,
      detail: `${currentPlayer} to move`,
    };
  }

  return {
    isGameOver: false,
    title: `${currentPlayer} to move`,
    detail: game.turn() === playerColor ? 'Your turn' : 'Computer turn',
  };
}

function getCapturedPieces(game) {
  return game.history({ verbose: true }).reduce(
    (captured, move) => {
      if (!move.captured) return captured;

      const capturedColor = move.color === 'w' ? 'black' : 'white';
      return {
        ...captured,
        [capturedColor]: [...captured[capturedColor], move.captured],
      };
    },
    { white: [], black: [] }
  );
}

function isPromotionMove(game, source, target, playerColor) {
  const promotionRank = playerColor === 'w' ? '8' : '1';

  return game.moves({ square: source, verbose: true }).some(
    (move) =>
      move.piece === 'p' &&
      move.color === playerColor &&
      move.from === source &&
      move.to === target &&
      target[1] === promotionRank
  );
}

function getLegalMoves(game, square) {
  return game.moves({ square, verbose: true });
}

function getHighlightStyles(square, legalMoves, theme) {
  const styles = {
    [square]: {
      background: `radial-gradient(circle, transparent 58%, ${theme.selected} 60%, ${theme.selected} 72%, transparent 74%)`,
    },
  };

  legalMoves.forEach((move) => {
    styles[move.to] = move.captured
      ? {
          background: `radial-gradient(circle, transparent 50%, ${theme.capture} 52%, ${theme.capture} 72%, transparent 74%)`,
        }
      : {
          background: `radial-gradient(circle, ${theme.move} 18%, transparent 20%)`,
        };
  });

  return styles;
}

function getLastMoveStyles(lastMove, theme) {
  if (!lastMove) return {};

  return {
    [lastMove.from]: {
      background: `linear-gradient(${theme.lastMove}, ${theme.lastMove})`,
    },
    [lastMove.to]: {
      background: `linear-gradient(${theme.lastMove}, ${theme.lastMove})`,
    },
  };
}

function getMovePairs(moveHistory) {
  const pairs = [];

  for (let index = 0; index < moveHistory.length; index += 2) {
    pairs.push({
      turn: index / 2 + 1,
      white: moveHistory[index],
      black: moveHistory[index + 1] || '',
    });
  }

  return pairs;
}

function getLastMoveFromHistory(game) {
  const history = game.history({ verbose: true });
  const lastMove = history[history.length - 1];

  return lastMove ? { from: lastMove.from, to: lastMove.to } : null;
}

function getRandomMove(moves) {
  return moves[Math.floor(Math.random() * moves.length)];
}

function scoreMove(game, move) {
  const nextGame = cloneGame(game);
  nextGame.move(move.san);

  if (nextGame.in_checkmate()) return 100000;

  let score = move.captured ? PIECE_VALUES[move.captured] : 0;
  if (move.promotion) score += PIECE_VALUES[move.promotion] - PIECE_VALUES.p;
  if (nextGame.in_check()) score += 45;

  return score;
}

function evaluatePosition(game, computerColor) {
  if (game.in_checkmate()) {
    return game.turn() === computerColor ? -100000 : 100000;
  }

  if (game.in_draw() || game.in_stalemate() || game.insufficient_material()) {
    return 0;
  }

  return game.board().flat().reduce((score, piece) => {
    if (!piece) return score;
    const pieceScore = PIECE_VALUES[piece.type];
    return piece.color === computerColor ? score + pieceScore : score - pieceScore;
  }, 0);
}

function minimax(game, depth, alpha, beta, computerColor) {
  if (depth === 0 || game.game_over()) {
    return evaluatePosition(game, computerColor);
  }

  const moves = game.moves({ verbose: true });
  const isComputerTurn = game.turn() === computerColor;
  let bestScore = isComputerTurn ? -Infinity : Infinity;

  for (const move of moves) {
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

function getBestMove(game, difficulty, computerColor) {
  const moves = game.moves({ verbose: true });

  if (moves.length === 0) return null;
  if (difficulty === 'easy') return getRandomMove(moves);

  if (difficulty === 'medium') {
    const scoredMoves = moves.map((move) => ({
      move,
      score: scoreMove(game, move),
    }));
    const bestScore = Math.max(...scoredMoves.map(({ score }) => score));
    const bestMoves = scoredMoves.filter(({ score }) => score === bestScore).map(({ move }) => move);
    return getRandomMove(bestMoves);
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

function App() {
  const [game, setGame] = useState(new Chess());
  const [isThinking, setIsThinking] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [boardThemeKey, setBoardThemeKey] = useState('classic');
  const [difficulty, setDifficulty] = useState('easy');
  const [setupDifficulty, setSetupDifficulty] = useState('easy');
  const [playerColor, setPlayerColor] = useState(null);
  const [boardWidth, setBoardWidth] = useState(440);
  const computerMoveTimeout = useRef(null);
  const boardContainerRef = useRef(null);

  const computerColor = playerColor ? (playerColor === 'w' ? 'b' : 'w') : null;
  const status = getGameStatus(game, isThinking, playerColor);
  const moveHistory = game.history();
  const movePairs = getMovePairs(moveHistory);
  const capturedPieces = getCapturedPieces(game);
  const canUndo = moveHistory.length > 0 || pendingPromotion !== null;
  const boardTheme = BOARD_THEMES[boardThemeKey];
  const legalMoves = selectedSquare ? getLegalMoves(game, selectedSquare) : [];
  const customSquareStyles = {
    ...getLastMoveStyles(lastMove, boardTheme),
    ...(selectedSquare ? getHighlightStyles(selectedSquare, legalMoves, boardTheme) : {}),
  };

  const clearComputerMove = useCallback(() => {
    if (computerMoveTimeout.current) {
      clearTimeout(computerMoveTimeout.current);
      computerMoveTimeout.current = null;
    }
  }, []);

  const scheduleComputerMove = useCallback(() => {
    setIsThinking(true);
    setSelectedSquare(null);

    computerMoveTimeout.current = setTimeout(() => {
      setGame((currentGame) => {
        const nextGame = cloneGame(currentGame);
        const bestMove = getBestMove(nextGame, difficulty, computerColor);

        if (nextGame.game_over() || bestMove === null) {
          return nextGame;
        }

        const move = nextGame.move(bestMove.san);
        setLastMove(move ? { from: move.from, to: move.to } : null);
        return nextGame;
      });
      setIsThinking(false);
      computerMoveTimeout.current = null;
    }, 300);
  }, [computerColor, difficulty]);

  function onDrop(source, target) {
    if (
      !playerColor ||
      status.isGameOver ||
      isThinking ||
      pendingPromotion ||
      game.turn() !== playerColor
    ) {
      return false;
    }

    if (isPromotionMove(game, source, target, playerColor)) {
      setPendingPromotion({ source, target });
      setSelectedSquare(null);
      return false;
    }

    const nextGame = cloneGame(game);
    const move = nextGame.move({
      from: source,
      to: target,
      promotion: 'q',
    });

    if (move === null) return false;

    setGame(nextGame);
    setLastMove({ from: move.from, to: move.to });
    setSelectedSquare(null);

    if (!nextGame.game_over()) {
      scheduleComputerMove();
    }

    return true;
  }

  function choosePromotion(piece) {
    if (!pendingPromotion) return;

    const nextGame = cloneGame(game);
    const move = nextGame.move({
      from: pendingPromotion.source,
      to: pendingPromotion.target,
      promotion: piece,
    });

    setPendingPromotion(null);

    if (move === null) return;

    setGame(nextGame);
    setLastMove({ from: move.from, to: move.to });
    setSelectedSquare(null);

    if (!nextGame.game_over()) {
      scheduleComputerMove();
    }
  }

  function undoTurn() {
    clearComputerMove();
    setIsThinking(false);
    setPendingPromotion(null);
    setSelectedSquare(null);

    setGame((currentGame) => {
      const nextGame = cloneGame(currentGame);
      const movesToUndo = nextGame.turn() === playerColor ? 2 : 1;

      for (let index = 0; index < movesToUndo; index += 1) {
        if (!nextGame.undo()) break;
      }

      setLastMove(getLastMoveFromHistory(nextGame));
      return nextGame;
    });
  }

  const restartGame = useCallback(() => {
    clearComputerMove();
    setGame(new Chess());
    setIsThinking(false);
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLastMove(null);
    setPlayerColor(null);
    setSetupDifficulty(difficulty);
  }, [clearComputerMove, difficulty]);

  const startGameAs = useCallback(
    (color) => {
      clearComputerMove();
      setPlayerColor(color);
      setDifficulty(setupDifficulty);
      setGame(new Chess());
      setIsThinking(false);
      setPendingPromotion(null);
      setSelectedSquare(null);
      setLastMove(null);
    },
    [clearComputerMove, setupDifficulty]
  );

  function handleSquareClick(square) {
    if (
      !playerColor ||
      status.isGameOver ||
      isThinking ||
      pendingPromotion ||
      game.turn() !== playerColor
    ) {
      return;
    }

    const clickedPiece = game.get(square);
    const existingMove = legalMoves.find((move) => move.to === square);

    if (selectedSquare && existingMove) {
      onDrop(selectedSquare, square);
      return;
    }

    if (clickedPiece?.color === playerColor) {
      setSelectedSquare(square);
      return;
    }

    setSelectedSquare(null);
  }

  useEffect(() => {
    function handleKeyPress(event) {
      if (event.key === 'Enter') {
        restartGame();
      }
    }
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [restartGame]);

  useEffect(() => clearComputerMove, [clearComputerMove]);

  useEffect(() => {
    if (playerColor && game.history().length === 0 && game.turn() === computerColor && !isThinking) {
      scheduleComputerMove();
    }
  }, [computerColor, game, isThinking, playerColor, scheduleComputerMove]);

  useEffect(() => {
    const container = boardContainerRef.current;
    if (!container) return undefined;

    const updateBoardWidth = () => {
      const containerWidth = Math.floor(container.clientWidth);
      if (containerWidth > 0) {
        setBoardWidth(Math.min(440, containerWidth));
      }
    };

    updateBoardWidth();

    if (typeof window.ResizeObserver !== 'function') {
      window.addEventListener('resize', updateBoardWidth);
      return () => {
        window.removeEventListener('resize', updateBoardWidth);
      };
    }

    const observer = new window.ResizeObserver(updateBoardWidth);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <img src={logo} alt="Chess Logo" className="game-image" />
          <div className="game-info">
            <h1>A chess game</h1>
          </div>
        </div>

        <div className="theme-picker">
          <span className="label">Board theme</span>
          <div className="theme-options">
            {Object.entries(BOARD_THEMES).map(([key, theme]) => (
              <button
                key={key}
                type="button"
                className={key === boardThemeKey ? 'theme-option active' : 'theme-option'}
                onClick={() => setBoardThemeKey(key)}
                aria-pressed={key === boardThemeKey}
              >
                <span
                  className="theme-swatch"
                  style={{
                    background: `linear-gradient(135deg, ${theme.light} 50%, ${theme.dark} 50%)`,
                  }}
                  aria-hidden="true"
                />
                {theme.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="top-actions" aria-label="Game controls">
        <div className="action-row">
          <button type="button" className="restart-button" onClick={restartGame}>
            Restart
          </button>
          <button type="button" className="undo-button" onClick={undoTurn} disabled={!canUndo}>
            Undo
          </button>
        </div>
      </div>

      <main className="game-layout">
        <aside className="side-panel" aria-label="Game details">
          <div className="status-card">
            <span className="label">Status</span>
            <strong>{status.title}</strong>
            <p>{status.detail}</p>
          </div>

          <div className="captured-pieces">
            <span className="label">Captured pieces</span>
            <div className="capture-grid">
              <div className="capture-group">
                <strong>White captured</strong>
                <p>
                  {capturedPieces.black.length > 0
                    ? capturedPieces.black.map((piece, index) => (
                        <span
                          key={`${piece}-${index}`}
                          className="piece-symbol"
                          aria-label={`Black ${PIECE_NAMES[piece]}`}
                          title={`Black ${PIECE_NAMES[piece]}`}
                        >
                          {PIECE_SYMBOLS.black[piece]}
                        </span>
                      ))
                    : 'None'}
                </p>
              </div>
              <div className="capture-group">
                <strong>Black captured</strong>
                <p>
                  {capturedPieces.white.length > 0
                    ? capturedPieces.white.map((piece, index) => (
                        <span
                          key={`${piece}-${index}`}
                          className="piece-symbol"
                          aria-label={`White ${PIECE_NAMES[piece]}`}
                          title={`White ${PIECE_NAMES[piece]}`}
                        >
                          {PIECE_SYMBOLS.white[piece]}
                        </span>
                      ))
                    : 'None'}
                </p>
              </div>
            </div>
          </div>

          <div className="move-history">
            <span className="label">Move history</span>
            {movePairs.length > 0 ? (
              <ol>
                {movePairs.map((pair) => (
                  <li key={pair.turn}>
                    <span>{pair.turn}.</span>
                    <strong>{pair.white}</strong>
                    <strong>{pair.black}</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No moves yet</p>
            )}
          </div>
        </aside>

        <section className="board-panel" aria-label="Chess board">
          <div className="chessboard-container" ref={boardContainerRef}>
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              onSquareClick={handleSquareClick}
              boardWidth={boardWidth}
              customLightSquareStyle={{ backgroundColor: boardTheme.light }}
              customDarkSquareStyle={{ backgroundColor: boardTheme.dark }}
              customSquareStyles={customSquareStyles}
              boardOrientation={playerColor === 'b' ? 'black' : 'white'}
              isDraggablePiece={({ piece }) =>
                Boolean(playerColor) &&
                piece.startsWith(playerColor) &&
                !isThinking &&
                !status.isGameOver &&
                !pendingPromotion
              }
            />
            {!playerColor && (
              <div className="welcome-backdrop">
                <div className="welcome-card" role="dialog" aria-label="Choose player color">
                  <span className="label">Welcome</span>
                  <p>Set up your game</p>
                  <div className="welcome-section">
                    <span className="label">Computer level</span>
                    <div className="welcome-difficulty-options">
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={
                            option.key === setupDifficulty
                              ? 'welcome-difficulty-option active'
                              : 'welcome-difficulty-option'
                          }
                          onClick={() => setSetupDifficulty(option.key)}
                          aria-pressed={option.key === setupDifficulty}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="welcome-section">
                    <span className="label">Play as</span>
                    <div className="welcome-options">
                      {COLOR_OPTIONS.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => startGameAs(option.key)}
                        >
                          Play as {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {status.isGameOver && (
              <div className="game-over-backdrop">
                <div className="game-over" role="status">
                  <span>Game over</span>
                  <p>{status.title}</p>
                  <strong>{status.detail}</strong>
                  <button type="button" onClick={restartGame}>
                    Play again
                  </button>
                </div>
              </div>
            )}
            {pendingPromotion && (
              <div className="promotion-backdrop">
                <div className="promotion-picker" role="dialog" aria-label="Choose promotion piece">
                  <span className="label">Promote pawn</span>
                  <div className="promotion-options">
                    {PROMOTION_OPTIONS.map((option) => (
                      <button
                        key={option.piece}
                        type="button"
                        onClick={() => choosePromotion(option.piece)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
