'use client';

import { ChevronLeft, ChevronRight, FileText } from '@acme/ui/icons';
import { useInstanceStore, useLayoutSize, useStore } from '@acme/ui';
import { Pressable, Text, TextInput, View } from '@acme/ui/tw';
import { useRouter } from 'solito/navigation';
import { useAssistantStore } from '../assistant/store';
import { addReadDocument, addUploadedDocument, startFormFromDocument } from '../session/actions';
import { analysisCopy, analyseDocument, type DocumentAnalysis } from '../session/document-analysis';
import { canPickDocument, pickDocument, type PickedDocument } from '../session/document-picker';
import { canReadDocument, readPickedDocument } from '../session/document-reader';
import { useLiveOverlay } from '../session/live-overlay';
import { findDocument, usePatientSession, type PatientDocument } from '../session/patient';
import { canSpeak, speak } from '../speech/speech';
import { PatientButton, PatientFrame, PatientPanel } from './patient-ui';

/**
 * /hybrid — Documentos: the source documents of the current visit
 * (ADR 0002). The patient lists what Pa'Casa has, reads the extracted text of
 * one document, and runs the synchronous analysis that turns intake labels
 * into Spanish questions. Nothing here simulates OCR: analysis reads the
 * text the session already holds, and files this build cannot parse are
 * reported as unreadable instead of inventing fields.
 */

/** Preguntar opens Pa'Casa Live (mounted by AppShell) on this screen's questions. */
const askPaCasa = () => useLiveOverlay.getState().openLive('/hybrid', 'preguntar');

/** Escanear opens the assistant overlay's camera workspace (mounted by AppShell). */
const scanWithPaCasa = () => useAssistantStore.getState().openAssistant('scan');

/** Screen-local UI state: which document is open, its page and search, the last analysis run. */
interface DocumentosState {
  selectedId: string | null;
  page: number;
  query: string;
  /** Tied to the document it read. Synchronous — no staged progress states. */
  analysis: { documentId: string; result: DocumentAnalysis } | null;
  /** A picked file waiting on the patient's read/save-unread decision. */
  pending: PickedDocument | null;
  consent: boolean;
  reading: boolean;
  readError: string | null;
}

const pageCountLabel = (document: PatientDocument) =>
  document.pages.length > 0 ? `${document.pages.length} ${document.pages.length === 1 ? 'página' : 'páginas'}` : 'sin leer todavía';

