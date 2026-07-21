import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, CalendarDays, Megaphone, ScrollText, TrendingUp, Activity } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { StatCard, SectionHeader } from '../../components/dashboard/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { relativeTime } from '../../lib/utils';
import type { Profile, Event, Department, Announcement, ActivityLog } from '../../types';

const COLORS = ['#245cf0', '#10b981', '#f59e0b', '#d946ef'];

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: u }, { data: e }, { data: d }, { data: an }, { data: l }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('events').select('*').order('event_date', { ascending: false }).limit(6),
        supabase.from('departments').select('*'),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(8),
      ]);
      if (!active) return;
      setUsers((u as Profile[]) ?? []);
      setEvents((e as Event[]) ?? []);
      setDepts((d as Department[]) ?? []);
      setAnnouncements((an as Announcement[]) ?? []);
      setLogs((l as ActivityLog[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const byRole = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach((u) => map.set(u.role, (map.get(u.role) ?? 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [users]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin Dashboard" subtitle="System overview and management." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={users.length} icon={<Users className="h-5 w-5" />} tone="brand" />
        <StatCard label="Departments" value={depts.length} icon={<Building2 className="h-5 w-5" />} tone="accent" />
        <StatCard label="Events" value={events.length} icon={<CalendarDays className="h-5 w-5" />} tone="violet" />
        <StatCard label="Announcements" value={announcements.length} icon={<Megaphone className="h-5 w-5" />} tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent events" action={<Link to="/app/events" className="text-sm font-medium text-brand-600">View all</Link>} />
          {events.length === 0 ? (
            <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="No events" />
          ) : (
            <div className="space-y-2">
              {events.map((e) => (
                <Link key={e.id} to={`/app/events/${e.id}`} className="flex items-center gap-3 rounded-lg border border-ink-100 dark:border-ink-800 p-3 transition hover:border-brand-300">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white"><CalendarDays className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.name}</p>
                    <p className="text-xs text-ink-400">{e.event_type} • {e.venue}</p>
                  </div>
                  <StatusBadge status={e.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Users by role" />
          {byRole.length === 0 ? (
            <EmptyState icon={<Users className="h-8 w-8" />} title="No users" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byRole} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                  {byRole.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12, textTransform: 'capitalize' }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent activity" action={<Link to="/app/logs" className="text-sm font-medium text-brand-600">All logs</Link>} />
          {logs.length === 0 ? (
            <EmptyState icon={<ScrollText className="h-8 w-8" />} title="No activity" />
          ) : (
            <div className="space-y-2">
              {logs.map((l) => (
                <div key={l.id} className="flex items-center gap-2 rounded-lg bg-ink-50 dark:bg-ink-800/50 px-3 py-2 text-sm">
                  <Activity className="h-4 w-4 text-ink-400" />
                  <span className="font-medium">{l.action.replace(/_/g, ' ')}</span>
                  {l.entity && <span className="text-xs text-ink-400">on {l.entity}</span>}
                  <span className="ml-auto text-xs text-ink-400">{relativeTime(l.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Announcements" action={<Link to="/app/announcements" className="text-sm font-medium text-brand-600">Manage</Link>} />
          {announcements.length === 0 ? (
            <EmptyState icon={<Megaphone className="h-8 w-8" />} title="None" />
          ) : (
            <div className="space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className="rounded-lg border border-ink-100 dark:border-ink-800 p-3">
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-ink-400 capitalize">To: {a.audience} • {relativeTime(a.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
