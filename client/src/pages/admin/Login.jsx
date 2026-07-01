import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { business } from '../../config.js';
import { useAuth } from '../../lib/auth.jsx';
import { cardCls, inputCls, labelCls, btnPrimary } from '../../lib/adminUi.js';
import { Spinner } from '../../components/ui.jsx';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-12">
      <Link to="/" className="font-display text-2xl font-semibold text-stone-800 mb-6">
        {business.name}
      </Link>

      <div className={`w-full max-w-sm ${cardCls}`}>
        <h1 className="font-display text-3xl font-medium text-stone-800 text-center">Admin sign in</h1>
        <p className="mt-1 text-sm text-stone-500 text-center">Manage services, hours, and bookings.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label className={labelCls} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-clay-400/10 border border-clay-400/40 px-3 py-2 text-sm text-stone-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className={`w-full ${btnPrimary}`}>
            {submitting && <Spinner className="h-4 w-4 text-white" />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 rounded-lg bg-stone-50 border border-stone-200 px-3 py-2.5 text-xs text-stone-500">
          <span className="font-semibold text-stone-600">Demo login</span> · admin@demo.test / demo1234
        </div>
      </div>
    </div>
  );
}
