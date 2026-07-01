import { Link } from 'react-router-dom';
import { business } from '../config.js';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-stone-200/70 bg-[#f4f2ec]/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-5 h-18 flex items-center py-5">
          <Link to="/" className="group flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold text-stone-800 group-hover:text-brand-700 transition-colors">
              {business.name}
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-5 py-10 sm:py-16">
        {children}
      </main>

      <footer className="border-t border-stone-200/70 py-8">
        <div className="mx-auto max-w-5xl px-5 text-sm text-stone-400">
          <span className="font-display text-base text-stone-500">{business.name}</span>
          <span className="mx-2 text-stone-300">·</span>
          Demo booking app
        </div>
      </footer>
    </div>
  );
}
