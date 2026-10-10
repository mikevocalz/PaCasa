export default function TextField({ label, hint, id, className = '', ...props }) {
  return (
    <label className={`grid gap-2 ${className}`} htmlFor={id}>
      <span className="text-sm font-semibold text-fg">{label}</span>
      <input id={id} className="min-h-12 w-full border border-line bg-page px-4 text-base text-fg outline-none placeholder:text-fg-subtle focus:border-accent-soft" {...props} />
      {hint ? <span className="text-sm leading-6 text-fg-subtle">{hint}</span> : null}
    </label>
  );
}
