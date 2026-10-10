'use client';
import { useMemo } from 'react';
import { ThreeCanvas, type ThreeSetup } from '@acme/ui/three';
import { Text, View } from '@acme/ui/tw';
import type { ChatOrbVisual } from './orb-scene';

const loadOrb = (): Promise<ThreeSetup<ChatOrbVisual>> =>
  import('./orb-scene').then((module) => module.createChatOrbScene);

export function ChatOrb({ busy }: { busy: boolean }) {
  const params = useMemo(() => ({ busy }), [busy]);
  return (
    <View className="mx-auto h-44 w-full max-w-sm overflow-hidden rounded-3xl bg-ink-950">
      <ThreeCanvas load={loadOrb} params={params} className="h-full w-full"
        accessibilityLabel={busy ? 'Pa’Casa está pensando' : 'Orbe animado de Pa’Casa'}
        tracksPointer={false} fallback={
          <View className="h-full items-center justify-center">
            <Text className="font-semibold text-royal-300">{busy ? 'Pa’Casa está pensando…' : 'Pa’Casa'}</Text>
          </View>
        } />
    </View>
  );
}
