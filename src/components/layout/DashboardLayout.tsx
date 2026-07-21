import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function DashboardLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-72">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
