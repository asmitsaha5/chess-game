# ♟️ Chess Game

A chess game built with React featuring an AI opponent powered by the Minimax algorithm with Alpha-Beta pruning. Choose your difficulty, pick a side, and play.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-chess--game--as.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://chess-game-as.vercel.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![chess.js](https://img.shields.io/badge/chess.js-0.13-lightgrey?style=for-the-badge)](https://github.com/jhlywa/chess.js)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

👉 **[Play here](https://chess-game-as.vercel.app/)**

---

## 🧠 How the AI Works

The computer opponent uses a different strategy per difficulty level:

| Level | Strategy |
|---|---|
| **Easy** | Random legal move |
| **Medium** | Greedy 1-ply — prioritises captures, checks, and promotions by static piece value |
| **Hard** | Minimax (depth 2) with Alpha-Beta pruning — minimises opponent's best response while maximising its own |

Position evaluation is material-based:

| Piece | Value |
|---|---|
| Pawn | 100 |
| Knight | 320 |
| Bishop | 330 |
| Rook | 500 |
| Queen | 900 |

Checkmate scores ±100,000. Draws evaluate to 0.

---

## 🛠️ Tech Stack

| | |
|---|---|
| React 18 | UI and state management |
| chess.js | Move validation, PGN/FEN, game rules |
| react-chessboard | Interactive board with drag-and-drop |
| Vercel | Deployment |

---

## 🚀 Run Locally

```bash
git clone https://github.com/asmitsaha5/chess-game.git
cd chess-game
npm install
npm start
```

---

## 🙋‍♂️ Author

**Asmit Saha** — [@asmitsaha5](https://github.com/asmitsaha5)