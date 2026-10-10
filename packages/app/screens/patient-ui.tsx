'use client';

// TEMPORARY STUB for lane verification only — the real shared primitives are
// owned by another lane and will replace this file. Do not ship.
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from '@acme/ui/tw';
import { formProgress, type PatientForm } from '../session/patient';

export function PatientFrame({ question, title, lead, children }: { question: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <ScrollView className="flex-1 bg-ink-950" contentContainerClassName="mx-auto w-full max-w-4xl gap-8 px-4 py-6 md:px-6 md:py-10">
      <View className="gap-3 border-b border-ink-800 pb-6">
        <Text className="text-xs font-semibold uppercase tracking-[0.24em] text-royal-300">{question}</Text>
        <Text role="heading" aria-level={1} className="font-display text-3xl leading-tight text-silver-50 md:text-5xl">{title}</Text>
        {lead ? <Text className="max-w-2xl text-base leading-7 text-silver-300 md:text-lg">{lead}</Text> : null}
      </View>
      {children}
    </ScrollView>
  );
}

export function PatientPanel({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <View role="region" aria-label={label} className={`overflow-hidden border border-ink-700 bg-ink-900/90 shadow-card ${className}`}>
      <View className="flex-row items-center gap-3 border-b border-ink-800 px-5 py-3.5">
        <View aria-hidden className="h-2 w-2 bg-royal-400" />
        <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-silver-300">{label}</Text>
      </View>
      <View className="gap-5 p-5 md:p-6">{children}</View>
    </View>
  );
}

export function PatientButton({ label, onPress, tone = 'solid', disabled }: { label: string; onPress: () => void; tone?: 'solid' | 'quiet'; disabled?: boolean }) {
  return (
    <Pressable role="button" aria-label={label} aria-disabled={disabled} disabled={disabled} onPress={onPress}
      className={`min-h-12 items-center justify-center border px-6 shadow-card ${tone === 'solid' ? 'border-royal-400 bg-royal-500' : 'border-ink-600 bg-ink-900'} ${disabled ? 'opacity-40' : ''}`}>
      <Text className={`text-sm font-semibold uppercase tracking-[0.12em] ${tone === 'solid' ? 'text-silver-50' : 'text-silver-200'}`}>{label}</Text>
    </Pressable>
  );
}

export function PatientBigAction({ label, hint, tone = 'solid', disabled, disabledHint, onPress }: { label: string; hint?: string; tone?: 'solid' | 'quiet'; disabled?: boolean; disabledHint?: string; onPress: () => void }) {
  return (
    <Pressable role="button" aria-label={label} aria-disabled={disabled} disabled={disabled} onPress={onPress}
      className={`min-h-24 w-full items-center justify-center gap-2 border px-6 py-6 shadow-card ${disabled ? 'border-ink-700 bg-ink-900' : tone === 'solid' ? 'border-royal-400 bg-royal-500' : 'border-ink-600 bg-ink-900'}`}>
      <Text className="font-display text-lg leading-tight text-silver-50">{label}</Text>
      {hint && !disabled ? <Text className="text-sm text-silver-300">{hint}</Text> : null}
      {disabled && disabledHint ? <Text className="text-sm text-silver-500">{disabledHint}</Text> : null}
    </Pressable>
  );
}

export function ProgressRow({ form }: { form: PatientForm }) {
  const { done, total } = formProgress(form);
  return (
    <View className="w-full gap-2">
      <Text className="text-sm font-semibold text-silver-300">{done} de {total} preguntas completas</Text>
      <View role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={`Progreso del formulario: ${done} de ${total}`} className="flex-row gap-1">
        {form.answers.map((item) => (
          <View key={item.id} className={`h-2 flex-1 ${item.confirmed && item.value.trim() ? 'bg-royal-400' : 'bg-ink-700'}`} />
        ))}
      </View>
    </View>
  );
}
