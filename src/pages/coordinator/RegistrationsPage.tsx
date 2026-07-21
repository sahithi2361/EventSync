import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarDays } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { SectionHeader } from '../../components/dashboard/StatCard';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, relativeTime } from '../../lib/utils';
import type { Event, Registration, Profile } from '../../types';

export function RegistrationsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [regs, setRegs] = useState<(Registration & { student?: Profile })[]>([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: evs } = await supabase.from('events').select('*').eq('coordinator_id', profile.id).order('event_date', { ascending: false });
      setEvents((evs as Event[]) ?? []);
      if ((evs as Event[])?.length) setSelected((evs as Event[])[0].id);
      setLoading(false);
    })();
  }, [profile]);

  useEffect(() => {
    if (!selected) {
      setRegs([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('registrations')
        .select('*, student:profiles!registrations_student_id_fkey(*)')
        .eq('event_id', selected)
        .order('registered_at', { ascending: false });
      setRegs((data as (Registration & { student?: Profile })[]) ?? []);
    })();
  }, [selected]);

  const event = useMemo(() => events.find((e) => e.id === selected), [events, selected]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Registrations" subtitle="View students registered for your events." />
      {events.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-10 w-10" />} title="No events" message="Create an event to see registrations." action={<Link to="/app/events/new" className="btn-primary">Create event</Link>} />
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap gap-2">
              {events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelected(e.id)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${selected === e.id ? 'bg-brand-600 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200'}`}
                >
                  {e.name}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">{event?.name}</h3>
              <span className="text-sm text-ink-400">{regs.length} registered</span>
            </div>
            {regs.length === 0 ? (
              <EmptyState icon={<Users className="h-8 w-8" />} title="No registrations yet" />
            ) : (
              <div className="divide-y divide-ink-100 dark:divide-ink-800">
                {regs.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-3">
                    <Avatar name={r.student?.full_name ?? 'Student'} src={r.student?.avatar_url} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.student?.full_name}</p>
                      <p className="text-xs text-ink-400">{r.student?.roll_number ?? r.student?.email}</p>
                    </div>
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-ink-400">{relativeTime(r.registered_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
