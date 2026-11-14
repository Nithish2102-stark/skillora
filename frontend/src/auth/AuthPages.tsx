import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

function AuthShell({
  children,
  eyebrow,
  title,
  description,
  mode = "form",
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  mode?: "form" | "confirmation";
}) {
  return (
    <main className="min-h-screen bg-[var(--background)] p-3 sm:p-5 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1360px] overflow-hidden rounded-[26px] border border-[var(--border)] bg-white shadow-[0_20px_70px_rgba(52,58,64,0.08)] sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <AuthVisual />
        <section className={`flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16 ${mode === "confirmation" ? "lg:py-16" : ""}`}>
          <div className="w-full max-w-[430px]">
            <Link to="/" className="mb-9 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] lg:hidden">
              <span className="grid size-8 place-items-center rounded-lg bg-[var(--primary)] text-sm font-bold text-slate-900">S</span>
              Skillora
            </Link>
            <div className="mb-7">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary-hover)]">{eyebrow}</p>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2.15rem]">{title}</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthVisual() {
  return (
    <aside className="relative hidden min-h-[620px] overflow-hidden bg-[#eef4fb] p-8 lg:flex lg:flex-col lg:justify-between xl:p-12">
      <div className="absolute -right-20 -top-20 size-72 rounded-full bg-[var(--primary)]/25" />
      <div className="absolute -bottom-28 -left-20 size-80 rounded-full border-[34px] border-white/70" />
      <div className="relative">
        <Link to="/" className="inline-flex items-center gap-3 text-[var(--text-primary)]">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--primary)] font-bold text-slate-900 shadow-sm">S</span>
          <span className="text-xl font-semibold tracking-tight">Skillora</span>
        </Link>
        <div className="mt-20 max-w-lg xl:mt-28">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary-hover)]">Personalized career intelligence</p>
          <h2 className="mt-5 max-w-md font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--text-primary)] xl:text-5xl">
            Your learning journey starts here.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-[var(--text-secondary)]">
            Turn your ambitions into a clear, adaptive plan with guidance that understands your skills, goals, and pace.
          </p>
        </div>
      </div>
      <div className="relative mt-16 max-w-[300px] border-l-2 border-[var(--primary)] pl-5">
        <p className="text-sm font-medium leading-6 text-[var(--text-primary)]">Learn smarter. Grow faster. Achieve more.</p>
      </div>
    </aside>
  );
}

