# ♟️ Chess Game

A modern chess web application built with React featuring an AI opponent (Minimax with Alpha-Beta pruning), Google Sign-In authentication, cloud match history, player analytics, and an interactive game replay viewer.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-chess--game--as.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://chess-game-as.vercel.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![chess.js](https://img.shields.io/badge/chess.js-0.13-lightgrey?style=for-the-badge)](https://github.com/jhlywa/chess.js)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

👉 **[Play here](https://chess-game-as.vercel.app/)**

---

## 🌟 Key Features

- **AI Opponent:** Play against three difficulty tiers (Easy: random; Medium: greedy material; Hard: Minimax depth 2 with Alpha-Beta pruning).
- **Authentication (Google & Guest):** One-click **Sign in with Google** via Firebase Auth or play anonymously with **Guest mode**.
- **Personal Match History & Stats:** Tracks your games, wins, losses, draws, and win rate percentage.
- **Move-by-Move Replay Viewer:** Review any past completed match on an interactive board with forward (`▶`), backward (`◀`), start (`|◀`), and end (`▶|`) controls.
- **Zero-Cost Cloud Deployment:** Engineered for Google Cloud Free Tier using **Google Cloud Run** and **Cloud Firestore** ($0 idle cost).
- **Dual-Mode Persistence:** Runs on **PostgreSQL** in local Docker Compose and seamlessly switches to **Cloud Firestore** in production.

---

## 🧠 How the AI Works

The computer opponent uses a different strategy per difficulty level:

| Level | Strategy |
|---|---|
| **Easy** | Random legal move |
| **Medium** | Greedy 1-ply — prioritises captures, checks, and promotions by static piece value |
| **Hard** | Minimax (depth 2) with Alpha-Beta pruning — minimises opponent's best response while maximising its own |

Position evaluation is material-based: Pawn (100), Knight (320), Bishop (330), Rook (500), Queen (900), Checkmate (±100,000), Draw (0).

---

## 🛠️ Tech Stack

| Component | Technology | Role |
|---|---|---|
| Frontend | React 18, `chess.js`, `react-chessboard` | Interactive board, game rules, animations |
| Authentication | Firebase Auth / Google Identity Platform | Google Sign-In, Guest login, JWT token issuance |
| Backend API | Express.js, `firebase-admin` | Token verification, match persistence, stats aggregation |
| Database | Cloud Firestore (Prod) / PostgreSQL (Local) | Zero-cost serverless document store / Relational DB |
| Cloud Hosting | Google Cloud Run | Serverless container scaling to 0 when idle |

---

## 📡 API Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | None | Service & database health check |
| `GET` | `/api/games?limit=10` | None | Public recent completed games |
| `GET` | `/api/games/:id` | None | Single game notation and result for replay |
| `GET` | `/api/me/games?limit=20` | Bearer Token | Authenticated player's personal match list |
| `GET` | `/api/me/stats` | Bearer Token | Authenticated player's win/loss/draw record |
| `POST` | `/api/games` | Optional | Save completed game (attaches to account if logged in) |

---

## 🚀 Run Locally

### Frontend Only (Development)
```bash
git clone https://github.com/asmitsaha5/chess-game.git
cd chess-game
npm install
npm start
```

### Full-Stack with Docker Compose (Local API + PostgreSQL)
```bash
docker compose up --build
```
Open [http://localhost:8080](http://localhost:8080). PostgreSQL data is persisted in the `postgres_data` Docker volume.

---

## ☁️ Zero-Cost Google Cloud Deployment Guide

This setup stays 100% within the **Google Cloud Always Free Tier** (Cloud Run 2M requests/month free, Cloud Firestore 1 GB storage + 50k reads/day free, Firebase Auth 50k active users free).

### Step 1: Create a Firebase & Google Cloud Project
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project (e.g. `chess-game-prod`).
2. Go to **Authentication** > **Sign-in method**:
   - Enable **Google**.
   - Enable **Anonymous** (for Guest mode).
3. Go to **Firestore Database** > **Create database**:
   - Start in **Production mode**.
   - Choose a region (e.g. `us-central1`).
4. In **Project Settings** > **General** > **Your apps**, click the web icon (`</>`) to register your web app and copy your Firebase config keys.

### Step 2: Deploy Backend to Google Cloud Run
From the `backend/` directory:

```bash
# Authenticate with gcloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and submit the backend container to Google Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/chess-api ./backend

# Deploy to Cloud Run (scales to 0, zero cost when idle)
gcloud run deploy chess-api \
  --image gcr.io/YOUR_PROJECT_ID/chess-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars USE_FIRESTORE=true,FIREBASE_PROJECT_ID=YOUR_PROJECT_ID,CORS_ORIGIN=https://YOUR_FRONTEND_DOMAIN
```
Copy the generated Cloud Run service URL (e.g. `https://chess-api-xyz-uc.a.run.app`).

### Step 3: Deploy Frontend (Vercel or Firebase Hosting)
In your frontend environment variables (on Vercel or in `.env.production`):
```env
REACT_APP_API_URL=https://chess-api-xyz-uc.a.run.app
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=1:...
```
Trigger your frontend deployment (e.g. `git push` on Vercel or `firebase deploy --only hosting`).

---

## 🙋‍♂️ Author

**Asmit Saha** — [@asmitsaha5](https://github.com/asmitsaha5)
