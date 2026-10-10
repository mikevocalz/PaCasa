import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destinationFromRequest, validCoordinates, resolveDirectionPlace, makeDirectionsOpenUI } from '../directions.mjs';

test('English and Spanish route intent requires a destination', () => {
  assert.equal(destinationFromRequest('Give me directions to Mount Sinai Hospital'), 'Mount Sinai Hospital');
  assert.equal(destinationFromRequest('¿Cómo llegar a Central Park?'), 'Central Park');
  assert.equal(destinationFromRequest('What is diabetes?'), null);
  assert.equal(destinationFromRequest('directions to A'), null);
});

test('coordinates are validated, never guessed from a model response', () => {
  assert.equal(validCoordinates(40.8, -73.9), true);
  assert.equal(validCoordinates(999, -73.9), false);
  assert.equal(validCoordinates(NaN, -73.9), false);
});

test('Google Places lookup verifies one real geocoded result', async () => {
  const place = await resolveDirectionPlace('directions to Mount Sinai', 'test-key', async (url, init) => {
    assert.match(url, /places:searchText/);
    assert.match(init.headers['X-Goog-FieldMask'], /places.location/);
    return { ok: true, async json() { return { places: [{
      displayName: { text: 'Mount Sinai' }, formattedAddress: 'New York, NY',
      location: { latitude: 40.791, longitude: -73.953 },
    }] }; } };
  });
  assert.equal(place?.name, 'Mount Sinai');
  assert.match(makeDirectionsOpenUI('Aquí está', place), /DirectionsMap/);
  assert.equal(makeDirectionsOpenUI('hi', { ...place, latitude: 999 }), null);
});
