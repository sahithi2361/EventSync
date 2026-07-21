import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, Award, Bell, TrendingUp, QrCode, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { StatCard, SectionHeader } from '../../components/dashboard/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, formatTime, relativeTime } from '../../lib/utils';
import type { Event, Registration, AttendanceRow, Certificate, Notification } from '../../types';

export function StudentDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [att, setAtt] = useState<AttendanceRow[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    (async () => {
      const now = new Date().toISOString().slice(0, 10);
      const [{ data: evs }, { data: r }, { data: a }, { data: c }, { data: n }] = await Promise.all([
        supabase.from('events').select('*').gte('event_date', now).order('event_date', { ascending: true }).limit(6),
        supabase.from('registrations').select('*, event:events(*)').eq('student_id', profile.id).order('registered_at', { ascending: false }),
        supabase.from('attendance').select('*, event:events(*)').eq('student_id', profile.id).order('marked_at', { ascending: false }),
        supabase.from('certificates').select('*, event:events(*)').eq('student_id', profile.id).order('issued_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5),
      ]);
      if (!active) return;
      setEvents((evs as Event[]) ?? []);
      setRegs((r as Registration[]) ?? []);
      setAtt((a as AttendanceRow[]) ?? []);
      setCerts((c as Certificate[]) ?? []);
      setNotifs((n as Notification[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [profile]);

  const upcoming = useMemo(() => events.filter((e) => e.status === 'upcoming' || e.status === 'ongoing'), [events]);
  const myRegs = useMemo(() => regs.filter((r) => r.status === 'registered' || r.status === 'attended'), [regs]);
  const approvedAtt = useMemo(() => att.filter((a) => a.approved_by_dean), [att]);

  if (loading) return <PageLoader />;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <SectionHeader
        title={`Hi, ${profile.full_name.split(' ')[0]} 👋`}
        subtitle="Here's what's happening with your events."
        action={<Link to="/app/scan" className="btn-primary"><QrCode className="h-4 w-4" /> Scan QR</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming Events" value={upcoming.length} icon={<CalendarDays className="h-5 w-5" />} tone="brand" />
        <StatCard label="Registered" value={myRegs.length} icon={<ClipboardCheck className="h-5 w-5" />} tone="accent" />
        <StatCard label="Attendance" value={att.length} icon={<TrendingUp className="h-5 w-5" />} tone="violet" hint={`${approvedAtt.length} approved`} />
        <StatCard label="Certificates" value={certs.length} icon={<Award className="h-5 w-5" />} tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Upcoming Events" subtitle="Register before the deadline" action={<Link to="/app/events" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</Link>} />
          {upcoming.length === 0 ? (
            <EmptyState icon={<CalendarDays className="h-10 w-10" />} title="No upcoming events" message="Check back soon for new events." />
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 4).map((e) => {
                const registered = myRegs.some((r) => r.event_id === e.id);
                return (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl border border-ink-100 dark:border-ink-800 p-3 transition hover:border-brand-300 dark:hover:border-brand-700">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{e.name}</p>
                      <p className="truncate text-xs text-ink-400">{formatDate(e.event_date)} • {formatTime(e.start_time)} • {e.venue}</p>
                    </div>
                    {registered ? (
                      <StatusBadge status="registered" />
                    ) : (
                      <Link to={`/app/events/${e.id}`} className="btn-secondary !px-3 !py-1.5 text-xs">Register</Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Notifications" action={<Link to="/app/notifications" className="text-sm font-medium text-brand-600">All</Link>} />
          {notifs.length === 0 ? (
            <EmptyState icon={<Bell className="h-8 w-8" />} title="No notifications" />
          ) : (
            <div className="space-y-2">
              {notifs.map((n) => (
                <div key={n.id} className="rounded-lg bg-ink-50 dark:bg-ink-800/50 p-3">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.message && <p className="mt-0.5 text-xs text-ink-400">{n.message}</p>}
                  <p className="mt-1 text-[10px] text-ink-400">{relativeTime(n.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Registered Events" action={<Link to="/app/events" className="text-sm font-medium text-brand-600">View</Link>} />
          {myRegs.length === 0 ? (
            <EmptyState icon={<ClipboardCheck className="h-8 w-8" />} title="No registrations yet" message="Browse events and register." />
          ) : (
            <div className="space-y-2">
              {myRegs.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-ink-100 dark:border-ink-800 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.event?.name}</p>
                    <p className="text-xs text-ink-400">{r.event && formatDate(r.event.event_date)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent Certificates" action={<Link to="/app/certificates" className="text-sm font-medium text-brand-600">View</Link>} />
          {certs.length === 0 ? (
            <EmptyState icon={<Award className="h-8 w-8" />} title="No certificates yet" message="Certificates are issued after approval." />
          ) : (
            <div className="space-y-2">
              {certs.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-ink-100 dark:border-ink-800 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.event?.name}</p>
                    <p className="text-xs text-ink-400 font-mono">{c.verification_code}</p>
                  </div>
                  <Link to={`/app/certificates`} className="btn-ghost !px-2 !py-1 text-xs">View <ArrowRight className="h-3 w-3" /></Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
