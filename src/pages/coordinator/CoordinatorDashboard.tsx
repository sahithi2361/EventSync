import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, ClipboardCheck, Activity, Plus, Send, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { StatCard, SectionHeader } from '../../components/dashboard/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, formatTime } from '../../lib/utils';
import type { Event, Registration, AttendanceRow, ApprovalRequest } from '../../types';

const COLORS = ['#245cf0', '#10b981', '#f59e0b', '#d946ef', '#ef4444', '#06b6d4'];

export function CoordinatorDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [att, setAtt] = useState<AttendanceRow[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    (async () => {
      const [{ data: evs }, { data: r }, { data: a }, { data: ap }] = await Promise.all([
        supabase.from('events').select('*').eq('coordinator_id', profile.id).order('event_date', { ascending: false }),
        supabase.from('registrations').select('*, event:events!registrations_event_id_fkey(coordinator_id)').eq('event.coordinator_id', profile.id),
        supabase.from('attendance').select('*, event:events!attendance_event_id_fkey(coordinator_id)').eq('event.coordinator_id', profile.id),
        supabase.from('approval_requests').select('*, event:events(*)').eq('coordinator_id', profile.id).order('submitted_at', { ascending: false }),
      ]);
      if (!active) return;
      setEvents((evs as Event[]) ?? []);
      setRegs((r as Registration[]) ?? []);
      setAtt((a as AttendanceRow[]) ?? []);
      setApprovals((ap as ApprovalRequest[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [profile]);

  const activeEvents = useMemo(() => events.filter((e) => e.status === 'ongoing' || e.attendance_open), [events]);
  const attRate = regs.length ? Math.round((att.length / regs.length) * 100) : 0;

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => map.set(e.event_type, (map.get(e.event_type) ?? 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [events]);

  const trend = useMemo(() => {
    const map = new Map<string, number>();
    att.forEach((a) => {
      const m = new Date(a.marked_at).toLocaleString('en-US', { month: 'short' });
      map.set(m, (map.get(m) ?? 0) + 1);
    });
    return Array.from(map, ([month, count]) => ({ month, count }));
  }, [att]);

  if (loading) return <PageLoader />;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <SectionHeader title="Coordinator Dashboard" subtitle="Manage your events and attendance." action={<Link to="/app/events/new" className="btn-primary"><Plus className="h-4 w-4" /> Create event</Link>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Events" value={events.length} icon={<CalendarDays className="h-5 w-5" />} tone="brand" />
        <StatCard label="Registrations" value={regs.length} icon={<Users className="h-5 w-5" />} tone="accent" />
        <StatCard label="Attendance %" value={`${attRate}%`} icon={<TrendingUp className="h-5 w-5" />} tone="violet" hint={`${att.length} marked`} />
        <StatCard label="Active Now" value={activeEvents.length} icon={<Activity className="h-5 w-5" />} tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="My events" action={<Link to="/app/events" className="text-sm font-medium text-brand-600">View all</Link>} />
          {events.length === 0 ? (
            <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="No events yet" message="Create your first event." action={<Link to="/app/events/new" className="btn-primary"><Plus className="h-4 w-4" /> Create</Link>} />
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map((e) => (
                <Link key={e.id} to={`/app/events/${e.id}`} className="flex items-center gap-3 rounded-xl border border-ink-100 dark:border-ink-800 p-3 transition hover:border-brand-300">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white"><CalendarDays className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.name}</p>
                    <p className="text-xs text-ink-400">{formatDate(e.event_date)} • {formatTime(e.start_time)}</p>
                  </div>
                  <StatusBadge status={e.status} />
                  {e.attendance_open && <span className="badge bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300 animate-pulse">Live</span>}
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Approval requests" action={<Link to="/app/approvals" className="text-sm font-medium text-brand-600">View</Link>} />
          {approvals.length === 0 ? (
            <EmptyState icon={<Send className="h-8 w-8" />} title="No requests" />
          ) : (
            <div className="space-y-2">
              {approvals.slice(0, 5).map((a) => (
                <div key={a.id} className="rounded-lg border border-ink-100 dark:border-ink-800 p-3">
                  <p className="truncate text-sm font-semibold">{a.event?.name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-ink-400">{a.student_count} students</span>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Attendance trend" subtitle="Marked attendance over time" />
          {trend.length === 0 ? (
            <EmptyState icon={<Activity className="h-8 w-8" />} title="No data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" fill="#245cf0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader title="Events by type" subtitle="Distribution of your events" />
          {byType.length === 0 ? (
            <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="No data" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                  {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
