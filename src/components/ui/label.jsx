import React from 'react';

export function Label({ className = '', ...props }) {
  return <label className={`block text-sm font-medium text-fg-muted ${className}`} {...props} />;
}

export default Label;