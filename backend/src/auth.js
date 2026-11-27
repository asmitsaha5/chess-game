const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

let authInitialized = false;
let authInstance = null;

function initAuth() {
  if (getApps().length > 0) {
    authInitialized = true;
    authInstance = getAuth();
    return authInstance;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      authInitialized = true;
      authInstance = getAuth(app);
      console.log('Firebase Admin initialized with service account.');
    } else if (projectId) {
      const app = initializeApp({ projectId });
      authInitialized = true;
      authInstance = getAuth(app);
      console.log(`Firebase Admin initialized for project: ${projectId}`);
    } else {
      const app = initializeApp();
      authInitialized = true;
      authInstance = getAuth(app);
      console.log('Firebase Admin initialized with default credentials.');
    }
  } catch (err) {
    console.warn('Firebase Admin initialization deferred (running in local/fallback mode):', err.message);
  }
  return authInstance;
}

async function verifyToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  if (!authInitialized || !authInstance) {
    if (process.env.NODE_ENV !== 'production' && token.startsWith('dev_')) {
      return {
        uid: token,
        name: req.headers['x-dev-name'] || 'Dev User',
        email: 'dev@example.com',
        picture: null,
      };
    }
    return null;
  }

  try {
    const decoded = await authInstance.verifyIdToken(token);
    return decoded;
  } catch (error) {
    console.warn('Failed to verify ID token:', error.message);
    return null;
  }
}

async function optionalAuth(req, _res, next) {
  try {
    req.user = await verifyToken(req);
  } catch (_e) {
    req.user = null;
  }
  next();
}

async function requireAuth(req, res, next) {
  const user = await verifyToken(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  req.user = user;
  next();
}

module.exports = {
  initAuth,
  optionalAuth,
  requireAuth,
  isAuthInitialized: () => authInitialized,
};