export function HybridScreen() {
  const { size, onLayout } = useLayoutSize();
  const split = size.width >= 720;
  const documents = usePatientSession((state) => state.documents);
  const router = useRouter();
  const local = useInstanceStore<DocumentosState>(() => ({ selectedId: null, page: 1, query: '', analysis: null, pending: null, consent: false, reading: false, readError: null }));
  const { selectedId, page, query, analysis, pending, consent, reading, readError } = useStore(local);
  const selected = findDocument(documents, selectedId);
  const selectedAnalysis = selected && analysis?.documentId === selected.id ? analysis.result : null;

  const select = (id: string) => local.setState({ selectedId: id, page: 1, query: '' });

  const upload = async () => {
    const picked = await pickDocument();
    if (!picked) return;
    if (canReadDocument(picked)) {
      local.setState({ pending: picked, consent: false, readError: null });
      return;
    }
    const added = addUploadedDocument(picked.name, picked.kind);
    local.setState({ selectedId: added.id, page: 1 });
  };

  const readPending = async () => {
    if (!pending || !consent || reading) return;
    local.setState({ reading: true, readError: null });
    try {
      const text = await readPickedDocument(pending);
      const added = addReadDocument(pending.name, pending.kind, text);
      local.setState({ pending: null, consent: false, reading: false, selectedId: added.id, page: 1 });
    } catch (error) {
      local.setState({ reading: false, readError: error instanceof Error ? error.message : 'No se pudo leer.' });
    }
  };

  const keepUnread = () => {
    if (!pending) return;
    const added = addUploadedDocument(pending.name, pending.kind);
    local.setState({ pending: null, consent: false, readError: null, selectedId: added.id, page: 1 });
  };

  const runAnalysis = (document: PatientDocument) =>
    local.setState({ analysis: { documentId: document.id, result: analyseDocument(document) } });

  const listenTo = (document: PatientDocument) => {
    const text = document.pages.find((item) => item.number === page)?.text ?? document.pages[0]?.text ?? document.title;
    speak(text.replace(/_+/g, ' '));
  };

  /** "Usar para formulario" creates the form; nothing is answered or confirmed yet. */
  const createForm = (document: PatientDocument) => {
    const form = startFormFromDocument(document.id);
    if (form) router.push('/native');
  };

  return (
    <PatientFrame
      question="Documentos"
      title="Sus documentos"
      lead="Los papeles de esta visita: lo que subió y lo que Pa’Casa leyó para ayudarle con el formulario."
    >
      <View onLayout={onLayout} className="gap-4" style={{ flexDirection: split ? 'row' : 'column', alignItems: split ? 'flex-start' : 'stretch' }}>
        <View className="gap-4" style={{ width: split ? (size.width - 16) * 0.4 : '100%' }}>
          <PatientPanel label="Subir un documento">
            <View className="gap-3">
              {canPickDocument() ? <PatientButton label="Subir PDF o foto" onPress={upload} /> : null}
              <PatientButton tone={canPickDocument() ? 'quiet' : 'solid'} label="Escanear con la cámara" onPress={scanWithPaCasa} />
              {canPickDocument() ? (
                <Text className="text-sm leading-6 text-text-muted">
                  Si el lector de demostración está conectado, Pa’Casa lee el texto del archivo solo con su permiso.
                </Text>
              ) : (
                <Text className="text-sm leading-6 text-text-muted">
                  Esta versión no puede subir archivos en este dispositivo; la cámara abre el escáner de Pa’Casa.
                </Text>
              )}
            </View>
          </PatientPanel>

          {pending ? (
            <PatientPanel label="Leer el archivo">
              <View className="gap-3">
                <Text className="text-base font-semibold text-text">{pending.name}</Text>
                <Text className="text-sm leading-6 text-text-muted">
                  El archivo se envía al lector de Google de demostración. No use datos reales de pacientes.
                </Text>
                <Pressable
                  role="checkbox"
                  aria-checked={consent}
                  onPress={() => local.setState({ consent: !consent })}
                  className="min-h-12 flex-row items-center gap-3 focus-visible:outline-2 focus-visible:outline-focus"
                >
                  <View className={`h-6 w-6 border-2 ${consent ? 'border-accent bg-accent' : 'border-border bg-surface-raised'}`} />
                  <Text className="min-w-0 flex-1 text-sm leading-6 text-text">
                    Autorizo leer esta imagen con el servicio de demostración.
                  </Text>
                </Pressable>
                {readError ? <Text role="alert" className="text-sm leading-6 text-danger">{readError}</Text> : null}
                <View className="flex-row flex-wrap gap-3">
                  <PatientButton
                    label={reading ? 'Leyendo…' : 'Leer el documento'}
                    disabled={!consent || reading}
                    onPress={() => void readPending()}
                  />
                  <PatientButton tone="quiet" label="Guardar sin leer" onPress={keepUnread} />
                </View>
              </View>
            </PatientPanel>
          ) : null}

          <PatientPanel label="En esta sesión">
            {documents.length === 0 ? (
              <Text className="text-base leading-7 text-text-muted">Todavía no hay documentos en esta sesión.</Text>
            ) : (
              <View role="list" className="gap-3">
                {documents.map((document) => (
                  <Pressable
                    key={document.id}
                    role="button"
                    aria-label={`Ver ${document.title}`}
                    aria-pressed={document.id === selectedId}
                    onPress={() => select(document.id)}
                    className={`min-h-14 rounded-soft border p-4 focus-visible:outline-2 focus-visible:outline-focus ${
                      document.id === selectedId ? 'border-accent bg-surface-sunken' : 'border-border bg-surface hover:border-accent'
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <FileText size={20} className="text-accent" aria-hidden />
                      <View className="min-w-0 flex-1 gap-1">
                        <Text className="font-display text-lg text-text">{document.title}</Text>
                        <Text className="text-sm text-text-muted">
                          {document.clinic} · {document.kind === 'pdf' ? 'PDF' : 'Imagen'} · {pageCountLabel(document)}
                        </Text>
                      </View>
                      {document.unreadable ? (
                        <Text className="border border-border px-2 py-1 text-xs font-semibold text-danger">No se pudo leer</Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </PatientPanel>
        </View>

        <View className="gap-4" style={{ width: split ? (size.width - 16) * 0.6 : '100%' }}>
          {selected ? (
            <DocumentView
              document={selected}
              page={page}
              query={query}
              onPage={(next) => local.setState({ page: next })}
              onQuery={(next) => local.setState({ query: next })}
              onAnalyze={() => runAnalysis(selected)}
              onListen={() => listenTo(selected)}
            />
          ) : (
            <PatientPanel label="Documento">
              <Text className="text-base leading-7 text-text-muted">Elija un documento de la lista para ver su texto.</Text>
            </PatientPanel>
          )}
          {selectedAnalysis ? <AnalysisPanel analysis={selectedAnalysis} onUseForForm={() => selected && createForm(selected)} /> : null}
        </View>
      </View>
    </PatientFrame>
  );
}

function DocumentView({
  document,
  page,
  query,
  onPage,
  onQuery,
  onAnalyze,
  onListen,
}: {
  document: PatientDocument;
  page: number;
  query: string;
  onPage: (page: number) => void;
  onQuery: (query: string) => void;
  onAnalyze: () => void;
  onListen: () => void;
}) {
  const total = document.pages.length;
  const current = Math.min(Math.max(1, page), Math.max(1, total));
  const text = document.pages.find((item) => item.number === current)?.text ?? '';
  const matches = query.trim()
    ? document.pages.filter((item) => item.text.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  return (
    <PatientPanel label="Documento">
      <View className="gap-1">
        <Text role="heading" aria-level={2} className="font-display text-xl text-text">
          {document.title}
        </Text>
        <Text className="text-sm text-text-muted">
          {document.clinic} · {document.kind === 'pdf' ? 'PDF' : 'Imagen'}
        </Text>
      </View>

      <View className="flex-row flex-wrap items-center gap-2">
        <Pressable
          role="button"
          aria-label="Página anterior"
          aria-disabled={current <= 1}
          disabled={current <= 1}
          onPress={() => onPage(current - 1)}
          className="h-11 w-11 items-center justify-center rounded-soft border border-border bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-40"
        >
          <ChevronLeft size={20} className="text-text" aria-hidden />
        </Pressable>
        <Text className="min-w-16 text-center text-sm text-text-muted">{total > 0 ? `${current} / ${total}` : '— / —'}</Text>
        <Pressable
          role="button"
          aria-label="Página siguiente"
          aria-disabled={current >= total}
          disabled={current >= total}
          onPress={() => onPage(current + 1)}
          className="h-11 w-11 items-center justify-center rounded-soft border border-border bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-40"
        >
          <ChevronRight size={20} className="text-text" aria-hidden />
        </Pressable>
        <View className="min-w-40 flex-1 flex-row items-center gap-2 rounded-soft border border-border bg-surface px-3">
          <TextInput
            value={query}
            onChangeText={onQuery}
            placeholder="Buscar en el documento"
            aria-label="Buscar en el documento"
            className="min-h-11 flex-1 bg-transparent text-base text-text placeholder:text-text-muted"
          />
        </View>
      </View>

      {query.trim() ? (
        matches.length > 0 ? (
          <View className="flex-row flex-wrap gap-3">
            {matches.map((item) => (
              <Pressable
                key={item.number}
                role="button"
                aria-label={`Ir a la página ${item.number}`}
                onPress={() => onPage(item.number)}
                className="min-h-11 justify-center"
              >
                <Text className="text-sm font-semibold text-accent">Página {item.number}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text className="text-sm text-text-muted">No encontré esa palabra.</Text>
        )
      ) : null}

      <View role="region" aria-label="Texto leído de este documento" className="gap-3 rounded-soft border border-border bg-surface p-4">
        <View className="gap-1">
          <Text className="text-sm font-semibold text-accent">Texto leído de este documento</Text>
          <Text className="text-sm leading-6 text-text-muted">Pa’Casa leyó el texto del archivo; no es una foto del papel original.</Text>
        </View>
        {text ? (
          <Text className="text-base leading-7 text-text">{text}</Text>
        ) : (
          <Text className="text-base leading-7 text-text-muted">No pude leer el texto de este archivo.</Text>
        )}
      </View>

      <View className="flex-row flex-wrap gap-3">
        <PatientButton label="Analizar" onPress={onAnalyze} />
        {canSpeak() ? <PatientButton tone="quiet" label="Escuchar" onPress={onListen} /> : null}
        <PatientButton tone="quiet" label="Preguntar a Pa’Casa" onPress={askPaCasa} />
      </View>
      {!canSpeak() ? (
        <Text className="text-sm leading-6 text-text-muted">Este dispositivo no puede leer el documento en voz alta; el texto queda en pantalla.</Text>
      ) : null}
    </PatientPanel>
  );
}

/** The analysis result states, honest about what could not be read. */
function AnalysisPanel({ analysis, onUseForForm }: { analysis: DocumentAnalysis; onUseForForm: () => void }) {
  const ready = analysis.state === 'ready' && analysis.fields.length > 0;
  return (
    <PatientPanel label="Análisis del documento">
      <Text aria-live="polite" className="text-base leading-7 text-text">
        {analysisCopy(analysis)}
      </Text>

      {analysis.state === 'needs_review' ? (
        <Text className="text-base leading-7 text-text-muted">
          Revise esas partes con la clínica o con un intérprete calificado antes de contestar.
        </Text>
      ) : null}

      {analysis.fields.length > 0 ? (
        <View className="gap-3">
          {analysis.fields.map((field) => (
            <View key={`${field.page}-${field.sourceLabel}`} className="gap-1 border-b border-border pb-3">
              <Text className="text-sm font-semibold text-text-muted">En el formulario dice · página {field.page}</Text>
              <Text className="text-base text-text">{field.sourceLabel}</Text>
              <Text className="text-sm text-text-muted">En español: {field.questionEs}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {analysis.unreadable.length > 0 ? (
        <Text className="text-sm leading-6 text-danger">No pude leer bien: {analysis.unreadable.join(', ')}.</Text>
      ) : null}

      {ready ? (
        <View className="gap-2">
          <PatientButton label="Usar para formulario" onPress={onUseForForm} />
          <Text className="text-sm leading-6 text-text-muted">Crea el formulario con las preguntas; usted contesta después, una por una.</Text>
        </View>
      ) : null}
    </PatientPanel>
  );
}
