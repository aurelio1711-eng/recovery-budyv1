import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase, hasSupabaseCredentials } from '../lib/supabaseClient';
import { setSyncEnabled } from '../services/storageProvider';

type AuthProvider = 'google' | 'email';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signIn: (provider: AuthProvider, email?: string, password?: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function tryGetSupabase() {
  try { return getSupabase(); } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = hasSupabaseCredentials();
  const supabase = tryGetSupabase();

  useEffect(() => {
    if (!supabase) {
      setSyncEnabled(false, null);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setSyncEnabled(!!session?.user, session?.user?.id ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setSyncEnabled(!!session?.user, session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(async (provider: AuthProvider, email?: string, password?: string): Promise<string | null> => {
    const sb = tryGetSupabase();
    if (!sb) return 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';

    if (provider === 'google') {
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      return error?.message ?? null;
    }

    if (provider === 'email' && email && password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    }

    return 'Invalid sign-in parameters';
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    const sb = tryGetSupabase();
    if (!sb) return 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';

    const { error } = await sb.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    const sb = tryGetSupabase();
    if (sb) await sb.auth.signOut();
    setUser(null);
    setSession(null);
    setSyncEnabled(false, null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, configured, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
