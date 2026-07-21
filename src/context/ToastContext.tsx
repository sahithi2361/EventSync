import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const iconFor = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-accent-500" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    default:
      return <Info className="h-5 w-5 text-brand-500" />;
  }
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove],
  );

  const value: ToastContextValue = {
    toast,
    success: (title, message) => toast({ type: 'success', title, message }),
    error: (title, message) => toast({ type: 'error', title, message }),
    warning: (title, message) => toast({ type: 'warning', title, message }),
    info: (title, message) => toast({ type: 'info', title, message }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="glass animate-fade-up flex items-start gap-3 rounded-xl p-3.5 pr-2.5"
          >
            <div className="mt-0.5 shrink-0">{iconFor(t.type)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{t.title}</p>
              {t.message && (
                <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 rounded-md p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
