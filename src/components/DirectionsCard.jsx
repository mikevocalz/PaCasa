import { useEffect, useState } from 'react';
import { Navigation } from 'lucide-react';

/**
 * The map card Preguntar shows for a "how do I get there" answer.
 *
 * The session only ever knows the clinic's NAME — never coordinates — so the
 * card resolves the name through Mapbox geocoding and shows the place the
 * geocoder actually found, with its resolved label, rather than trusting a
 * guessed location. Without a public token, or when the geocoder has no
 * answer, the route button still works: it falls back to a maps search for
 * the clinic's name and the card says so instead of drawing a broken map.
 */

/** The public `pk.` token a client bundle may hold; anything else is refused. */
const mapboxToken = () => {
  const token = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? '').trim();
  return token.startsWith('pk.') ? token : null;
};

export function DirectionsCard({ block }) {
  const [lookup, setLookup] = useState({ status: 'loading' });
  const token = mapboxToken();

  useEffect(() => {
    if (!token) {
      setLookup({ status: 'unavailable' });
      return;
    }
    let cancelled = false;
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(block.query)}.json?` +
        new URLSearchParams({ access_token: token, limit: '1', types: 'poi,address,place' }).toString(),
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled) return;
        const feature = body?.features?.[0];
        const center = feature?.center;
        if (typeof center?.[0] === 'number' && typeof center?.[1] === 'number') {
          setLookup({ status: 'found', placeName: feature.place_name ?? block.label, longitude: center[0], latitude: center[1] });
        } else {
          setLookup({ status: 'missing' });
        }
      })
      .catch(() => {
        if (!cancelled) setLookup({ status: 'unavailable' });
      });
    return () => {
      cancelled = true;
    };
  }, [block.query, block.label, token]);

  const found = lookup.status === 'found' ? lookup : null;
  const staticMapUrl =
    found && token
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
        `pin-s+0058F8(${found.longitude},${found.latitude})/` +
        `${found.longitude},${found.latitude},14,0/640x280@2x?access_token=${token}`
      : null;

  // No origin: the maps app routes from wherever the patient is standing.
  const directionsUrl = found
    ? `https://www.google.com/maps/dir/?api=1&destination=${found.latitude},${found.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(block.query)}`;

  return (
    <div className="space-y-3 border border-line bg-page p-4">
      <div className="flex items-center gap-2">
        <Navigation size={18} aria-hidden className="text-accent-soft" />
        <p className="text-sm font-semibold text-fg">{block.label}</p>
      </div>

      {found && staticMapUrl ? (
        <div className="space-y-2">
          <img
            src={staticMapUrl}
            alt={`Mapa de ${found.placeName}`}
            className="h-40 w-full border border-line object-cover"
            loading="lazy"
          />
          {/* The geocoder's own label, so the patient sees where the pin landed. */}
          <p className="text-sm text-fg-muted">En el mapa: {found.placeName}</p>
        </div>
      ) : null}

      {lookup.status === 'loading' ? (
        <p className="text-sm text-fg-muted">Buscando la clínica en el mapa…</p>
      ) : null}
      {lookup.status === 'missing' ? (
        <p className="text-sm text-fg-muted">
          No encontré el lugar en el mapa; el botón abre la búsqueda con el nombre de la clínica.
        </p>
      ) : null}
      {lookup.status === 'unavailable' ? (
        <p className="text-sm text-fg-muted">
          El mapa no está disponible aquí; el botón abre la búsqueda con el nombre de la clínica.
        </p>
      ) : null}

      <a
        href={directionsUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Cómo llegar a ${block.label}`}
        className="flex min-h-12 items-center justify-center gap-2 border border-royal-400 bg-accent px-6 text-base font-semibold text-silver-50 shadow-card hover:bg-royal-400 active:bg-royal-600"
      >
        <Navigation size={18} aria-hidden /> Cómo llegar
      </a>
    </div>
  );
}
