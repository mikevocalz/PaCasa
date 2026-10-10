import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { DEMO_PATIENTS } from '@/data/demoPortal';

export default function ProviderPatients() {
  return <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-7 md:px-6"><header className="space-y-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-soft">Portal proveedor</p><h1 className="font-display text-3xl text-fg">Pacientes</h1><p className="text-base text-fg-muted">Pacientes vinculados a su organización. Datos ficticios para la demostración.</p></header><Card as="section" className="p-0"><div className="divide-y divide-line">{DEMO_PATIENTS.map((patient) => <article key={patient.id} className="grid gap-3 p-5 md:grid-cols-[1.3fr_1fr_auto_auto] md:items-center"><div><h2 className="font-semibold text-fg">{patient.name}</h2><p className="text-sm text-fg-subtle">{patient.language}</p></div><p className="text-sm text-fg-muted">{patient.form}</p><Badge tone={patient.status === 'Necesita ayuda' ? 'pending' : 'default'}>{patient.status}</Badge><Button tone="secondary">Abrir paciente</Button></article>)}</div></Card></section>;
}
