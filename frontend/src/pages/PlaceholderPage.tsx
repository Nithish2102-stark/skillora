export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-8">
      <p className="text-sm font-medium text-[var(--primary-hover)]">Skillora</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
        This route is established in Phase 1. The complete {title.toLowerCase()}{" "}
        experience will be implemented in a later phase.
      </p>
    </section>
  );
}

