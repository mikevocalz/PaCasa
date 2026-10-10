import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Stethoscope, UserRound } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import TextField from '@/components/ui/TextField';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const { isAuthenticated, profile, login, loginDemo, remoteAuthConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  if (isAuthenticated && profile) return <Navigate to={profile.accountType === 'provider' ? '/provider' : '/'} replace />;

  const afterLogin = (session) => {
    const requested = location.state?.returnTo;
    navigate(requested || (session.profile.accountType === 'provider' ? '/provider' : '/'), { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try { afterLogin(await login({ email, password })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.'); }
    finally { setPending(false); }
  };

  const demoSubmit = async (role) => {
    setPending(true);
    setError(null);
    try { afterLogin(await loginDemo(role)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo abrir la sesión de demostración.'); }
    finally { setPending(false); }
  };

  return (
    <AuthLayout title="Entre a su portal" subtitle="La misma cuenta de Pa’Casa abre una experiencia distinta para pacientes y proveedores." footer="Datos de demostración: las organizaciones y personas de ejemplo son ficticias.">
      <form className="space-y-5" onSubmit={submit}>
        <header className="space-y-2"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-soft">Iniciar sesión</p><h2 className="font-display text-2xl text-fg">Bienvenido de nuevo</h2></header>
        {error ? <p role="alert" className="border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
        <TextField id="login-email" label="Correo electrónico" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField id="login-password" label="Contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="w-full" disabled={pending || !email || !password}>{pending ? 'Entrando…' : 'Entrar'}</Button>
        <p className="text-center text-sm text-fg-muted">¿No tiene cuenta? <a className="font-semibold text-accent-soft underline underline-offset-4" href="/signup">Crear una cuenta</a></p>
      </form>
      <section className="mt-7 space-y-3 border-t border-line pt-6" aria-labelledby="demo-login-title">
        <header className="space-y-1"><h3 id="demo-login-title" className="font-display text-lg text-fg">Entradas rápidas para la demo</h3><p className="text-sm leading-6 text-fg-subtle">{remoteAuthConfigured ? 'Use las cuentas sembradas en Supabase cuando el seed esté ejecutado.' : 'El backend aún no está conectado; estos botones abren una sesión demo temporal.'}</p></header>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card as="article" className="space-y-3 p-4"><UserRound className="text-emerald-300" aria-hidden /><div><h4 className="font-semibold text-fg">Paciente</h4><p className="text-sm text-fg-subtle">Rosa Velázquez</p></div><Button tone="secondary" className="w-full" onClick={() => demoSubmit('patient')}>Entrar como paciente</Button></Card>
          <Card as="article" className="space-y-3 p-4"><Stethoscope className="text-sky-300" aria-hidden /><div><h4 className="font-semibold text-fg">Proveedor</h4><p className="text-sm text-fg-subtle">Dra. Elena Ruiz</p></div><Button tone="secondary" className="w-full" onClick={() => demoSubmit('provider')}>Entrar como proveedor</Button></Card>
        </div>
      </section>
    </AuthLayout>
  );
}