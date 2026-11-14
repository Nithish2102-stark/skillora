import type { ReactNode } from "react";
import { Check, ChevronRight, CircleAlert, X } from "lucide-react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary-hover)]">{eyebrow}</p>}
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--text-primary)]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-[var(--border)] bg-white ${className}`}>{children}</div>;
}

export function SectionTitle({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-serif text-lg font-semibold">{title}</h2>{detail && <p className="mt-1 text-xs text-[var(--text-secondary)]">{detail}</p>}</div>{action}</div>;
}

export function MetricCard({ label, value, detail, progress, tone = "blue" }: { label: string; value: string; detail: string; progress?: number; tone?: "blue" | "green" }) {
  return <Card className="p-5"><p className="text-sm text-[var(--text-secondary)]">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p>{progress !== undefined && <ProgressBar value={progress} tone={tone} className="mt-3" />}<p className="mt-2 text-xs text-[var(--text-secondary)]">{detail}</p></Card>;
}

export function ProgressBar({ value, tone = "green", className = "" }: { value: number; tone?: "green" | "blue"; className?: string }) {
  return <div className={`h-2 overflow-hidden rounded-full bg-slate-100 ${className}`}><div className={`h-full rounded-full ${tone === "green" ? "bg-[var(--success)]" : "bg-[var(--primary)]"}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "blue" }) {
  const classes = { neutral: "bg-slate-100 text-slate-600", success: "bg-emerald-50 text-emerald-700", warning: "bg-amber-50 text-amber-700", blue: "bg-blue-50 text-blue-700" };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes[tone]}`}>{children}</span>;
}

export function Button({ children, variant = "primary", onClick, type = "button", className = "", ariaLabel, disabled = false }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; onClick?: () => void; type?: "button" | "submit"; className?: string; ariaLabel?: string; disabled?: boolean }) {
  const classes = { primary: "bg-[var(--primary)] text-slate-900 hover:bg-[var(--primary-hover)]", secondary: "border border-[var(--border)] bg-white text-[var(--text-primary)] hover:bg-slate-50", ghost: "text-[var(--primary-hover)] hover:bg-blue-50", danger: "border border-red-200 text-red-600 hover:bg-red-50" };
  return <button type={type} aria-label={ariaLabel} disabled={disabled} onClick={onClick} className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 hover:shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-60 ${classes[variant]} ${className}`}>{children}</button>;
}

export function StatusIcon({ status }: { status: "completed" | "in-progress" | "not-started" }) {
  if (status === "completed") return <span className="grid size-8 place-items-center rounded-full bg-emerald-50 text-[var(--success)]"><Check size={16} /></span>;
  if (status === "in-progress") return <span className="grid size-8 place-items-center rounded-full bg-blue-50 text-[var(--primary-hover)]"><ChevronRight size={16} /></span>;
  return <span className="grid size-8 place-items-center rounded-full border border-[var(--border)] text-slate-400"><span className="size-2 rounded-full bg-slate-300" /></span>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-8 text-center"><CircleAlert className="mx-auto text-slate-300" size={24} /><h3 className="mt-3 font-semibold">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-slate-900/30 p-4" role="dialog" aria-modal="true"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--border)] bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="font-serif text-xl font-semibold">{title}</h2><button aria-label="Close dialog" onClick={onClose} className="cursor-pointer rounded p-1 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"><X size={18} /></button></div><div className="mt-5">{children}</div></div></div>;
}

