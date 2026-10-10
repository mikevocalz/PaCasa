import { useSyncExternalStore } from 'react';
import { detectDeviceLanguage, LOCALE_PREFERENCE_KEY, resolvePatientLanguage } from './locale.mjs';
import { translation } from './strings.mjs';

function storedPreference() {
  if (typeof localStorage === 'undefined') return 'auto';
  try {
    const value = localStorage.getItem(LOCALE_PREFERENCE_KEY);
    return value === 'en' || value === 'es' ? value : 'auto';
  } catch {
    return 'auto';
  }
}

let snapshot = { preference: storedPreference(), deviceLanguage: detectDeviceLanguage() };
const subscribers = new Set();
const subscribe = (notify) => {
  subscribers.add(notify);
  return () => subscribers.delete(notify);
};
const getSnapshot = () => snapshot;
const notify = (next) => {
  if (snapshot.preference === next.preference && snapshot.deviceLanguage === next.deviceLanguage) return;
  snapshot = next;
  subscribers.forEach((callback) => callback());
};

export function setLanguagePreference(value) {
  const preference = value === 'en' || value === 'es' ? value : 'auto';
  if (typeof localStorage !== 'undefined') {
    try {
      if (preference === 'auto') localStorage.removeItem(LOCALE_PREFERENCE_KEY);
      else localStorage.setItem(LOCALE_PREFERENCE_KEY, preference);
    } catch {
      // Private-browsing storage errors do not prevent a session override.
    }
  }
  notify({ ...snapshot, preference });
}
export function refreshDeviceLanguage() {
  notify({ ...snapshot, deviceLanguage: detectDeviceLanguage() });
}
export function useLocale() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const language = resolvePatientLanguage(state.preference, state.deviceLanguage);
  return {
    ...state,
    language,
    setPreference: setLanguagePreference,
    t: (key) => translation(key, language),
  };
}
