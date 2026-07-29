import { useState } from 'react';

export default function AuthDialog({ onClose, onSubmit }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit({ email, password, ...(isRegistering ? { displayName } : {}) }, isRegistering);
    } catch (submissionError) {
      setError(submissionError.message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-backdrop">
      <form className="auth-dialog" onSubmit={submit}>
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Close login dialog">×</button>
        <span className="label">Account</span>
        <h2>{isRegistering ? 'Create your account' : 'Welcome back'}</h2>
        <p>Sign in to keep your completed games.</p>
        {isRegistering && <label>Display name<input required minLength="2" maxLength="40" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>}
        <label>Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Password<input required type="password" minLength="8" autoComplete={isRegistering ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'}</button>
        <button className="auth-switch" type="button" onClick={() => { setIsRegistering(!isRegistering); setError(''); }}>
          {isRegistering ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
      </form>
    </div>
  );
}
