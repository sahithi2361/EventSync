import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle2, Building2, TrendingUp, Download, Users } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { StatCard, SectionHeader } from '../../components/dashboard/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, relativeTime } from '../../lib/utils';
import type { ApprovalRequest, Event, AttendanceRow, Profile } from '../../types';

export function DeanDashboard() {
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [att, setAtt] = useState<(AttendanceRow & { student?: Profile; event?: Event })[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: ap }, { data: evs }, { data: a }] = await Promise.all([
        supabase.from('approval_requests').select('*, event:events(*), coordinator:profiles!approval_requests_coordinator_id_fkey(full_name)').order('submitted_at', { ascending: false }),
        supabase.from('events').select('*').order('event_date', { ascending: false }),
        supabase.from('attendance').select('*, student:profiles!attendance_student_id_fkey(*), event:events(*)'),
      ]);
      if (!active) return;
      setApprovals((ap as ApprovalRequest[]) ?? []);
      setEvents((evs as Event[]) ?? []);
      setAtt((a as (AttendanceRow & { student?: Profile; event?: Event })[]) ?? []);
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

  const presentAtt = useMemo(() => att.filter((a) => a.status === 'present'), [att]);

  const exportAtt = () => {
    const rows = presentAtt.map((a) => ({
      Student: a.student?.full_name ?? '—',
      RollNo: a.student?.roll_number ?? '—',
      Email: a.student?.email ?? '—',
      Event: a.event?.name ?? '—',
      Date: a.event ? formatDate(a.event.event_date) : '—',
      Department: a.event?.department_name ?? '—',
      DeanApproved: a.approved_by_dean ? 'Yes' : 'No',
      MarkedAt: a.marked_at ? formatDate(a.marked_at) : '—',
    }));
    const csv = [Object.keys(rows[0] ?? {}).join(','), ...rows.map((r) => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attended-participants.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

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

      <Card>
        <CardHeader title="Attended participants" subtitle={`${presentAtt.length} present across all events`} action={presentAtt.length > 0 ? <Button size="sm" variant="secondary" onClick={exportAtt}><Download className="h-4 w-4" /> Export CSV</Button> : undefined} />
        {presentAtt.length === 0 ? (
          <EmptyState icon={<Users className="h-8 w-8" />} title="No attendance yet" message="Attended participants will appear here once coordinators mark attendance." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Roll No</th>
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Dean</th>
                </tr>
              </thead>
              <tbody>
                {presentAtt.slice(0, 50).map((a) => (
                  <tr key={a.id} className="border-b border-ink-50 dark:border-ink-800/50">
                    <td className="py-3 pr-4 font-medium">{a.student?.full_name ?? '—'}</td>
                    <td className="py-3 pr-4 text-ink-400">{a.student?.roll_number ?? '—'}</td>
                    <td className="py-3 pr-4">{a.event?.name ?? '—'}</td>
                    <td className="py-3 pr-4 text-ink-400">{a.event ? formatDate(a.event.event_date) : '—'}</td>
                    <td className="py-3 pr-4">
                      {a.approved_by_dean ? <span className="badge bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300">Approved</span> : <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {presentAtt.length > 50 && <p className="mt-3 text-xs text-ink-400">Showing 50 of {presentAtt.length}. Export CSV for full list.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
