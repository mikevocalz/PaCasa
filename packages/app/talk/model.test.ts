import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  boundedUtterance, spokenLanguageForSpeaker, spokenTranslationLocale,
  speechLocaleForSpeaker, talkPhaseLabel,
} from './model.ts';

test('doctor English is always translated to Spanish, reverse for the patient', () => {
  assert.equal(spokenLanguageForSpeaker('doctor'), 'en');
  assert.equal(speechLocaleForSpeaker('doctor'), 'en-US');
  assert.equal(spokenTranslationLocale('doctor'), 'es-ES');
  assert.equal(spokenLanguageForSpeaker('patient'), 'es');
  assert.equal(speechLocaleForSpeaker('patient'), 'es-US');
  assert.equal(spokenTranslationLocale('patient'), 'en-US');
});

test('bounded utterances avoid empty, huge, or accidental history payloads', () => {
  assert.equal(boundedUtterance('Hola  '), 'Hola');
  assert.equal(boundedUtterance('   '), null);
  assert.equal(boundedUtterance('z'.repeat(2001)), null);
  assert.equal(talkPhaseLabel('speaking'), 'Reproduciendo traducción…');
});
