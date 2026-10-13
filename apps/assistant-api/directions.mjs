const DIRECTIONS = /(?:directions?\s+to|route\s+to|how\s+(?:do\s+i\s+)?get\s+to|where(?:'s|\s+is|\s+are|\s+was|\s+were)|cómo\s+llegar\s+a|como\s+llegar\s+a|dónde\s+(?:está|estan|queda|quedan|se\s+encuentra)|donde\s+(?:está|estan|queda|quedan|se\s+encuentra)|ruta\s+(?:para|a)|llévame\s+a|llevame\s+a)\s+(.{3,120})/i;

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

async function googlePlace(destination, key, request) {
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
  return {
    name: place?.displayName?.text,
    address: place?.formattedAddress,
    latitude: place?.location?.latitude,
    longitude: place?.location?.longitude,
  };
}

async function mapboxPlace(destination, token, request) {
  // Search Box (suggest → retrieve): the forward-geocoder index lacks real
  // POIs like hospitals, so a single geocode call is not enough here.
  const session = crypto.randomUUID();
  const suggestRes = await request(
    'https://api.mapbox.com/search/searchbox/v1/suggest?' +
    new URLSearchParams({ q: destination, access_token: token, limit: '3', country: 'us', session_token: session }),
    { signal: AbortSignal.timeout(6000) });
  if (!suggestRes.ok) return null;
  const suggestion = (await suggestRes.json())?.suggestions?.[0];
  const mapboxId = suggestion?.mapbox_id;
  if (typeof mapboxId !== 'string' || !mapboxId) return null;
  const retrieveRes = await request(
    'https://api.mapbox.com/search/searchbox/v1/retrieve/' + encodeURIComponent(mapboxId) + '?' +
    new URLSearchParams({ access_token: token, session_token: session }),
    { signal: AbortSignal.timeout(6000) });
  if (!retrieveRes.ok) return null;
  const feature = (await retrieveRes.json())?.features?.[0];
  const center = feature?.geometry?.coordinates;
  const props = feature?.properties ?? {};
  return {
    name: props.name ?? suggestion.name,
    address: props.full_address ?? props.place_formatted ??
      suggestion.full_address ?? suggestion.place_formatted,
    latitude: center?.[1],
    longitude: center?.[0],
  };
}

/**
 * Verified geocoding only: Google Places when a server key exists, else the
 * public Mapbox token (pk.* — designed for client exposure). Model text never
 * produces coordinates.
 */
export async function resolveDirectionPlace(text, keys = {}, request = fetch) {
  const destination = destinationFromRequest(text);
  if (!destination) return null;
  let place = null;
  try {
    if (keys.googleKey) place = await googlePlace(destination, keys.googleKey, request);
    else if (keys.mapboxToken) place = await mapboxPlace(destination, keys.mapboxToken, request);
  } catch {
    return null;
  }
  if (!place) return null;
  const { name, address, latitude, longitude } = place;
  if (typeof name !== 'string' || name.length > 140 ||
      typeof address !== 'string' || address.length > 250 ||
      !validCoordinates(latitude, longitude)) return null;
  return { name, address, latitude, longitude };
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
