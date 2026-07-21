import { Link } from 'react-router-dom';
import {
  GraduationCap,
  QrCode,
  ShieldCheck,
  Award,
  BarChart3,
  Bell,
  CalendarDays,
  Users,
  ArrowRight,
  CheckCircle2,
  Star,
  Menu,
  X,
  Moon,
  Sun,
  Zap,
  Lock,
  FileCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';

const features = [
  { icon: QrCode, title: 'Rotating QR Attendance', desc: 'Dynamic QR codes refresh every 30 seconds. Students scan once — duplicate and ghost attendance are blocked instantly.' },
  { icon: ShieldCheck, title: 'Digital Approval Workflow', desc: 'Coordinators submit attendance to the Dean Academics. Approve, reject, or request changes — all in one click.' },
  { icon: Award, title: 'Auto-Issued Certificates', desc: 'Once attendance is approved, verifiable PDF certificates are generated automatically with a unique QR verification code.' },
  { icon: BarChart3, title: 'Live Analytics', desc: 'Attendance rates, department participation, popular events, and monthly trends — visualized in real time.' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Students are notified on registration, attendance marking, approval, and certificate availability.' },
  { icon: FileCheck, title: 'Export Everything', desc: 'Export attendance reports to Excel, CSV, or PDF for the Dean Academics and institutional records.' },
];

const steps = [
  { n: '01', title: 'Coordinator creates an event', desc: 'Set name, department, type, date, venue, capacity, and registration deadline.' },
  { n: '02', title: 'Students register & scan QR', desc: 'Registered students scan the rotating QR during the event to mark attendance instantly.' },
  { n: '03', title: 'Coordinator submits to Dean', desc: 'Verify attendance, then send the report to Dean Academics for approval.' },
  { n: '04', title: 'Dean approves — certificates issued', desc: 'On approval, attendance becomes official and certificates are auto-generated.' },
];

const testimonials = [
  { name: 'Dr. Anjali Mehta', role: 'Dean Academics, NIT Surat', quote: 'EventSync eliminated the paper chaos during our tech fest. Approval times dropped from a week to minutes.', rating: 5 },
  { name: 'Rahul Verma', role: 'Event Coordinator, CSE', quote: 'The rotating QR is genius — no proxy attendance, no duplicate scans. The analytics dashboard is a bonus.', rating: 5 },
  { name: 'Sneha Iyer', role: 'Student, ECE 3rd Year', quote: 'I downloaded my certificate seconds after the Dean approved. Verification page actually works too.', rating: 4 },
];

const faqs = [
  { q: 'How does the rotating QR prevent proxy attendance?', a: 'The QR token refreshes every 30 seconds on the coordinator\'s device. A student must be physically present to scan the current code; expired tokens are rejected. Only registered students can mark attendance, and each student can mark once per event.' },
  { q: 'Can certificates be verified by employers?', a: 'Yes. Every certificate carries a unique verification code. Anyone can visit the public verification page, enter the code, and instantly confirm the student, event, and approval status.' },
  { q: 'What roles are supported?', a: 'Four roles: Student, Event Coordinator, Dean Academics, and Admin. Each role has a tailored dashboard with only the actions relevant to them.' },
  { q: 'Is the system mobile friendly?', a: 'Yes. The entire app is responsive — students can scan QR from their phones, and coordinators can manage events from a tablet or laptop.' },
  { q: 'Do I need to install anything?', a: 'No. EventSync is a web app — it runs in any modern browser. Sign in with your college email and you\'re in.' },
];

export function LandingPage() {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 text-ink-900 dark:text-ink-100">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-ink-200/60 dark:border-ink-800/60 bg-white/70 dark:bg-ink-950/70 backdrop-blur-xl">
        <div className="section flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">EventSync</span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#features" className="text-sm font-medium text-ink-500 hover:text-ink-900 dark:hover:text-white">Features</a>
            <a href="#how" className="text-sm font-medium text-ink-500 hover:text-ink-900 dark:hover:text-white">How it works</a>
            <a href="#testimonials" className="text-sm font-medium text-ink-500 hover:text-ink-900 dark:hover:text-white">Testimonials</a>
            <a href="#faq" className="text-sm font-medium text-ink-500 hover:text-ink-900 dark:hover:text-white">FAQ</a>
            <a href="#contact" className="text-sm font-medium text-ink-500 hover:text-ink-900 dark:hover:text-white">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="rounded-xl p-2.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link to="/login" className="btn-ghost hidden sm:inline-flex">Sign in</Link>
            <Link to="/signup" className="btn-primary">Get started</Link>
            <button onClick={() => setMenuOpen((v) => !v)} className="rounded-xl p-2.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 md:hidden">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-ink-200/60 dark:border-ink-800 px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2">
              <a href="#features" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-ink-100 dark:hover:bg-ink-800">Features</a>
              <a href="#how" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-ink-100 dark:hover:bg-ink-800">How it works</a>
              <a href="#testimonials" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-ink-100 dark:hover:bg-ink-800">Testimonials</a>
              <a href="#faq" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-ink-100 dark:hover:bg-ink-800">FAQ</a>
              <a href="#contact" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-ink-100 dark:hover:bg-ink-800">Contact</a>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-light dark:bg-grid-dark [background-size:24px_24px] opacity-60" />
        <div className="absolute -top-32 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="section relative py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 dark:border-brand-500/20 bg-brand-50 dark:bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
              <Zap className="h-3.5 w-3.5" /> Built for modern colleges — paper attendance is over
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-balance sm:text-6xl">
              Smart Event Attendance &{' '}
              <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
                Approval Management
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-500 dark:text-ink-400 text-balance">
              EventSync replaces paper attendance sheets with rotating QR codes, a digital approval workflow, auto-generated certificates, and live analytics — purpose-built for workshops, seminars, hackathons, and club events.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup" className="btn-primary w-full sm:w-auto">
                Create your account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="btn-secondary w-full sm:w-auto">Sign in</Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-5 text-xs text-ink-400">
              <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Secure auth</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> 4 roles</span>
              <span className="inline-flex items-center gap-1.5"><Award className="h-3.5 w-3.5" /> Auto certificates</span>
            </div>
          </div>

          {/* Mock dashboard preview */}
          <div className="mx-auto mt-14 max-w-5xl">
            <div className="glass rounded-2xl p-3 shadow-glow">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: CalendarDays, label: 'Events', value: '24', tone: 'from-brand-500 to-brand-700' },
                  { icon: Users, label: 'Registrations', value: '1,842', tone: 'from-accent-500 to-accent-700' },
                  { icon: QrCode, label: 'Attendance', value: '94%', tone: 'from-fuchsia-500 to-fuchsia-700' },
                  { icon: Award, label: 'Certificates', value: '318', tone: 'from-amber-500 to-amber-700' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-white/70 dark:bg-ink-900/60 p-4">
                    <div className={`mb-3 grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${s.tone} text-white`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold font-display">{s.value}</p>
                    <p className="text-xs text-ink-400">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/70 dark:bg-ink-900/60 p-4 sm:col-span-2">
                  <p className="mb-3 text-sm font-semibold">Participation trend</p>
                  <div className="flex h-24 items-end gap-1.5">
                    {[40, 65, 50, 80, 60, 90, 75, 95, 70, 85, 100, 88].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand-500 to-brand-300" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-white/70 dark:bg-ink-900/60 p-4">
                  <p className="mb-3 text-sm font-semibold">Approval queue</p>
                  <div className="space-y-2">
                    {['AI Workshop', 'Hackathon 26', 'Guest Lecture'].map((t, i) => (
                      <div key={t} className="flex items-center justify-between rounded-lg bg-ink-100 dark:bg-ink-800 px-3 py-2 text-xs">
                        <span className="font-medium">{t}</span>
                        <span className={`badge ${i === 0 ? 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>
                          {i === 0 ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Everything a campus event needs</h2>
          <p className="mt-3 text-ink-500 dark:text-ink-400">From registration to certificate verification — one cohesive platform.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="section py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">How it works</h2>
          <p className="mt-3 text-ink-500 dark:text-ink-400">Four steps from event creation to issued certificate.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="card relative p-6">
              <span className="font-display text-4xl font-extrabold text-brand-500/30">{s.n}</span>
              <h3 className="mt-2 font-display text-base font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="section py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Trusted by campuses</h2>
          <p className="mt-3 text-ink-500 dark:text-ink-400">What faculty and students say about EventSync.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="card p-6">
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-300 dark:text-ink-600'}`} />
                ))}
              </div>
              <p className="text-sm text-ink-600 dark:text-ink-300">"{t.quote}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
                  {t.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-ink-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Frequently asked questions</h2>
        </div>
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="font-display text-base font-semibold">{f.q}</span>
                <span className="shrink-0 text-ink-400">{openFaq === i ? <X className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-ink-500 dark:text-ink-400 animate-fade-in">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section py-16">
        <div className="glass relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
          <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Ready to digitize your campus events?</h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-500 dark:text-ink-400">Sign up in seconds and create your first event today.</p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup" className="btn-primary w-full sm:w-auto">Create account <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/verify" className="btn-secondary w-full sm:w-auto">Verify a certificate</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact + Footer */}
      <footer id="contact" className="border-t border-ink-200/60 dark:border-ink-800">
        <div className="section py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="font-display text-lg font-bold">EventSync</span>
              </div>
              <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">Smart attendance & approval management for modern colleges.</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-500 dark:text-ink-400">
                <li><a href="#features" className="hover:text-ink-900 dark:hover:text-white">Features</a></li>
                <li><a href="#how" className="hover:text-ink-900 dark:hover:text-white">How it works</a></li>
                <li><Link to="/verify" className="hover:text-ink-900 dark:hover:text-white">Verify certificate</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Company</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-500 dark:text-ink-400">
                <li><a href="#testimonials" className="hover:text-ink-900 dark:hover:text-white">Testimonials</a></li>
                <li><a href="#faq" className="hover:text-ink-900 dark:hover:text-white">FAQ</a></li>
                <li><a href="mailto:hello@eventsync.edu" className="hover:text-ink-900 dark:hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Get in touch</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-500 dark:text-ink-400">
                <li>hello@eventsync.edu</li>
                <li>+91 98765 43210</li>
                <li>Mon–Fri, 9am–6pm</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-ink-200/60 dark:border-ink-800 pt-6 text-center text-xs text-ink-400">
            © {new Date().getFullYear()} EventSync. Built for colleges. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
