import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { classNames } from '../../lib/utils';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={classNames('h-5 w-5 animate-spin', className)} />;
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-400">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={classNames('skeleton h-4 w-full', className)} />;
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 dark:border-ink-800 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-ink-300 dark:text-ink-600">{icon}</div>}
      <p className="font-display text-base font-semibold text-ink-700 dark:text-ink-200">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-500 dark:text-ink-400">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
