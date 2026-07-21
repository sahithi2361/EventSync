import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import { TrendingUp, Users, CalendarDays, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { SectionHeader } from '../../components/dashboard/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { Select } from '../../components/ui/Field';
import type { Event, Registration, AttendanceRow, Department } from '../../types';

const COLORS = ['#245cf0', '#10b981', '#f59e0b', '#d946ef', '#ef4444', '#06b6d4'];

export function AnalyticsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [att, setAtt] = useState<AttendanceRow[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [scope, setScope] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: e }, { data: r }, { data: a }, { data: d }] = await Promise.all([
        supabase.from('events').select('*'),
        supabase.from('registrations').select('*, event:events!registrations_event_id_fkey(*)'),
        supabase.from('attendance').select('*, event:events!attendance_event_id_fkey(*)'),
        supabase.from('departments').select('*').order('name'),
      ]);
      if (!active) return;
      setEvents((e as Event[]) ?? []);
      setRegs((r as Registration[]) ?? []);
      setAtt((a as AttendanceRow[]) ?? []);
      setDepts((d as Department[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const scopedEvents = useMemo(() => (scope === 'mine' && profile ? events.filter((e) => e.coordinator_id === profile.id) : events), [scope, events, profile]);
  const scopedEventIds = useMemo(() => new Set(scopedEvents.map((e) => e.id)), [scopedEvents]);
  const scopedRegs = useMemo(() => regs.filter((r) => scopedEventIds.has(r.event_id)), [regs, scopedEventIds]);
  const scopedAtt = useMemo(() => att.filter((a) => scopedEventIds.has(a.event_id)), [att, scopedEventIds]);

  const attRate = scopedRegs.length ? Math.round((scopedAtt.length / scopedRegs.length) * 100) : 0;

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    scopedEvents.forEach((e) => map.set(e.event_type, (map.get(e.event_type) ?? 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [scopedEvents]);

  const byDept = useMemo(() => {
    const map = new Map<string, number>();
    scopedAtt.forEach((a) => {
      const ev = scopedEvents.find((e) => e.id === a.event_id);
      const dept = depts.find((d) => d.id === ev?.department_id)?.code ?? 'Unknown';
      map.set(dept, (map.get(dept) ?? 0) + 1);
    });
    return Array.from(map, ([name, count]) => ({ name, count }));
  }, [scopedAtt, scopedEvents, depts]);

  const monthly = useMemo(() => {
    const map = new Map<string, { reg: number; att: number }>();
    scopedRegs.forEach((r) => {
      const m = new Date(r.registered_at).toLocaleString('en-US', { month: 'short' });
      (map.get(m) ?? map.set(m, { reg: 0, att: 0 }).get(m)!).reg++;
    });
    scopedAtt.forEach((a) => {
      const m = new Date(a.marked_at).toLocaleString('en-US', { month: 'short' });
      (map.get(m) ?? map.set(m, { reg: 0, att: 0 }).get(m)!).att++;
    });
    return Array.from(map, ([month, v]) => ({ month, ...v }));
  }, [scopedRegs, scopedAtt]);

  const popular = useMemo(() => {
    const map = new Map<string, number>();
    scopedRegs.forEach((r) => map.set(r.event_id, (map.get(r.event_id) ?? 0) + 1));
    return Array.from(map, ([id, count]) => ({ name: scopedEvents.find((e) => e.id === id)?.name ?? 'Event', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [scopedRegs, scopedEvents]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Analytics"
        subtitle="Participation trends and department statistics."
        action={
          (profile?.role === 'coordinator') ? (
            <Select value={scope} onChange={(e) => setScope(e.target.value as 'all' | 'mine')} className="!w-auto">
              <option value="all">All events</option>
              <option value="mine">My events</option>
            </Select>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-400">Attendance Rate</p>
          <p className="mt-2 font-display text-3xl font-bold">{attRate}%</p>
          <div className="mt-3 h-2 w-full rounded-full bg-ink-100 dark:bg-ink-800">
            <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: `${attRate}%` }} />
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-400">Events</p>
          <p className="mt-2 font-display text-3xl font-bold">{scopedEvents.length}</p>
          <p className="mt-1 text-xs text-ink-400"><Users className="inline h-3 w-3" /> {scopedRegs.length} registrations</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-400">Attendance Marked</p>
          <p className="mt-2 font-display text-3xl font-bold">{scopedAtt.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-400">Departments</p>
          <p className="mt-2 font-display text-3xl font-bold">{byDept.length}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Participation trend" subtitle="Registrations vs attendance" />
          {monthly.length === 0 ? <EmptyState icon={<TrendingUp className="h-8 w-8" />} title="No data" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="reg" name="Registrations" stroke="#245cf0" strokeWidth={2} />
                <Line type="monotone" dataKey="att" name="Attendance" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader title="Popular events" subtitle="Top by registrations" />
          {popular.length === 0 ? <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="No data" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={popular} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" fill="#245cf0" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader title="Events by type" />
          {byType.length === 0 ? <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="No data" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45}>
                  {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader title="Department-wise attendance" />
          {byDept.length === 0 ? <EmptyState icon={<Building2 className="h-8 w-8" />} title="No data" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={byDept}>
                <defs>
                  <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="count" stroke="#10b981" fill="url(#gd)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
