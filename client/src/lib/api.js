// Tiny fetch wrapper. Uses same-origin relative URLs (Vite proxies /api in dev)
// and always sends cookies so admin sessions work once auth is wired up.
async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    // Never serve stale data (e.g. availability right after a booking).
    cache: 'no-store',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};
