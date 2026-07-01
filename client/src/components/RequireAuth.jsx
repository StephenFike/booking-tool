import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Loading } from './ui.jsx';

// Gate for admin routes: waits for the session check, then redirects
// unauthenticated visitors to the login page.
export default function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Loading label="Checking session…" />;
  if (status === 'anon') {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}
