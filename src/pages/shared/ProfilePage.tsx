import { useEffect, useState } from 'react';
import { Mail, Phone, Hash, Building2, Calendar, Save, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SectionHeader } from '../../components/dashboard/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { PageLoader } from '../../components/ui/Feedback';
import type { Department } from '../../types';

const roleLabel: Record<string, string> = { student: 'Student', coordinator: 'Coordinator', dean: 'Dean Academics', admin: 'Administrator' };

export function ProfilePage() {
  const { profile, updateProfile } = useAuth();
  const toast = useToast();
  const [depts, setDepts] = useState<Department[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    roll_number: '',
    department_id: '',
    year: '',
    phone: '',
    bio: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        roll_number: profile.roll_number ?? '',
        department_id: profile.department_id ?? '',
        year: profile.year ? String(profile.year) : '',
        phone: profile.phone ?? '',
        bio: profile.bio ?? '',
        avatar_url: profile.avatar_url ?? '',
      });
    }
    supabase.from('departments').select('*').order('name').then(({ data }) => setDepts((data as Department[]) ?? []));
  }, [profile]);

  if (!profile) return <PageLoader />;

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile({
      full_name: form.full_name,
      roll_number: form.roll_number || null,
      department_id: form.department_id || null,
      year: form.year ? Number(form.year) : null,
      phone: form.phone || null,
      bio: form.bio || null,
      avatar_url: form.avatar_url || null,
    });
    setSaving(false);
    if (error) toast.error('Update failed', error);
    else toast.success('Profile updated');
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Profile" subtitle="Manage your personal information." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="text-center">
          <Avatar name={profile.full_name} src={profile.avatar_url} size="xl" className="mx-auto" />
          <h3 className="mt-4 font-display text-lg font-semibold">{profile.full_name}</h3>
          <p className="text-sm text-ink-400">{profile.email}</p>
          <span className="badge mt-2 bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{roleLabel[profile.role]}</span>
          <div className="mt-5 space-y-2 text-left text-sm">
            <Row icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
            <Row icon={<Hash className="h-4 w-4" />} label="Roll No" value={profile.roll_number ?? '—'} />
            <Row icon={<Building2 className="h-4 w-4" />} label="Dept" value={depts.find((d) => d.id === profile.department_id)?.code ?? '—'} />
            <Row icon={<Calendar className="h-4 w-4" />} label="Year" value={profile.year ? `Year ${profile.year}` : '—'} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Edit profile" subtitle="Changes save to your account." />
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} /></Field>
              <Field label="Roll number"><Input value={form.roll_number} onChange={(e) => set('roll_number', e.target.value)} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Department">
                <Select value={form.department_id} onChange={(e) => set('department_id', e.target.value)}>
                  <option value="">— None —</option>
                  {depts.map((d) => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                </Select>
              </Field>
              <Field label="Year"><Input type="number" min={1} max={5} value={form.year} onChange={(e) => set('year', e.target.value)} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
              <Field label="Avatar URL"><Input value={form.avatar_url} onChange={(e) => set('avatar_url', e.target.value)} placeholder="https://…" /></Field>
            </div>
            <Field label="Bio"><Textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} /></Field>
            <div className="flex justify-end">
              <Button type="submit" loading={saving}><Save className="h-4 w-4" /> Save changes</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-ink-50 dark:bg-ink-800/50 px-3 py-2">
      <span className="text-ink-400">{icon}</span>
      <span className="text-xs uppercase tracking-wide text-ink-400">{label}</span>
      <span className="ml-auto truncate text-sm font-medium">{value}</span>
    </div>
  );
}
