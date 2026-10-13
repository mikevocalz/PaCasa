'use client';

/**
 * The map card Preguntar shows for a "how do I get there" answer.
 *
 * The session only ever knows the clinic's NAME — never coordinates — so the
 * card resolves the name through Mapbox geocoding and shows the place the
 * geocoder actually found, with its resolved label, rather than trusting a
 * guessed location. Without a public token, or when the geocoder has no
 * answer, the route button still works: it falls back to a maps search for
 * the clinic's name and the card says so instead of drawing a broken map.
 *
 * Repo rules: per-instance lookup state lives in a vanilla store held in a
 * ref (`useInstanceStore`), never React useState; the fetch is an imperative
 * handle and stays inside an effect.
 */

import { useEffect } from 'react';
import { Link } from 'solito/link';
import { Image, useInstanceStore, useStore } from '@acme/ui';
import { Navigation } from '@acme/ui/icons';
import { Text, View } from '@acme/ui/tw';
import type { DirectionsBlock } from '../session/grounding';

/**
 * The public `pk.` token a client bundle may hold — `EXPO_PUBLIC_*` on
 * native, `NEXT_PUBLIC_*` on web. Both bundlers inline the value only when it
 * is read as a literal `process.env.NAME`, which is why it is read here and
 * nowhere else in the card. Anything that is not a public token is refused
 * rather than sent.
 */
function mapboxToken(): string | null {
  const token = (process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '').trim();
  return token.startsWith('pk.') ? token : null;
}

/** The geocoder's answer for this card's query. */
type Lookup =
  | { status: 'loading' }
  | { status: 'found'; placeName: string; longitude: number; latitude: number }
  /** The geocoder had no feature for this name — nothing to pin honestly. */
  | { status: 'missing' }
  /** No token or no network; the route button still opens a name search. */
  | { status: 'unavailable' };

interface DirectionsCardState {
  lookup: Lookup;
}

export function DirectionsCard({ block }: { block: DirectionsBlock }) {
  const store = useInstanceStore<DirectionsCardState>(() => ({ lookup: { status: 'loading' } }));
  const lookup = useStore(store, (state) => state.lookup);
  const token = mapboxToken();

  useEffect(() => {
    if (!token) {
      store.setState({ lookup: { status: 'unavailable' } });
      return;
    }
    let cancelled = false;
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(block.query)}.json?` +
        new URLSearchParams({ access_token: token, limit: '1', types: 'poi,address,place' }).toString(),
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { features?: { place_name?: string; center?: number[] }[] } | null) => {
        if (cancelled) return;
        const feature = body?.features?.[0];
        const center = feature?.center;
        if (typeof center?.[0] === 'number' && typeof center?.[1] === 'number') {
          store.setState({
            lookup: {
              status: 'found',
              placeName: feature?.place_name ?? block.label,
              longitude: center[0],
              latitude: center[1],
            },
          });
        } else {
          store.setState({ lookup: { status: 'missing' } });
        }
      })
      .catch(() => {
        if (!cancelled) store.setState({ lookup: { status: 'unavailable' } });
      });
    return () => {
      cancelled = true;
    };
  }, [block.label, block.query, store, token]);

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
    <View className="gap-3 rounded-soft border border-border bg-surface p-4">
      <View className="flex-row items-center gap-2">
        <Navigation size={18} className="text-accent" />
        <Text className="text-sm font-semibold text-text">{block.label}</Text>
      </View>

      {found && staticMapUrl ? (
        <View className="gap-2">
          <View className="h-40 w-full overflow-hidden rounded-soft border border-border">
            <Image src={staticMapUrl} alt={`Mapa de ${found.placeName}`} framed={false} />
          </View>
          {/* The geocoder's own label, so the patient sees where the pin landed. */}
          <Text className="text-sm text-text-muted">En el mapa: {found.placeName}</Text>
        </View>
      ) : null}

      {lookup.status === 'loading' ? (
        <Text className="text-sm text-text-muted">Buscando la clínica en el mapa…</Text>
      ) : null}
      {lookup.status === 'missing' ? (
        <Text className="text-sm text-text-muted">
          No encontré el lugar en el mapa; el botón abre la búsqueda con el nombre de la clínica.
        </Text>
      ) : null}
      {lookup.status === 'unavailable' ? (
        <Text className="text-sm text-text-muted">
          El mapa no está disponible aquí; el botón abre la búsqueda con el nombre de la clínica.
        </Text>
      ) : null}

      <Link href={directionsUrl} aria-label={`Cómo llegar a ${block.label}`}>
        <View className="min-h-12 flex-row items-center justify-center gap-2 rounded-soft border border-transparent bg-cta px-6">
          <Navigation size={18} className="text-on-cta" />
          <Text className="text-base font-semibold text-on-cta">Cómo llegar</Text>
        </View>
      </Link>
    </View>
  );
}
