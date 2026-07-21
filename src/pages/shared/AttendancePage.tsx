import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Filter, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { SectionHeader } from '../../components/dashboard/StatCard';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Field';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, relativeTime } from '../../lib/utils';
import type { AttendanceRow, Event, Profile } from '../../types';

export function AttendancePage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<(AttendanceRow & { event?: Event; student?: Profile })[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!profile) return;
    let query = supabase.from('attendance').select('*, event:events!attendance_event_id_fkey(*), student:profiles!attendance_student_id_fkey(*)').order('marked_at', { ascending: false });
    if (profile.role === 'student') query = query.eq('student_id', profile.id);
    query.then(({ data }) => {
      setRows((data as (AttendanceRow & { event?: Event; student?: Profile })[]) ?? []);
      setLoading(false);
    });
  }, [profile]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (status && r.status !== status) return false;
    if (q && !(r.event?.name.toLowerCase().includes(q.toLowerCase()) || (r.student?.full_name ?? '').toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [rows, q, status]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Attendance History" subtitle={profile?.role === 'student' ? 'Your attendance across all events.' : 'All attendance records.'} />
      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search event or student…" className="pl-9" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="excused">Excused</option>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={<ClipboardCheck className="h-10 w-10" />} title="No attendance records" message="Attendance appears here once students scan the QR." action={<Link to="/app/events" className="btn-primary">Browse events</Link>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="py-2 pr-4">Event</th>
                  {profile?.role !== 'student' && <th className="py-2 pr-4">Student</th>}
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Dean</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-ink-50 dark:border-ink-800/50">
                    <td className="py-3 pr-4 font-medium">{r.event?.name ?? '—'}</td>
                    {profile?.role !== 'student' && <td className="py-3 pr-4">{r.student?.full_name ?? '—'}</td>}
                    <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                    <td className="py-3 pr-4 text-ink-400">{r.event && formatDate(r.event.event_date)}</td>
                    <td className="py-3 pr-4">
                      {r.approved_by_dean ? <span className="badge bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300">Approved</span> : <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
