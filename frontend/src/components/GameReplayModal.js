import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getLastMoveStyles } from '../game/boardStyles';

export default function GameReplayModal({ gameData, boardTheme, onClose }) {
  const [moveIndex, setMoveIndex] = useState(0);

  // Parse moves from PGN
  const { moves, totalMoves } = useMemo(() => {
    if (!gameData?.pgn) return { moves: [], totalMoves: 0 };
    const temp = new Chess();
    try {
      temp.load_pgn(gameData.pgn);
      const history = temp.history({ verbose: true });
      return { moves: history, totalMoves: history.length };
    } catch (_e) {
      return { moves: [], totalMoves: 0 };
    }
  }, [gameData]);

  // Set initial position to the end of the game
  useEffect(() => {
    setMoveIndex(totalMoves);
  }, [totalMoves]);

  // Compute current FEN and last move based on moveIndex
  const { currentFen, lastMove } = useMemo(() => {
    const replay = new Chess();
    let moveObj = null;
    for (let i = 0; i < moveIndex; i += 1) {
      if (moves[i]) {
        moveObj = replay.move(moves[i].san);
      }
    }
    return {
      currentFen: replay.fen(),
      lastMove: moveObj ? { from: moveObj.from, to: moveObj.to } : null,
    };
  }, [moveIndex, moves]);

  const goToStart = useCallback(() => setMoveIndex(0), []);
  const goPrev = useCallback(() => setMoveIndex((prev) => Math.max(0, prev - 1)), []);
  const goNext = useCallback(() => setMoveIndex((prev) => Math.min(totalMoves, prev + 1)), [totalMoves]);
  const goToEnd = useCallback(() => setMoveIndex(totalMoves), [totalMoves]);

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext, onClose]);

  const customSquareStyles = boardTheme ? getLastMoveStyles(lastMove, boardTheme) : {};
  const currentSan = moveIndex > 0 && moves[moveIndex - 1] ? moves[moveIndex - 1].san : null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Game Replay">
      <div className="replay-modal-card">
        <div className="replay-header">
          <div>
            <h3>Match Replay</h3>
            <p className="replay-matchup">
              <strong>{gameData.whitePlayer}</strong> (White) vs <strong>{gameData.blackPlayer}</strong> (Black)
            </p>
            <span className="replay-result">
              Result: <strong>{gameData.result}</strong> {gameData.outcome ? `(${gameData.outcome.toUpperCase()})` : ''}
            </span>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close replay">
            ✕
          </button>
        </div>

        <div className="replay-board-wrap">
          <Chessboard
            position={currentFen}
            boardWidth={360}
            isDraggablePiece={() => false}
            customLightSquareStyle={boardTheme ? { backgroundColor: boardTheme.light } : undefined}
            customDarkSquareStyle={boardTheme ? { backgroundColor: boardTheme.dark } : undefined}
            customSquareStyles={customSquareStyles}
            boardOrientation={gameData.playerColor === 'b' ? 'black' : 'white'}
          />
        </div>

        <div className="replay-controls">
          <div className="replay-move-status">
            <span>
              Move: <strong>{moveIndex}</strong> / {totalMoves}
            </span>
            {currentSan && <span className="replay-current-san">Played: <strong>{currentSan}</strong></span>}
          </div>

          <div className="replay-btn-group">
            <button type="button" onClick={goToStart} disabled={moveIndex === 0} title="Start (Home)">
              |◀
            </button>
            <button type="button" onClick={goPrev} disabled={moveIndex === 0} title="Previous Move (Left Arrow)">
              ◀
            </button>
            <button type="button" onClick={goNext} disabled={moveIndex === totalMoves} title="Next Move (Right Arrow)">
              ▶
            </button>
            <button type="button" onClick={goToEnd} disabled={moveIndex === totalMoves} title="End (End)">
              ▶|
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
