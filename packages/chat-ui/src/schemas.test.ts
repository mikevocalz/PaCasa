import assert from 'node:assert/strict';
import { test } from 'node:test';
import { descriptions, paCasaSchemas, safePaCasaProgram } from './schemas.ts';

const example = [
  'root = PaCasaResponse([intro, translation])',
  'intro = PaCasaText("Aquí está la pregunta.")',
  'translation = TranslationPair("Date of birth", "Fecha de nacimiento", "en", "es")',
].join('\n');

test('accepts a bounded stateless root-first OpenUI program', () => {
  assert.equal(safePaCasaProgram(example), true);
});

test('rejects tool, mutation, URL, and state execution from model output', () => {
  for (const token of ['@OpenUrl', '@ToAssistant', 'Query(', 'Mutation(', '$variable', 'https://', 'javascript:']) {
    assert.equal(safePaCasaProgram(example + '\nextra = ' + token), false, token);
  }
  assert.equal(safePaCasaProgram('root = ArbitraryComponent([])'), false);
  assert.equal(safePaCasaProgram('root = PaCasaResponse([])' + 'a'.repeat(12000)), false);
});

test('all assistant domains have model descriptions and strict schemas', () => {
  assert.deepEqual(Object.keys(descriptions), ['PaCasaText', 'TranslationPair', 'FormFieldReview', 'FollowUpSuggestion', 'PaCasaResponse']);
  assert.equal(paCasaSchemas.translation.safeParse({
    original: 'Hello', translated: 'Hola', source: 'en', target: 'es',
  }).success, true);
  assert.equal(paCasaSchemas.translation.safeParse({
    original: 'Hello', translated: '', source: 'en', target: 'xx',
  }).success, false);
});
