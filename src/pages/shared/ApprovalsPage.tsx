import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle2, XCircle, RefreshCw, FileText, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SectionHeader } from '../../components/dashboard/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Field, Textarea } from '../../components/ui/Field';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, csvFromRows, downloadFile, relativeTime } from '../../lib/utils';
import { reviewApproval } from '../../lib/attendance';
import { logActivity } from '../../lib/actions';
import type { ApprovalRequest, AttendanceRow, Profile } from '../../types';

export function ApprovalsPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [attMap, setAttMap] = useState<Record<string, AttendanceRow[]>>({});
  const [reviewing, setReviewing] = useState<ApprovalRequest | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'changes_requested'>('approved');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const isDean = profile?.role === 'dean' || profile?.role === 'admin';

  const load = async () => {
    if (!profile) return;
    let q = supabase.from('approval_requests').select('*, event:events(*), coordinator:profiles!approval_requests_coordinator_id_fkey(full_name, department_id)').order('submitted_at', { ascending: false });
    if (profile.role === 'coordinator') q = q.eq('coordinator_id', profile.id);
    const { data } = await q;
    const list = (data as ApprovalRequest[]) ?? [];
    setApprovals(list);
    // load attendance for each event
    const ids = list.map((a) => a.event_id);
    if (ids.length) {
      const { data: atts } = await supabase
        .from('attendance')
        .select('*, student:profiles!attendance_student_id_fkey(full_name, roll_number, email)')
        .in('event_id', ids);
      const map: Record<string, AttendanceRow[]> = {};
      (atts as AttendanceRow[])?.forEach((a) => {
        (map[a.event_id] ??= []).push(a);
      });
      setAttMap(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const openReview = (a: ApprovalRequest, d: 'approved' | 'rejected' | 'changes_requested') => {
    setReviewing(a);
    setDecision(d);
    setNote('');
  };

  const confirm = async () => {
    if (!profile || !reviewing) return;
    setSaving(true);
    const { error } = await reviewApproval({ requestId: reviewing.id, deanId: profile.id, status: decision, note });
    setSaving(false);
    if (error) toast.error('Failed', error);
    else {
      toast.success(`Request ${decision}`, decision === 'approved' ? 'Attendance is now official. Certificates issued.' : 'The coordinator has been notified.');
      logActivity(profile.id, `approval_${decision}`, 'approval_requests', reviewing.id);
      setReviewing(null);
      load();
    }
  };

  const exportReport = (a: ApprovalRequest) => {
    const rows = (attMap[a.event_id] ?? []).map((x) => ({
      student: (x.student as unknown as Profile)?.full_name ?? '',
      roll: (x.student as unknown as Profile)?.roll_number ?? '',
      email: (x.student as unknown as Profile)?.email ?? '',
      status: x.status,
      marked_at: x.marked_at,
      approved: x.approved_by_dean ? 'yes' : 'no',
    }));
    downloadFile(`${a.event?.name}-report.csv`, csvFromRows(rows), 'text/csv');
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Approval Requests" subtitle={isDean ? 'Review attendance submissions from coordinators.' : 'Track the status of your submitted attendance.'} />
      {approvals.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="h-10 w-10" />} title="No approval requests" message={isDean ? 'Coordinators will submit here after events.' : 'Submit attendance from an event page.'} action={<Link to="/app/events" className="btn-primary">Go to events</Link>} />
      ) : (
        <div className="space-y-4">
          {approvals.map((a) => {
            const rows = attMap[a.event_id] ?? [];
            return (
              <Card key={a.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-semibold">{a.event?.name}</h3>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="mt-1 text-xs text-ink-400">
                      Coordinator: {a.coordinator?.full_name ?? '—'} • {a.student_count} students • Submitted {formatDate(a.submitted_at)}
                    </p>
                    {a.report_summary && <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{a.report_summary}</p>}
                    {a.dean_note && <p className="mt-1 text-sm text-ink-500"><b>Dean:</b> {a.dean_note}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" onClick={() => exportReport(a)}><FileText className="h-4 w-4" /> Report</Button>
                    {isDean && a.status === 'pending' && (
                      <>
                        <Button size="sm" variant="success" onClick={() => openReview(a, 'approved')}><CheckCircle2 className="h-4 w-4" /> Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => openReview(a, 'rejected')}><XCircle className="h-4 w-4" /> Reject</Button>
                        <Button size="sm" variant="secondary" onClick={() => openReview(a, 'changes_requested')}><RefreshCw className="h-4 w-4" /> Request changes</Button>
                      </>
                    )}
                  </div>
                </div>

                {rows.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-ink-100 dark:border-ink-800 text-left text-xs uppercase tracking-wide text-ink-400">
                          <th className="py-2 pr-4">Student</th>
                          <th className="py-2 pr-4">Roll</th>
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2 pr-4">Marked</th>
                          <th className="py-2 pr-4">Approved</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 6).map((r) => (
                          <tr key={r.id} className="border-b border-ink-50 dark:border-ink-800/50">
                            <td className="py-2 pr-4 font-medium">{(r.student as unknown as Profile)?.full_name}</td>
                            <td className="py-2 pr-4 text-ink-400">{(r.student as unknown as Profile)?.roll_number ?? '—'}</td>
                            <td className="py-2 pr-4"><StatusBadge status={r.status} /></td>
                            <td className="py-2 pr-4 text-ink-400">{relativeTime(r.marked_at)}</td>
                            <td className="py-2 pr-4">{r.approved_by_dean ? <CheckCircle2 className="h-4 w-4 text-accent-500" /> : <Clock className="h-4 w-4 text-ink-300" />}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 6 && <p className="mt-2 text-xs text-ink-400">+{rows.length - 6} more — export for full report.</p>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        title={`Confirm: ${decision.replace('_', ' ')}`}
        footer={<><Button variant="secondary" onClick={() => setReviewing(null)}>Cancel</Button><Button loading={saving} variant={decision === 'approved' ? 'success' : decision === 'rejected' ? 'danger' : 'primary'} onClick={confirm}><Send className="h-4 w-4" /> Confirm</Button></>}
      >
        <p className="text-sm text-ink-500">You are about to <b className="capitalize">{decision.replace('_', ' ')}</b> the attendance report for <b>{reviewing?.event?.name}</b>.</p>
        <div className="mt-4">
          <Field label="Note to coordinator (optional)"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason or instructions…" /></Field>
        </div>
      </Modal>
    </div>
  );
}
