import { create } from 'zustand';

/**
 * Patient display language for the workspace app. Mirrors src/i18n in the
 * Vite/Base44 surface: 'auto' follows the device, an explicit pick wins.
 * Persisted in localStorage on web only; native keeps the session choice.
 */
export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type PatientLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type LanguagePreference = 'auto' | PatientLanguage;

const PREFERENCE_KEY = 'pacasa.patientLanguage';

export function normalizeLanguage(value: unknown, fallback: PatientLanguage = 'es'): PatientLanguage {
  const primary = typeof value === 'string' ? (value.trim().split(/[-_]/)[0] ?? '').toLowerCase() : '';
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(primary) ? (primary as PatientLanguage) : fallback;
}

export function detectDeviceLanguage(): PatientLanguage {
  try {
    const nav = typeof navigator === 'undefined' ? null : navigator;
    const fromNavigator = nav?.languages?.[0] ?? nav?.language;
    if (fromNavigator) return normalizeLanguage(fromNavigator);
    return normalizeLanguage(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return 'es';
  }
}

function storedPreference(): LanguagePreference {
  try {
    const value = typeof localStorage === 'undefined' ? null : localStorage.getItem(PREFERENCE_KEY);
    return value === 'en' || value === 'es' ? value : 'auto';
  } catch {
    return 'auto';
  }
}

function persistPreference(preference: LanguagePreference) {
  try {
    if (typeof localStorage === 'undefined') return;
    if (preference === 'auto') localStorage.removeItem(PREFERENCE_KEY);
    else localStorage.setItem(PREFERENCE_KEY, preference);
  } catch {
    // Private-browsing storage errors do not prevent a session override.
  }
}

export function resolvePatientLanguage(preference: LanguagePreference, deviceLanguage: PatientLanguage): PatientLanguage {
  return preference === 'auto' ? deviceLanguage : normalizeLanguage(preference);
}

export const usePatientLanguage = create<{
  preference: LanguagePreference;
  deviceLanguage: PatientLanguage;
  setPreference: (preference: LanguagePreference) => void;
}>((set) => ({
  // 'auto' + 'es' keeps SSR and the first client render identical; the real
  // preference/device values are applied by hydrateLanguage() after mount.
  preference: 'auto',
  deviceLanguage: 'es',
  setPreference: (preference) => {
    persistPreference(preference);
    set({ preference });
  },
}));

/** Called once on mount (AppShell). Reads stored preference + device locale. */
export function hydrateLanguage() {
  usePatientLanguage.setState({
    preference: storedPreference(),
    deviceLanguage: detectDeviceLanguage(),
  });
}

export function useLanguage(): PatientLanguage {
  return usePatientLanguage((s) => resolvePatientLanguage(s.preference, s.deviceLanguage));
}
