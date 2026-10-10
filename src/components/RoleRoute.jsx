import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function RoleRoute({ role, allowPending = false }) {
  const { isLoadingAuth, isAuthenticated, profile } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return <main className="grid min-h-screen place-items-center bg-page" aria-live="polite"><p className="text-fg-muted">Abriendo su portal…</p></main>;
  }
  if (!isAuthenticated || !profile) return <Navigate to="/login" replace state={{ returnTo: location.pathname }} />;
  if (profile.accountType === 'provider' && profile.status !== 'active' && !allowPending) return <Navigate to="/provider/pending" replace />;
  if (role && profile.accountType !== role) return <Navigate to={profile.accountType === 'provider' ? '/provider' : '/'} replace />;
  return <Outlet />;
}
