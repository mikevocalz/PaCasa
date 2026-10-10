import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Building2, UserRound } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import TextField from '@/components/ui/TextField';
import { DEMO_ORGANIZATIONS } from '@/data/demoPortal';
import { useAuth } from '@/lib/AuthContext';

export default function Register() {
  const { isAuthenticated, profile, signup, remoteAuthConfigured } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState(DEMO_ORGANIZATIONS[0].slug);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  if (isAuthenticated && profile) return <Navigate to={profile.accountType === 'provider' ? '/provider' : '/'} replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (!remoteAuthConfigured) {
      setError('Conecte VITE_PACASA_AUTH_URL para crear cuentas reales. Para la demo use las entradas rápidas de Iniciar sesión.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const session = await signup({ name, email, password, accountType, organizationSlug: accountType === 'provider' ? organizationSlug : null });
      navigate(session.profile.status === 'active' ? (accountType === 'provider' ? '/provider' : '/') : '/provider/pending', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la cuenta.');
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout title="Cree su cuenta Pa’Casa" subtitle="Pacientes entran de inmediato. Las cuentas de proveedor requieren una organización y aprobación.">
      <form className="space-y-5" onSubmit={submit}>
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-soft">Tipo de cuenta</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setAccountType('patient')} aria-pressed={accountType === 'patient'} className={`min-h-24 border p-4 text-left ${accountType === 'patient' ? 'border-emerald-400 bg-emerald-400/10' : 'border-line bg-panel'}`}><UserRound className="mb-2 text-emerald-300" aria-hidden /><strong className="block text-fg">Soy paciente</strong><span className="text-sm text-fg-subtle">Formularios, documentos, voz y revisión.</span></button>
            <button type="button" onClick={() => setAccountType('provider')} aria-pressed={accountType === 'provider'} className={`min-h-24 border p-4 text-left ${accountType === 'provider' ? 'border-sky-400 bg-sky-400/10' : 'border-line bg-panel'}`}><Building2 className="mb-2 text-sky-300" aria-hidden /><strong className="block text-fg">Trabajo en una clínica</strong><span className="text-sm text-fg-subtle">Pacientes, formularios y cola de revisión.</span></button>
          </div>
        </fieldset>

        {accountType === 'provider' ? (
          <Card as="section" className="space-y-3 border-sky-400/30 bg-sky-400/5 p-4">
            <Badge tone="pending">Aprobación requerida</Badge>
            <p className="text-sm leading-6 text-fg-muted">Seleccionar una clínica no concede acceso por sí solo. La membresía se activa por seed/invitación o aprobación del equipo.</p>
            <label className="grid gap-2 text-sm font-semibold text-fg">Organización
              <select value={organizationSlug} onChange={(e) => setOrganizationSlug(e.target.value)} className="min-h-12 border border-line bg-page px-4 text-base text-fg">
                {DEMO_ORGANIZATIONS.map((org) => <option key={org.id} value={org.slug}>{org.name}</option>)}
              </select>
            </label>
          </Card>
        ) : null}

        {error ? <p role="alert" className="border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
        <TextField id="signup-name" label="Nombre" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField id="signup-email" label="Correo electrónico" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField id="signup-password" label="Contraseña" type="password" autoComplete="new-password" hint="Use por lo menos 10 caracteres." value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="w-full" disabled={pending || !name || !email || password.length < 10}>{pending ? 'Creando cuenta…' : accountType === 'provider' ? 'Solicitar cuenta de proveedor' : 'Crear cuenta de paciente'}</Button>
        <p className="text-center text-sm text-fg-muted">¿Ya tiene cuenta? <a className="font-semibold text-accent-soft underline underline-offset-4" href="/login">Iniciar sesión</a></p>
      </form>
    </AuthLayout>
  );
}
