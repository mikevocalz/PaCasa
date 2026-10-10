import React from 'react';

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`min-h-12 w-full border border-line bg-page px-3 text-base text-fg placeholder:text-fg-subtle focus:border-accent-soft disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export default Input;