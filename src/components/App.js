import '../styles/App.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import logo from '../assets/logo.png';
import { getBestMove } from '../game/ai';
import { getHighlightStyles, getLastMoveStyles, BOARD_THEMES } from '../game/boardStyles';
import { cloneGame, getCapturedPieces, getGameStatus, getLastMoveFromHistory, getLegalMoves, getMovePairs, isPromotionMove } from '../game/chessUtils';
import GameOverModal from './GameOverModal';
import GameSetup from './GameSetup';
import PromotionPicker from './PromotionPicker';

const PIECE_NAMES = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen' };
const PIECE_SYMBOLS = {
  white: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕' },
  black: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' },
};

function CapturedGroup({ title, color, pieces }) {
  return <div className="capture-group"><strong>{title}</strong><p>{pieces.length ? pieces.map((piece, index) => <span key={`${piece}-${index}`} className="piece-symbol" aria-label={`${color} ${PIECE_NAMES[piece]}`} title={`${color} ${PIECE_NAMES[piece]}`}>{PIECE_SYMBOLS[color.toLowerCase()][piece]}</span>) : 'None'}</p></div>;
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
  const [mode, setMode] = useState('ai');
  const [setupMode, setSetupMode] = useState('ai');
  const [playerColor, setPlayerColor] = useState(null);
  const [boardWidth, setBoardWidth] = useState(440);
  const computerMoveTimeout = useRef(null);
  const boardContainerRef = useRef(null);

  const computerColor = mode === 'ai' && playerColor ? (playerColor === 'w' ? 'b' : 'w') : null;
  const status = getGameStatus(game, isThinking, playerColor, mode);
  const moveHistory = game.history();
  const movePairs = getMovePairs(moveHistory);
  const capturedPieces = getCapturedPieces(game);
  const boardTheme = BOARD_THEMES[boardThemeKey];
  const legalMoves = selectedSquare ? getLegalMoves(game, selectedSquare) : [];
  const customSquareStyles = { ...getLastMoveStyles(lastMove, boardTheme), ...(selectedSquare ? getHighlightStyles(selectedSquare, legalMoves, boardTheme) : {}) };
  const canUndo = moveHistory.length > 0 || pendingPromotion !== null;

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
        if (nextGame.game_over() || bestMove === null) return nextGame;
        const move = nextGame.move(bestMove.san);
        setLastMove(move ? { from: move.from, to: move.to } : null);
        return nextGame;
      });
      setIsThinking(false);
      computerMoveTimeout.current = null;
    }, 300);
  }, [computerColor, difficulty]);

  const makeMove = (source, target, promotion = 'q') => {
    const nextGame = cloneGame(game);
    const move = nextGame.move({ from: source, to: target, promotion });
    if (!move) return false;
    setGame(nextGame);
    setLastMove({ from: move.from, to: move.to });
    setSelectedSquare(null);
    if (mode === 'ai' && !nextGame.game_over()) scheduleComputerMove();
    return true;
  };

  function onDrop(source, target) {
    const isPlayersTurn = mode === 'local' || game.turn() === playerColor;
    if (!playerColor || status.isGameOver || isThinking || pendingPromotion || !isPlayersTurn) return false;
    if (isPromotionMove(game, source, target, game.turn())) {
      setPendingPromotion({ source, target });
      setSelectedSquare(null);
      return false;
    }
    return makeMove(source, target);
  }

  function choosePromotion(piece) {
    if (!pendingPromotion) return;
    const { source, target } = pendingPromotion;
    setPendingPromotion(null);
    makeMove(source, target, piece);
  }

  function undoTurn() {
    clearComputerMove();
    setIsThinking(false);
    setPendingPromotion(null);
    setSelectedSquare(null);
    setGame((currentGame) => {
      const nextGame = cloneGame(currentGame);
      const movesToUndo = mode === 'ai' && nextGame.turn() === playerColor ? 2 : 1;
      for (let index = 0; index < movesToUndo; index += 1) if (!nextGame.undo()) break;
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
    setSetupMode(mode);
  }, [clearComputerMove, difficulty, mode]);

  const startGame = useCallback((color) => {
    clearComputerMove();
    setMode(setupMode);
    setPlayerColor(color);
    if (setupMode === 'ai') setDifficulty(setupDifficulty);
    setGame(new Chess());
    setIsThinking(false);
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLastMove(null);
  }, [clearComputerMove, setupDifficulty, setupMode]);

  function handleSquareClick(square) {
    const isPlayersTurn = mode === 'local' || game.turn() === playerColor;
    if (!playerColor || status.isGameOver || isThinking || pendingPromotion || !isPlayersTurn) return;
    const clickedPiece = game.get(square);
    const existingMove = legalMoves.find((move) => move.to === square);
    if (selectedSquare && existingMove) {
      onDrop(selectedSquare, square);
    } else if (clickedPiece?.color === game.turn()) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  }

  useEffect(() => {
    const handleKeyPress = (event) => { if (event.key === 'Enter') restartGame(); };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [restartGame]);
  useEffect(() => clearComputerMove, [clearComputerMove]);
  useEffect(() => {
    if (playerColor && game.history().length === 0 && game.turn() === computerColor && !isThinking) scheduleComputerMove();
  }, [computerColor, game, isThinking, playerColor, scheduleComputerMove]);
  useEffect(() => {
    const container = boardContainerRef.current;
    if (!container) return undefined;
    const updateBoardWidth = () => { const width = Math.floor(container.clientWidth); if (width > 0) setBoardWidth(Math.min(440, width)); };
    updateBoardWidth();
    if (typeof window.ResizeObserver !== 'function') {
      window.addEventListener('resize', updateBoardWidth);
      return () => window.removeEventListener('resize', updateBoardWidth);
    }
    const observer = new window.ResizeObserver(updateBoardWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return <div className="app">
    <header className="header"><div className="brand"><img src={logo} alt="Chess Logo" className="game-image" /><div className="game-info"><h1>A chess game</h1></div></div><div className="theme-picker"><span className="label">Board theme</span><div className="theme-options">{Object.entries(BOARD_THEMES).map(([key, theme]) => <button key={key} type="button" className={key === boardThemeKey ? 'theme-option active' : 'theme-option'} onClick={() => setBoardThemeKey(key)} aria-label={theme.name} aria-pressed={key === boardThemeKey}><span className="theme-swatch" style={{ background: `linear-gradient(135deg, ${theme.light} 50%, ${theme.dark} 50%)` }} aria-hidden="true" />{theme.name}</button>)}</div></div></header>
    <div className="top-actions" aria-label="Game controls"><div className="action-row"><button type="button" className="restart-button" onClick={restartGame}>Restart</button><button type="button" className="undo-button" onClick={undoTurn} disabled={!canUndo}>Undo</button></div></div>
    <main className="game-layout"><aside className="side-panel" aria-label="Game details"><div className="status-card"><span className="label">Status</span><strong>{status.title}</strong><p>{status.detail}</p></div><div className="captured-pieces"><span className="label">Captured pieces</span><div className="capture-grid"><CapturedGroup title="White captured" color="Black" pieces={capturedPieces.black} /><CapturedGroup title="Black captured" color="White" pieces={capturedPieces.white} /></div></div><div className="move-history"><span className="label">Move history</span>{movePairs.length ? <ol>{movePairs.map((pair) => <li key={pair.turn}><span>{pair.turn}.</span><strong>{pair.white}</strong><strong>{pair.black}</strong></li>)}</ol> : <p>No moves yet</p>}</div></aside>
      <section className="board-panel" aria-label="Chess board"><div className="chessboard-container" ref={boardContainerRef}><Chessboard position={game.fen()} onPieceDrop={onDrop} onSquareClick={handleSquareClick} boardWidth={boardWidth} customLightSquareStyle={{ backgroundColor: boardTheme.light }} customDarkSquareStyle={{ backgroundColor: boardTheme.dark }} customSquareStyles={customSquareStyles} boardOrientation={playerColor === 'b' ? 'black' : 'white'} isDraggablePiece={({ piece }) => Boolean(playerColor) && !isThinking && !status.isGameOver && !pendingPromotion && (mode === 'local' ? piece.startsWith(game.turn()) : piece.startsWith(playerColor))} />{!playerColor && <GameSetup mode={setupMode} difficulty={setupDifficulty} onModeChange={setSetupMode} onDifficultyChange={setSetupDifficulty} onStart={startGame} />}{status.isGameOver && <GameOverModal status={status} onRestart={restartGame} />}{pendingPromotion && <PromotionPicker onChoose={choosePromotion} />}</div></section>
    </main>
  </div>;
}

export default App;
