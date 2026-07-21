import { supabase } from './supabase';
import type { Event } from '../types';

export async function registerForEvent(eventId: string, studentId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('registrations')
    .insert({ event_id: eventId, student_id: studentId, status: 'registered' });
  if (error) return { error: error.message };
  await supabase.from('notifications').insert({
    user_id: studentId,
    title: 'Event registered',
    message: 'You have registered for the event.',
    type: 'event',
    link: `/app/events/${eventId}`,
  });
  return { error: null };
}

export async function cancelRegistration(eventId: string, studentId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('registrations')
    .delete()
    .eq('event_id', eventId)
    .eq('student_id', studentId);
  return { error: error ? error.message : null };
}

export async function markAttendance(opts: {
  eventId: string;
  studentId: string;
  qrToken: string;
}): Promise<{ error: string | null; already?: boolean }> {
  const { eventId, studentId, qrToken } = opts;
  // validate token + attendance open
  const { data: ev, error: evErr } = await supabase
    .from('events')
    .select('id, attendance_open, qr_token, qr_token_updated_at')
    .eq('id', eventId)
    .maybeSingle();
  if (evErr) return { error: evErr.message };
  if (!ev) return { error: 'Event not found.' };
  if (!ev.attendance_open) return { error: 'Attendance is not open for this event.' };
  if (!ev.qr_token || ev.qr_token !== qrToken) return { error: 'Invalid or expired QR code.' };
  if (ev.qr_token_updated_at) {
    const ageMs = Date.now() - new Date(ev.qr_token_updated_at).getTime();
    if (ageMs > 60_000) return { error: 'QR code expired. Ask the coordinator to refresh.' };
  }
  // must be registered
  const { data: reg } = await supabase
    .from('registrations')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (!reg) return { error: 'You are not registered for this event.' };
  // check duplicate
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('event_id', eventId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (existing) return { error: 'You have already marked attendance.', already: true };

  const { error } = await supabase.from('attendance').insert({
    event_id: eventId,
    student_id: studentId,
    status: 'present',
    marked_by: studentId,
  });
  if (error) return { error: error.message };
  await supabase.from('registrations').update({ status: 'attended' }).eq('id', reg.id);
  await supabase.from('notifications').insert({
    user_id: studentId,
    title: 'Attendance marked',
    message: 'Your attendance has been recorded.',
    type: 'attendance',
    link: `/app/events/${eventId}`,
  });
  return { error: null };
}

export async function refreshQrToken(eventId: string): Promise<{ token: string | null; error: string | null }> {
  const token = crypto.randomUUID() + '-' + Date.now().toString(36);
  const { error } = await supabase
    .from('events')
    .update({ qr_token: token, qr_token_updated_at: new Date().toISOString() })
    .eq('id', eventId);
  return { token: error ? null : token, error: error ? error.message : null };
}

export async function setAttendanceOpen(eventId: string, open: boolean): Promise<{ error: string | null }> {
  const patch: Partial<Event> = { attendance_open: open };
  if (!open) {
    patch.qr_token = null;
    patch.qr_token_updated_at = null;
  }
  const { error } = await supabase.from('events').update(patch).eq('id', eventId);
  return { error: error ? error.message : null };
}

export async function submitApprovalRequest(opts: {
  eventId: string;
  coordinatorId: string;
  studentCount: number;
  reportSummary?: string;
  note?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('approval_requests').upsert(
    {
      event_id: opts.eventId,
      coordinator_id: opts.coordinatorId,
      student_count: opts.studentCount,
      report_summary: opts.reportSummary ?? null,
      coordinator_note: opts.note ?? null,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      dean_id: null,
      dean_note: null,
    },
    { onConflict: 'event_id' },
  );
  return { error: error ? error.message : null };
}

export async function reviewApproval(opts: {
  requestId: string;
  deanId: string;
  status: 'approved' | 'rejected' | 'changes_requested';
  note?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('approval_requests')
    .update({
      status: opts.status,
      dean_id: opts.deanId,
      dean_note: opts.note ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', opts.requestId);
  if (error) return { error: error.message };

  if (opts.status === 'approved') {
    // mark attendance as approved + issue certificates
    const { data: req } = await supabase
      .from('approval_requests')
      .select('event_id, coordinator_id')
      .eq('id', opts.requestId)
      .maybeSingle();
    if (req) {
      await supabase
        .from('attendance')
        .update({ approved_by_dean: true })
        .eq('event_id', req.event_id)
        .eq('status', 'present');
      // issue certificates for present students
      const { data: atts } = await supabase
        .from('attendance')
        .select('id, student_id, event_id')
        .eq('event_id', req.event_id)
        .eq('status', 'present')
        .eq('approved_by_dean', true);
      if (atts && atts.length) {
        // find which attendance rows already have a certificate
        const { data: existingCerts } = await supabase
          .from('certificates')
          .select('attendance_id')
          .in(
            'attendance_id',
          atts.map((a) => a.id),
          );
        const existing = new Set((existingCerts ?? []).map((c) => c.attendance_id));
        const newAtts = atts.filter((a) => !existing.has(a.id));
        const certs = newAtts.map((a) => ({
          attendance_id: a.id,
          student_id: a.student_id,
          event_id: a.event_id,
          verification_code: crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase(),
        }));
        if (certs.length) {
          await supabase.from('certificates').insert(certs);
        }
        // notify all present students
        const notifs = atts.map((a) => ({
          user_id: a.student_id,
          title: 'Certificate available',
          message: 'Your attendance was approved and a certificate has been issued.',
          type: 'certificate' as const,
          link: `/app/certificates`,
        }));
        await supabase.from('notifications').insert(notifs);
      }
    }
  }
  return { error: null };
}
