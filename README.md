# ♟️ Chess Game

A chess game built with React featuring an AI opponent powered by the Minimax algorithm with Alpha-Beta pruning. Choose your difficulty, pick a side, and play.

## Backend API

The project includes an Express/PostgreSQL API in [`server`](./server) for accounts and private game history.

### Local setup

1. Start PostgreSQL. With Docker Desktop, run `docker compose up -d database` from the project root. Otherwise create a database named `chess_game` in your local PostgreSQL installation.
2. Copy [`server/.env.example`](./server/.env.example) to `server/.env`. Set `JWT_SECRET` to a long random value; do not commit it.
3. Run `npm run db:migrate --prefix server` to create the tables.
4. Run `npm run server` for the API and `npm start` for the React app in separate terminals.

The API runs at `http://localhost:5000` and has `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/games`, and `GET /api/games`. The game endpoints require `Authorization: Bearer <token>`.

### Production deployment

The repository includes [`render.yaml`](./render.yaml), which provisions the Express API and managed PostgreSQL database as a Render Blueprint. In Render, create a new Blueprint from this repository and confirm the generated resources. Render supplies the database connection string and generated JWT secret; the migration runs before each API deploy.

The frontend is deployed to Vercel. In the Vercel project settings, add `REACT_APP_API_URL` with the API URL from Render followed by `/api` (for example, `https://chess-game-api.onrender.com/api`), then redeploy. If the Vercel domain changes, update `CLIENT_ORIGIN` in Render to the exact frontend origin, without a trailing slash.

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
