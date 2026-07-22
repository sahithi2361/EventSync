import { Link } from 'react-router-dom';
import { UserCheck, CalendarDays } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/Feedback';

export function ScanQrPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Attendance</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Attendance is now marked by your event coordinator — no QR code needed.</p>
      </div>

      <Card>
        <CardHeader title="How it works" subtitle="Simple and proxy-free" />
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Coordinator marks you present</p>
              <p className="text-xs text-ink-400">Just show up to the event. The coordinator will mark you as present from the attendance roster.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Check your attendance</p>
              <p className="text-xs text-ink-400">View your attendance status in the Attendance History page.</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <EmptyState
          icon={<UserCheck className="h-8 w-8" />}
          title="No action needed"
          message="Register for events, show up, and the coordinator handles the rest."
          action={<Link to="/app/events" className="btn-primary">Browse events</Link>}
        />
      </Card>
    </div>
  );
}
