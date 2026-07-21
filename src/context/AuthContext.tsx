import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, Role } from '../types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (args: { email: string; password: string; fullName: string; role: Role }) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingUidRef = useRef<string | null>(null);

  const loadProfile = async (uid: string, retries = 3): Promise<Profile | null> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (error) {
        // eslint-disable-next-line no-console
        console.error('profile load error', error.message);
      }
      if (data) {
        setProfile(data as Profile);
        return data as Profile;
      }
      // profile not found yet (trigger may not have committed) — wait and retry
      if (attempt < retries) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
    setProfile(null);
    return null;
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        loadingUidRef.current = data.session.user.id;
        await loadProfile(data.session.user.id);
        if (mounted) loadingUidRef.current = null;
      }
      if (mounted) setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        const uid = sess.user.id;
        loadingUidRef.current = uid;
        setLoading(true);
        (async () => {
          await loadProfile(uid);
          if (mounted && loadingUidRef.current === uid) {
            loadingUidRef.current = null;
            setLoading(false);
          }
        })();
      } else {
        loadingUidRef.current = null;
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp: AuthContextValue['signUp'] = async ({ email, password, fullName, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      // profile is auto-created by trigger; load it (with retry)
      setLoading(true);
      loadingUidRef.current = data.user.id;
      await loadProfile(data.user.id);
      loadingUidRef.current = null;
      setLoading(false);
    }
    return { error: null };
  };

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  const updateProfile: AuthContextValue['updateProfile'] = async (patch) => {
    if (!session?.user) return { error: 'Not signed in' };
    const { error } = await supabase
      .from('profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', session.user.id);
    if (error) return { error: error.message };
    await refreshProfile();
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, signUp, signIn, signOut, refreshProfile, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
