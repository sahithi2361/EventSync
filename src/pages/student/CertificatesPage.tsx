import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { Award, Download, Search, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SectionHeader } from '../../components/dashboard/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate } from '../../lib/utils';
import type { Certificate, Event, Profile, AttendanceRow } from '../../types';

export function CertificatesPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!profile) return;
    let active = true;
    (async () => {
      let query = supabase.from('certificates').select('*, event:events(*), student:profiles!certificates_student_id_fkey(*), attendance:attendance(*)').order('issued_at', { ascending: false });
      if (profile.role === 'student') query = query.eq('student_id', profile.id);
      const { data } = await query;
      if (!active) return;
      setCerts((data as Certificate[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [profile]);

  const filtered = useMemo(() => certs.filter((c) => !q || c.event?.name.toLowerCase().includes(q.toLowerCase()) || c.verification_code.toLowerCase().includes(q.toLowerCase())), [certs, q]);

  if (loading) return <PageLoader />;

  const download = (c: Certificate) => {
    const doc = generateCertificatePdf(c, c.event, c.student, c.attendance);
    doc.save(`${c.event?.name ?? 'event'}-${c.student?.full_name ?? 'student'}.pdf`);
    toast.success('Certificate downloaded');
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Certificates" subtitle="Download your participation certificates." />
      <Card>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by event or code…" className="pl-9" />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={<Award className="h-10 w-10" />} title="No certificates" message="Certificates are issued automatically after the Dean approves your attendance." action={<Link to="/app/events" className="btn-primary">Browse events</Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} hover>
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white"><Award className="h-5 w-5" /></div>
                <StatusBadge status="approved" />
              </div>
              <h3 className="mt-3 font-display text-base font-semibold leading-tight">{c.event?.name}</h3>
              <p className="mt-1 text-xs text-ink-400">{c.event && formatDate(c.event.event_date)}</p>
              <p className="mt-2 text-xs font-mono text-ink-400">{c.verification_code}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => download(c)}><Download className="h-4 w-4" /> PDF</Button>
                <Link to={`/verify?code=${c.verification_code}`} className="btn-secondary !px-3 !py-1.5 text-xs"><ShieldCheck className="h-3.5 w-3.5" /> Verify</Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function generateCertificatePdf(c: Certificate, event?: Event, student?: Profile, attendance?: AttendanceRow): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // background
  doc.setFillColor(252, 252, 252);
  doc.rect(0, 0, W, H, 'F');

  // outer border
  doc.setDrawColor(59, 125, 255);
  doc.setLineWidth(3);
  doc.rect(24, 24, W - 48, H - 48);
  // inner border
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1);
  doc.rect(34, 34, W - 68, H - 68);

  // header band
  doc.setFillColor(28, 73, 212);
  doc.rect(34, 34, W - 68, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('EVENTSYNC', W / 2, 70, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Certificate of Participation', W / 2, 90, { align: 'center' });

  // title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('This certifies that', W / 2, 150, { align: 'center' });

  // name
  doc.setTextColor(28, 73, 212);
  doc.setFontSize(34);
  doc.text(student?.full_name ?? 'Student Name', W / 2, 190, { align: 'center' });

  // body
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text(`Roll No: ${student?.roll_number ?? '—'}`, W / 2, 220, { align: 'center' });
  doc.text('has successfully participated in', W / 2, 250, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(event?.name ?? 'Event Name', W / 2, 285, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(`Coordinated by ${event ? 'the Event Coordinator' : '—'}  •  ${event ? formatDate(event.event_date) : '—'}`, W / 2, 310, { align: 'center' });

  // verification
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.roundedRect(W / 2 - 140, 340, 280, 60, 6, 6, 'S');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Verification Code', W / 2, 358, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(28, 73, 212);
  doc.text(c.verification_code, W / 2, 380, { align: 'center' });

  // footer
  doc.setDrawColor(203, 213, 225);
  doc.line(80, 470, 280, 470);
  doc.line(W - 280, 470, W - 80, 470);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Event Coordinator', 180, 488, { align: 'center' });
  doc.text('Dean Academics', W - 180, 488, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Issued on ${formatDate(c.issued_at)} • Verify at eventsync.app/verify`, W / 2, H - 50, { align: 'center' });

  return doc;
}
