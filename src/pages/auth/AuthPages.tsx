import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { GraduationCap, Mail, Lock, User, ArrowRight, ShieldCheck, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { validatePassword } from '../../lib/passwordValidation';
import type { Role } from '../../types';
import { supabase } from '../../lib/supabase';

export function inferRoleFromEmail(email: string): Role {
  const local = email.split('@')[0].toLowerCase();
  if (local.startsWith('admin')) return 'admin';
  if (local.startsWith('deanacademics')) return 'dean';
  if (/^\d/.test(local)) return 'student';
  return 'coordinator';
}

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
  const [showPw, setShowPw] = useState(false);
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
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@srkrec.ac.in" className="pl-9" />
          </div>
        </Field>
        <Field label="Password">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 pr-10" />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200" aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
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
  const [loading, setLoading] = useState(false);

  if (session && profile) return <Navigate to="/app" replace />;

  const passwordValid = validatePassword(password).isStrong;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith('@srkrec.ac.in')) {
      toast.error('Invalid email domain', 'Only @srkrec.ac.in emails are allowed.');
      return;
    }
    if (!passwordValid) {
      toast.error('Password is too weak', 'Please create a strong password.');
      return;
    }
    const role = inferRoleFromEmail(trimmedEmail);
    setLoading(true);
    const { error } = await signUp({ email: trimmedEmail, password, fullName: fullName.trim(), role });
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
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@srkrec.ac.in" className="pl-9" />
          </div>
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={setPassword} placeholder="Create a strong password" />
        </Field>
        <Button type="submit" loading={loading} disabled={!passwordValid} className="w-full">
          Create account <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link>
      </p>
      <div className="mt-4 rounded-xl border border-ink-100 dark:border-ink-800 bg-ink-50 dark:bg-ink-900/50 p-4 text-xs text-ink-500">
        <p className="font-semibold text-ink-600 dark:text-ink-300">Role is auto-detected from your @srkrec.ac.in email:</p>
        <ul className="mt-2 space-y-1">
          <li><span className="font-medium">22b81a5401@srkrec.ac.in</span> → Student</li>
          <li><span className="font-medium">ramesh@srkrec.ac.in</span> → Coordinator</li>
          <li><span className="font-medium">deanacademics@srkrec.ac.in</span> → Dean Academics</li>
          <li><span className="font-medium">admin@srkrec.ac.in</span> → Admin</li>
        </ul>
      </div>
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
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@srkrec.ac.in" className="pl-9" />
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

export function ResetPasswordPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const hasRecoveryToken = searchParams.get('type') === 'recovery';

  const passwordValid = validatePassword(password).isStrong;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      toast.error('Password is too weak', 'Please create a strong password.');
      return;
    }
    setLoading(true);
    // Server-side password validation
    const validateRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ password }),
    });
    if (!validateRes.ok) {
      const body = await validateRes.json().catch(() => null);
      toast.error('Password is too weak', body?.message ?? 'Please create a strong password.');
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error('Could not reset password', error.message);
    else {
      toast.success('Password updated', 'You can now sign in with your new password.');
      navigate('/login');
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Choose a new strong password for your account.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password">
          <PasswordInput value={password} onChange={setPassword} placeholder="Create a strong password" />
        </Field>
        <Button type="submit" loading={loading} disabled={!passwordValid} className="w-full">
          Reset password <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      {!hasRecoveryToken && (
        <p className="mt-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 p-3 text-xs text-yellow-700 dark:text-yellow-400">
          This link may have expired. If resetting doesn't work, request a new link from the forgot password page.
        </p>
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
