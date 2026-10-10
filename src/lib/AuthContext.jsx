import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getPortalSession,
  hasRemoteAuth,
  signInDemo as demoSignIn,
  signInEmail,
  signOut as gatewaySignOut,
  signUpEmail,
} from '@/lib/authGateway';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [portalSession, setPortalSession] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const refresh = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const next = await getPortalSession();
      setPortalSession(next);
      return next;
    } catch (error) {
      setPortalSession(null);
      setAuthError({ type: 'backend_error', message: error instanceof Error ? error.message : 'No se pudo conectar.' });
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const login = async (credentials) => {
    setAuthError(null);
    const next = await signInEmail(credentials);
    setPortalSession(next);
    return next;
  };

  const signup = async (registration) => {
    setAuthError(null);
    const next = await signUpEmail(registration);
    setPortalSession(next);
    return next;
  };

  const loginDemo = async (role) => {
    setAuthError(null);
    const next = await demoSignIn(role);
    setPortalSession(next);
    return next;
  };

  const logout = async () => {
    await gatewaySignOut();
    setPortalSession(null);
  };

  const value = useMemo(() => ({
    user: portalSession?.user ?? null,
    profile: portalSession?.profile ?? null,
    organizations: portalSession?.organizations ?? [],
    isAuthenticated: Boolean(portalSession?.user),
    isLoadingAuth,
    authError,
    remoteAuthConfigured: hasRemoteAuth(),
    login,
    signup,
    loginDemo,
    logout,
    refresh,
  }), [portalSession, isLoadingAuth, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
