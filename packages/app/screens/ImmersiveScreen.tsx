'use client';

import { ForkSpatialLayout, getSpatialForkCapabilities, SpatialViroExperience } from '@acme/spatial';
import { useLayoutSize } from '@acme/ui';
import { Text, View } from '@acme/ui/tw';
import { useOrbitStore } from '../state';
import { ActionButton, Panel, ScreenFrame } from './parts';

export interface ImmersiveScreenProps {
  enterImmersive?: () => Promise<boolean>;
}

export function ImmersiveScreen({ enterImmersive }: ImmersiveScreenProps = {}) {
  const { size, onLayout } = useLayoutSize();
  const split = size.width >= 720;
  const { open, setOpen } = useOrbitStore();
  const host = getSpatialForkCapabilities();
  const controls = (
    <Panel label="Orbit Lab">
      <ActionButton
        label={open ? 'Close Orbit Lab' : 'Open Orbit Lab'}
        onPress={async () => {
          if (!open && enterImmersive && (await enterImmersive())) return;
          setOpen(!open);
        }}
      />
      <Text className="text-sm leading-6 text-text-muted">
        {host.metaSpatialWindows ? 'Tools are hosted beside the main spatial stage.' : 'Tools stay inline until a spatial window host is available.'}
      </Text>
    </Panel>
  );
  const stage = (
    <View role="region" aria-label="Orbit stage" style={{ aspectRatio: 1 }} className="relative w-full overflow-hidden border border-ink-700 bg-ink-900/90 shadow-raised">
      <View className="absolute inset-0">
      {open ? (
        <SpatialViroExperience onExit={() => setOpen(false)} />
      ) : (
        <View className="relative flex-1 items-center justify-center gap-4 p-4">
          <View aria-hidden style={{ width: '80%', aspectRatio: 1 }} className="absolute rounded-full border border-royal-500/20" />
          <View aria-hidden style={{ width: '55%', aspectRatio: 1 }} className="absolute rounded-full border border-carolina-400/30" />
          <View aria-hidden className="h-16 w-16 items-center justify-center border border-royal-300 bg-royal-500/20 shadow-glow-royal">
            <View className="h-8 w-8 bg-royal-400" />
          </View>
          <View className="max-w-md gap-2 bg-ink-950/80 p-3">
            <Text className="text-center font-display text-lg text-text">Orbit stage ready</Text>
            <Text className="text-center text-sm leading-6 text-text-muted">Open Orbit Lab to place the interactive material study in three-dimensional space.</Text>
          </View>
        </View>
      )}
      </View>
    </View>
  );

  return (
    <ScreenFrame title="Immersive Workspace" purpose="One object on an orbit. Tap or click it to change its material.">
      {host.metaSpatialWindows ? (
        <ForkSpatialLayout panel={controls}>{stage}</ForkSpatialLayout>
      ) : (
        <View onLayout={onLayout} className="gap-4" style={{ flexDirection: split ? 'row' : 'column', alignItems: split ? 'flex-start' : 'stretch' }}>
          <View style={{ width: split ? 256 : '100%' }}>{controls}</View>
          <View style={{ width: split ? size.width - 272 : '100%' }}>{stage}</View>
        </View>
      )}
    </ScreenFrame>
  );
}
