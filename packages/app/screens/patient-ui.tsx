'use client';

/**
 * Shared patient primitives: the daylit visual language of the Pa'Casa
 * workflows. Semantic tokens only — no palette names — so every screen
 * follows the scheme. Titles stay sentence case, controls stay at or above
 * the 48px minimum target, and nothing here forces uppercase tracking.
 */

import type { ComponentType, ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from '@acme/ui/tw';
import { formProgress, type PatientForm } from '../session/patient';

export type PatientIcon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

/**
 * The frame every patient screen sits in: the question it answers, then the
 * answer. A centred max-w-4xl cap when wide, full width when compact — no
 * decorative blobs, just the content.
 */
export function PatientFrame({
  question,
  title,
  lead,
  children,
}: {
  question: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="mx-auto w-full max-w-4xl gap-8 px-4 py-6 md:px-6 md:py-10"
    >
      <View className="gap-3 border-b border-border pb-6">
        <Text className="text-sm font-semibold text-accent">{question}</Text>
        <Text role="heading" aria-level={1} className="font-display text-3xl leading-tight text-text md:text-5xl">
          {title}
        </Text>
        {lead ? <Text className="max-w-2xl text-base leading-7 text-text-muted md:text-lg md:leading-8">{lead}</Text> : null}
      </View>
      {children}
    </ScrollView>
  );
}

/** One labelled region: a soft, rounded daylit card. */
export function PatientPanel({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View role="region" aria-label={label} className={`overflow-hidden rounded-soft border border-border bg-surface-raised ${className}`}>
      <View className="flex-row items-center gap-3 border-b border-border px-5 py-4">
        <View aria-hidden className="h-2 w-2 rounded-full bg-accent" />
        <Text className="text-sm font-semibold text-text-muted">{label}</Text>
      </View>
      <View className="gap-5 p-5 md:p-6">{children}</View>
    </View>
  );
}

/** A 48px-minimum button with sentence-case labels and a visible focus ring. */
export function PatientButton({
  label,
  onPress,
  tone = 'solid',
  disabled = false,
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
          ? 'border-transparent bg-cta hover:bg-cta-pressed active:bg-cta-pressed'
          : 'border-border bg-surface-raised hover:bg-surface-sunken active:bg-surface-sunken'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className={`text-base font-semibold ${tone === 'solid' ? 'text-on-cta' : 'text-text'}`}>{label}</Text>
    </Pressable>
  );
}

/** The very large primary actions Inicio and Pa'Casa Live open on (96px-friendly). */
export function PatientBigAction({
  icon: Icon,
  label,
  hint,
  tone = 'solid',
  disabled = false,
  disabledHint,
  onPress,
}: {
  icon: PatientIcon;
  label: string;
  hint?: string;
  tone?: 'solid' | 'quiet';
  disabled?: boolean;
  disabledHint?: string;
  onPress: () => void;
}) {
  const face = disabled
    ? 'border-border bg-surface-sunken'
    : tone === 'solid'
      ? 'border-transparent bg-cta hover:bg-cta-pressed active:bg-cta-pressed'
      : 'border-border bg-surface-raised hover:bg-surface-sunken active:bg-surface-sunken';
  const ink = disabled ? 'text-text-muted' : tone === 'solid' ? 'text-on-cta' : 'text-text';
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-24 w-full flex-col items-center justify-center gap-2 rounded-soft border px-6 py-6 transition-colors focus-visible:outline-2 focus-visible:outline-focus ${face} ${disabled ? 'opacity-70' : ''}`}
    >
      <Icon size={30} strokeWidth={2} className={ink} />
      <Text className={`font-display text-lg leading-tight md:text-xl ${ink}`}>{label}</Text>
      {hint && !disabled ? <Text className={`text-sm ${ink} opacity-80`}>{hint}</Text> : null}
      {disabled && disabledHint ? <Text className="text-sm text-text-muted">{disabledHint}</Text> : null}
    </Pressable>
  );
}

/** "5 de 8 preguntas completas", counted and drawn with progressbar semantics. */
export function ProgressRow({ form }: { form: PatientForm }) {
  const { done, total } = formProgress(form);
  return (
    <View className="w-full gap-2">
      <Text className="text-base font-semibold text-text-muted">
        {done} de {total} preguntas completas
      </Text>
      <View
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label={`Progreso del formulario: ${done} de ${total} preguntas completas`}
        className="flex-row gap-1"
      >
        {form.answers.map((item) => (
          <View
            key={item.id}
            className={`h-2 flex-1 rounded-full ${item.confirmed && item.value.trim() ? 'bg-accent' : 'bg-border'}`}
          />
        ))}
      </View>
    </View>
  );
}