function Notice({ message, success = false }: { message: string; success?: boolean }) {
  return <div role="alert" className={`rounded-xl border p-3.5 text-sm leading-5 ${success ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>;
}

function Field({ label, id, type = "text", value, onChange, placeholder, icon: Icon, required = true, autoComplete }: { label: string; id: string; type?: string; value: string; onChange: (value: string) => void; placeholder?: string; icon?: typeof Mail; required?: boolean; autoComplete?: string }) {
  return <label htmlFor={id} className="block text-sm font-medium text-[var(--text-primary)]">{label}<div className="relative mt-2">{Icon && <Icon aria-hidden="true" size={16} className="pointer-events-none absolute left-3.5 top-3 text-slate-400" />}<input id={id} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} className={`w-full rounded-xl border border-[var(--border)] bg-white py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[var(--primary-hover)] focus:ring-4 focus:ring-blue-100 ${Icon ? "pl-10 pr-3" : "px-3"}`} /></div></label>;
}

function PasswordField({ label, id, value, onChange, autoComplete }: { label: string; id: string; value: string; onChange: (value: string) => void; autoComplete?: string }) {
  const [visible, setVisible] = useState(false);
  return <label htmlFor={id} className="block text-sm font-medium text-[var(--text-primary)]">{label}<div className="relative mt-2"><LockKeyhole aria-hidden="true" size={16} className="pointer-events-none absolute left-3.5 top-3 text-slate-400" /><input id={id} required minLength={8} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className="w-full rounded-xl border border-[var(--border)] bg-white py-3 pl-10 pr-11 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[var(--primary-hover)] focus:ring-4 focus:ring-blue-100" /><button type="button" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} onClick={() => setVisible(!visible)} className="absolute right-3 top-2.5 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[var(--text-primary)]">{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>;
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const label = score <= 1 ? "Needs improvement" : score === 2 ? "Getting stronger" : score === 3 ? "Good password" : "Strong password";
  return <div aria-live="polite" className="mt-2"><div className="flex gap-1">{checks.map((valid, index) => <span key={index} className={`h-1 flex-1 rounded-full ${valid ? "bg-[var(--success)]" : "bg-slate-200"}`} />)}</div>{password && <p className="mt-1.5 text-[11px] text-[var(--text-secondary)]">{label} · Use 8+ characters, a number, and a symbol.</p>}</div>;
}

function FooterLink({ children, to }: { children: ReactNode; to: string }) {
  return <Link to={to} className="font-semibold text-[var(--primary-hover)] transition hover:text-[var(--text-primary)]">{children}</Link>;
}

export function LoginPage() {
  const { signIn, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const next = new URLSearchParams(location.search).get("next") || "/dashboard";
  useEffect(() => {
    const verificationError = new URLSearchParams(location.search).get("error_description");
    if (verificationError) setError("This verification link is invalid or has expired. Request a new email to continue.");
  }, [location.search]);
  const submit = async (event: FormEvent) => { event.preventDefault(); if (loading) return; setLoading(true); setError(""); const result = await signIn(email, password); setLoading(false); if (result.error) setError(result.error); else navigate(next); };
  return <AuthShell eyebrow="Welcome back" title="Sign in to Skillora" description="Continue your personalized learning journey and pick up where you left off."><form onSubmit={submit} className="space-y-5"><Field id="login-email" label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} autoComplete="email" /><PasswordField id="login-password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" /><div className="flex items-center justify-end"><Link to="/forgot-password" className="text-xs font-semibold text-[var(--primary-hover)] transition hover:text-[var(--text-primary)]">Forgot password?</Link></div>{error && <Notice message={error} />}{!configured && <Notice message="Local preview mode is active. Add your Supabase publishable key to enable authentication." />}<Button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 py-3">{loading ? "Signing in…" : <>Sign in <ArrowRight size={16} className="transition group-hover:translate-x-0.5" /></>}</Button></form><p className="mt-7 text-center text-sm text-[var(--text-secondary)]">New to Skillora? <FooterLink to="/register">Create an account</FooterLink></p></AuthShell>;
}

export function RegisterPage() {
  const { signUp, resendVerification, configured } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const strength = useMemo(() => form.password, [form.password]);
  const submit = async (event: FormEvent) => { event.preventDefault(); if (loading) return; setError(""); if (form.password.length < 8) return setError("Password must be at least 8 characters."); if (form.password !== form.confirm) return setError("Passwords do not match."); setLoading(true); const result = await signUp(form.name, form.email, form.password); setLoading(false); if (result.error) setError(result.error); else if (result.needsVerification) setSuccess(true); else navigate("/dashboard"); };
  const resend = async () => { if (cooldown > 0 || resendLoading) return; setResendLoading(true); setResendMessage(""); const result = await resendVerification(form.email); setResendLoading(false); if (result.error) setResendMessage(result.error); else { setResendMessage("A fresh verification email has been sent."); setCooldown(30); const timer = window.setInterval(() => setCooldown((value) => { if (value <= 1) { window.clearInterval(timer); return 0; } return value - 1; }), 1000); } };
  if (success) return <AuthShell mode="confirmation" eyebrow="One last step" title="Check your inbox" description={`We sent a verification link to ${form.email}. Confirm your email to activate your Skillora workspace.`}><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center"><div className="mx-auto grid size-12 place-items-center rounded-full bg-white text-[var(--success)] shadow-sm"><CheckCircle2 size={25} /></div><h2 className="mt-4 font-serif text-xl font-semibold text-[var(--text-primary)]">Your account is almost ready</h2><p className="mt-2 text-sm leading-6 text-emerald-800/80">The link expires for your security. If it does not arrive shortly, check your spam folder or resend it below.</p></div><div className="mt-5 space-y-3"><Button variant="secondary" disabled={cooldown > 0 || resendLoading} onClick={() => void resend()} className="w-full">{resendLoading ? "Sending…" : cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend verification email"}</Button>{resendMessage && <Notice message={resendMessage} success={!resendMessage.toLowerCase().includes("error")} />}</div><p className="mt-7 text-center text-sm text-[var(--text-secondary)]">Ready to sign in? <FooterLink to="/login">Return to sign in</FooterLink></p></AuthShell>;
  return <AuthShell eyebrow="Start growing" title="Create your Skillora account" description="Build a learning path that adapts to your strengths, goals, and pace."><form onSubmit={submit} className="space-y-4"><Field id="register-name" label="Full name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="Your name" icon={UserRound} autoComplete="name" /><Field id="register-email" label="Email address" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} placeholder="you@example.com" icon={Mail} autoComplete="email" /><div><PasswordField id="register-password" label="Password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} autoComplete="new-password" /><PasswordStrength password={strength} /></div><PasswordField id="register-confirm" label="Confirm password" value={form.confirm} onChange={(value) => setForm({ ...form, confirm: value })} autoComplete="new-password" /><label className="flex items-start gap-2.5 pt-1 text-xs leading-5 text-[var(--text-secondary)]"><input required type="checkbox" className="mt-1 size-3.5 accent-[var(--primary-hover)]" />I agree to Skillora&apos;s <button type="button" className="font-semibold text-[var(--primary-hover)]">Terms</button> and <button type="button" className="font-semibold text-[var(--primary-hover)]">Privacy Policy</button>.</label>{error && <Notice message={error} />}{!configured && <Notice message="Registration is unavailable until Supabase is configured." />}<Button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 py-3">{loading ? "Creating account…" : <>Create account <ArrowRight size={16} className="transition group-hover:translate-x-0.5" /></>}</Button></form><p className="mt-7 text-center text-sm text-[var(--text-secondary)]">Already have an account? <FooterLink to="/login">Sign in</FooterLink></p></AuthShell>;
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return <AuthShell eyebrow="Account recovery" title="Reset your password" description="We&apos;ll send a secure reset link to the email address associated with your account."><form onSubmit={async (event) => { event.preventDefault(); if (loading) return; setLoading(true); setError(""); const result = await resetPassword(email); setLoading(false); if (result.error) setError(result.error); else setMessage("If an account exists for this email, a reset link is on its way."); }} className="space-y-5"><Field id="forgot-email" label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} autoComplete="email" />{message && <Notice message={message} success />}{error && <Notice message={error} />}<Button type="submit" disabled={loading} className="w-full py-3">{loading ? "Sending…" : "Send reset link"}</Button></form><Link to="/login" className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--primary-hover)]"><ArrowLeft size={15} />Back to sign in</Link></AuthShell>;
}

export function ResetPasswordPage() {
  const { session } = useAuth();
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  return <AuthShell eyebrow="Account recovery" title="Choose a new password" description={session ? "Create a new password for your Skillora account." : "Use the reset link from your email to continue."}>{session ? <form onSubmit={async (event) => { event.preventDefault(); if (!supabase || password.length < 8) return; const result = await supabase.auth.updateUser({ password }); if (result.error) setError(result.error.message); else setSuccess(true); }} className="space-y-5"><PasswordField id="reset-password" label="New password" value={password} onChange={setPassword} autoComplete="new-password" />{error && <Notice message={error} />}{success && <Notice message="Password updated successfully." success />}<Button type="submit" className="w-full py-3">Update password</Button></form> : <Notice message="Your reset session is not available. Request a new reset link." />}</AuthShell>;
}

