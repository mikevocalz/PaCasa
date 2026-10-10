import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DEMO_ORGANIZATIONS } from '@/data/demoPortal';
import { clearDemoSession, readDemoSession, signInDemo as demoSignIn } from '@/lib/authGateway';

/**
 * Pa'Casa signs people in with the platform's own accounts (base44.auth), so the
 * portal needs no backend function of its own. The account record carries the two
 * portal fields — which door this is (patient/provider) and whether the clinic has
 * approved a provider — and the rest of the session comes from the platform.
 */
const AuthContext = createContext();

function toSession(user) {
  const accountType = user.accountType === 'provider' ? 'provider' : 'patient';
  const displayName = user.displayName || user.full_name || user.email;
  const clinic = DEMO_ORGANIZATIONS.find((org) => org.slug === user.organization);
  return {
    user: { id: user.id, email: user.email, name: displayName, role: user.role },
    profile: {
      id: user.id,
      accountType,
      status: user.accountStatus === 'pending' ? 'pending' : 'active',
      displayName,
      preferredLanguage: user.preferredLanguage ?? null,
    },
    organizations: accountType === 'provider' && clinic ? [clinic] : [],
  };
}

async function readBase44Session() {
  if (!(await base44.auth.isAuthenticated())) return null;
  return toSession(await base44.auth.me());
}

export const AuthProvider = ({ children }) => {
  const [portalSession, setPortalSession] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  /** The platform session first, then a demonstration session kept for this tab. */
  const refresh = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const next = (await readBase44Session()) ?? readDemoSession() ?? null;
      setPortalSession(next);
      return next;
    } catch (error) {
      setPortalSession(null);
      // 403: the account exists but has no access to this app yet.
      const status = error?.status ?? error?.statusCode;
      setAuthError(status === 403 ? { type: 'user_not_registered' } : null);
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const login = async ({ email, password }) => {
    setAuthError(null);
    await base44.auth.loginViaEmailPassword(email, password);
    const next = await readBase44Session();
    setPortalSession(next);
    return next;
  };

  const register = async ({ email, password }) => base44.auth.register({ email, password });

  const resendCode = async (email) => base44.auth.resendOtp(email);

  const verifyRegistration = async ({ email, otpCode, password, profile }) => {
    await base44.auth.verifyOtp({ email, otpCode });
    // Verification finishes the account; signing in now also stores the token.
    await base44.auth.loginViaEmailPassword(email, password);
    await base44.auth.updateMe({
      displayName: profile.name.trim(),
      accountType: profile.accountType,
      accountStatus: profile.accountType === 'provider' ? 'pending' : 'active',
      ...(profile.organization ? { organization: profile.organization } : {}),
    });
    const next = await readBase44Session();
    if (!next) throw new Error('Su cuenta se creó, pero no pudimos abrir la sesión. Intente iniciar sesión.');
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
    clearDemoSession();
    setPortalSession(null);
    if (await base44.auth.isAuthenticated()) await base44.auth.logout('/login');
    else window.location.assign('/login');
  };

  return (
    <AuthContext.Provider value={{
      user: portalSession?.user ?? null,
      profile: portalSession?.profile ?? null,
      organizations: portalSession?.organizations ?? [],
      isAuthenticated: Boolean(portalSession?.user),
      isLoadingAuth,
      authError,
      login,
      register,
      resendCode,
      verifyRegistration,
      loginDemo,
      logout,
      refresh,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};