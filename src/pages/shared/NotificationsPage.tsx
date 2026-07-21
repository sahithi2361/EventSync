import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SectionHeader } from '../../components/dashboard/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Feedback';
import { relativeTime, classNames } from '../../lib/utils';
import type { Notification } from '../../types';

const typeColor: Record<string, string> = {
  success: 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  event: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  attendance: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
  certificate: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  info: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
};

export function NotificationsPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Notification[]>([]);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setItems((data as Notification[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const markAll = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All marked as read');
  };

  const remove = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      <SectionHeader title="Notifications" subtitle="Stay up to date with your events." action={items.some((n) => !n.read) ? <Button variant="secondary" size="sm" onClick={markAll}><CheckCheck className="h-4 w-4" /> Mark all read</Button> : undefined} />
      {items.length === 0 ? (
        <EmptyState icon={<Bell className="h-10 w-10" />} title="No notifications" message="You're all caught up." />
      ) : (
        <Card>
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {items.map((n) => (
              <div key={n.id} className={classNames('flex items-start gap-3 py-3', !n.read && 'bg-brand-50/40 dark:bg-brand-500/5 -mx-5 px-5')}>
                <span className={classNames('mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', typeColor[n.type] ?? typeColor.info)}>
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.message && <p className="text-xs text-ink-500 dark:text-ink-400">{n.message}</p>}
                  <p className="mt-0.5 text-[10px] text-ink-400">{relativeTime(n.created_at)}</p>
                </div>
                {n.link && <Link to={n.link} className="btn-ghost !px-2 !py-1 text-xs">View</Link>}
                <button onClick={() => remove(n.id)} className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
