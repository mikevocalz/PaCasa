'use client';

import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from '@acme/ui/tw';

/**
 * Legacy screen chrome for the remaining starter surfaces, now on the same
 * daylit semantic tokens as the patient workflows. Patient-facing screens use
 * the primitives in ./patient-ui; these stay exported under their existing
 * names so the other routes keep their API.
 */
export function ScreenFrame({ title, purpose, children }: { title: string; purpose: string; children: ReactNode }) {
  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="mx-auto w-full max-w-4xl gap-8 px-4 py-7 md:px-6 md:py-10"
    >
      <View className="gap-5 border-b border-border pb-7 md:items-start">
        <View className="min-w-0 max-w-3xl flex-1 gap-3">
          <Text className="text-sm font-semibold text-accent">Pa&apos;Casa</Text>
          <Text role="heading" aria-level={1} className="font-display text-4xl leading-tight text-text md:text-6xl">
            {title}
          </Text>
          <Text className="max-w-2xl text-base leading-7 text-text-muted md:text-lg md:leading-8">{purpose}</Text>
        </View>
      </View>
      {children}
    </ScrollView>
  );
}

export function Panel({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <View role="region" aria-label={label} className={`overflow-hidden rounded-soft border border-border bg-surface-raised ${className}`}>
      <View className="flex-row items-center gap-3 border-b border-border px-5 py-4">
        <View aria-hidden className="h-2 w-2 rounded-full bg-accent" />
        <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</Text>
      </View>
      <View className="gap-5 p-5 md:p-6">{children}</View>
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  tone = 'solid',
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: 'solid' | 'quiet';
  disabled?: boolean;
}) {
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-12 items-center justify-center rounded-soft border px-6 transition-colors focus-visible:outline-2 focus-visible:outline-focus ${
        tone === 'solid'
          ? 'border-transparent bg-accent active:bg-accent-pressed hover:bg-accent-pressed'
          : 'border-border bg-surface-raised active:bg-surface-sunken hover:bg-surface-sunken'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className={`text-sm font-semibold ${tone === 'solid' ? 'text-on-accent' : 'text-text'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
