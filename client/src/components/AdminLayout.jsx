import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { business } from '../config.js';
import { useAuth } from '../lib/auth.jsx';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/services', label: 'Services' },
  { to: '/admin/availability', label: 'Hours' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-stone-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="font-display text-xl font-semibold text-stone-800">
              {business.name}{' '}
              <span className="text-stone-300 font-sans text-sm font-normal">/ admin</span>
            </span>
            <nav className="hidden sm:flex items-center gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ' +
                    (isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-stone-500 hover:text-stone-800')
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-stone-400">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-full border border-stone-300 px-3 py-1.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="sm:hidden flex items-center gap-1 overflow-x-auto px-5 pb-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                'shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ' +
                (isActive ? 'bg-brand-50 text-brand-700' : 'text-stone-500')
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
