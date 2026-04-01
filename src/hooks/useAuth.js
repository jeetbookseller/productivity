import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const emailConfirmedRef = useRef(false);
  const passwordRecoveryRef = useRef(false);

  const signInWithPassword = useCallback(async (email, password) => {
    if (!supabase) return { data: null, error: { message: 'Auth service is not configured.' } };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }, []);

  const signUp = useCallback(async (email, password) => {
    if (!supabase) return { data: null, error: { message: 'Auth service is not configured.' } };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (data?.user?.identities?.length === 0) {
      return { data, error: { message: 'An account with this email already exists. Please sign in instead.' } };
    }
    return { data, error };
  }, []);

  const resetPasswordForEmail = useCallback(async (email) => {
    if (!supabase) return { data: null, error: { message: 'Auth service is not configured.' } };
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const updatePassword = useCallback(async (password) => {
    if (!supabase) return { data: null, error: { message: 'Auth service is not configured.' } };
    const { data, error } = await supabase.auth.updateUser({ password });
    if (!error) {
      await signOut();
    }
    return { data, error };
  }, [signOut]);

  const clearEmailConfirmed = useCallback(() => {
    emailConfirmedRef.current = false;
  }, []);

  useEffect(() => {
    let subscription;

    async function init() {
      if (!supabase) { setLoading(false); return; }
      try {
        // Capture hash BEFORE getSession() — Supabase cleans it
        const hash = window.location.hash;

        // Check for email confirmation (signup or email_change)
        if (hash.includes('type=signup') || hash.includes('type=email_change')) {
          emailConfirmedRef.current = true;
          await supabase.auth.signOut();
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        // Check for password recovery
        if (hash.includes('type=recovery')) {
          passwordRecoveryRef.current = true;
          // Do NOT sign out — user needs the recovery session
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        // Restore existing session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
        }

        // Listen for auth state changes
        const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
          // Guard: skip updates when emailConfirmed or passwordRecovery is true
          if (emailConfirmedRef.current || passwordRecoveryRef.current) {
            return;
          }

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setSession(newSession);
            setUser(newSession?.user ?? null);
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
          }
        });

        subscription = data.subscription;
      } catch (err) {
        console.error('Auth init failed:', err);
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return {
    user,
    session,
    loading,
    emailConfirmed: emailConfirmedRef.current,
    passwordRecovery: passwordRecoveryRef.current,
    signInWithPassword,
    signUp,
    resetPasswordForEmail,
    updatePassword,
    signOut,
    clearEmailConfirmed,
  };
}
