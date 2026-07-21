import { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SectionHeader } from '../../components/dashboard/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { relativeTime } from '../../lib/utils';
import type { Announcement } from '../../types';

export function AnnouncementsPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all' as Announcement['audience'] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setItems((data as Announcement[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', body: '', audience: 'all' });
    setOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, body: a.body ?? '', audience: a.audience });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('announcements').update(form).eq('id', editing.id);
      if (error) toast.error('Update failed', error.message);
      else toast.success('Announcement updated');
    } else {
      const { error } = await supabase.from('announcements').insert({ ...form, created_by: profile?.id ?? null });
      if (error) toast.error('Create failed', error.message);
      else toast.success('Announcement published');
    }
    setSaving(false);
    setOpen(false);
    load();
  };

  const remove = async (a: Announcement) => {
    if (!confirm('Delete this announcement?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', a.id);
    if (error) toast.error('Delete failed', error.message);
    else {
      toast.success('Deleted');
      load();
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Announcements" subtitle="Broadcast updates to your campus." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> New announcement</Button>} />
      {items.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-10 w-10" />} title="No announcements" message="Publish your first announcement." action={<Button onClick={openNew}>Create</Button>} />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-brand-500" />
                    <h3 className="font-display text-base font-semibold">{a.title}</h3>
                    <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 capitalize">{a.audience}</span>
                  </div>
                  {a.body && <p className="mt-1.5 text-sm text-ink-600 dark:text-ink-300">{a.body}</p>}
                  <p className="mt-1 text-xs text-ink-400">{relativeTime(a.created_at)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(a)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(a)} className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit announcement' : 'New announcement'}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button loading={saving} onClick={save as unknown as () => void}>Publish</Button></>}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Title"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Audience">
            <Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as Announcement['audience'] })}>
              <option value="all">All</option>
              <option value="students">Students</option>
              <option value="coordinators">Coordinators</option>
              <option value="dean">Dean</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
          <Field label="Body"><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
        </form>
      </Modal>
    </div>
  );
}
