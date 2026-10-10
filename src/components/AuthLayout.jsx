import { HeartPulse } from 'lucide-react';
import Card from '@/components/ui/Card';

export default function AuthLayout({ eyebrow = 'Pa’Casa', title, subtitle, footer, children }) {
  return (
    <main className="min-h-screen bg-page px-4 py-8 md:py-14">
      <section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <header className="space-y-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-royal-400 bg-accent text-silver-50 shadow-raised"><HeartPulse size={28} aria-hidden /></div>
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-soft">{eyebrow}</p>
            <h1 className="font-display text-4xl leading-tight text-fg md:text-5xl">{title}</h1>
            {subtitle ? <p className="max-w-xl text-lg leading-8 text-fg-muted">{subtitle}</p> : null}
          </div>
          <p className="max-w-lg text-sm leading-6 text-fg-subtle">Pacientes y proveedores usan la misma identidad de Pa’Casa, pero entran a portales distintos según su cuenta.</p>
        </header>
        <Card as="section" className="p-6 md:p-8" aria-label={title}>{children}</Card>
      </section>
      {footer ? <footer className="mx-auto mt-6 max-w-5xl text-center text-sm text-fg-subtle">{footer}</footer> : null}
    </main>
  );
}
