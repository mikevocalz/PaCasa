import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AccountTypePicker from '@/components/AccountTypePicker';
import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import VerifyCodeForm from '@/components/VerifyCodeForm';
import { DEMO_ORGANIZATIONS } from '@/data/demoPortal';
import { useAuth } from '@/lib/AuthContext';

export default function Register() {
  const { isAuthenticated, profile, register, resendCode, verifyRegistration } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('details');
  const [accountType, setAccountType] = useState('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState(DEMO_ORGANIZATIONS[0].slug);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  if (isAuthenticated && profile) return <Navigate to={profile.accountType === 'provider' ? '/provider' : '/'} replace />;

  const start = async (event) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await register({ email: email.trim(), password });
      setStep('code');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la cuenta.');
    } finally {
      setPending(false);
    }
  };

  const confirm = async (otpCode) => {
    setPending(true);
    setError(null);
    try {
      const session = await verifyRegistration({
        email: email.trim(),
        password,
        otpCode,
        profile: { name, accountType, organization: accountType === 'provider' ? organizationSlug : null },
      });
      navigate(session.profile.status === 'active' ? (accountType === 'provider' ? '/provider' : '/') : '/provider/pending', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo verificar el código.');
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout
      title="Cree su cuenta Pa’Casa"
      subtitle={step === 'code' ? 'Un último paso: confirme su correo.' : 'Pacientes entran de inmediato. Las cuentas de proveedor requieren una organización y aprobación.'}
    >
      {step === 'code' ? (
        <VerifyCodeForm email={email.trim()} error={error} pending={pending} onVerify={confirm} onResend={() => resendCode(email.trim())} />
      ) : (
        <form className="space-y-5" onSubmit={start}>
          <AccountTypePicker accountType={accountType} onAccountType={setAccountType} organizationSlug={organizationSlug} onOrganization={setOrganizationSlug} />
          {error ? <p role="alert" className="border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
          <TextField id="signup-name" label="Nombre" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
          <TextField id="signup-email" label="Correo electrónico" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <TextField id="signup-password" label="Contraseña" type="password" autoComplete="new-password" hint="Use por lo menos 10 caracteres." value={password} onChange={(event) => setPassword(event.target.value)} />
          <Button type="submit" className="w-full" disabled={pending || !name || !email || password.length < 10}>{pending ? 'Creando cuenta…' : accountType === 'provider' ? 'Solicitar cuenta de proveedor' : 'Crear cuenta de paciente'}</Button>
          <p className="text-center text-sm text-fg-muted">¿Ya tiene cuenta? <a className="font-semibold text-accent-soft underline underline-offset-4" href="/login">Iniciar sesión</a></p>
        </form>
      )}
    </AuthLayout>
  );
}