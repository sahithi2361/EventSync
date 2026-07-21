import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle2, Building2, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { StatCard, SectionHeader } from '../../components/dashboard/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, relativeTime } from '../../lib/utils';
import type { ApprovalRequest, Event, AttendanceRow } from '../../types';

export function DeanDashboard() {
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [att, setAtt] = useState<AttendanceRow[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: ap }, { data: evs }, { data: a }] = await Promise.all([
        supabase.from('approval_requests').select('*, event:events(*), coordinator:profiles!approval_requests_coordinator_id_fkey(full_name)').order('submitted_at', { ascending: false }),
        supabase.from('events').select('*').order('event_date', { ascending: false }),
        supabase.from('attendance').select('*'),
      ]);
      if (!active) return;
      setApprovals((ap as ApprovalRequest[]) ?? []);
      setEvents((evs as Event[]) ?? []);
      setAtt((a as AttendanceRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const pending = useMemo(() => approvals.filter((a) => a.status === 'pending'), [approvals]);
  const approved = useMemo(() => approvals.filter((a) => a.status === 'approved'), [approvals]);

  const byDept = useMemo(() => {
    const map = new Map<string, number>();
    att.forEach((a) => {
      const ev = events.find((e) => e.id === a.event_id);
      const dept = ev?.department_name ?? 'Unknown';
      map.set(dept, (map.get(dept) ?? 0) + 1);
    });
    return Array.from(map, ([name, count]) => ({ name, count }));
  }, [att, events]);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    att.forEach((a) => {
      if (!a.approved_by_dean) return;
      const m = new Date(a.marked_at).toLocaleString('en-US', { month: 'short' });
      map.set(m, (map.get(m) ?? 0) + 1);
    });
    return Array.from(map, ([month, count]) => ({ month, count }));
  }, [att]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Dean Academics Dashboard" subtitle="Review and approve attendance reports." action={<Link to="/app/approvals" className="btn-primary">Review approvals</Link>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending Requests" value={pending.length} icon={<Clock className="h-5 w-5" />} tone="amber" />
        <StatCard label="Approved" value={approved.length} icon={<CheckCircle2 className="h-5 w-5" />} tone="accent" />
        <StatCard label="Total Events" value={events.length} icon={<ShieldCheck className="h-5 w-5" />} tone="brand" />
        <StatCard label="Attendance Rows" value={att.length} icon={<TrendingUp className="h-5 w-5" />} tone="violet" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Pending approval requests" subtitle={`${pending.length} awaiting review`} action={<Link to="/app/approvals" className="text-sm font-medium text-brand-600">View all</Link>} />
          {pending.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="h-8 w-8" />} title="All caught up" message="No pending requests." />
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 5).map((a) => (
                <Link key={a.id} to="/app/approvals" className="block rounded-xl border border-ink-100 dark:border-ink-800 p-4 transition hover:border-brand-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{a.event?.name}</p>
                      <p className="text-xs text-ink-400">{a.coordinator?.full_name ?? 'Coordinator'} • {a.student_count} students • {formatDate(a.submitted_at)}</p>
                      {a.report_summary && <p className="mt-1 line-clamp-2 text-xs text-ink-500">{a.report_summary}</p>}
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent approvals" />
          {approved.length === 0 ? (
            <EmptyState icon={<ShieldCheck className="h-8 w-8" />} title="None yet" />
          ) : (
            <div className="space-y-2">
              {approved.slice(0, 5).map((a) => (
                <div key={a.id} className="rounded-lg border border-ink-100 dark:border-ink-800 p-3">
                  <p className="truncate text-sm font-semibold">{a.event?.name}</p>
                  <p className="text-xs text-ink-400">{relativeTime(a.reviewed_at ?? a.submitted_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Department participation" subtitle="Attendance by department" />
          {byDept.length === 0 ? (
            <EmptyState icon={<Building2 className="h-8 w-8" />} title="No data" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byDept} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader title="Monthly approved attendance" />
          {monthly.length === 0 ? (
            <EmptyState icon={<TrendingUp className="h-8 w-8" />} title="No data" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#245cf0" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#245cf0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="count" stroke="#245cf0" fill="url(#g)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
