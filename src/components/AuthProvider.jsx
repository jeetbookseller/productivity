import { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth.js';

const AuthContext = createContext(null);

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-cream">
        <div className="text-bark/50 text-sm font-semibold">Loading…</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
