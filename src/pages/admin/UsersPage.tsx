import { useEffect, useMemo, useState } from 'react';
import { Users, Search, Shield, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { SectionHeader } from '../../components/dashboard/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate } from '../../lib/utils';
import type { Profile, Department } from '../../types';

const roleLabel: Record<string, string> = { student: 'Student', coordinator: 'Coordinator', dean: 'Dean', admin: 'Admin' };

export function UsersPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [editing, setEditing] = useState<Profile | null>(null);

  const load = async () => {
    const [{ data: u }, { data: d }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('departments').select('*').order('name'),
    ]);
    setUsers((u as Profile[]) ?? []);
    setDepts((d as Department[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => users.filter((u) => {
    if (q && !u.full_name.toLowerCase().includes(q.toLowerCase()) && !u.email.toLowerCase().includes(q.toLowerCase()) && !(u.roll_number ?? '').toLowerCase().includes(q.toLowerCase())) return false;
    if (role && u.role !== role) return false;
    return true;
  }), [users, q, role]);

  const saveRole = async () => {
    if (!editing) return;
    const { error } = await supabase.from('profiles').update({ role: editing.role }).eq('id', editing.id);
    if (error) toast.error('Update failed', error.message);
    else {
      toast.success('Role updated');
      setUsers((prev) => prev.map((u) => (u.id === editing.id ? { ...u, role: editing.role } : u)));
      setEditing(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Users" subtitle="Manage students, faculty, and roles." />
      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, roll no…" className="pl-9" />
          </div>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="student">Student</option>
            <option value="coordinator">Coordinator</option>
            <option value="dean">Dean</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-10 w-10" />} title="No users found" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Roll</th>
                  <th className="py-2 pr-4">Dept</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Joined</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-ink-50 dark:border-ink-800/50">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.full_name} src={u.avatar_url} size="sm" />
                        <span className="font-semibold">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-ink-500">{u.email}</td>
                    <td className="py-3 pr-4 text-ink-500">{u.roll_number ?? '—'}</td>
                    <td className="py-3 pr-4 text-ink-500">{depts.find((d) => d.id === u.department_id)?.code ?? '—'}</td>
                    <td className="py-3 pr-4">
                      {editing?.id === u.id ? (
                        <Select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as Profile['role'] })} className="!py-1 text-xs">
                          <option value="student">Student</option>
                          <option value="coordinator">Coordinator</option>
                          <option value="dean">Dean</option>
                          <option value="admin">Admin</option>
                        </Select>
                      ) : (
                        <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{roleLabel[u.role]}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-ink-400">{formatDate(u.created_at ?? new Date().toISOString())}</td>
                    <td className="py-3 pr-4">
                      {editing?.id === u.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={saveRole}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setEditing(u)}><Shield className="h-4 w-4" /> Role</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
