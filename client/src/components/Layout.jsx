import { Link } from 'react-router-dom';
import { business } from '../config.js';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="grid place-items-center h-8 w-8 rounded-lg bg-brand-600 text-white font-bold">
              {business.name.charAt(0)}
            </span>
            <span className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
              {business.name}
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
        {children}
      </main>

      <footer className="border-t border-slate-200 py-6">
        <div className="mx-auto max-w-5xl px-4 text-sm text-slate-400">
          {business.name} · Demo booking app
        </div>
      </footer>
    </div>
  );
}
