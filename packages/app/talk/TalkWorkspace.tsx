'use client';

import { Pressable, Text, TextInput, View } from '@acme/ui/tw';
import { Mic, MicOff, Play, Square, Volume2 } from '@acme/ui/icons';
import { talkPhaseLabel } from './model';
import { TalkOrb } from './TalkOrb';
import { useTalkSession, talkEndpointAvailable } from './useTalkSession';

/** One explicitly consented phrase at a time. All audio/network ownership lives in useTalkSession. */
export function TalkWorkspace({ active }: { active: boolean }) {
  const { state, listenTo, stopListening, repeat, translate, toggleMuted, toggleConsent, cancel } = useTalkSession(active);
  const busy = state.phase === 'translating';
  const listening = state.phase === 'listening';
  return (
    <View className="gap-4">
      <View className="gap-2 rounded-soft border border-border bg-surface-raised p-5">
        <Text role="heading" aria-level={2} className="font-display text-2xl text-text">
          Interpretación inglés ↔ español
        </Text>
        <Text className="text-base leading-7 text-text-muted">
          Toca quién va a hablar. Verás la traducción de cada frase y Pa’Casa la dirá en voz alta.
          Termina la frase antes de cambiar de persona.
        </Text>
      </View>
      <TalkOrb phase={state.phase} />
      <View className="items-center gap-1">
        <Text role="status" aria-live="polite" className="text-lg font-semibold text-accent">
          {talkPhaseLabel(state.phase)}
        </Text>
        {state.partial ? <Text className="text-center text-base leading-6 text-text">{state.partial}</Text> : null}
      </View>
      <View className="flex-row flex-wrap gap-3">
        <Pressable role="button" disabled={!active || busy || listening} onPress={() => { void listenTo('doctor'); }}
          accessibilityLabel="Escuchar al médico en inglés y traducir al español"
          className="min-h-28 min-w-32 flex-1 items-center justify-center gap-2 rounded-soft border-2 border-accent bg-surface-raised p-3 disabled:opacity-40">
          <Mic size={28} className="text-accent" />
          <Text className="text-center text-lg font-semibold text-text">Médico</Text>
          <Text className="text-center text-sm text-text-muted">English → Español</Text>
        </Pressable>
        <Pressable role="button" disabled={!active || busy || listening} onPress={() => { void listenTo('patient'); }}
          accessibilityLabel="Escuchar al paciente en español y traducir al inglés"
          className="min-h-28 min-w-32 flex-1 items-center justify-center gap-2 rounded-soft border-2 border-accent bg-surface-raised p-3 disabled:opacity-40">
          <Mic size={28} className="text-accent" />
          <Text className="text-center text-lg font-semibold text-text">Paciente</Text>
          <Text className="text-center text-sm text-text-muted">Español → English</Text>
        </Pressable>
      </View>
      <View className="flex-row flex-wrap gap-3">
        <Pressable role="button" disabled={!listening} onPress={stopListening}
          className="min-h-12 min-w-24 flex-1 flex-row items-center justify-center gap-2 rounded-soft border border-border bg-surface-raised disabled:opacity-50">
          <Square size={17} className="text-text" />
          <Text className="font-semibold text-text">Terminar frase</Text>
        </Pressable>
        <Pressable role="button" disabled={state.turns.length === 0 || !active || busy || listening} onPress={() => { void repeat(); }}
          className="min-h-12 min-w-24 flex-1 flex-row items-center justify-center gap-2 rounded-soft border border-border bg-surface-raised disabled:opacity-50">
          <Play size={18} className="text-text" />
          <Text className="font-semibold text-text">Repetir</Text>
        </Pressable>
        <Pressable role="button" onPress={toggleMuted}
          className="min-h-12 min-w-24 flex-1 flex-row items-center justify-center gap-2 rounded-soft border border-border bg-surface-raised">
          {state.muted ? <MicOff size={18} className="text-text" /> : <Volume2 size={18} className="text-text" />}
          <Text className="font-semibold text-text">{state.muted ? 'Sin sonido' : 'Sonido'}</Text>
        </Pressable>
      </View>
      <Pressable role="checkbox" aria-checked={state.consent} onPress={toggleConsent}
        className="min-h-12 flex-row items-center gap-3 rounded-soft border border-border bg-surface-raised p-3">
        <View className={state.consent ? 'h-6 w-6 border-2 border-accent bg-accent' : 'h-6 w-6 border-2 border-border bg-surface-sunken'} />
        <Text className="min-w-0 flex-1 text-sm leading-6 text-text-muted">
          Ambas personas aceptan usar el reconocimiento de voz del dispositivo o navegador y enviar la frase al traductor.
          El servicio de reconocimiento también puede procesar audio fuera del dispositivo. Desmarcar detiene la sesión y borra el texto.
        </Text>
      </Pressable>
      <Pressable role="button" onPress={cancel} accessibilityLabel="Cancelar audio y traducción y borrar esta sesión"
        className="min-h-12 items-center justify-center rounded-soft border border-border bg-surface-raised px-4">
        <Text className="font-semibold text-text">Cancelar y borrar sesión</Text>
      </Pressable>
      {!talkEndpointAvailable ? <Text role="alert" className="text-sm text-text-muted">
        No hay servidor de traducción configurado. El micrófono no se encenderá.
      </Text> : null}
      {state.error ? <Text role="alert" className="text-sm leading-6 text-danger">{state.error}</Text> : null}
      <View className="gap-3 rounded-soft border border-border bg-surface-raised p-4">
        <Text className="text-base font-semibold text-text">
          También puedes escribir ({state.speaker === 'doctor' ? 'Médico · EN' : 'Paciente · ES'})
        </Text>
        <TextInput value={state.typedText} maxLength={2000} onChangeText={state.setTypedText}
          aria-label="Escribe una frase para traducir" placeholder="Escribe aquí si no puedes usar el micrófono…"
          placeholderTextColor="#61656A"
          className="min-h-14 rounded-soft border border-border bg-surface p-3 text-base text-text" />
        <Pressable role="button" disabled={busy || listening || !state.consent || !talkEndpointAvailable || !state.typedText.trim()}
          onPress={() => { void translate(state.typedText); }}
          className="min-h-12 items-center justify-center rounded-soft bg-cta disabled:opacity-40">
          <Text className="font-semibold text-on-cta">Traducir frase escrita</Text>
        </Pressable>
      </View>
      {state.turns.map((turn) => (
        <View key={turn.id} className="gap-3 rounded-soft border border-border bg-surface-raised p-5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-accent">
            {turn.speaker === 'doctor' ? 'Médico · English' : 'Paciente · Español'}
          </Text>
          <Text className="text-base leading-7 text-text-muted">{turn.original}</Text>
          <View className="h-px bg-border" />
          <Text className="text-xs font-semibold uppercase tracking-wider text-accent">
            {turn.speaker === 'doctor' ? 'Para el paciente · Español' : 'Para el médico · English'}
          </Text>
          <Text className="text-xl leading-8 text-text">{turn.translation}</Text>
        </View>
      ))}
      <Text className="text-sm leading-6 text-text-muted">
        Ayuda para comprender, no intérprete médico certificado. En diagnósticos, consentimiento,
        tratamientos, dosis y decisiones importantes, solicita un intérprete profesional. Comprueba
        siempre los nombres, números y las palabras negativas. Este modo no escucha en segundo plano.
      </Text>
    </View>
  );
}
