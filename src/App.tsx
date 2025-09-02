import React, { useEffect, useMemo, useState } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// ---- API base ----
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ---- Simple cookie reader (for CSRF) ----
function getCookie(name: string): string | null {
  const m = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[-.\\[\\]]/g, '\\$&') + '=([^;]*)')
  );
  return m ? decodeURIComponent(m[1]) : null;
}

// ---- Minimal fetch wrapper: includes cookies + csrf + refresh-once ----
async function api(path: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  // attach CSRF for mutating calls
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = getCookie('csrf');
    if (csrf) headers.set('x-csrf-token', csrf);
  }

  const send = () =>
    fetch(`${API}${path}`, {
      ...options,
      method,
      headers,
      credentials: 'include',
    });

  let res = await send();
  if (res.status === 401 && path !== '/api/auth/refresh') {
    // Try refresh once, then retry original
    const r = await fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (r.ok) {
      // refresh sets new at/csrf cookies; rebuild csrf header
      headers.delete('x-csrf-token');
      const csrf = getCookie('csrf');
      if (csrf && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        headers.set('x-csrf-token', csrf);
      }
      res = await send();
    }
  }
  return res;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'patients' | 'appointments' | 'payments' | 'profile'>('dashboard');

  // ---- App init: check session using /me; refresh if needed ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api('/api/me');
        if (res.ok) {
          if (mounted) setIsAuthenticated(true);
        } else {
          if (mounted) setIsAuthenticated(false);
        }
      } catch {
        if (mounted) setIsAuthenticated(false);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ---- Handlers ----
  const handleLogin = async (email: string, password: string) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      credentials: 'include', // IMPORTANT: receive cookies
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error?.message || 'Login failed');
      return;
    }
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return <Patients />;
      case 'appointments':
        return <Appointments />;
      case 'payments':
        return <Payments />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  // Optional: pass navigation + logout to Header if your Header supports it.
  const headerEl = useMemo(() => {
    // If your Header component accepts props like onNavigate/onLogout, use:
    // return <Header onNavigate={setCurrentPage} onLogout={handleLogout} />;
    return <Header />;
  }, [/* setCurrentPage, handleLogout */]);

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-600">
        Checking session…
      </div>
    );
  }

  if (!isAuthenticated) {
    // Your Login expects onLogin prop — keep that contract
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeItem={currentPage}
        onItemClick={(item) => {
          if (
            item === 'dashboard' ||
            item === 'patients' ||
            item === 'appointments' ||
            item === 'payments' ||
            item === 'profile'
          ) {
            setCurrentPage(item);
          }
        }}
      />
      <div className="flex-1 flex flex-col">
        {headerEl}
        <main className="flex-1 p-6 overflow-auto">
          {renderPage()}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">© 2025 Square One. All rights reserved.</p>
            
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
