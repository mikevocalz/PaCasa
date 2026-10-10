import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Search, Volume2, ZoomIn, ZoomOut } from 'lucide-react';
import { addUploadedDocument, startFormFromDocument } from '@/session/actions';
import { analysisCopy, analyseDocument } from '@/session/domain';
import { session, useSession } from '@/session/store';
import { canSpeak, pickDocument, speak } from '@/session/voice';
import { ActionButton, OverflowMenu, Panel, PatientFrame } from '@/components/patient-ui';

/** Documentos: the source documents of the current visit. */
export default function Documentos() {
  const { documents } = useSession();
  const navigate = useNavigate();
  const [viewerId, setViewerId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(true);
  const [query, setQuery] = useState('');

  const viewer = documents.find((document) => document.id === viewerId) ?? null;

  const uploadPdf = async () => {
    const picked = await pickDocument();
    if (picked) addUploadedDocument(picked.name, picked.kind);
  };

  /** The analysis screens, in order: reading → detecting → translating → result. */
  const runAnalysis = (document) => {
    const result = analyseDocument(document);
    const step = (state) => setAnalysis({ documentId: document.id, state, result });
    step('reading');
    window.setTimeout(() => step('detecting'), 700);
    window.setTimeout(() => step('translating'), 1400);
    window.setTimeout(() => step(result.state), 2100);
    if (!viewerId) setViewerId(document.id);
    setPage(1);
  };

  const listenTo = (document) => {
    const text = document.pages[0]?.text ?? document.title;
    speak(text.replace(/_+/g, ' '));
  };

  const openFormFromDocument = (document) => {
    const form = startFormFromDocument(document.id);
    if (form) navigate('/formularios');
  };

  if (viewer) {
    const text = viewer.pages.find((item) => item.number === page)?.text ?? '';
    const matches = query.trim()
      ? viewer.pages.filter((item) => item.text.toLowerCase().includes(query.trim().toLowerCase()))
      : [];
    const activeAnalysis = analysis?.documentId === viewer.id ? analysis : null;

    return (
      <PatientFrame question="Documentos" title={viewer.title} lead={`${viewer.clinic} · ${viewer.kind === 'pdf' ? 'PDF' : 'Imagen'}`}>
        <button type="button" onClick={() => setViewerId(null)} className="self-start text-sm font-semibold uppercase tracking-[0.12em] text-accent-soft">
          ‹ Documentos
        </button>

        <article aria-label="Documento" className="border border-line bg-panel shadow-card">
          <div className="flex flex-wrap items-center gap-2 border-b border-line/70 px-3 py-2">
            <button type="button" aria-label="Página anterior" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="flex h-11 w-11 items-center justify-center border border-line bg-panel text-fg disabled:opacity-40">
              <ChevronLeft size={20} aria-hidden />
            </button>
            <span className="min-w-16 text-center text-sm text-fg-muted">
              {viewer.pages.length > 0 ? `${page} / ${viewer.pages.length}` : '— / —'}
            </span>
            <button type="button" aria-label="Página siguiente" onClick={() => setPage((current) => Math.min(viewer.pages.length, current + 1))} disabled={page >= viewer.pages.length} className="flex h-11 w-11 items-center justify-center border border-line bg-panel text-fg disabled:opacity-40">
              <ChevronRight size={20} aria-hidden />
            </button>
            <span aria-hidden className="mx-1 h-6 w-px bg-line" />
            <button type="button" aria-label="Alejar" onClick={() => setZoom((value) => Math.max(0.85, value - 0.15))} className="flex h-11 w-11 items-center justify-center border border-line bg-panel text-fg">
              <ZoomOut size={20} aria-hidden />
            </button>
            <button type="button" aria-label="Acercar" onClick={() => setZoom((value) => Math.min(2, value + 0.15))} className="flex h-11 w-11 items-center justify-center border border-line bg-panel text-fg">
              <ZoomIn size={20} aria-hidden />
            </button>
            <button type="button" onClick={() => setFit((value) => !value)} className="min-h-11 border border-line bg-panel px-3 text-sm text-fg-muted hover:text-fg">
              {fit ? 'Ajustar ancho' : 'Tamaño real'}
            </button>
            <span aria-hidden className="mx-1 h-6 w-px bg-line" />
            <button type="button" onClick={() => listenTo(viewer)} disabled={!canSpeak()} className="flex min-h-11 items-center gap-2 border border-line bg-panel px-3 text-sm text-fg-muted hover:text-fg disabled:opacity-40">
              <Volume2 size={18} aria-hidden /> Escuchar
            </button>
            <button
              type="button"
              onClick={() => {
                session.set({ returnTo: '/documentos' });
                navigate('/pacasa');
              }}
              className="min-h-11 border border-line bg-panel px-3 text-sm text-fg-muted hover:text-fg"
            >
              Preguntar a Pa’Casa
            </button>
            <ActionButton label="Analizar" onPress={() => runAnalysis(viewer)} />
          </div>

          <div className="border-b border-line/70 px-3 py-3">
            <label className="flex items-center gap-2 border border-line bg-page px-3">
              <Search size={18} className="text-fg-subtle" aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar en el documento"
                aria-label="Buscar en el documento"
                className="min-h-11 w-full bg-transparent text-base text-fg outline-none"
              />
            </label>
            {matches.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {matches.map((item) => (
                  <li key={item.number}>
                    <button type="button" onClick={() => setPage(item.number)} className="text-sm text-accent-soft">
                      Página {item.number}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {query.trim() && matches.length === 0 ? <p className="mt-2 text-sm text-fg-subtle">No encontré esa palabra.</p> : null}
          </div>

          <div className="bg-ink-900 p-4 md:p-8">
            {text ? (
              <div
                style={{ fontSize: `${zoom}rem` }}
                className={`mx-auto whitespace-pre-wrap bg-silver-50 p-6 font-mono leading-8 text-ink-950 shadow-card ${fit ? 'w-full max-w-2xl' : 'w-max'}`}
              >
                {text}
              </div>
            ) : (
              <p className="mx-auto max-w-2xl text-center text-base text-fg-muted">
                No pude leer el texto de este archivo todavía.
              </p>
            )}
          </div>
        </article>

        {activeAnalysis ? <AnalysisPanel analysis={activeAnalysis} onView={() => setViewerId(viewer.id)} onRetry={() => runAnalysis(viewer)} onUse={() => openFormFromDocument(viewer)} /> : null}
      </PatientFrame>
    );
  }

  return (
    <PatientFrame
      question="Documentos"
      title="Sus documentos"
      lead="Los papeles de esta visita: lo que subió, lo que Pa’Casa leyó y lo que puede preguntarle."
    >
      <Panel label="Subir un documento">
        <ActionButton label="Subir PDF" onPress={uploadPdf} />
      </Panel>

      <Panel label="En esta sesión">
        {documents.length === 0 ? (
          <p className="text-base text-fg-muted">Todavía no hay documentos en esta sesión.</p>
        ) : (
          <ul className="space-y-4">
            {documents.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center justify-between gap-4 border border-line bg-panel p-4">
                <div className="min-w-0 space-y-1">
                  <p className="flex items-center gap-2 font-display text-lg text-fg">
                    <FileText size={18} className="text-accent-soft" aria-hidden />
                    {document.title}
                  </p>
                  <p className="text-sm text-fg-muted">
                    {document.clinic} · {document.kind === 'pdf' ? 'PDF' : 'Imagen'} ·{' '}
                    {document.pages.length > 0 ? `${document.pages.length} páginas` : 'sin leer todavía'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <ActionButton
                    label="Ver"
                    onPress={() => {
                      setViewerId(document.id);
                      setPage(1);
                      setAnalysis(null);
                    }}
                  />
                  <OverflowMenu
                    label={`Más acciones para ${document.title}`}
                    actions={[
                      { label: 'Analizar', onPress: () => runAnalysis(document) },
                      { label: 'Escuchar', onPress: () => listenTo(document), disabled: !canSpeak() },
                      {
                        label: 'Usar para formulario',
                        onPress: () => openFormFromDocument(document),
                        disabled: analyseDocument(document).fields.length === 0,
                      },
                    ]}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {analysis ? <AnalysisPanel analysis={analysis} onView={() => setViewerId(analysis.documentId)} onRetry={() => setViewerId(analysis.documentId)} onUse={() => openFormFromDocument(documents.find((item) => item.id === analysis.documentId))} /> : null}
    </PatientFrame>
  );
}

/** The document-analysis states, with the actions each one offers. */
function AnalysisPanel({ analysis, onView, onRetry, onUse }) {
  const settled = analysis.state === 'ready' || analysis.state === 'needs_review' || analysis.state === 'no_fields';
  const ready = analysis.state === 'ready';

  return (
    <Panel label="Análisis del documento">
      <p className="text-base leading-7 text-fg" aria-live="polite">
        {analysisCopy(analysis.result ? { ...analysis.result, state: analysis.state } : { state: analysis.state, fields: [] })}
      </p>

      {settled && analysis.result?.fields?.length > 0 ? (
        <ul className="space-y-2">
          {analysis.result.fields.map((field) => (
            <li key={`${field.page}-${field.sourceLabel}`} className="border-b border-line/60 pb-2 last:border-b-0">
              <p className="text-xs uppercase tracking-[0.14em] text-fg-subtle">En el formulario dice · página {field.page}</p>
              <p className="text-base text-fg">{field.sourceLabel}</p>
              <p className="text-sm text-fg-muted">En español: {field.questionEs}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {analysis.result?.unreadable?.length > 0 ? (
        <p className="text-sm text-fg-muted">
          No pude leer bien: {analysis.result.unreadable.join(', ')}.
        </p>
      ) : null}

      {settled ? (
        <div className="flex flex-wrap gap-3">
          <ActionButton tone="quiet" label="Ver documento" onPress={onView} />
          <ActionButton tone="quiet" label="Intentar de nuevo" onPress={onRetry} />
          {ready ? <ActionButton label="Usar para formulario" onPress={onUse} /> : null}
        </div>
      ) : null}
    </Panel>
  );
}