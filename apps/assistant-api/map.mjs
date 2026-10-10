import { validCoordinates } from './directions.mjs';

export async function serveStaticMap(req, res, keys = {}, fetchMap = fetch) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  if ((!keys.googleKey && !keys.mapboxToken) || !url.searchParams.has('lat') ||
      !url.searchParams.has('lng') || !validCoordinates(lat, lng)) {
    res.writeHead(400, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ error: 'No hay mapa disponible.' }));
    return;
  }
  // Google Static Maps when a server key exists; else the public Mapbox token.
  const imageUrl = keys.googleKey
    ? 'https://maps.googleapis.com/maps/api/staticmap?' + new URLSearchParams({
        center: lat + ',' + lng, zoom: '14', size: '640x320', scale: '1',
        markers: 'color:blue|' + lat + ',' + lng, key: keys.googleKey,
      })
    : 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/' +
      'pin-s+0058F8(' + lng + ',' + lat + ')/' + lng + ',' + lat + ',14,0/640x320@2x?' +
      new URLSearchParams({ access_token: keys.mapboxToken });
  try {
    const result = await fetchMap(imageUrl, { signal: AbortSignal.timeout(7000) });
    if (!result.ok || !result.headers.get('content-type')?.startsWith('image/')) throw new Error('map-unavailable');
    const bytes = Buffer.from(await result.arrayBuffer());
    if (bytes.length > 2 * 1024 * 1024) throw new Error('map-too-large');
    res.writeHead(200, {
      'Content-Type': result.headers.get('content-type'),
      'Content-Length': String(bytes.length),
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });
    res.end(bytes);
  } catch {
    res.writeHead(502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ error: 'El mapa no está disponible en este momento.' }));
  }
}
