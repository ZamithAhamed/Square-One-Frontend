import React, { useEffect, useRef, useState } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type PageKey = 'dashboard' | 'patients' | 'appointments' | 'payments' | 'profile' | 'settings';

interface HeaderProps {
  onNavigate?: (page: PageKey) => void;           // pass setCurrentPage from App
  onLogout?: () => Promise<void> | void;          // pass your App logout, or we’ll call API directly
  user?: { name?: string; role?: string; initials?: string };
}

function getCookie(name: string): string | null {
  const m = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[-.\\[\\]]/g, '\\$&') + '=([^;]*)')
  );
  return m ? decodeURIComponent(m[1]) : null;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, onLogout, user }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (page: PageKey, fallbackPath: string) => {
    setOpen(false);
    if (onNavigate) onNavigate(page);
    else window.location.href = fallbackPath;
  };

  const handleLogout = async () => {
    try {
      if (onLogout) {
        await onLogout();
      } else {
        // direct API logout (cookie + CSRF)
        const csrf = getCookie('csrf');
        await fetch(`${API}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: csrf ? { 'x-csrf-token': csrf } : undefined,
        });
      }
    } finally {
      // ensure UI leaves the app
      window.location.href = '/login';
    }
  };

  const initials = user?.initials || 'MD';
  const name = user?.name || 'Mr Doctor';
  const role = user?.role || 'admin';

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 relative z-50 text-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-lg" />
        <div className="flex items-center space-x-4">
          <div className="relative z-[60]">
            <button
              ref={btnRef}
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">{initials}</span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-100 leading-tight">{name}</p>
                <p className="text-xs text-gray-400 leading-tight">{role}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div
                ref={menuRef}
                role="menu"
                className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-gray-800 bg-gray-900 shadow-lg ring-1 ring-white/10 z-[70]"
              >
                <div className="px-4 py-3 border-b border-gray-800">
                  <p className="text-sm font-medium text-gray-100">{name}</p>
                  <p className="text-xs text-gray-400">{role}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => go('profile', '/profile')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/60 hover:text-gray-100"
                    role="menuitem"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    Profile
                  </button>
                  <button
                    onClick={() => go('settings', '/settings')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/60 hover:text-gray-100"
                    role="menuitem"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    Settings
                  </button>
                </div>
                <div className="py-1 border-t border-gray-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
