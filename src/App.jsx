import { useEffect } from 'react';
import { refreshDeviceLanguage, useLocale } from '@/i18n/store';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import { queryClientInstance } from '@/lib/query-client';
import { Toaster } from '@/components/ui/toaster';
import RoleRoute from '@/components/RoleRoute';
import PatientShell from '@/components/PatientShell';
import ProviderShell from '@/components/ProviderShell';
import Documentos from '@/pages/Documentos';
import ForgotPassword from '@/pages/ForgotPassword';
import Formularios from '@/pages/Formularios';
import Inicio from '@/pages/Inicio';
import Login from '@/pages/Login';
import PaCasaLive from '@/pages/PaCasaLive';
import ProviderDashboard from '@/pages/ProviderDashboard';
import ProviderForms from '@/pages/ProviderForms';
import ProviderInbox from '@/pages/ProviderInbox';
import ProviderPaCasa from '@/pages/ProviderPaCasa';
import ProviderPatients from '@/pages/ProviderPatients';
import ProviderPending from '@/pages/ProviderPending';
import Register from '@/pages/Register';
import ResetPassword from '@/pages/ResetPassword';
import Revisar from '@/pages/Revisar';

function PortalRoutes() {
  const { language } = useLocale();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshDeviceLanguage();
    };
    window.addEventListener('focus', refreshDeviceLanguage);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshDeviceLanguage);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Register />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<RoleRoute role="patient" />}>
        <Route path="/pacasa" element={<PaCasaLive />} />
        <Route element={<PatientShell />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/formularios" element={<Formularios />} />
          <Route path="/documentos" element={<Documentos />} />
          <Route path="/revisar" element={<Revisar />} />
        </Route>
      </Route>

      <Route element={<RoleRoute role="provider" />}>
        <Route path="/provider/pacasa" element={<ProviderPaCasa />} />
        <Route element={<ProviderShell />}>
          <Route path="/provider" element={<ProviderDashboard />} />
          <Route path="/provider/patients" element={<ProviderPatients />} />
          <Route path="/provider/forms" element={<ProviderForms />} />
          <Route path="/provider/inbox" element={<ProviderInbox />} />
        </Route>
      </Route>

      <Route element={<RoleRoute role="provider" allowPending />}>
        <Route path="/provider/pending" element={<ProviderPending />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AuthProvider><QueryClientProvider client={queryClientInstance}><Router><PortalRoutes /></Router><Toaster /></QueryClientProvider></AuthProvider>;
}