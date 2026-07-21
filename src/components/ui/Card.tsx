import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glass?: boolean;
}

export function Card({ children, className, hover, glass, ...rest }: CardProps) {
  return (
    <div
      className={classNames(
        glass ? 'glass' : 'card',
        'p-5',
        hover && 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-display text-base font-semibold text-ink-900 dark:text-ink-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
