import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, CalendarDays, Users, ClipboardCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { SectionHeader } from '../../components/dashboard/StatCard';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate } from '../../lib/utils';
import type { Event, Profile, AttendanceRow } from '../../types';

export function SearchPage() {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [att, setAtt] = useState<AttendanceRow[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const term = q.trim();
      if (!term) {
        setLoading(false);
        return;
      }
      const like = `%${term}%`;
      const [ev, u, a] = await Promise.all([
        supabase.from('events').select('*').or(`name.ilike.${like},description.ilike.${like},venue.ilike.${like}`).limit(10),
        (profile?.role === 'admin' || profile?.role === 'dean' || profile?.role === 'coordinator')
          ? supabase.from('profiles').select('*').or(`full_name.ilike.${like},email.ilike.${like},roll_number.ilike.${like}`).limit(10)
          : Promise.resolve({ data: null }),
        (profile?.role === 'admin' || profile?.role === 'dean' || profile?.role === 'coordinator')
          ? supabase.from('attendance').select('*, event:events!attendance_event_id_fkey(name), student:profiles!attendance_student_id_fkey(full_name)').limit(10)
          : Promise.resolve({ data: null }),
      ]);
      if (!active) return;
      setEvents((ev.data as Event[]) ?? []);
      setUsers((u.data as Profile[]) ?? []);
      setAtt((a.data as AttendanceRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [q, profile]);

  const canSearchUsers = profile?.role === 'admin' || profile?.role === 'dean' || profile?.role === 'coordinator';

  return (
    <div className="space-y-6">
      <SectionHeader title="Search" subtitle="Find events, students, and attendance." />
      <Card>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" autoFocus />
        </div>
      </Card>

      {!q.trim() ? (
        <EmptyState icon={<Search className="h-10 w-10" />} title="Start typing to search" message="Search events by name, venue, or description." />
      ) : loading ? (
        <PageLoader />
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-brand-500" /> Events ({events.length})</div>
            {events.length === 0 ? <p className="text-sm text-ink-400">No events found.</p> : (
              <div className="space-y-2">
                {events.map((e) => (
                  <Link key={e.id} to={`/app/events/${e.id}`} className="flex items-center gap-3 rounded-lg border border-ink-100 dark:border-ink-800 p-3 hover:border-brand-300">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white"><CalendarDays className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{e.name}</p>
                      <p className="text-xs text-ink-400">{formatDate(e.event_date)} • {e.venue}</p>
                    </div>
                    <StatusBadge status={e.status} />
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {canSearchUsers && (
            <Card>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-accent-500" /> People ({users.length})</div>
              {users.length === 0 ? <p className="text-sm text-ink-400">No people found.</p> : (
                <div className="space-y-2">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 rounded-lg border border-ink-100 dark:border-ink-800 p-3">
                      <Avatar name={u.full_name} src={u.avatar_url} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{u.full_name}</p>
                        <p className="text-xs text-ink-400">{u.email} • {u.roll_number ?? '—'}</p>
                      </div>
                      <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 capitalize">{u.role}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {canSearchUsers && att.length > 0 && (
            <Card>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><ClipboardCheck className="h-4 w-4 text-violet-500" /> Attendance ({att.length})</div>
              <div className="space-y-2">
                {att.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-ink-100 dark:border-ink-800 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{(a.student as unknown as Profile)?.full_name ?? 'Student'}</p>
                      <p className="text-xs text-ink-400">{(a.event as unknown as Event)?.name ?? 'Event'}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
