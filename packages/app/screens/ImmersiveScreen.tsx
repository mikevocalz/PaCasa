'use client';

import { Link } from 'solito/link';
import { usePathname } from 'solito/navigation';
import { FileText, HelpCircle, Languages, MessageCircle, Mic, ShieldCheck } from '@acme/ui/icons';
import { Text, View } from '@acme/ui/tw';
import { useLiveOverlay } from '../session/live-overlay';
import { canListen, canSpeak, microphoneAvailable } from '../speech/speech';
import { PatientBigAction, PatientButton, PatientFrame, PatientPanel } from './patient-ui';

export interface ImmersiveScreenProps {
  enterImmersive?: () => Promise<boolean>;
}

/** Ayuda: explains the product honestly and keeps every workflow one tap away. */
export function ImmersiveScreen({ enterImmersive }: ImmersiveScreenProps = {}) {
  const pathname = usePathname() ?? '/immersive';
  const openLive = useLiveOverlay((s) => s.openLive);
  const voiceInput = canListen() && microphoneAvailable();
  const readAloud = canSpeak();

  return (
    <PatientFrame
      question="Ayuda"
      title="¿Cómo funciona Pa’Casa?"
      lead="Una visita guiada en español: el documento origina las preguntas, usted responde, y nada se confirma sin su aprobación."
    >
      <PatientPanel label="Tres formas de pedir ayuda">
        <View className="gap-4 md:flex-row">
          <View className="flex-1">
            <PatientBigAction icon={Mic} label="Hablar" hint="Dicte una respuesta y confírmela." onPress={() => openLive(pathname, 'hablar')} />
          </View>
          <View className="flex-1">
            <PatientBigAction icon={Languages} label="Traducir" hint="Convierta frases comunes inglés ↔ español." tone="quiet" onPress={() => openLive(pathname, 'traducir')} />
          </View>
          <View className="flex-1">
            <PatientBigAction icon={MessageCircle} label="Preguntar" hint="Pregunte por un campo del formulario." tone="quiet" onPress={() => openLive(pathname, 'preguntar')} />
          </View>
        </View>
      </PatientPanel>

      <PatientPanel label="Procedencia de las preguntas">
        <View className="flex-row items-start gap-3">
          <FileText size={24} className="mt-1 shrink-0 text-accent" />
          <View className="min-w-0 flex-1 gap-2">
            <Text className="text-base leading-7 text-text">
              Cada respuesta conserva la etiqueta original del documento y, cuando existe, el número de página.
            </Text>
            <Text className="text-base leading-7 text-text-muted">
              Si una línea no se puede leer, Pa’Casa la marca para revisión en lugar de inventar una pregunta.
            </Text>
            <Link href="/hybrid" aria-label="Abrir Documentos">
              <View className="min-h-12 items-center justify-center self-start rounded-soft border border-border bg-surface px-6">
                <Text className="text-base font-semibold text-text">Ver documentos</Text>
              </View>
            </Link>
          </View>
        </View>
      </PatientPanel>

      <PatientPanel label="Confirmación y privacidad">
        <View className="flex-row items-start gap-3">
          <ShieldCheck size={24} className="mt-1 shrink-0 text-accent" />
          <View className="min-w-0 flex-1 gap-3">
            <Text className="text-base leading-7 text-text-muted">
              Editar una respuesta la vuelve pendiente. Un formulario solo puede marcarse listo cuando cada respuesta tiene texto y confirmación explícita.
            </Text>
            <Text className="text-base leading-7 text-text-muted">
              Esta sesión es temporal y vive en este dispositivo. No es un expediente médico ni una historia clínica permanente.
            </Text>
            <Text className="text-base leading-7 text-text-muted">
              Pa’Casa ayuda a comprender palabras; no sustituye a un intérprete médico calificado ni da consejo clínico.
            </Text>
          </View>
        </View>
      </PatientPanel>

      <PatientPanel label="Capacidades de esta versión">
        <View role="list" className="gap-3">
          <View role="listitem" className="gap-1 border-b border-border pb-3">
            <Text className="font-semibold text-text">Escuchar una respuesta</Text>
            <Text className="text-base leading-7 text-text-muted">
              {voiceInput
                ? 'Este navegador puede dictar una respuesta en español. Confirme lo que escuchó antes de usarlo.'
                : 'No hay dictado disponible en esta versión. Puede escribir la respuesta con el teclado.'}
            </Text>
          </View>
          <View role="listitem" className="gap-1 border-b border-border pb-3">
            <Text className="font-semibold text-text">Leer en voz alta</Text>
            <Text className="text-base leading-7 text-text-muted">
              {readAloud
                ? 'Este navegador puede leer las preguntas en español.'
                : 'La lectura en voz alta no está disponible en esta versión.'}
            </Text>
          </View>
          <View role="listitem" className="gap-1">
            <Text className="font-semibold text-text">Vista espacial</Text>
            <Text className="text-base leading-7 text-text-muted">
              {enterImmersive
                ? 'Este dispositivo ofreció una vista espacial opcional; se abrirá solo si la plataforma la acepta.'
                : 'Esta versión trabaja en pantalla plana. No hay una vista espacial abierta desde Ayuda.'}
            </Text>
            {enterImmersive ? <PatientButton label="Abrir vista espacial" tone="quiet" onPress={() => void enterImmersive()} /> : null}
          </View>
        </View>
      </PatientPanel>

      <View className="gap-3 rounded-soft border border-border bg-surface-raised p-5">
        <View className="flex-row items-center gap-3">
          <HelpCircle size={22} className="text-accent" />
          <Text className="font-display text-xl text-text">¿Dónde seguir?</Text>
        </View>
        <View className="flex-row flex-wrap gap-3">
          <Link href="/native" aria-label="Abrir Formularios">
            <View className="min-h-12 items-center justify-center rounded-soft border border-border bg-surface px-6">
              <Text className="text-base font-semibold text-text">Formularios</Text>
            </View>
          </Link>
          <Link href="/game" aria-label="Abrir Revisar">
            <View className="min-h-12 items-center justify-center rounded-soft border border-border bg-surface px-6">
              <Text className="text-base font-semibold text-text">Revisar</Text>
            </View>
          </Link>
        </View>
      </View>
    </PatientFrame>
  );
}
