import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { logActivity } from '../../lib/actions';
import type { Department, EventType } from '../../types';

const eventTypes: EventType[] = ['Workshop', 'Seminar', 'Hackathon', 'Guest Lecture', 'Technical', 'Project Expo', 'Club Event', 'Cultural', 'Sports'];

export function CreateEventPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [depts, setDepts] = useState<Department[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    department_id: '',
    event_type: 'Workshop' as EventType,
    event_date: '',
    start_time: '09:00',
    end_time: '17:00',
    venue: '',
    max_participants: 100,
    registration_deadline: '',
    poster_url: '',
    is_paid: false,
    price: 0,
    tags: '',
  });

  useEffect(() => {
    supabase.from('departments').select('*').order('name').then(({ data }) => setDepts((data as Department[]) ?? []));
  }, []);

  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.name || !form.event_date || !form.venue) {
      toast.error('Missing fields', 'Name, date and venue are required.');
      return;
    }
    if (form.registration_deadline && new Date(form.registration_deadline) > new Date(form.event_date)) {
      toast.error('Invalid deadline', 'Registration deadline must be on or before the event date.');
      return;
    }
    setSaving(true);
    const dept = depts.find((d) => d.id === form.department_id);
    const { data, error } = await supabase.from('events').insert({
      name: form.name,
      description: form.description || null,
      department_id: form.department_id || null,
      department_name: dept?.name ?? null,
      event_type: form.event_type,
      event_date: form.event_date,
      start_time: form.start_time,
      end_time: form.end_time,
      venue: form.venue,
      max_participants: Number(form.max_participants) || 100,
      registration_deadline: form.registration_deadline || form.event_date,
      poster_url: form.poster_url || null,
      coordinator_id: profile.id,
      is_paid: form.is_paid,
      price: form.is_paid ? Number(form.price) || 0 : 0,
      tags: form.tags || null,
      status: 'upcoming',
    }).select().single();
    setSaving(false);
    if (error) toast.error('Create failed', error.message);
    else {
      toast.success('Event created', 'Your event is now live.');
      logActivity(profile.id, 'create_event', 'events', data.id);
      navigate(`/app/events/${data.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/app/events" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>
      <Card>
        <CardHeader title="Create event" subtitle="Fill in the details to publish a new event." />
        <form onSubmit={submit} className="space-y-4">
          <Field label="Event name"><Input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="AI Workshop 2026" /></Field>
          <Field label="Description"><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What is this event about?" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Department">
              <Select value={form.department_id} onChange={(e) => set('department_id', e.target.value)}>
                <option value="">— None —</option>
                {depts.map((d) => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
              </Select>
            </Field>
            <Field label="Event type">
              <Select value={form.event_type} onChange={(e) => set('event_type', e.target.value)}>
                {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date"><Input type="date" required value={form.event_date} onChange={(e) => set('event_date', e.target.value)} /></Field>
            <Field label="Start time"><Input type="time" value={form.start_time} onChange={(e) => set('start_time', e.target.value)} /></Field>
            <Field label="End time"><Input type="time" value={form.end_time} onChange={(e) => set('end_time', e.target.value)} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Venue"><Input required value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="Seminar Hall 1" /></Field>
            <Field label="Max participants"><Input type="number" min={1} value={form.max_participants} onChange={(e) => set('max_participants', e.target.value)} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Registration deadline"><Input type="date" value={form.registration_deadline} onChange={(e) => set('registration_deadline', e.target.value)} /></Field>
            <Field label="Poster URL (optional)"><Input value={form.poster_url} onChange={(e) => set('poster_url', e.target.value)} placeholder="https://…" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tags (optional)"><Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="AI, ML, Beginner…" /></Field>
            <Field label="Pricing">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!form.is_paid} onChange={() => set('is_paid', false)} className="rounded" /> Free
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_paid} onChange={() => set('is_paid', true)} className="rounded" /> Paid
                </label>
                {form.is_paid && (
                  <div className="relative">
                    <IndianRupee className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} className="pl-8 w-28" placeholder="0" />
                  </div>
                )}
              </div>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Link to="/app/events" className="btn-secondary">Cancel</Link>
            <Button type="submit" loading={saving}>Create event</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
