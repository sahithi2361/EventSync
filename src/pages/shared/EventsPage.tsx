import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users, Filter, Plus, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { SectionHeader } from '../../components/dashboard/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, Input } from '../../components/ui/Field';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, formatTime } from '../../lib/utils';
import type { Event, EventType, Department } from '../../types';

const eventTypes: EventType[] = ['Workshop', 'Seminar', 'Hackathon', 'Guest Lecture', 'Technical', 'Project Expo', 'Club Event', 'Cultural', 'Sports'];

export function EventsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: evs }, { data: ds }] = await Promise.all([
        supabase.from('events').select('*, coordinator:profiles!events_coordinator_id_fkey(full_name), department:departments(*)').order('event_date', { ascending: false }),
        supabase.from('departments').select('*').order('name'),
      ]);
      if (!active) return;
      setEvents((evs as Event[]) ?? []);
      setDepts((ds as Department[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q.toLowerCase()) && !(e.description ?? '').toLowerCase().includes(q.toLowerCase())) return false;
      if (type && e.event_type !== type) return false;
      if (dept && e.department_id !== dept) return false;
      if (status && e.status !== status) return false;
      return true;
    });
  }, [events, q, type, dept, status]);

  if (loading) return <PageLoader />;

  const canCreate = profile?.role === 'coordinator' || profile?.role === 'admin';

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Events"
        subtitle="Browse, register, and manage campus events."
        action={canCreate ? <Link to="/app/events/new" className="btn-primary"><Plus className="h-4 w-4" /> Create event</Link> : undefined}
      />

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" className="pl-9" />
          </div>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">All departments</option>
            {depts.map((d) => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-10 w-10" />} title="No events found" message="Try adjusting your filters." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <Link key={e.id} to={`/app/events/${e.id}`} className="card group overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
              <div className="relative h-32 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800">
                {e.poster_url ? (
                  <img src={e.poster_url} alt={e.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-grid-dark [background-size:18px_18px] opacity-20" />
                )}
                <div className="absolute left-3 top-3"><StatusBadge status={e.status} /></div>
                <div className="absolute right-3 top-3 badge bg-white/20 text-white backdrop-blur">{e.event_type}</div>
              </div>
              <div className="p-4">
                <h3 className="font-display text-base font-semibold leading-tight group-hover:text-brand-600">{e.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-ink-500 dark:text-ink-400">{e.description}</p>
                <div className="mt-3 space-y-1.5 text-xs text-ink-500 dark:text-ink-400">
                  <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(e.event_date)} • {formatTime(e.start_time)}</p>
                  <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {e.venue}</p>
                  <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {e.registration_count ?? 0}/{e.max_participants} registered</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
