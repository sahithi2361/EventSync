import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Search, GraduationCap, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { Avatar } from '../components/ui/Avatar';
import { formatDate } from '../lib/utils';
import type { Certificate, Event, Profile } from '../types';

export function VerifyCertificatePage() {
  const { theme, toggle } = useTheme();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('code') ?? '');
  const [result, setResult] = useState<(Certificate & { event?: Event; student?: Profile }) | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const verify = async (c?: string) => {
    const value = (c ?? code).trim();
    if (!value) return;
    setLoading(true);
    const { data } = await supabase
      .from('certificates')
      .select('*, event:events(*), student:profiles!certificates_student_id_fkey(*)')
      .eq('verification_code', value)
      .maybeSingle();
    setResult(data as (Certificate & { event?: Event; student?: Profile }) | null);
    setSearched(true);
    setLoading(false);
  };

  useEffect(() => {
    const c = params.get('code');
    if (c) {
      setCode(c);
      verify(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <header className="border-b border-ink-200/60 dark:border-ink-800 bg-white/70 dark:bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white"><GraduationCap className="h-5 w-5" /></div>
            <span className="font-display text-lg font-bold">EventSync</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
            <button onClick={toggle} className="rounded-xl p-2.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow"><ShieldCheck className="h-7 w-7" /></div>
          <h1 className="font-display text-3xl font-bold">Verify a Certificate</h1>
          <p className="mt-2 text-ink-500 dark:text-ink-400">Enter the verification code printed on any EventSync certificate to confirm its authenticity.</p>
        </div>

        <Card>
          <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Verification code" className="pl-9 font-mono uppercase" />
            </div>
            <Button type="submit" loading={loading}>Verify</Button>
          </form>
        </Card>

        {searched && (
          <div className="mt-6 animate-fade-up">
            {result ? (
              <Card className="overflow-hidden p-0">
                <div className="flex items-center gap-3 bg-accent-50 dark:bg-accent-500/10 px-5 py-4">
                  <CheckCircle2 className="h-8 w-8 text-accent-600" />
                  <div>
                    <p className="font-display text-lg font-semibold text-accent-700 dark:text-accent-300">Certificate verified</p>
                    <p className="text-sm text-ink-500">This certificate is authentic and approved.</p>
                  </div>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <Detail label="Student" value={result.student?.full_name ?? '—'} />
                  <Detail label="Roll number" value={result.student?.roll_number ?? '—'} />
                  <Detail label="Event" value={result.event?.name ?? '—'} />
                  <Detail label="Date" value={result.event ? formatDate(result.event.event_date) : '—'} />
                  <Detail label="Venue" value={result.event?.venue ?? '—'} />
                  <Detail label="Issued" value={formatDate(result.issued_at)} />
                  <div className="sm:col-span-2">
                    <Detail label="Verification code" value={result.verification_code} mono />
                  </div>
                </div>
                <div className="flex items-center gap-3 border-t border-ink-100 dark:border-ink-800 px-5 py-4">
                  <Avatar name={result.student?.full_name ?? 'Student'} src={result.student?.avatar_url} size="md" />
                  <div>
                    <p className="text-sm font-semibold">{result.student?.full_name}</p>
                    <p className="text-xs text-ink-400">{result.student?.email}</p>
                  </div>
                  <span className="ml-auto badge bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300">Valid</span>
                </div>
              </Card>
            ) : (
              <Card className="text-center">
                <XCircle className="mx-auto h-10 w-10 text-red-500" />
                <p className="mt-3 font-display text-lg font-semibold">Certificate not found</p>
                <p className="mt-1 text-sm text-ink-500">No certificate matches this code. Please check and try again.</p>
              </Card>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
