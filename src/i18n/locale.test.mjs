import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLanguage, detectDeviceLanguage, resolvePatientLanguage, speechLanguage } from './locale.mjs';
import { translation } from './strings.mjs';

test('phone locale, region subtags, and safe unsupported language fallback', () => {
  assert.equal(detectDeviceLanguage({ languages: ['es-MX', 'en-US'] }), 'es');
  assert.equal(detectDeviceLanguage({ language: 'en-GB' }), 'en');
  assert.equal(detectDeviceLanguage({ languages: ['fr-FR', 'es-ES'] }), 'es');
  assert.equal(normalizeLanguage('ES_us'), 'es');
});
test('auto selects the patient device, overrides are explicit, provider is independent', () => {
  assert.equal(resolvePatientLanguage('auto', 'es'), 'es');
  assert.equal(resolvePatientLanguage('en', 'es'), 'en');
  assert.equal(resolvePatientLanguage('es', 'en'), 'es');
  assert.equal(speechLanguage('en'), 'en-US');
  assert.equal(speechLanguage('es-MX'), 'es-MX');
});
test('both locales have navigation and translator copy', () => {
  for (const lang of ['en', 'es']) {
    for (const key of ['nav.home', 'nav.forms', 'nav.documents', 'nav.review', 'translate.notice', 'translate.unavailable']) {
      assert.notEqual(translation(key, lang), key);
    }
  }
});
