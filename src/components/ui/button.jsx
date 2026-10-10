import React from 'react';

/** Pa'Casa button — the shared look for the account screens. */
const VARIANTS = {
  default: 'border border-royal-400 bg-accent text-silver-50 hover:bg-royal-600',
  outline: 'border border-line bg-panel text-fg hover:bg-panel-2',
  ghost: 'border border-transparent text-fg-muted hover:bg-panel hover:text-fg',
};

const SIZES = {
  default: 'min-h-11 px-5 text-sm',
  sm: 'min-h-9 px-4 text-sm',
  lg: 'min-h-12 px-6 text-base',
  icon: 'h-11 w-11',
};

export function Button({ variant = 'default', size = 'default', type = 'button', className = '', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        VARIANTS[variant] ?? VARIANTS.default
      } ${SIZES[size] ?? SIZES.default} ${className}`}
      {...props}
    />
  );
}

export default Button;