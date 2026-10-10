import { Link } from 'react-router-dom';

/** Pa'Casa button — the shared look for the account screens. */
const TONES = {
  primary: 'border-royal-400 bg-accent text-silver-50 hover:bg-royal-600',
  secondary: 'border-line bg-panel text-fg hover:border-accent-soft hover:bg-panel-2',
  ghost: 'border-transparent bg-transparent text-fg-muted hover:bg-panel hover:text-fg',
  danger: 'border-red-500/60 bg-red-500/10 text-red-100 hover:bg-red-500/20',
};

// Older callers use variant=/size=; newer screens use tone=/to=.
const VARIANT_TO_TONE = { default: 'primary', outline: 'secondary', ghost: 'ghost' };

const SIZES = {
  default: 'min-h-11 px-5 text-sm',
  sm: 'min-h-9 px-4 text-sm',
  lg: 'min-h-12 px-6 text-base',
  icon: 'h-11 w-11 px-0',
};

export function Button({ to, tone, variant = 'default', size = 'default', type = 'button', className = '', children, ...props }) {
  const resolved = tone ?? VARIANT_TO_TONE[variant] ?? 'primary';
  const classes = `inline-flex min-h-12 items-center justify-center gap-2 border px-5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${TONES[resolved] ?? TONES.primary} ${SIZES[size] ?? SIZES.default} ${className}`;
  if (to) return <Link to={to} className={classes}>{children}</Link>;
  return <button type={type} className={classes} {...props}>{children}</button>;
}

export default Button;
