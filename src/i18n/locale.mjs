/** Patient language follows the phone/browser unless the patient explicitly overrides it. */
export const SUPPORTED_LANGUAGES = Object.freeze(['en', 'es']);
export const LOCALE_PREFERENCE_KEY = 'pacasa.patientLanguage';

export function normalizeLanguage(value, fallback = 'es') {
  const primary = typeof value === 'string' ? value.trim().split(/[-_]/)[0].toLowerCase() : '';
  return SUPPORTED_LANGUAGES.includes(primary) ? primary : fallback;
}

export function detectDeviceLanguage(source = typeof navigator === 'undefined' ? null : navigator) {
  const first = source?.languages?.[0] || source?.language || '';
  return normalizeLanguage(first);
}

export function resolvePatientLanguage(preference, deviceLanguage) {
  return preference === 'auto'
    ? normalizeLanguage(deviceLanguage)
    : normalizeLanguage(preference);
}

export function speechLanguage(language) {
  return normalizeLanguage(language) === 'en' ? 'en-US' : 'es-MX';
}
