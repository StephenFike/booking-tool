import { useEffect, useState } from 'react';
import { api } from './lib/api.js';

// Placeholder shell. Routes and real pages are added in the UI build steps:
//   Home/Services, Booking, Confirm, Cancel, Admin Login, Admin Dashboard, ...
export default function App() {
  const [health, setHealth] = useState('checking…');

  useEffect(() => {
    api
      .get('/api/health')
      .then((data) => setHealth(`${data.status} · db ${data.db}`))
      .catch(() => setHealth('unreachable'));
  }, []);

  return (
    <main className="app-shell">
      <h1>Booking Tool</h1>
      <p>Skeleton is up. API health: {health}</p>
    </main>
  );
}
