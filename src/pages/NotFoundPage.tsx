import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Compass } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 dark:bg-ink-950 px-4">
      <div className="text-center">
        <p className="font-display text-[120px] font-extrabold leading-none bg-gradient-to-br from-brand-500 to-accent-500 bg-clip-text text-transparent">404</p>
        <div className="mx-auto mt-4 mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow animate-float">
          <Compass className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-ink-500 dark:text-ink-400">The page you're looking for doesn't exist or has moved.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/" className="btn-primary"><Home className="h-4 w-4" /> Home</Link>
          <Link to="/app" className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
