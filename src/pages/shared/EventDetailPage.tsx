import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Users, User, Building2,
  Send, Download, CheckCircle2, Star, MessageSquare,
  Pencil, Trash2, Check, X, UserCheck, IndianRupee, CreditCard, Tag,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { Field, Textarea, Input, Select } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { formatDate, formatTime, csvFromRows, downloadFile, relativeTime } from '../../lib/utils';
import { registerForEvent, cancelRegistration, manualMarkAttendance, unmarkAttendance, submitApprovalRequest, payForEvent } from '../../lib/attendance';
import { logActivity } from '../../lib/actions';
import type { Event, Registration, AttendanceRow, ApprovalRequest, Feedback, Profile } from '../../types';

export function EventDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [coordinator, setCoordinator] = useState<Profile | null>(null);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [att, setAtt] = useState<AttendanceRow[]>([]);
  const [approval, setApproval] = useState<ApprovalRequest | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [myReg, setMyReg] = useState<Registration | null>(null);
  const [myAtt, setMyAtt] = useState<AttendanceRow | null>(null);
  const [myFeedback, setMyFeedback] = useState<Feedback | null>(null);
  const [tab, setTab] = useState<'overview' | 'registrations' | 'attendance' | 'feedback'>('overview');
  const [submitOpen, setSubmitOpen] = useState(false);
  const [reportSummary, setReportSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [fbRating, setFbRating] = useState(5);
  const [fbComment, setFbComment] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', description: '', event_type: 'Workshop', event_date: '', start_time: '09:00',
    end_time: '17:00', venue: '', max_participants: 100, registration_deadline: '', poster_url: '', status: 'upcoming',
    is_paid: false, price: 0, tags: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const isOwner = profile && event && event.coordinator_id === profile.id;
  const isCoordinator = profile?.role === 'coordinator' || profile?.role === 'admin';
  const isStudent = profile?.role === 'student';
  const isDeadlinePassed = useMemo(() => {
    if (!event) return false;
    const deadline = new Date(event.registration_deadline + 'T23:59:59');
    return deadline < new Date();
  }, [event]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      const [{ data: ev }, { data: r }, { data: a }, { data: ap }, { data: fb }] = await Promise.all([
        supabase.from('events').select('*, coordinator:profiles!events_coordinator_id_fkey(*), department:departments(*)').eq('id', id).maybeSingle(),
        supabase.from('registrations').select('*, student:profiles!registrations_student_id_fkey(*)').eq('event_id', id).order('registered_at'),
        supabase.from('attendance').select('*, student:profiles!attendance_student_id_fkey(*)').eq('event_id', id).order('marked_at'),
        supabase.from('approval_requests').select('*').eq('event_id', id).maybeSingle(),
        supabase.from('feedback').select('*, student:profiles!feedback_student_id_fkey(full_name)').eq('event_id', id).order('created_at', { ascending: false }),
      ]);
      if (!active) return;
      setEvent(ev as Event | null);
      setCoordinator((ev as Event | null)?.coordinator ?? null);
      setRegs((r as Registration[]) ?? []);
      setAtt((a as AttendanceRow[]) ?? []);
      setApproval(ap as ApprovalRequest | null);
      setFeedback((fb as Feedback[]) ?? []);
      if (profile) {
        setMyReg(((r as Registration[]) ?? []).find((x) => x.student_id === profile.id) ?? null);
        setMyAtt(((a as AttendanceRow[]) ?? []).find((x) => x.student_id === profile.id) ?? null);
        setMyFeedback(((fb as Feedback[]) ?? []).find((x) => x.student_id === profile.id) ?? null);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id, profile]);

  const avgRating = useMemo(() => (feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : null), [feedback]);

  if (loading) return <PageLoader />;
  if (!event) return <EmptyState title="Event not found" message="It may have been removed." action={<Link to="/app/events" className="btn-primary">Back to events</Link>} />;

  const handleRegister = async () => {
    if (!profile) return;
    const { error, paymentStatus } = await registerForEvent({
      eventId: event.id, studentId: profile.id, isPaid: event.is_paid, price: event.price,
    });
    if (error) toast.error('Registration failed', error);
    else {
      if (paymentStatus === 'pending') {
        toast.info('Registered!', `Please pay ₹${event.price} to confirm.`);
        setPayOpen(true);
      } else {
        toast.success('Registered!', 'You are now registered.');
      }
      setMyReg({ id: 'temp', event_id: event.id, student_id: profile.id, status: 'registered', payment_status: paymentStatus as 'free' | 'pending', payment_amount: event.price, registered_at: new Date().toISOString() });
      logActivity(profile.id, 'register_event', 'events', event.id);
    }
  };

  const handlePay = async () => {
    if (!profile) return;
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1500));
    const { error } = await payForEvent(event.id, profile.id, event.price);
    setPaying(false);
    if (error) toast.error('Payment failed', error);
    else {
      toast.success('Payment confirmed!', `₹${event.price} paid.`);
      setMyReg(myReg ? { ...myReg, payment_status: 'paid' } : null);
      setPayOpen(false);
    }
  };

  const handleCancel = async () => {
    if (!profile) return;
    const { error } = await cancelRegistration(event.id, profile.id);
    if (error) toast.error('Cancel failed', error);
    else {
      toast.success('Registration cancelled');
      setMyReg(null);
    }
  };

  const handleMark = async (studentId: string, name: string) => {
    if (!profile || !id) return;
    const { error } = await manualMarkAttendance({ eventId: id, studentId, markedBy: profile.id, status: 'present' });
    if (error) toast.error('Failed', error);
    else {
      toast.success(`${name} marked present`);
      const { data } = await supabase.from('attendance').select('*, student:profiles!attendance_student_id_fkey(*)').eq('event_id', id).order('marked_at');
      setAtt((data as AttendanceRow[]) ?? []);
      setRegs((prev) => prev.map((r) => r.student_id === studentId ? { ...r, status: 'attended' as const } : r));
    }
  };

  const handleUnmark = async (studentId: string, name: string) => {
    if (!id) return;
    const { error } = await unmarkAttendance({ eventId: id, studentId });
    if (error) toast.error('Failed', error);
    else {
      toast.info(`${name} unmarked`);
      const { data } = await supabase.from('attendance').select('*, student:profiles!attendance_student_id_fkey(*)').eq('event_id', id).order('marked_at');
      setAtt((data as AttendanceRow[]) ?? []);
      setRegs((prev) => prev.map((r) => r.student_id === studentId ? { ...r, status: 'registered' as const } : r));
    }
  };

  const markAllPresent = async () => {
    if (!profile || !id) return;
    for (const r of regs) {
      await manualMarkAttendance({ eventId: id, studentId: r.student_id, markedBy: profile.id, status: 'present' });
    }
    const { data } = await supabase.from('attendance').select('*, student:profiles!attendance_student_id_fkey(*)').eq('event_id', id).order('marked_at');
    setAtt((data as AttendanceRow[]) ?? []);
    setRegs((prev) => prev.map((r) => ({ ...r, status: 'attended' as const })));
    toast.success('All registered students marked present');
  };

  const submitApproval = async () => {
    if (!profile || !id) return;
    setSubmitting(true);
    const { error } = await submitApprovalRequest({
      eventId: id,
      coordinatorId: profile.id,
      studentCount: att.filter((a) => a.status === 'present').length,
      reportSummary,
    });
    setSubmitting(false);
    setSubmitOpen(false);
    if (error) toast.error('Submit failed', error);
    else {
      toast.success('Submitted to Dean', 'Awaiting approval.');
      setApproval({ id: 'temp', event_id: id, coordinator_id: profile.id, status: 'pending', student_count: att.length, report_summary: reportSummary, submitted_at: new Date().toISOString() } as ApprovalRequest);
      logActivity(profile.id, 'submit_approval', 'events', id);
    }
  };

  const exportCsv = () => {
    const rows = att.map((a) => ({
      student: a.student?.full_name,
      roll: a.student?.roll_number ?? '',
      status: a.status,
      marked_at: a.marked_at,
      approved: a.approved_by_dean ? 'yes' : 'no',
    }));
    downloadFile(`${event.name}-attendance.csv`, csvFromRows(rows), 'text/csv');
  };

  const submitFeedback = async () => {
    if (!profile || !id) return;
    const { error } = await supabase.from('feedback').upsert(
      { event_id: id, student_id: profile.id, rating: fbRating, comment: fbComment },
      { onConflict: 'event_id,student_id' },
    );
    if (error) toast.error('Feedback failed', error.message);
    else {
      toast.success('Thanks for your feedback!');
      setMyFeedback({ id: 'temp', event_id: id, student_id: profile.id, rating: fbRating, comment: fbComment, created_at: new Date().toISOString() });
      setFeedbackOpen(false);
    }
  };

  const openEdit = () => {
    if (!event) return;
    setEditForm({
      name: event.name,
      description: event.description ?? '',
      event_type: event.event_type,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      venue: event.venue,
      max_participants: event.max_participants,
      registration_deadline: event.registration_deadline,
      poster_url: event.poster_url ?? '',
      status: event.status,
      is_paid: event.is_paid,
      price: event.price,
      tags: event.tags ?? '',
    });
    setEditOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setEditSaving(true);
    const { error } = await supabase.from('events').update({
      name: editForm.name,
      description: editForm.description || null,
      event_type: editForm.event_type,
      event_date: editForm.event_date,
      start_time: editForm.start_time,
      end_time: editForm.end_time,
      venue: editForm.venue,
      max_participants: Number(editForm.max_participants) || 100,
      registration_deadline: editForm.registration_deadline || editForm.event_date,
      poster_url: editForm.poster_url || null,
      status: editForm.status,
      is_paid: editForm.is_paid,
      price: editForm.is_paid ? Number(editForm.price) || 0 : 0,
      tags: editForm.tags || null,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setEditSaving(false);
    if (error) toast.error('Update failed', error.message);
    else {
      toast.success('Event updated');
      setEvent({ ...event, ...editForm, max_participants: Number(editForm.max_participants), price: Number(editForm.price) });
      setEditOpen(false);
      logActivity(profile?.id, 'update_event', 'events', id);
    }
  };

  const deleteEvent = async () => {
    if (!id || !event) return;
    if (!confirm(`Delete "${event.name}"? This removes all registrations, attendance, and certificates for this event. This cannot be undone.`)) return;
    setDeleting(true);
    const { error } = await supabase.from('events').delete().eq('id', id);
    setDeleting(false);
    if (error) toast.error('Delete failed', error.message);
    else {
      toast.success('Event deleted');
      logActivity(profile?.id, 'delete_event', 'events', id);
      navigate('/app/events');
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/app/events" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>

      {/* Hero */}
      <Card className="overflow-hidden p-0">
        <div className="relative h-40 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 sm:h-48">
          {event.poster_url && <img src={event.poster_url} alt={event.name} className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <StatusBadge status={event.status} />
                <span className="badge bg-white/20 text-white backdrop-blur">{event.event_type}</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{event.name}</h1>
            </div>
            {isStudent && (
              <div>
                {myReg ? (
                  <div className="flex items-center gap-2">
                    <StatusBadge status={myReg.status} />
                    {event.is_paid && myReg.payment_status !== 'paid' && (
                      <Button size="sm" onClick={() => setPayOpen(true)}><CreditCard className="h-4 w-4" /> Pay ₹{event.price}</Button>
                    )}
                    {event.is_paid && myReg.payment_status === 'paid' && (
                      <span className="badge bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300">Paid</span>
                    )}
                    <Button variant="secondary" size="sm" onClick={handleCancel}>Cancel</Button>
                  </div>
                ) : (
                  <div>
                    <Button onClick={handleRegister} disabled={isDeadlinePassed}>
                      <Users className="h-4 w-4" /> {event.is_paid ? `Register (₹${event.price})` : 'Register'}
                    </Button>
                    {isDeadlinePassed && <p className="mt-1 text-xs text-red-500">Registration closed</p>}
                  </div>
                )}
              </div>
            )}
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={openEdit}><Pencil className="h-4 w-4" /> Edit</Button>
                <Button variant="danger" size="sm" onClick={deleteEvent} loading={deleting}><Trash2 className="h-4 w-4" /> Delete</Button>
              </div>
            )}
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Info icon={<CalendarDays className="h-4 w-4" />} label="Date" value={formatDate(event.event_date)} />
          <Info icon={<Clock className="h-4 w-4" />} label="Time" value={`${formatTime(event.start_time)} – ${formatTime(event.end_time)}`} />
          <Info icon={<MapPin className="h-4 w-4" />} label="Venue" value={event.venue} />
          <Info icon={<Users className="h-4 w-4" />} label="Capacity" value={`${regs.length}/${event.max_participants}`} />
          <Info icon={<User className="h-4 w-4" />} label="Coordinator" value={coordinator?.full_name ?? '—'} />
          <Info icon={<Building2 className="h-4 w-4" />} label="Department" value={event.department?.name ?? event.department_name ?? '—'} />
          <Info icon={<CalendarDays className="h-4 w-4" />} label="Reg. deadline" value={formatDate(event.registration_deadline)} />
          <Info icon={<Star className="h-4 w-4" />} label="Rating" value={avgRating ? `${avgRating}/5 (${feedback.length})` : 'No ratings'} />
          <Info icon={<IndianRupee className="h-4 w-4" />} label="Fee" value={event.is_paid ? `₹${event.price}` : 'Free'} />
          {event.tags && <Info icon={<Tag className="h-4 w-4" />} label="Tags" value={event.tags} />}
        </div>
        {event.description && (
          <div className="border-t border-ink-100 dark:border-ink-800 px-5 py-4">
            <p className="text-sm text-ink-600 dark:text-ink-300">{event.description}</p>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {(['overview', 'registrations', 'attendance', 'feedback'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${tab === t ? 'bg-brand-600 text-white' : 'text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="My status" subtitle="Your registration & attendance for this event" />
            {isStudent ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-ink-100 dark:border-ink-800 p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-400">Registration</p>
                  <p className="mt-1 font-semibold">{myReg ? <StatusBadge status={myReg.status} /> : 'Not registered'}</p>
                </div>
                <div className="rounded-xl border border-ink-100 dark:border-ink-800 p-4">
                  <p className="text-xs uppercase tracking-wide text-ink-400">Attendance</p>
                  <p className="mt-1 font-semibold">{myAtt ? <StatusBadge status={myAtt.status} /> : 'Not marked'}</p>
                  {myAtt?.approved_by_dean && <p className="mt-1 text-xs text-accent-600">Approved by Dean</p>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink-500">Sign in as a student to register.</p>
            )}
            {isStudent && event.status === 'completed' && (
              <div className="mt-4">
                <Button variant="secondary" onClick={() => setFeedbackOpen(true)}>
                  <MessageSquare className="h-4 w-4" /> {myFeedback ? 'Edit feedback' : 'Rate this event'}
                </Button>
              </div>
            )}
          </Card>

          {isOwner && (
            <Card>
              <CardHeader title="Coordinator controls" subtitle="Manual attendance & approval" />
              <div className="space-y-3">
                <Button variant="secondary" onClick={() => setTab('attendance')} className="w-full"><UserCheck className="h-4 w-4" /> Mark attendance</Button>
                <Button variant="secondary" onClick={() => setSubmitOpen(true)} disabled={approval?.status === 'approved'} className="w-full">
                  <Send className="h-4 w-4" /> {approval ? `Approval: ${approval.status}` : 'Submit to Dean'}
                </Button>
                <Button variant="ghost" onClick={exportCsv} className="w-full"><Download className="h-4 w-4" /> Export CSV</Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === 'registrations' && (
        <Card>
          <CardHeader title="Registered students" subtitle={`${regs.length} registered`} />
          {regs.length === 0 ? (
            <EmptyState icon={<Users className="h-8 w-8" />} title="No registrations yet" />
          ) : (
            <div className="divide-y divide-ink-100 dark:divide-ink-800">
              {regs.map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <Avatar name={r.student?.full_name ?? 'Student'} size="sm" />
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
      )}

      {tab === 'attendance' && (
        <div className="space-y-5">
          {isOwner ? (
            <Card>
              <CardHeader title="Mark attendance" subtitle={`${regs.length} registered • ${att.filter((a) => a.status === 'present').length} present`} action={regs.length > 0 ? <Button size="sm" variant="secondary" onClick={markAllPresent}>Mark all present</Button> : undefined} />
              {regs.length === 0 ? (
                <EmptyState icon={<Users className="h-8 w-8" />} title="No registrations" message="Students must register before you can mark attendance." />
              ) : (
                <div className="divide-y divide-ink-100 dark:divide-ink-800">
                  {regs.map((r) => {
                    const studentAtt = att.find((a) => a.student_id === r.student_id);
                    const isPresent = studentAtt?.status === 'present';
                    return (
                      <div key={r.id} className="flex items-center gap-3 py-3">
                        <Avatar name={r.student?.full_name ?? 'Student'} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{r.student?.full_name}</p>
                          <p className="text-xs text-ink-400">{r.student?.roll_number ?? r.student?.email}</p>
                        </div>
                        {isPresent ? (
                          <div className="flex items-center gap-2">
                            <span className="badge bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300">Present</span>
                            <Button size="sm" variant="ghost" onClick={() => handleUnmark(r.student_id, r.student?.full_name ?? 'Student')}><X className="h-4 w-4" /> Unmark</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="success" onClick={() => handleMark(r.student_id, r.student?.full_name ?? 'Student')}><Check className="h-4 w-4" /> Mark present</Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <CardHeader title="Attendance records" subtitle={`${att.length} marked`} action={isCoordinator && att.length > 0 ? <Button size="sm" variant="ghost" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button> : undefined} />
              {att.length === 0 ? (
                <EmptyState icon={<CheckCircle2 className="h-8 w-8" />} title="No attendance yet" message="Attendance will appear here once the coordinator marks it." />
              ) : (
                <div className="divide-y divide-ink-100 dark:divide-ink-800">
                  {att.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 py-3">
                      <Avatar name={a.student?.full_name ?? 'Student'} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{a.student?.full_name}</p>
                        <p className="text-xs text-ink-400">{a.student?.roll_number ?? a.student?.email}</p>
                      </div>
                      <StatusBadge status={a.status} />
                      {a.approved_by_dean && <span className="badge bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300">Approved</span>}
                      <span className="text-xs text-ink-400">{relativeTime(a.marked_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {tab === 'feedback' && (
        <Card>
          <CardHeader title="Event feedback" subtitle={avgRating ? `Average: ${avgRating}/5` : 'No ratings yet'} />
          {feedback.length === 0 ? (
            <EmptyState icon={<Star className="h-8 w-8" />} title="No feedback yet" />
          ) : (
            <div className="space-y-3">
              {feedback.map((f) => (
                <div key={f.id} className="rounded-xl border border-ink-100 dark:border-ink-800 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{f.student?.full_name ?? 'Student'}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < f.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-300'}`} />
                      ))}
                    </div>
                  </div>
                  {f.comment && <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{f.comment}</p>}
                  <p className="mt-1 text-xs text-ink-400">{relativeTime(f.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Modal open={submitOpen} onClose={() => setSubmitOpen(false)} title="Submit attendance to Dean"
        footer={<><Button variant="secondary" onClick={() => setSubmitOpen(false)}>Cancel</Button><Button loading={submitting} onClick={submitApproval}>Submit</Button></>}>
        <p className="text-sm text-ink-500">You are submitting attendance for <b>{att.filter((a) => a.status === 'present').length}</b> present students to the Dean Academics for approval.</p>
        <div className="mt-4">
          <Field label="Report summary (optional)"><Textarea value={reportSummary} onChange={(e) => setReportSummary(e.target.value)} placeholder="Notes for the Dean…" /></Field>
        </div>
      </Modal>

      <Modal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="Rate this event"
        footer={<><Button variant="secondary" onClick={() => setFeedbackOpen(false)}>Cancel</Button><Button onClick={submitFeedback}>Submit</Button></>}>
        <div className="flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button key={i} onClick={() => setFbRating(i + 1)}>
              <Star className={`h-8 w-8 ${i < fbRating ? 'fill-amber-400 text-amber-400' : 'text-ink-300'}`} />
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Field label="Comment (optional)"><Textarea value={fbComment} onChange={(e) => setFbComment(e.target.value)} placeholder="Share your thoughts…" /></Field>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit event" size="lg"
        footer={<><Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button><Button type="submit" form="edit-event-form" loading={editSaving}>Save changes</Button></>}>
        <form id="edit-event-form" onSubmit={saveEdit} className="space-y-4">
          <Field label="Event name"><Input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></Field>
          <Field label="Description"><Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Event type">
              <Select value={editForm.event_type} onChange={(e) => setEditForm({ ...editForm, event_type: e.target.value as Event['event_type'] })}>
                {(['Workshop','Seminar','Hackathon','Guest Lecture','Technical','Project Expo','Club Event','Cultural','Sports'] as const).map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Event['status'] })}>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date"><Input type="date" required value={editForm.event_date} onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })} /></Field>
            <Field label="Start time"><Input type="time" value={editForm.start_time} onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })} /></Field>
            <Field label="End time"><Input type="time" value={editForm.end_time} onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Venue"><Input required value={editForm.venue} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} /></Field>
            <Field label="Max participants"><Input type="number" min={1} value={editForm.max_participants} onChange={(e) => setEditForm({ ...editForm, max_participants: Number(e.target.value) })} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Registration deadline"><Input type="date" value={editForm.registration_deadline} onChange={(e) => setEditForm({ ...editForm, registration_deadline: e.target.value })} /></Field>
            <Field label="Poster URL (optional)"><Input value={editForm.poster_url} onChange={(e) => setEditForm({ ...editForm, poster_url: e.target.value })} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tags (optional)"><Input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="AI, ML, Beginner…" /></Field>
            <Field label="Pricing">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!editForm.is_paid} onChange={() => setEditForm({ ...editForm, is_paid: false })} className="rounded" /> Free
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editForm.is_paid} onChange={() => setEditForm({ ...editForm, is_paid: true })} className="rounded" /> Paid
                </label>
                {editForm.is_paid && (
                  <div className="relative">
                    <IndianRupee className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <Input type="number" min={0} step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="pl-8 w-28" placeholder="0" />
                  </div>
                )}
              </div>
            </Field>
          </div>
        </form>
      </Modal>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Complete payment"
        footer={<><Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button><Button loading={paying} onClick={handlePay}><CreditCard className="h-4 w-4" /> Pay ₹{event.price}</Button></>}>
        <div className="space-y-4">
          <div className="rounded-xl border border-ink-100 dark:border-ink-800 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-500">Event</span>
              <span className="font-semibold">{event.name}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-ink-500">Amount</span>
              <span className="font-semibold">₹{event.price}</span>
            </div>
          </div>
          <p className="text-xs text-ink-400">This is a simulated payment for demo purposes. In production, this would redirect to a secure payment gateway.</p>
        </div>
      </Modal>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-ink-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
