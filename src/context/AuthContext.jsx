/**
 * AuthContext — Supabase Auth state management
 * Handles login, logout, session persistence, and current user info.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // true until session checked

  useEffect(() => {
    if (!isSupabaseEnabled) {
      // Dev mode: skip auth, use fake user
      setCurrentUser({ id: 'dev', email: 'admin@linkmart.app', role: 'admin', name: 'Agency Admin' });
      setAuthLoading(false);
      return;
    }

    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session ? enrichUser(session.user) : null);
      setAuthLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session ? enrichUser(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /** Add display-friendly fields to the raw Supabase user object */
  const enrichUser = (user) => ({
    ...user,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    role: user.user_metadata?.role || 'member',
    initials: getInitials(user.user_metadata?.name || user.email || 'U'),
  });

  const getInitials = (str) => str.split(/[\s@]+/).map(s => s[0]).join('').toUpperCase().slice(0, 2);

  // ── Auth actions ──────────────────────────────────────────────────────────
  const login = async (email, password) => {
    if (!isSupabaseEnabled) return { ok: true };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true, user: enrichUser(data.user) };
  };

  const logout = async () => {
    if (!isSupabaseEnabled) { setCurrentUser(null); return; }
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.user_metadata?.role === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, authLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
