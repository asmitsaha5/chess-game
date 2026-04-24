import { render, screen } from '@testing-library/react';
import App from './components/App';

jest.mock('react-chessboard', () => ({
  Chessboard: () => {
    const React = require('react');
    return React.createElement('div', { role: 'img', 'aria-label': 'Chessboard' });
  },
}));

jest.mock('chess.js', () => ({
  Chess: class {
    fen() {
      return 'start';
    }

    pgn() {
      return '';
    }

    load() {}

    load_pgn() {}

    history() {
      return [];
    }

    get(square) {
      if (square === 'e2') {
        return { type: 'p', color: 'w' };
      }

      return null;
    }

    turn() {
      return 'w';
    }

    moves(options) {
      if (options?.square === 'e2') {
        return [{ from: 'e2', to: 'e4', piece: 'p', color: 'w' }];
      }

      return [];
    }

    board() {
      return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
    }

    move() {
      return null;
    }

    game_over() {
      return false;
    }

    in_checkmate() {
      return false;
    }

    in_stalemate() {
      return false;
    }

    insufficient_material() {
      return false;
    }

    in_threefold_repetition() {
      return false;
    }

    in_draw() {
      return false;
    }

    in_check() {
      return false;
    }

    undo() {
      return null;
    }
  },
}));

test('renders the chess game status', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /a very basic chess game/i })).toBeInTheDocument();
  expect(screen.getAllByText(/choose your side/i).length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: /play as white/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /play as black/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /classic/i })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByRole('button', { name: /easy/i })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText(/captured pieces/i)).toBeInTheDocument();
});
