import { useState } from 'react';
import { Lock, Eye, EyeOff, Check, X, ShieldCheck } from 'lucide-react';
import { Input } from './Field';
import { passwordChecks, validatePassword } from '../../lib/passwordValidation';
import { classNames } from '../../lib/utils';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showStrength?: boolean;
}

export function PasswordInput({ value, onChange, placeholder = 'Enter a strong password', showStrength = true }: PasswordInputProps) {
  const [show, setShow] = useState(false);
  const validation = validatePassword(value);
  const active = value.length > 0;

  return (
    <div>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <Input
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-10"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrength && active && (
        <div className="mt-3 space-y-2.5">
          {/* Strength meter */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-500">Password strength</span>
              <span className={classNames('font-semibold', validation.levelColor)}>{validation.levelLabel}</span>
            </div>
            <div className="mt-1 flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={classNames(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    i < validation.score ? validation.barColor : 'bg-ink-200 dark:bg-ink-700'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Error or success banner */}
          {validation.isStrong ? (
            <div className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
              <ShieldCheck className="h-4 w-4" />
              Strong password ✓
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-red-500">Password is too weak. Please create a strong password.</p>
              <ul className="mt-1.5 space-y-1">
                {passwordChecks.map((c, i) => {
                  const ok = validation.results[i];
                  return (
                    <li key={c.label} className={classNames('flex items-center gap-1.5 text-xs', ok ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                      {ok ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                      {c.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
