import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onSkip: () => void;
}

export default function LoginPage({ onSkip }: LoginPageProps) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    setError(null);

    const err = isSignUp ? await signUp(email, password) : await signIn('email', email, password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4 safe-area-inset-bottom">
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-[var(--radius-lg)] border border-border shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="font-heading text-xl font-bold text-text">Recovery Buddy</h1>
            <p className="text-sm text-text-muted mt-1">Sign in to sync your data to the cloud</p>
          </div>

          {error && (
            <div className="bg-warning/10 border border-warning/30 text-warning text-xs rounded-[var(--radius-sm)] px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm py-2 px-3 rounded-[var(--radius-sm)] border border-border bg-background text-text placeholder:text-text-muted outline-none focus:border-primary transition-colors duration-150"
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm py-2 px-3 rounded-[var(--radius-sm)] border border-border bg-background text-text placeholder:text-text-muted outline-none focus:border-primary transition-colors duration-150"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
            <button
              type="submit"
              className="w-full text-sm font-semibold py-2.5 px-4 rounded-[var(--radius-sm)] bg-primary text-white cursor-pointer border-none hover:bg-primary-dark transition-colors duration-150 touch-target disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <button
            type="button"
            className="w-full text-xs text-text-muted bg-transparent border-none cursor-pointer mt-3 hover:text-text transition-colors duration-150"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>

          <div className="border-t border-border mt-6 pt-4 text-center">
            <button
              type="button"
              className="text-xs text-text-muted bg-transparent border-none cursor-pointer hover:text-text transition-colors duration-150"
              onClick={onSkip}
            >
              Continue without an account
            </button>
          </div>
        </div>

        <p className="text-xs text-text-muted text-center mt-4 px-2">
          Your data is encrypted in transit and at rest. You can delete your account and data at any time.
        </p>
      </div>
    </div>
  );
}
