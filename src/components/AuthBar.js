import React, { useState } from 'react';
import { isFirebaseConfigured } from '../firebase';

export default function AuthBar({ user, loading, onLoginGoogle, onLoginGuest, onLogout }) {
  const [errorMsg, setErrorMsg] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg(null);
      await onLoginGoogle();
    } catch (err) {
      setErrorMsg(err.message || 'Google sign-in failed');
    }
  };

  const handleGuestLogin = async () => {
    try {
      setErrorMsg(null);
      await onLoginGuest();
    } catch (err) {
      setErrorMsg(err.message || 'Guest sign-in failed');
    }
  };

  if (loading) {
    return <div className="auth-bar"><span className="auth-status">Checking account…</span></div>;
  }

  if (user) {
    const displayName = user.displayName || (user.isAnonymous ? 'Guest Player' : user.email?.split('@')[0] || 'Player');
    return (
      <div className="auth-bar logged-in">
        <div className="user-profile-badge">
          {user.photoURL ? (
            <img src={user.photoURL} alt={displayName} className="user-avatar" />
          ) : (
            <div className="user-avatar-placeholder">{displayName.charAt(0).toUpperCase()}</div>
          )}
          <div className="user-details">
            <span className="user-name">{displayName}</span>
            {user.isAnonymous && <span className="guest-tag">Guest</span>}
          </div>
        </div>
        <button type="button" className="auth-button logout-button" onClick={onLogout}>
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="auth-bar logged-out">
      {isFirebaseConfigured ? (
        <div className="auth-buttons-group">
          <button type="button" className="auth-button google-button" onClick={handleGoogleLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24" className="google-icon" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </button>
          <button type="button" className="auth-button guest-button" onClick={handleGuestLogin}>
            Guest
          </button>
        </div>
      ) : (
        <span className="local-badge" title="Configure Firebase environment variables to enable Google Cloud sign-in.">
          Local Mode
        </span>
      )}
      {errorMsg && <span className="auth-error">{errorMsg}</span>}
    </div>
  );
}
