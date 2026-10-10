import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

/**
 * Pa'Casa is a public app: a patient walks up and starts. An unsigned-in
 * visitor is simply "not authenticated", never an error, so the tab screens
 * render either way. Only a real failure to reach the backend is surfaced.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = await base44.auth.me();
        if (!cancelled && current) setUser(current);
      } catch (error) {
        // No session is the normal case for a public app: an unsigned-in
        // visitor is simply anonymous, never an error. Only a signed-in email
        // the app does not know about is surfaced.
        const status = error?.status ?? error?.response?.status;
        if (!cancelled && status === 403) {
          setAuthError({ type: 'user_not_registered', message: error.message });
        }
      } finally {
        if (!cancelled) setIsLoadingAuth(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  const logout = async () => {
    await base44.auth.logout();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: Boolean(user),
        isLoadingAuth,
        authError,
        navigateToLogin,
        logout,
      }}
    >
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