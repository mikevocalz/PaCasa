import { ClipboardCheck, FileText, Languages, Users } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { DEMO_PATIENTS } from '@/data/demoPortal';
import { useAuth } from '@/lib/AuthContext';

export default function ProviderDashboard() {
  const { user, organizations } = useAuth();
  const org = organizations[0];
  return (
    <section className="mx-auto w-full max-w-6xl space-y-7 px-4 py-7 md:px-6">
      <header className="space-y-2"><div className="flex flex-wrap items-center gap-2"><Badge tone="provider">Proveedor</Badge><span className="text-sm text-fg-subtle">{org?.name}</span></div><h1 className="font-display text-3xl text-fg">Buenos días, {user?.name?.split(' ')[0] ?? 'equipo'}</h1><p className="max-w-2xl text-base leading-7 text-fg-muted">Vea qué pacientes están llenando formularios, cuáles necesitan ayuda y qué documentos esperan revisión.</p></header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Users} value="3" label="Pacientes demo" /><Metric icon={ClipboardCheck} value="1" label="Listo para revisar" /><Metric icon={FileText} value="3" label="Formularios activos" /><Metric icon={Languages} value="ES ↔ EN" label="Idioma principal" /></div>
      <Card as="section" aria-labelledby="provider-recent-patients" className="space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-soft">Hoy</p><h2 id="provider-recent-patients" className="font-display text-2xl text-fg">Pacientes recientes</h2></div><Button to="/provider/patients" tone="secondary">Ver todos</Button></header>
        <div className="divide-y divide-line">{DEMO_PATIENTS.map((patient) => <article key={patient.id} className="grid gap-2 py-4 md:grid-cols-[1fr_auto_auto] md:items-center"><div><h3 className="font-semibold text-fg">{patient.name}</h3><p className="text-sm text-fg-subtle">{patient.form} · {patient.language}</p></div><Badge tone={patient.status === 'Listo para revisar' ? 'provider' : patient.status === 'Necesita ayuda' ? 'pending' : 'default'}>{patient.status}</Badge><Button tone="ghost">Abrir</Button></article>)}</div>
      </Card>
    </section>
  );
}
function Metric({ icon: Icon, value, label }) { return <Card as="article" className="space-y-3"><Icon size={22} className="text-sky-300" aria-hidden /><strong className="block font-display text-2xl text-fg">{value}</strong><span className="text-sm text-fg-subtle">{label}</span></Card>; }
