import { MoreHorizontal } from 'lucide-react';
import { formProgress } from '@/session/store';

/** The frame every primary tab screen sits in: its question, then its answer. */
export function PatientFrame({ question, title, lead, children }) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6 md:px-6 md:py-10">
      <header className="space-y-3 border-b border-line/70 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-soft">{question}</p>
        <h1 className="max-w-3xl text-3xl leading-tight text-fg md:text-5xl">{title}</h1>
        {lead ? <p className="max-w-2xl text-base leading-7 text-fg-muted md:text-lg">{lead}</p> : null}
      </header>
      {children}
    </div>
  );
}

/** One region with a label: the kit's panel, without the dashboard chrome. */
export function Panel({ label, children, className = '' }) {
  return (
    <section aria-label={label} className={`overflow-hidden border border-line bg-panel shadow-card ${className}`}>
      <div className="flex items-center gap-3 border-b border-line/70 px-5 py-3.5">
        <span aria-hidden className="h-2 w-2 bg-accent" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">{label}</h2>
      </div>
      <div className="space-y-5 p-5 md:p-6">{children}</div>
    </section>
  );
}

export function ActionButton({ label, onPress, tone = 'solid', disabled, type = 'button' }) {
  const face =
    tone === 'solid'
      ? 'border-royal-400 bg-accent text-silver-50 hover:bg-royal-400 active:bg-royal-600'
      : 'border-line bg-panel text-fg-muted hover:border-accent-soft hover:bg-panel-2 hover:text-fg';
  return (
    <button
      type={type}
      onClick={onPress}
      disabled={disabled}
      aria-disabled={disabled}
      className={`min-h-12 border px-6 text-sm font-semibold uppercase tracking-[0.12em] shadow-card transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${face}`}
    >
      {label}
    </button>
  );
}

/** The very large primary actions Inicio opens on. */
export function BigAction({ icon: Icon, label, hint, tone = 'solid', disabled, disabledHint, onPress }) {
  const face = disabled
    ? 'border-line bg-panel text-fg-subtle'
    : tone === 'solid'
      ? 'border-royal-400 bg-accent text-silver-50 hover:bg-royal-400 active:bg-royal-600'
      : 'border-line bg-panel text-fg hover:border-accent-soft hover:bg-panel-2';
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-disabled={disabled}
      className={`flex min-h-24 w-full flex-col items-center justify-center gap-2 border px-6 py-6 text-center shadow-card transition-colors disabled:cursor-not-allowed ${face}`}
    >
      <Icon size={30} aria-hidden />
      <span className="font-display text-lg leading-tight md:text-xl">{label}</span>
      {hint && !disabled ? <span className="text-sm opacity-80">{hint}</span> : null}
      {disabled && disabledHint ? <span className="text-sm text-fg-subtle">{disabledHint}</span> : null}
    </button>
  );
}

/** "5 de 8 preguntas completas", counted and drawn. */
export function ProgressRow({ form }) {
  const { done, total } = formProgress(form);
  return (
    <div className="w-full space-y-2">
      <p className="text-sm font-semibold text-fg-muted md:text-base">
        {done} de {total} preguntas completas
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label={`Progreso del formulario: ${done} de ${total} preguntas completas`}
        className="flex gap-1"
      >
        {form.answers.map((item) => (
          <span
            key={item.id}
            className={`h-2 flex-1 ${item.confirmed && item.value.trim() ? 'bg-accent' : 'bg-ink-700'}`}
          />
        ))}
      </div>
    </div>
  );
}

/** A primary action plus an overflow menu — never eight buttons on a row. */
export function OverflowMenu({ label, actions }) {
  return (
    <details className="relative">
      <summary
        aria-label={label}
        className="flex h-12 w-12 cursor-pointer list-none items-center justify-center border border-line bg-panel text-fg-muted hover:border-accent-soft hover:text-fg"
      >
        <MoreHorizontal size={20} aria-hidden />
      </summary>
      <div className="absolute right-0 top-full z-20 mt-2 min-w-56 border border-line bg-panel py-1 shadow-card">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onPress}
            disabled={action.disabled}
            className="flex min-h-11 w-full items-center px-4 text-left text-base text-fg hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {action.label}
          </button>
        ))}
      </div>
    </details>
  );
}