import type { ReactNode } from 'react';
import { classNames } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: 'brand' | 'accent' | 'amber' | 'violet' | 'red';
  hint?: string;
}

const tones = {
  brand: 'from-brand-500 to-brand-700',
  accent: 'from-accent-500 to-accent-700',
  amber: 'from-amber-500 to-amber-700',
  violet: 'from-fuchsia-500 to-fuchsia-700',
  red: 'from-red-500 to-red-700',
};

export function StatCard({ label, value, icon, tone = 'brand', hint }: StatCardProps) {
  return (
    <div className="card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink-900 dark:text-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
        </div>
        <div className={classNames('grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm', tones[tone])}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
