import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

// Tracks the admin session: checks /me on load, exposes login/logout.
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null }); // loading | authed | anon

  useEffect(() => {
    api
      .get('/api/auth/me')
      .then(({ user }) => setState({ status: 'authed', user }))
      .catch(() => setState({ status: 'anon', user: null }));
  }, []);

  async function login(email, password) {
    const { user } = await api.post('/api/auth/login', { email, password });
    setState({ status: 'authed', user });
    return user;
  }

  async function logout() {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setState({ status: 'anon', user: null });
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
