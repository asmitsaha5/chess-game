// App.js

import '../styles/App.css';
import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import logo from '../assets/logo.png';


function App() {
  const [game, setGame] = useState(new Chess());
  const [winner, setWinner] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  // Let's perform a function on the game state
  function safeGameMutate(modify) {
    setGame((g) => {
      const update = { ...g };
      modify(update);
      return update;
    });
  }

  // Movement of computer
  function makeRandomMove() {
    const possibleMove = game.moves();

    // exit if the game is over
    if (game.game_over() || game.in_draw() || possibleMove.length === 0) {
      setGameOver(true);
      const winner = game.turn() === 'w' ? 'Black' : 'White';
      setWinner(winner);
      return;
    }

    // select random move
    const randomIndex = Math.floor(Math.random() * possibleMove.length);
    // play random move
    safeGameMutate((game) => {
      game.move(possibleMove[randomIndex]);
    });
  }

  // Perform an action when a piece is dropped by a user
  function onDrop(source, target) {
    if (gameOver) return false;

    let move = null;
    safeGameMutate((game) => {
      move = game.move({
        from: source,
        to: target,
        promotion: 'q',
      });
    });
    // illegal move
    if (move === null) return false;
    // valid move
    setTimeout(makeRandomMove, 200);
    return true;
  }

  // Reset the game
  function restartGame() {
    setGame(new Chess());
    setGameOver(false);
    setWinner(null);
  }

  // Listen for Enter key press to restart the game
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
  }, []);

  return (
    <div className="app">
      <div className="header">
        <img src={logo} alt="Chess Logo" className="game-image" />
        <div className="game-info">
          <h1>A very basic chessgame</h1>
        </div>
      </div>
      <div className="chessboard-container">
        <Chessboard position={game.fen()} onPieceDrop={onDrop} />
        {gameOver && (
          <div className="game-over">
            <p>Game Over</p>
            <p>Winner: {winner}</p>
            <p>Press Enter to restart</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;