import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase client — prevents real network calls in tests
// Note: @supabase/supabase-js is aliased to a stub in vite.config.js to prevent OOM
vi.mock('./lib/supabase.js', () => ({
  supabase: null,
}));

// Mock AuthProvider — provides a fake authenticated user context for all tests
vi.mock('./components/AuthProvider.jsx', () => ({
  AuthProvider: ({ children }) => children,
  useAuthContext: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: { access_token: 'test-token' },
    loading: false,
    emailConfirmed: false,
    passwordRecovery: false,
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updatePassword: vi.fn(),
    signOut: vi.fn(),
    clearEmailConfirmed: vi.fn(),
  }),
}));

// Mock sync module — prevents real Supabase calls in persistence tests
vi.mock('./lib/sync.js', () => ({
  pushKey: vi.fn(),
  pullAll: vi.fn().mockResolvedValue({}),
  mergeValues: vi.fn((key, local, remote) => remote ?? local),
  SYNCED_KEYS: ['todos', 'notes', 'lists', 'focus', 'theme', 'preset', 'customT', 'poms', 'met', 'dHist', 'fHist'],
}));

// Mock AuthForm — prevents loading heavy Supabase SDK in tests
vi.mock('./components/AuthForm.jsx', () => ({
  default: () => null,
}));
