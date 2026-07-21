import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QrCode, ScanLine, CheckCircle2, AlertTriangle, CalendarDays, Clock, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { markAttendance } from '../../lib/attendance';
import { formatDate, formatTime } from '../../lib/utils';
import type { Event, Registration } from '../../types';

export function ScanQrPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: evs }, { data: r }] = await Promise.all([
        supabase.from('events').select('*').gte('event_date', today).order('event_date', { ascending: true }),
        supabase.from('registrations').select('*, event:events(*)').eq('student_id', profile.id).eq('status', 'registered'),
      ]);
      setEvents((evs as Event[]) ?? []);
      setRegs((r as Registration[]) ?? []);
      const qEvent = params.get('event');
      if (qEvent) setSelectedEvent(qEvent);
      setLoading(false);
    })();
  }, [profile, params]);

  const openEvents = useMemo(() => events.filter((e) => e.attendance_open), [events]);
  const myRegEvents = useMemo(() => new Set(regs.map((r) => r.event_id)), [regs]);

  if (loading) return <PageLoader />;

  const submit = async (token: string) => {
    if (!profile || !selectedEvent || !token) return;
    setSubmitting(true);
    const { error, already } = await markAttendance({ eventId: selectedEvent, studentId: profile.id, qrToken: token });
    setSubmitting(false);
    if (error) {
      setResult({ ok: false, message: error });
      toast.error('Attendance failed', error);
    } else {
      setResult({ ok: true, message: already ? 'Already marked.' : 'Attendance marked successfully!' });
      toast.success('Attendance marked!');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Scan QR to mark attendance</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Enter the code shown on the coordinator's screen, or scan it from the event page.</p>
      </div>

      {result && (
        <Card>
          <div className={`flex items-center gap-3 rounded-xl p-4 ${result.ok ? 'bg-accent-50 dark:bg-accent-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
            {result.ok ? <CheckCircle2 className="h-8 w-8 text-accent-600" /> : <AlertTriangle className="h-8 w-8 text-red-600" />}
            <div>
              <p className="font-semibold">{result.ok ? 'Success' : 'Failed'}</p>
              <p className="text-sm text-ink-500">{result.message}</p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Enter QR token" subtitle="The 8+ character code on the coordinator's QR" />
        <ManualEntry onSubmit={submit} loading={submitting} />
      </Card>

      <Card>
        <CardHeader title="Events with open attendance" subtitle="Pick an event, then enter the live token" />
        {openEvents.length === 0 ? (
          <EmptyState icon={<ScanLine className="h-8 w-8" />} title="No open attendance" message="Ask the coordinator to start attendance." />
        ) : (
          <div className="space-y-2">
            {openEvents.map((e) => {
              const registered = myRegEvents.has(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedEvent(e.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selectedEvent === e.id ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-ink-100 dark:border-ink-800 hover:border-brand-300'}`}
                >
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white"><QrCode className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.name}</p>
                    <p className="text-xs text-ink-400">{formatDate(e.event_date)} • {formatTime(e.start_time)} • {e.venue}</p>
                  </div>
                  {registered ? <StatusBadge status="registered" /> : <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Not registered</span>}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="My registered events" subtitle="You can only mark attendance for events you're registered in" />
        {regs.length === 0 ? (
          <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="No registrations" message="Register for an event first." action={<Link to="/app/events" className="btn-primary">Browse events</Link>} />
        ) : (
          <div className="space-y-2">
            {regs.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-ink-100 dark:border-ink-800 p-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink-100 dark:bg-ink-800"><CalendarDays className="h-5 w-5 text-ink-400" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.event?.name}</p>
                  <p className="text-xs text-ink-400">{r.event && formatDate(r.event.event_date)} • {r.event && formatTime(r.event.start_time)}</p>
                </div>
                <Link to={`/app/events/${r.event_id}`} className="btn-secondary !px-3 !py-1.5 text-xs">Open</Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ManualEntry({ onSubmit, loading }: { onSubmit: (token: string) => void; loading: boolean }) {
  const [token, setToken] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(token.trim());
      }}
      className="flex gap-2"
    >
      <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste QR token…" className="input font-mono" />
      <Button type="submit" loading={loading} disabled={!token.trim()}>Mark</Button>
    </form>
  );
}
