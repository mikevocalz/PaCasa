import { Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/AuthContext';

export default function ProviderPending() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return <AuthLayout title="Su cuenta de proveedor está pendiente" subtitle="La organización debe aprobar la membresía antes de que Pa’Casa muestre pacientes o documentos."><section className="space-y-5"><Clock3 size={32} className="text-amber-300" aria-hidden /><Badge tone="pending">Pendiente</Badge><div><p className="font-semibold text-fg">{user?.name}</p><p className="text-sm text-fg-subtle">{user?.email}</p></div><p className="text-sm leading-6 text-fg-muted">Para la demo, use la cuenta de proveedor sembrada o el botón “Entrar como proveedor” en la pantalla de acceso.</p><Button tone="secondary" onClick={async () => { await logout(); navigate('/login', { replace: true }); }}>Cerrar sesión</Button></section></AuthLayout>;
}
