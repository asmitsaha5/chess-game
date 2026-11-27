import { getAuthToken } from '../firebase';

const configuredUrl = process.env.REACT_APP_API_URL || '';
const API_BASE_URL = configuredUrl.replace(/\/$/, '');

async function getHeaders(customHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...customHeaders };
  try {
    const token = await getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch (_e) {
    // Ignore token lookup failure in unauthenticated flows
  }
  return headers;
}

export async function fetchRecentGames(limit = 10) {
  const response = await fetch(`${API_BASE_URL}/api/games?limit=${limit}`);
  if (!response.ok) throw new Error('Could not load saved games.');
  return response.json();
}

export async function fetchMyGames(limit = 20) {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE_URL}/api/me/games?limit=${limit}`, { headers });
  if (!response.ok) {
    if (response.status === 401) return { games: [] };
    throw new Error('Could not load your games.');
  }
  return response.json();
}

export async function fetchMyStats() {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE_URL}/api/me/stats`, { headers });
  if (!response.ok) {
    if (response.status === 401) return { stats: null };
    throw new Error('Could not load your stats.');
  }
  return response.json();
}

export async function fetchGameById(gameId) {
  const response = await fetch(`${API_BASE_URL}/api/games/${gameId}`);
  if (!response.ok) throw new Error('Game not found.');
  return response.json();
}

export async function saveGame(game) {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE_URL}/api/games`, {
    method: 'POST',
    headers,
    body: JSON.stringify(game),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Could not save this game.');
  }
  return response.json();
}
