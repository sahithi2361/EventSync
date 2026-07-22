import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  Users,
  Building2,
  Megaphone,
  ScrollText,
  Award,
  Bell,
  User,
  ShieldCheck,
  LogOut,
  X,
  GraduationCap,
} from 'lucide-react';
import type { Role } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { classNames } from '../../lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const navItems: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, roles: ['student', 'coordinator', 'dean', 'admin'] },
  { to: '/app/events', label: 'Events', icon: CalendarDays, roles: ['student', 'coordinator', 'dean', 'admin'] },
  { to: '/app/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['student', 'coordinator', 'dean'] },
  { to: '/app/certificates', label: 'Certificates', icon: Award, roles: ['student', 'dean', 'admin'] },
  { to: '/app/approvals', label: 'Approvals', icon: ShieldCheck, roles: ['coordinator', 'dean'] },
  { to: '/app/registrations', label: 'Registrations', icon: Users, roles: ['coordinator'] },
  { to: '/app/analytics', label: 'Analytics', icon: ScrollText, roles: ['coordinator', 'dean', 'admin'] },
  { to: '/app/users', label: 'Users', icon: Users, roles: ['admin'] },
  { to: '/app/departments', label: 'Departments', icon: Building2, roles: ['admin'] },
  { to: '/app/announcements', label: 'Announcements', icon: Megaphone, roles: ['admin'] },
  { to: '/app/logs', label: 'Activity Logs', icon: ScrollText, roles: ['admin'] },
  { to: '/app/notifications', label: 'Notifications', icon: Bell, roles: ['student', 'coordinator', 'dean', 'admin'] },
  { to: '/app/profile', label: 'Profile', icon: User, roles: ['student', 'coordinator', 'dean', 'admin'] },
];

const roleLabel: Record<Role, string> = {
  student: 'Student',
  coordinator: 'Coordinator',
  dean: 'Dean Academics',
  admin: 'Administrator',
};

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role ?? 'student';
  const items = navItems.filter((i) => i.roles.includes(role));

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-ink-950/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-ink-200/70 bg-white/80 dark:border-ink-800 dark:bg-ink-900/80 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-bold text-ink-900 dark:text-white">EventSync</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400">Attendance Suite</p>
            </div>
          </NavLink>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 no-scrollbar">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              onClick={onClose}
              className={({ isActive }) =>
                classNames(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                    : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800',
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-200/70 dark:border-ink-800 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar name={profile?.full_name ?? 'User'} src={profile?.avatar_url} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">
                {profile?.full_name}
              </p>
              <p className="truncate text-xs text-ink-400">{roleLabel[role]}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
