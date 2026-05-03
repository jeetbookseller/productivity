import { useState, useEffect } from 'react';
import { useAuthContext } from './AuthProvider.jsx';
import { AppExplainer } from './AboutModal.jsx';

function getPasswordChecks(password) {
  return [
    { label: 'At least 15 characters', met: password.length >= 15 },
    { label: 'A lowercase letter', met: /[a-z]/.test(password) },
    { label: 'An uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'A digit', met: /\d/.test(password) },
    { label: 'A symbol', met: /[^a-zA-Z0-9]/.test(password) },
  ];
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function AuthForm() {
  const {
    emailConfirmed,
    passwordRecovery,
    clearEmailConfirmed,
    signInWithPassword,
    signUp,
    resetPasswordForEmail,
    updatePassword,
    signOut,
  } = useAuthContext();

  const [mode, setMode] = useState(passwordRecovery ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  useEffect(() => {
    if (passwordRecovery) setMode('reset');
  }, [passwordRecovery]);

  function switchMode(newMode) {
    if (mode === 'login' && emailConfirmed) {
      clearEmailConfirmed();
    }
    setMode(newMode);
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  }

  const checks = getPasswordChecks(password);
  const allChecksMet = checks.every((c) => c.met);
  const passwordsMatch = password === confirmPassword;

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await signInWithPassword(email, password);
      if (err) setError(err.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: err } = await signUp(email, password);
      if (err) {
        setError(err.message);
      } else if (!data?.session) {
        setSignupDone(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { error: err } = await resetPasswordForEmail(email);
      if (err) {
        setError(err.message);
      } else {
        setSuccess('Password reset email sent! Please check your inbox.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { error: err } = await updatePassword(password);
      if (err) {
        setError(err.message);
      } else {
        setSuccess('Password updated successfully!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full border border-sand rounded-xl px-3 py-2 text-sm font-bold text-bark focus:outline-none focus:ring-2 focus:ring-sage/40 bg-cream';

  const btnClass =
    'w-full py-2.5 rounded-xl bg-sage text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2';

  return (
    <div className="min-h-[100dvh] flex items-start justify-center bg-cream p-4 pt-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-sm font-semibold tracking-wide text-bark/50 uppercase">
            Productivity Hub - Personal Journal
          </span>
        </div>
        <div className="bg-[rgb(var(--surface))] border border-sand rounded-2xl shadow-sm p-6 space-y-4">

          {/* ---- Login mode ---- */}
          {mode === 'login' && (
            <>
              {emailConfirmed && (
                <div className="rounded-xl px-4 py-3 bg-sage/10 text-sage text-sm font-semibold">
                  Email confirmed! Please sign in.
                </div>
              )}
              {error && (
                <div className="rounded-xl px-4 py-3 bg-terracotta/10 text-terracotta text-sm font-semibold">
                  {error}
                </div>
              )}
              <h2 className="text-lg font-bold text-bark">Sign in</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    required
                  />
                  <div className="mt-1">
                    <span
                      className="text-sage text-sm font-semibold hover:underline cursor-pointer"
                      onClick={() => switchMode('forgot')}
                    >
                      Forgot password?
                    </span>
                  </div>
                </div>
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading && <Spinner />}
                  Sign in
                </button>
              </form>
            </>
          )}

          {/* ---- Signup mode ---- */}
          {mode === 'signup' && !signupDone && (
            <>
              {error && (
                <div className="rounded-xl px-4 py-3 bg-terracotta/10 text-terracotta text-sm font-semibold">
                  {error}
                </div>
              )}
              <h2 className="text-lg font-bold text-bark">Create account</h2>
              <form onSubmit={handleSignup} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    required
                  />
                  <ul className="mt-2 space-y-1">
                    {checks.map((c) => (
                      <li key={c.label} className="flex items-center gap-1.5 text-xs">
                        {c.met ? (
                          <span className="text-sage">&#10003;</span>
                        ) : (
                          <span className="text-bark/30">&bull;</span>
                        )}
                        <span className={c.met ? 'text-sage' : 'text-bark/30'}>{c.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    required
                  />
                  {confirmPassword !== '' && (
                    <p className={`mt-1 text-sm font-semibold ${passwordsMatch ? 'text-sage' : 'text-terracotta'}`}>
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !allChecksMet || !passwordsMatch || confirmPassword === ''}
                  className={btnClass}
                >
                  {loading && <Spinner />}
                  Create account
                </button>
              </form>
            </>
          )}

          {mode === 'signup' && signupDone && (
            <div className="rounded-xl px-4 py-3 bg-sage/10 text-sage text-sm font-semibold">
              Signup successful! Please check your email for a confirmation link from Supabase Auth.
              <div className="mt-3">
                <span
                  className="text-sage text-sm font-semibold hover:underline cursor-pointer"
                  onClick={() => {
                    setSignupDone(false);
                    switchMode('login');
                  }}
                >
                  Back to sign in
                </span>
              </div>
            </div>
          )}

          {/* ---- Forgot mode ---- */}
          {mode === 'forgot' && (
            <>
              {error && (
                <div className="rounded-xl px-4 py-3 bg-terracotta/10 text-terracotta text-sm font-semibold">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl px-4 py-3 bg-sage/10 text-sage text-sm font-semibold">
                  {success}
                </div>
              )}
              <h2 className="text-lg font-bold text-bark">Reset password</h2>
              <form onSubmit={handleForgot} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading && <Spinner />}
                  Send reset link
                </button>
              </form>
            </>
          )}

          {/* ---- Reset mode ---- */}
          {mode === 'reset' && (
            <>
              {error && (
                <div className="rounded-xl px-4 py-3 bg-terracotta/10 text-terracotta text-sm font-semibold">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl px-4 py-3 bg-sage/10 text-sage text-sm font-semibold">
                  {success}
                  <div className="mt-3">
                    <span
                      className="text-sage text-sm font-semibold hover:underline cursor-pointer"
                      onClick={async () => {
                        await signOut();
                        switchMode('login');
                      }}
                    >
                      Sign in
                    </span>
                  </div>
                </div>
              )}
              {!success && (
                <>
                  <h2 className="text-lg font-bold text-bark">Set a new password</h2>
                  <form onSubmit={handleReset} className="space-y-4">
                    <div>
                      <input
                        type="password"
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClass}
                        required
                      />
                      <ul className="mt-2 space-y-1">
                        {checks.map((c) => (
                          <li key={c.label} className="flex items-center gap-1.5 text-xs">
                            {c.met ? (
                              <span className="text-sage">&#10003;</span>
                            ) : (
                              <span className="text-bark/30">&bull;</span>
                            )}
                            <span className={c.met ? 'text-sage' : 'text-bark/30'}>{c.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClass}
                        required
                      />
                      {confirmPassword !== '' && (
                        <p className={`mt-1 text-sm font-semibold ${passwordsMatch ? 'text-sage' : 'text-terracotta'}`}>
                          {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !allChecksMet || !passwordsMatch || confirmPassword === ''}
                      className={btnClass}
                    >
                      {loading && <Spinner />}
                      Update password
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer mode-switch links */}
        <div className="mt-4 text-center">
          {mode === 'login' && (
            <span className="text-bark/50 text-sm">
              Don&apos;t have an account?{' '}
              <span
                className="text-sage text-sm font-semibold hover:underline cursor-pointer"
                onClick={() => switchMode('signup')}
              >
                Sign up
              </span>
            </span>
          )}
          {mode === 'signup' && !signupDone && (
            <span className="text-bark/50 text-sm">
              Already have an account?{' '}
              <span
                className="text-sage text-sm font-semibold hover:underline cursor-pointer"
                onClick={() => {
                  setSignupDone(false);
                  switchMode('login');
                }}
              >
                Sign in
              </span>
            </span>
          )}
          {mode === 'forgot' && (
            <span className="text-bark/50 text-sm">
              Remember your password?{' '}
              <span
                className="text-sage text-sm font-semibold hover:underline cursor-pointer"
                onClick={() => switchMode('login')}
              >
                Sign in
              </span>
            </span>
          )}
        </div>

        {/* App explainer — login and signup only */}
        {(mode === 'login' || (mode === 'signup' && !signupDone)) && (
          <div className="mt-4 bg-[rgb(var(--surface))] border border-sand rounded-2xl shadow-sm px-4 py-3">
            <AppExplainer />
          </div>
        )}
      </div>
    </div>
  );
}
