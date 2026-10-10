const tones = {
  default: 'border-line bg-panel-2 text-fg-muted',
  patient: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
  provider: 'border-sky-400/40 bg-sky-400/10 text-sky-100',
  pending: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
};

export default function Badge({ tone = 'default', children }) {
  return <span className={`inline-flex min-h-7 items-center border px-2.5 text-xs font-semibold uppercase tracking-[0.1em] ${tones[tone] ?? tones.default}`}>{children}</span>;
}
