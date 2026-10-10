'use client';

import { Link } from 'solito/link';
import { usePathname } from 'solito/navigation';
import { useLayoutSize } from '@acme/ui';
import { ArrowRight, FileText, Mic } from '@acme/ui/icons';
import { Text, View } from '@acme/ui/tw';
import { startExampleForm } from '../session/actions';
import { useLiveOverlay } from '../session/live-overlay';
import { latestDocument, pendingAnswers, useActiveForm, usePatientSession } from '../session/patient';
import { PatientBigAction, PatientButton, PatientFrame, PatientPanel, ProgressRow } from './patient-ui';
import { SHOWCASE_DEMOS, type ShowcaseDemo } from './showcase-demos';

/**
 * Inicio: the patient's starting point. Spanish-first, one clear primary
 * path — start or resume the visit by talking — with the session's progress,
 * the latest document and the rest of the workflows one level down.
 */
export function ShowcaseScreen({ demos = SHOWCASE_DEMOS }: { demos?: readonly ShowcaseDemo[] }) {
  const pathname = usePathname() ?? '/';
  const { size, onLayout } = useLayoutSize();
  const form = useActiveForm();
  const documents = usePatientSession((state) => state.documents);
  const openLive = useLiveOverlay((state) => state.openLive);
  const document = latestDocument(documents);
  const pending = form ? pendingAnswers(form) : [];
  const columns = size.width >= 640 ? 2 : 1;

  const startTalking = () => {
    startExampleForm();
    openLive(pathname, 'hablar');
  };
  const resumeTalking = () => openLive(pathname, 'hablar');

  return (
    <PatientFrame
      question="¿Qué necesita hacer ahora?"
      title={form ? 'Continuemos con su formulario' : '¿Qué necesita llenar hoy?'}
      lead={
        form
          ? `${form.title} · ${form.clinic}`
          : 'Suba el formulario de la clínica y Pa’Casa se lo pregunta en español, una pregunta a la vez.'
      }
    >
      {form ? (
        <PatientPanel label="Formulario en curso">
          <ProgressRow form={form} />
          <Text className="text-base text-text-muted">
            {pending.length === 0 ? 'Ya contestó todo. Revise sus respuestas.' : `Siguiente pregunta: ${pending[0]?.questionEs ?? ''}`}
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <PatientButton label="Continuar hablando" onPress={resumeTalking} />
            <Link href="/game">
              <View className="min-h-12 items-center justify-center rounded-soft border border-border bg-surface-raised px-6">
                <Text className="text-base font-semibold text-text">Revisar respuestas</Text>
              </View>
            </Link>
          </View>
        </PatientPanel>
      ) : (
        <View className="gap-4">
          <PatientBigAction
            icon={Mic}
            label="Empezar con un formulario"
            hint="Pa’Casa le pregunta en español"
            onPress={startTalking}
          />
          <PatientBigAction
            icon={Mic}
            label="Hablar con Pa’Casa"
            hint="Traducir frases o preguntar sobre su formulario"
            tone="quiet"
            onPress={() => openLive(pathname, 'hablar')}
          />
        </View>
      )}

      {document ? (
        <PatientPanel label="Último documento">
          <View className="gap-1">
            <Text className="font-display text-lg text-text">{document.title}</Text>
            <Text className="text-sm text-text-muted">
              {document.clinic} · {document.kind === 'pdf' ? 'PDF' : 'Imagen'} ·{' '}
              {document.pages.length > 0 ? `${document.pages.length} páginas` : 'sin leer todavía'}
            </Text>
          </View>
          <Link href="/hybrid">
            <View className="min-h-12 items-center justify-center self-start rounded-soft border border-border bg-surface-raised px-6">
              <Text className="text-base font-semibold text-text">Ver documentos</Text>
            </View>
          </Link>
        </PatientPanel>
      ) : null}

      <View role="list" onLayout={onLayout} className="flex-row flex-wrap gap-4">
        {demos.map((demo) => (
          <View role="listitem" key={demo.href} style={{ width: columns === 1 ? '100%' : (size.width - 16) / 2 }}>
            <Link href={demo.href}>
              <View className="group min-h-44 gap-4 overflow-hidden rounded-soft border border-border bg-surface-raised p-6 transition-colors hover:border-border-strong hover:bg-surface-sunken">
                <View className="flex-row items-start justify-between gap-4">
                  <Text className="text-sm font-semibold text-accent">{demo.layout}</Text>
                  <View className="h-10 w-10 items-center justify-center rounded-soft border border-border bg-surface">
                    <ArrowRight size={20} className="text-text-muted" />
                  </View>
                </View>
                <View className="gap-2">
                  <Text className="font-display text-2xl leading-tight text-text">{demo.title}</Text>
                  <Text className="text-base leading-7 text-text-muted">{demo.line}</Text>
                </View>
              </View>
            </Link>
          </View>
        ))}
      </View>

      <PatientPanel label="Privacidad de esta sesión">
        <Text className="text-base leading-7 text-text-muted">
          Esta sesión es temporal: los formularios y documentos viven en este dispositivo mientras dura la visita.
          No es un expediente médico y no se guarda como historial permanente.
        </Text>
        <Link href="/immersive">
          <View className="flex-row items-center gap-2 self-start">
            <FileText size={18} className="text-accent" />
            <Text className="text-base font-semibold text-accent">Cómo funciona Pa’Casa</Text>
          </View>
        </Link>
      </PatientPanel>
    </PatientFrame>
  );
}
