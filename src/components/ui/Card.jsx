export default function Card({ as: Element = 'section', className = '', children, ...props }) {
  return <Element className={`border border-line bg-panel p-5 shadow-card ${className}`} {...props}>{children}</Element>;
}
