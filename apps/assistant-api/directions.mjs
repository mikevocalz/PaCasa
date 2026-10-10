const DIRECTIONS = /(?:directions?\s+to|route\s+to|how\s+(?:do\s+i\s+)?get\s+to|cómo\s+llegar\s+a|como\s+llegar\s+a|ruta\s+(?:para|a)|llévame\s+a|llevame\s+a)\s+(.{3,120})/i;

export function destinationFromRequest(text) {
  if (typeof text !== 'string' || text.length > 2000) return null;
  const match = DIRECTIONS.exec(text);
  if (!match) return null;
  const result = match[1].replace(/[.!?]+$/, '').trim();
  return result.length >= 3 && result.length <= 120 ? result : null;
}

export function validCoordinates(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

export async function resolveDirectionPlace(text, key, request = fetch) {
  const destination = destinationFromRequest(text);
  if (!destination || !key) return null;
  const response = await request('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify({ textQuery: destination, maxResultCount: 1 }),
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) return null;
  const place = (await response.json())?.places?.[0];
  const lat = place?.location?.latitude;
  const lng = place?.location?.longitude;
  const name = place?.displayName?.text;
  const address = place?.formattedAddress;
  if (typeof name !== 'string' || name.length > 140 ||
      typeof address !== 'string' || address.length > 250 ||
      !validCoordinates(lat, lng)) return null;
  return { name, address, latitude: lat, longitude: lng };
}

/** Preserve exact coordinates; never accept model-generated URLs. */
export function makeDirectionsOpenUI(reply, place) {
  if (!place || !validCoordinates(place.latitude, place.longitude)) return null;
  return [
    'root = PaCasaResponse([paragraph, directions])',
    'paragraph = PaCasaText(' + JSON.stringify(reply) + ')',
    'directions = DirectionsMap(' + [
      place.name, place.address, place.latitude, place.longitude,
    ].map(JSON.stringify).join(', ') + ')',
  ].join('\n');
}
