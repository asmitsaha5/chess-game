import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error('Failed to initialize Firebase client:', error);
  }
}

export { auth, googleProvider };

export async function loginWithGoogle() {
  if (!auth) {
    throw new Error('Firebase is not configured. Add your REACT_APP_FIREBASE_* variables in .env');
  }
  return signInWithPopup(auth, googleProvider);
}

export async function loginAsGuest() {
  if (!auth) {
    throw new Error('Firebase is not configured. Add your REACT_APP_FIREBASE_* variables in .env');
  }
  return signInAnonymously(auth);
}

export async function logoutUser() {
  if (!auth) return;
  return signOut(auth);
}

export async function getAuthToken() {
  if (!auth || !auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch (err) {
    console.warn('Failed to retrieve ID token:', err);
    return null;
  }
}

export function subscribeToAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
