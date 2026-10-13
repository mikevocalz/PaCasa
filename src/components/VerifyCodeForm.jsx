import { useState } from 'react';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';

/** The code Base44 emails after a sign-up; the account is not usable until it is entered. */
export default function VerifyCodeForm({ email, error, pending, onVerify, onResend }) {
  const [code, setCode] = useState('');
  const [resent, setResent] = useState(false);

  const resend = async () => {
    await onResend();
    setResent(true);
  };

  return (
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void onVerify(code.trim()); }}>
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-soft">Verificación</p>
        <h2 className="font-display text-2xl text-fg">Revise su correo</h2>
        <p className="text-sm leading-6 text-fg-muted">Enviamos un código a <strong className="text-fg">{email}</strong>. Escríbalo aquí para activar su cuenta.</p>
      </header>
      {error ? <p role="alert" className="border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
      <TextField id="signup-code" label="Código de verificación" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} />
      <Button type="submit" className="w-full" disabled={pending || code.trim().length < 6}>{pending ? 'Verificando…' : 'Verificar y entrar'}</Button>
      <p className="text-center text-sm text-fg-muted">
        ¿No llegó? <button type="button" onClick={resend} disabled={pending} className="font-semibold text-accent-soft underline underline-offset-4 disabled:opacity-60">Reenviar código</button>
      </p>
      {resent ? <p className="text-center text-sm text-fg-subtle">Enviamos un código nuevo.</p> : null}
    </form>
  );
}