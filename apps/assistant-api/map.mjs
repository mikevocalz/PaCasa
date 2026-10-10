import { validCoordinates } from './directions.mjs';

export async function serveStaticMap(req, res, apiKey, fetchMap = fetch) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  if (!apiKey || !url.searchParams.has('lat') || !url.searchParams.has('lng') ||
      !validCoordinates(lat, lng)) {
    res.writeHead(400, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ error: 'No hay mapa disponible.' }));
    return;
  }
  const params = new URLSearchParams({
    center: lat + ',' + lng, zoom: '14', size: '640x320', scale: '1',
    markers: 'color:blue|' + lat + ',' + lng, key: apiKey,
  });
  try {
    const result = await fetchMap('https://maps.googleapis.com/maps/api/staticmap?' + params, {
      signal: AbortSignal.timeout(7000),
    });
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
