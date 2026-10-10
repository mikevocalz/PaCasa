import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
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

/**
 * Locked navigation (PA'CASA — LOCKED APP ARCHITECTURE):
 *
 *   Inicio · Formularios · ◉ Pa'Casa · Documentos · Revisar
 *
 * Exactly five routes. Pa'Casa Live is a ROOT-LEVEL screen outside the tab
 * stack; every other destination is nested inside one of the four tabs.
 */
function AuthenticatedApp() {
  const { isLoadingAuth, authError, navigateToLogin } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-page">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink-700 border-t-royal-500" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
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