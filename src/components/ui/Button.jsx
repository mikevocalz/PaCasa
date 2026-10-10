import { Link } from 'react-router-dom';

const tones = {
  primary: 'border-royal-400 bg-accent text-silver-50 hover:bg-royal-600',
  secondary: 'border-line bg-panel text-fg hover:border-accent-soft hover:bg-panel-2',
  ghost: 'border-transparent bg-transparent text-fg-muted hover:bg-panel hover:text-fg',
  danger: 'border-red-500/60 bg-red-500/10 text-red-100 hover:bg-red-500/20',
};

export default function Button({ to, tone = 'primary', className = '', children, ...props }) {
  const classes = `inline-flex min-h-12 items-center justify-center gap-2 border px-5 py-2 text-sm font-semibold transition ${tones[tone] ?? tones.primary} ${className}`;
  if (to) return <Link to={to} className={classes}>{children}</Link>;
  return <button type={props.type ?? 'button'} className={classes} {...props}>{children}</button>;
}
