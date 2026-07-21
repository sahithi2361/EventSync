import { useEffect, useState } from 'react';
import { Building2, Plus, Trash2, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { SectionHeader } from '../../components/dashboard/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input, Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import type { Department } from '../../types';

export function DepartmentsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [depts, setDepts] = useState<Department[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('departments').select('*').order('name');
    setDepts((data as Department[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', code: '', description: '' });
    setOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditing(d);
    setForm({ name: d.name, code: d.code, description: d.description ?? '' });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('departments').update(form).eq('id', editing.id);
      if (error) toast.error('Update failed', error.message);
      else toast.success('Department updated');
    } else {
      const { error } = await supabase.from('departments').insert(form);
      if (error) toast.error('Create failed', error.message);
      else toast.success('Department created');
    }
    setSaving(false);
    setOpen(false);
    load();
  };

  const remove = async (d: Department) => {
    if (!confirm(`Delete department ${d.name}?`)) return;
    const { error } = await supabase.from('departments').delete().eq('id', d.id);
    if (error) toast.error('Delete failed', error.message);
    else {
      toast.success('Deleted');
      load();
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Departments" subtitle="Manage college departments." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Add department</Button>} />
      {depts.length === 0 ? (
        <EmptyState icon={<Building2 className="h-10 w-10" />} title="No departments" message="Add your first department." action={<Button onClick={openNew}>Add</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {depts.map((d) => (
            <Card key={d.id} hover>
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 text-white"><Building2 className="h-5 w-5" /></div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(d)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(d)} className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <h3 className="mt-3 font-display text-base font-semibold">{d.name}</h3>
              <p className="text-xs font-mono text-brand-600">{d.code}</p>
              {d.description && <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{d.description}</p>}
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit department' : 'New department'}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button loading={saving} onClick={save as unknown as () => void}>Save</Button></>}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Code"><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CSE" /></Field>
          <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </form>
      </Modal>
    </div>
  );
}
