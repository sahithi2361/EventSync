import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SectionHeader } from '../../components/dashboard/StatCard';
import { Card } from '../../components/ui/Card';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { relativeTime } from '../../lib/utils';
import type { ActivityLog, Profile } from '../../types';

export function LogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<(ActivityLog & { user?: Profile | null })[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*, user:profiles!activity_logs_user_id_fkey(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);
      setLogs((data as (ActivityLog & { user?: Profile | null })[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Activity Logs" subtitle="Audit trail of system actions." />
      {logs.length === 0 ? (
        <EmptyState icon={<ScrollText className="h-10 w-10" />} title="No activity yet" />
      ) : (
        <Card>
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center gap-3 py-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-ink-100 dark:bg-ink-800 text-ink-400"><ScrollText className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize">{l.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-ink-400">{l.user?.full_name ?? l.user?.email ?? 'system'}{l.entity ? ` • ${l.entity}` : ''}</p>
                </div>
                <span className="text-xs text-ink-400">{relativeTime(l.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
