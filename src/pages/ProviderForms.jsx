import { FileText } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { DEMO_PROVIDER_FORMS } from '@/data/demoPortal';

export default function ProviderForms() {
  return <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-7 md:px-6"><header className="flex flex-wrap items-end justify-between gap-4"><div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-soft">Portal proveedor</p><h1 className="font-display text-3xl text-fg">Formularios</h1><p className="text-base text-fg-muted">Plantillas que Pa’Casa convierte en una conversación guiada para pacientes.</p></div><Button>Subir formulario</Button></header><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{DEMO_PROVIDER_FORMS.map((form) => <Card as="article" key={form.id} className="space-y-4"><FileText className="text-sky-300" aria-hidden /><div><h2 className="font-display text-xl text-fg">{form.name}</h2><p className="text-sm text-fg-subtle">{form.questions} preguntas · Original: {form.language}</p></div><div className="flex items-center justify-between gap-3"><Badge tone="provider">Activo</Badge><Button tone="secondary">Ver</Button></div></Card>)}</div></section>;
}
