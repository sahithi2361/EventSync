import type { ReactNode } from 'react';
import { classNames } from '../../lib/utils';

type Tone = 'brand' | 'accent' | 'amber' | 'red' | 'ink' | 'violet';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  accent: 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  ink: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  violet: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
};

export function Badge({ tone = 'ink', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={classNames('badge', tones[tone], className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    upcoming: { tone: 'brand', label: 'Upcoming' },
    ongoing: { tone: 'accent', label: 'Ongoing' },
    completed: { tone: 'ink', label: 'Completed' },
    cancelled: { tone: 'red', label: 'Cancelled' },
    pending: { tone: 'amber', label: 'Pending' },
    approved: { tone: 'accent', label: 'Approved' },
    rejected: { tone: 'red', label: 'Rejected' },
    changes_requested: { tone: 'violet', label: 'Changes Requested' },
    registered: { tone: 'brand', label: 'Registered' },
    attended: { tone: 'accent', label: 'Attended' },
    absent: { tone: 'red', label: 'Absent' },
    present: { tone: 'accent', label: 'Present' },
    excused: { tone: 'amber', label: 'Excused' },
  };
  const cfg = map[status] ?? { tone: 'ink' as Tone, label: status };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
