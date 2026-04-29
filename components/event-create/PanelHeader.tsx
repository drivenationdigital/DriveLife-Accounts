/**
 * Shared header used at the top of every wizard panel.
 *
 * Layout:
 *   ┌──────────────────────────────────┐
 *   │ STEP n OF 10  ← gold eyebrow      │
 *   │ Big title    ← font-display       │
 *   │ Subtitle paragraph                │
 *   └──────────────────────────────────┘
 *
 * Kept dumb on purpose — no state, no router. Each panel passes the
 * step number, title, and subtitle in. This means panels stay easy
 * to test and the header is a pure presentation component.
 */
export function PanelHeader({
  stepNumber,
  totalSteps,
  title,
  subtitle,
}: {
  stepNumber: number;
  totalSteps: number;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="mb-8">
      <p className="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-2">
        Step {stepNumber} of {totalSteps}
      </p>
      <h2 className="font-display text-3xl sm:text-4xl text-ink-900 mb-2">
        {title}
      </h2>
      <p className="text-ink-500">{subtitle}</p>
    </header>
  );
}
