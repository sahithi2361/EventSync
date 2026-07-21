import { supabase } from './supabase';
import type { Department, Event, Profile } from '../types';

export async function fetchDepartments(): Promise<Department[]> {
  const { data, error } = await supabase.from('departments').select('*').order('name');
  if (error) throw error;
  return (data as Department[]) ?? [];
}

export async function fetchEventsWithCount(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*, coordinator:profiles!events_coordinator_id_fkey(*), department:departments(*)')
    .order('event_date', { ascending: false });
  if (error) throw error;
  const events = (data as Event[]) ?? [];
  // attach registration counts
  const { data: counts } = await supabase
    .from('registrations')
    .select('event_id')
    .eq('status', 'registered');
  const map = new Map<string, number>();
  counts?.forEach((r) => map.set(r.event_id, (map.get(r.event_id) ?? 0) + 1));
  return events.map((e) => ({ ...e, registration_count: map.get(e.id) ?? 0 }));
}

export async function fetchProfilesByRole(role: Profile['role']): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', role)
    .order('full_name');
  if (error) throw error;
  return (data as Profile[]) ?? [];
}
