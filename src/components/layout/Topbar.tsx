import { useState, type ReactNode } from 'react';
import { Menu, Search, Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { NavLink, useNavigate } from 'react-router-dom';

export function Topbar({ onMenu, search }: { onMenu: () => void; search?: ReactNode }) {
  const { theme, toggle } = useTheme();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  return (
    <header className="sticky top-0 z-20 border-b border-ink-200/70 dark:border-ink-800 bg-white/70 dark:bg-ink-950/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onMenu}
          className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 lg:hidden"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) navigate(`/app/search?q=${encodeURIComponent(q.trim())}`);
          }}
          className="relative hidden flex-1 max-w-md sm:block"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events, students…"
            className="input pl-9 py-2"
          />
        </form>

        {search}

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={toggle}
            className="rounded-xl p-2.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <NavLink
            to="/app/notifications"
            className="relative rounded-xl p-2.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </NavLink>
          <NavLink to="/app/profile" className="ml-1">
            <Avatar name={profile?.full_name ?? 'User'} src={profile?.avatar_url} size="sm" />
          </NavLink>
        </div>
      </div>
    </header>
  );
}
