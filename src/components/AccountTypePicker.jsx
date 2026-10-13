import { Building2, UserRound } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { DEMO_ORGANIZATIONS } from '@/data/demoPortal';

/** Which door this account opens, and — for clinic staff — which clinic it belongs to. */
export default function AccountTypePicker({ accountType, onAccountType, organizationSlug, onOrganization }) {
  return (
    <>
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-soft">Tipo de cuenta</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => onAccountType('patient')} aria-pressed={accountType === 'patient'} className={`min-h-24 border p-4 text-left ${accountType === 'patient' ? 'border-emerald-400 bg-emerald-400/10' : 'border-line bg-panel'}`}><UserRound className="mb-2 text-emerald-300" aria-hidden /><strong className="block text-fg">Soy paciente</strong><span className="text-sm text-fg-subtle">Formularios, documentos, voz y revisión.</span></button>
          <button type="button" onClick={() => onAccountType('provider')} aria-pressed={accountType === 'provider'} className={`min-h-24 border p-4 text-left ${accountType === 'provider' ? 'border-sky-400 bg-sky-400/10' : 'border-line bg-panel'}`}><Building2 className="mb-2 text-sky-300" aria-hidden /><strong className="block text-fg">Trabajo en una clínica</strong><span className="text-sm text-fg-subtle">Pacientes, formularios y cola de revisión.</span></button>
        </div>
      </fieldset>

      {accountType === 'provider' ? (
        <Card as="section" className="space-y-3 border-sky-400/30 bg-sky-400/5 p-4">
          <Badge tone="pending">Aprobación requerida</Badge>
          <p className="text-sm leading-6 text-fg-muted">Elegir una clínica no concede acceso por sí solo: la clínica aprueba la membresía antes de que Pa’Casa muestre pacientes o documentos.</p>
          <label className="grid gap-2 text-sm font-semibold text-fg">Organización
            <select value={organizationSlug} onChange={(event) => onOrganization(event.target.value)} className="min-h-12 border border-line bg-page px-4 text-base text-fg">
              {DEMO_ORGANIZATIONS.map((org) => <option key={org.id} value={org.slug}>{org.name}</option>)}
            </select>
          </label>
        </Card>
      ) : null}
    </>
  );
}