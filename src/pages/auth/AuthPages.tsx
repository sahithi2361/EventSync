import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { GraduationCap, Mail, Lock, User, ArrowRight, ShieldCheck, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import type { Role } from '../../types';
import { supabase } from '../../lib/supabase';

const roles: { value: Role; label: string; desc: string }[] = [
  { value: 'student', label: 'Student', desc: 'Register & scan QR' },
  { value: 'coordinator', label: 'Coordinator', desc: 'Create & manage events' },
  { value: 'dean', label: 'Dean Academics', desc: 'Approve attendance' },
  { value: 'admin', label: 'Admin', desc: 'Manage everything' },
];

export function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink-50 dark:bg-ink-950">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-900 p-12 text-white">
        <div className="absolute inset-0 bg-grid-dark [background-size:24px_24px] opacity-20" />
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-accent-500/30 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="font-display text-xl font-bold">EventSync</span>
        </Link>
        <div className="relative">
          <h2 className="font-display text-4xl font-extrabold leading-tight">Digitize campus event attendance, end to end.</h2>
          <p className="mt-4 max-w-md text-white/80">Rotating QR attendance, a digital approval workflow, auto-generated certificates, and live analytics — all in one place.</p>
          <div className="mt-8 flex gap-6">
            <div><p className="font-display text-3xl font-bold">94%</p><p className="text-sm text-white/70">Avg attendance</p></div>
            <div><p className="font-display text-3xl font-bold">4</p><p className="text-sm text-white/70">Role dashboards</p></div>
            <div><p className="font-display text-3xl font-bold">30s</p><p className="text-sm text-white/70">QR refresh</p></div>
          </div>
        </div>
        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} EventSync</p>
      </div>
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">EventSync</span>
          </Link>
          <button onClick={toggle} className="ml-auto rounded-xl p-2.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="w-full max-w-md animate-fade-up">
            <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">{title}</h1>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { signIn, session, profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (session && profile) return <Navigate to="/app" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) toast.error('Sign in failed', error);
    else {
      toast.success('Welcome back!');
      navigate('/app');
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your EventSync account.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" className="pl-9" />
          </div>
        </Field>
        <Field label="Password">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9" />
          </div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-500">
            <input type="checkbox" className="rounded border-ink-300 text-brand-600 focus:ring-brand-500" /> Remember me
          </label>
          <Link to="/forgot" className="font-medium text-brand-600 hover:text-brand-700">Forgot password?</Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">Sign in <ArrowRight className="h-4 w-4" /></Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        New to EventSync? <Link to="/signup" className="font-semibold text-brand-600 hover:text-brand-700">Create an account</Link>
      </p>
    </AuthShell>
  );
}

export function SignupPage() {
  const { signUp, session, profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [loading, setLoading] = useState(false);

  if (session && profile) return <Navigate to="/app" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password too short', 'Use at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUp({ email: email.trim(), password, fullName: fullName.trim(), role });
    setLoading(false);
    if (error) toast.error('Sign up failed', error);
    else {
      toast.success('Account created', 'You are signed in.');
      navigate('/app');
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join your campus on EventSync in seconds.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="pl-9" />
          </div>
        </Field>
        <Field label="Email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" className="pl-9" />
          </div>
        </Field>
        <Field label="Password">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="pl-9" />
          </div>
        </Field>
        <Field label="I am a">
          <div className="grid grid-cols-2 gap-2">
            {roles.map((r) => (
              <button
                type="button"
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`rounded-xl border p-3 text-left transition ${role === r.value ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 ring-2 ring-brand-500/30' : 'border-ink-200 dark:border-ink-700 hover:border-ink-300'}`}
              >
                <p className="text-sm font-semibold">{r.label}</p>
                <p className="text-xs text-ink-400">{r.desc}</p>
              </button>
            ))}
          </div>
        </Field>
        <Button type="submit" loading={loading} className="w-full">Create account <ArrowRight className="h-4 w-4" /></Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) toast.error('Could not send email', error.message);
    else {
      setSent(true);
      toast.success('Reset link sent', 'Check your inbox.');
    }
  };

  return (
    <AuthShell title="Forgot password" subtitle="We'll email you a secure reset link.">
      {sent ? (
        <div className="card p-6 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-accent-500" />
          <p className="mt-3 font-display text-lg font-semibold">Check your inbox</p>
          <p className="mt-1 text-sm text-ink-500">If an account exists for {email}, a reset link is on its way.</p>
          <Link to="/login" className="btn-secondary mt-5 inline-flex">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" className="pl-9" />
            </div>
          </Field>
          <Button type="submit" loading={loading} className="w-full">Send reset link</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink-500">
        Remembered? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link>
      </p>
    </AuthShell>
  );
}

export function VerifyEmailPage() {
  const { session } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    setLoading(true);
    if (!session?.user?.email) {
      toast.error('No session', 'Sign in first.');
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.resend({ type: 'signup', email: session.user.email });
    setLoading(false);
    if (error) toast.error('Could not resend', error.message);
    else toast.success('Verification email sent');
  };

  return (
    <AuthShell title="Verify your email" subtitle="We sent a verification link to your inbox.">
      <div className="card p-6 text-center">
        <Mail className="mx-auto h-10 w-10 text-brand-500" />
        <p className="mt-3 text-sm text-ink-500">Click the link in the email to confirm your address. Email confirmation is optional — you can continue using EventSync.</p>
        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={resend} loading={loading}>Resend verification</Button>
          <Link to="/app" className="btn-secondary">Continue to dashboard</Link>
        </div>
      </div>
    </AuthShell>
  );
}
