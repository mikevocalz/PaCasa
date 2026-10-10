import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const items = [
  { id: 1, patient: 'Elena Martínez', task: 'Formulario listo para revisar', tone: 'provider', icon: CheckCircle2 },
  { id: 2, patient: 'Carlos Rivera', task: 'Marcó “Necesito ayuda”', tone: 'pending', icon: AlertCircle },
  { id: 3, patient: 'Rosa Velázquez', task: '3 preguntas pendientes', tone: 'default', icon: Clock3 },
];

export default function ProviderInbox() {
  return <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-7 md:px-6"><header className="space-y-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-soft">Portal proveedor</p><h1 className="font-display text-3xl text-fg">Pendientes</h1><p className="text-base text-fg-muted">Una cola operativa, no un dashboard genérico.</p></header><Card as="section" className="p-0"><div className="divide-y divide-line">{items.map((item) => <article key={item.id} className="grid gap-3 p-5 md:grid-cols-[auto_1fr_auto_auto] md:items-center"><item.icon size={22} className={item.tone === 'pending' ? 'text-amber-300' : 'text-sky-300'} aria-hidden /><div><h2 className="font-semibold text-fg">{item.patient}</h2><p className="text-sm text-fg-muted">{item.task}</p></div><Badge tone={item.tone}>{item.tone === 'pending' ? 'Atención' : 'Abierto'}</Badge><Button tone="secondary">Revisar</Button></article>)}</div></Card></section>;
}
