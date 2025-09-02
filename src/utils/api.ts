const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// --- cookie helpers + fetch wrapper (adds CSRF & refresh-once) ---
function getCookie(name: string): string | null {
  const m = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[-.\\[\\]]/g, '\\$&') + '=([^;]*)')
  );
  return m ? decodeURIComponent(m[1]) : null;
}

export async function api(path: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = getCookie('csrf');
    if (csrf) headers.set('x-csrf-token', csrf);
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }
  }
  const send = () =>
    fetch(`${API}${path}`, { ...options, method, headers, credentials: 'include' });

  let res = await send();
  if (res.status === 401 && path !== '/api/auth/refresh') {
    const r = await fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (r.ok) res = await send();
  }
  return res;
}