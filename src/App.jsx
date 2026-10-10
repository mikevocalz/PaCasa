import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { queryClientInstance } from '@/lib/query-client';
import { Toaster } from '@/components/ui/toaster';
import PatientShell from '@/components/PatientShell';
import Documentos from '@/pages/Documentos';
import Formularios from '@/pages/Formularios';
import Inicio from '@/pages/Inicio';
import PaCasaLive from '@/pages/PaCasaLive';
import Revisar from '@/pages/Revisar';
import ForgotPassword from '@/pages/ForgotPassword';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ResetPassword from '@/pages/ResetPassword';

/**
 * Locked navigation (PA'CASA — LOCKED APP ARCHITECTURE):
 *
 *   Inicio · Formularios · ◉ Pa'Casa · Documentos · Revisar
 *
 * Five destinations. Pa'Casa Live is a ROOT-LEVEL screen outside the tab stack;
 * every other destination is nested inside one of the four tabs. The four
 * account screens sit outside it too, because signing in is optional.
 */
const AUTH_SCREENS = ['/login', '/register', '/forgot-password', '/reset-password'];

function AuthenticatedApp() {
  const { isLoadingAuth, authError } = useAuth();
  const { pathname } = useLocation();
  const onAuthScreen = AUTH_SCREENS.includes(pathname);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-page">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink-700 border-t-royal-500" />
      </div>
    );
  }

  // A visitor with no session is simply anonymous — Pa'Casa is public, so the
  // tabs render either way. Only a signed-in email the app does not know about
  // is held back, and even then the account screens stay reachable so they can
  // sign in with a different address.
  if (authError && !onAuthScreen) {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pacasa" element={<PaCasaLive />} />
      <Route element={<PatientShell />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/formularios" element={<Formularios />} />
        <Route path="/documentos" element={<Documentos />} />
        <Route path="/revisar" element={<Revisar />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}