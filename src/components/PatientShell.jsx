import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Accessibility,
  ClipboardList,
  FileText,
  HelpCircle,
  Home,
  Info,
  ListChecks,
  Menu,
  Mic,
  MicOff,
  RotateCcw,
  Volume2,
  X,
} from 'lucide-react';
import { resetSession, setDemoMode, setReturnTo, useSession } from '@/session/store';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/AuthContext';
import { canListen, canSpeak, microphoneAvailable } from '@/session/voice';

/** The five visible positions. Pa'Casa is the raised center action, not a tab. */
const TABS = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/formularios', label: 'Formularios', icon: ClipboardList },
  { to: '/documentos', label: 'Documentos', icon: FileText },
  { to: '/revisar', label: 'Revisar', icon: ListChecks },
];

/** Left drawer: secondary functionality only, never a second navigation universe. */
const DRAWER_ITEMS = [
  { id: 'accesibilidad', label: 'Accesibilidad', icon: Accessibility },
  { id: 'voz', label: 'Voz y audio', icon: Volume2 },
  { id: 'funciona', label: 'Cómo funciona', icon: Info },
  { id: 'privacidad', label: 'Privacidad', icon: HelpCircle },
  { id: 'demo', label: 'Modo demo', icon: RotateCcw },
  { id: 'microfono', label: 'Estado del micrófono', icon: Mic },
  { id: 'acerca', label: 'Acerca de Pa’Casa', icon: FileText },
];

function DrawerPanel({ id, onClose }) {
  const { demoMode } = useSession();

  if (id === 'accesibilidad') {
    return (
      <DrawerText title="Accesibilidad">
        <p>Botones grandes, textos que crecen con el sistema, contraste alto y etiquetas para lectores de pantalla.</p>
        <p>Toda la app respeta la orientación del texto y el modo de movimiento reducido.</p>
      </DrawerText>
    );
  }
  if (id === 'voz') {
    return (
      <DrawerText title="Voz y audio">
        <p>{canSpeak() ? 'Pa’Casa puede leerle las preguntas y sus respuestas en voz alta.' : 'Este navegador no tiene voz de lectura.'}</p>
        <p>{canListen() ? 'También puede dictar sus respuestas.' : 'El dictado no está disponible aquí; puede escribir sus respuestas.'}</p>
      </DrawerText>
    );
  }
  if (id === 'funciona') {
    return (
      <DrawerText title="Cómo funciona">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Suba el formulario de la clínica, o tome una foto.</li>
          <li>Pa’Casa encuentra las preguntas y las prepara en español.</li>
          <li>Conteste hablando, una pregunta a la vez.</li>
          <li>Revise sus respuestas y genere el documento.</li>
        </ol>
      </DrawerText>
    );
  }
  if (id === 'privacidad') {
    return (
      <DrawerText title="Privacidad">
        <p>Esta sesión es temporal: los formularios y documentos viven en este dispositivo mientras dura la visita.</p>
        <p>No es un expediente médico y no se guarda como historial permanente.</p>
      </DrawerText>
    );
  }
  if (id === 'microfono') {
    return (
      <DrawerText title="Estado del micrófono">
        <p>{microphoneAvailable() ? 'El dispositivo tiene micrófono.' : 'No encontré un micrófono en este dispositivo.'}</p>
        <p>{canListen() ? 'El dictado por voz está disponible.' : 'El dictado por voz no está disponible; use el teclado.'}</p>
      </DrawerText>
    );
  }
  if (id === 'demo') {
    return (
      <DrawerText title="Modo demo">
        <p>
          {demoMode
            ? 'Ahora mismo está cargada la visita de ejemplo (Rosa Velázquez).'
            : 'La sesión está vacía: puede empezar de cero.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setDemoMode(!demoMode)}
            className="min-h-12 border border-royal-400 bg-accent px-6 text-sm font-semibold uppercase tracking-[0.12em] text-silver-50"
          >
            {demoMode ? 'Empezar una sesión vacía' : 'Cargar la visita de ejemplo'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 border border-line bg-panel px-6 text-sm font-semibold uppercase tracking-[0.12em] text-fg-muted"
          >
            Cerrar
          </button>
        </div>
      </DrawerText>
    );
  }
  return (
    <DrawerText title="Acerca de Pa’Casa">
      <p>Pa’Casa lee el formulario de la clínica y se lo pregunta en español, una pregunta a la vez.</p>
      <p>Usted puede revisar, corregir y escuchar cada respuesta antes de terminar.</p>
    </DrawerText>
  );
}

function DrawerText({ title, children }) {
  return (
    <div className="space-y-4 text-base leading-7 text-fg-muted">
      <h2 className="font-display text-xl text-fg">{title}</h2>
      {children}
    </div>
  );
}

export default function PatientShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panel, setPanel] = useState(null);

  const isActive = (to) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to));

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setPanel(null);
  };

  /** The center action opens a ROOT screen; the tab selection does not change. */
  const openPaCasaLive = () => {
    setReturnTo(location.pathname);
    navigate('/pacasa');
  };

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-page/95 px-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" aria-label="Pa’Casa, inicio" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center border border-royal-400 bg-accent font-display text-lg text-silver-50">
              P
            </span>
            <span className="font-display text-lg text-fg">Pa’Casa</span>
          </Link>
          <Badge tone="patient">Portal paciente</Badge>
        </div>

        <nav aria-label="Navegación principal" className="hidden flex-row items-center gap-1 md:flex">
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={isActive(tab.to) ? 'page' : undefined}
              className={`flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold ${
                isActive(tab.to) ? 'border-royal-400 text-fg' : 'border-transparent text-fg-muted hover:bg-panel'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir el menú"
          aria-expanded={drawerOpen}
          className="flex h-11 w-11 items-center justify-center border border-line bg-panel text-fg"
        >
          <Menu size={22} aria-hidden />
        </button>
      </header>

      <main className="min-h-0 flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-line bg-page/95 px-1 pb-2 pt-1.5 backdrop-blur md:hidden"
      >
        {TABS.slice(0, 2).map((tab) => (
          <TabItem key={tab.to} tab={tab} active={isActive(tab.to)} />
        ))}

        <div className="flex flex-1 flex-col items-center justify-end">
          <button
            type="button"
            onClick={openPaCasaLive}
            aria-label="Pa’Casa: hablar con la app"
            className="-mt-6 flex h-16 w-16 items-center justify-center rounded-full border-4 border-page bg-accent text-silver-50 shadow-raised"
          >
            <Mic size={26} aria-hidden />
          </button>
          <span className="pt-1 font-display text-xs text-fg">Pa’Casa</span>
        </div>

        {TABS.slice(2).map((tab) => (
          <TabItem key={tab.to} tab={tab} active={isActive(tab.to)} />
        ))}
      </nav>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 flex">
          <button
            type="button"
            aria-label="Cerrar el menú"
            onClick={closeDrawer}
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
          />
          <aside
            aria-label="Menú de Pa’Casa"
            className="relative flex h-full w-full max-w-sm flex-col border-r border-line bg-panel shadow-card"
          >
            <div className="flex min-h-16 items-center justify-between border-b border-line px-4">
              <span className="font-display text-lg text-fg">Pa’Casa</span>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Cerrar el menú"
                className="flex h-11 w-11 items-center justify-center border border-line bg-panel text-fg"
              >
                <X size={22} aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {panel ? (
                <div className="space-y-5">
                  <button
                    type="button"
                    onClick={() => setPanel(null)}
                    className="text-sm font-semibold uppercase tracking-[0.12em] text-accent-soft"
                  >
                    ‹ Volver
                  </button>
                  <DrawerPanel id={panel} onClose={closeDrawer} />
                </div>
              ) : (
                <ul className="space-y-2">
                  {DRAWER_ITEMS.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setPanel(item.id)}
                        className="flex min-h-14 w-full items-center gap-4 border border-line bg-panel px-4 text-left text-base text-fg hover:border-accent-soft hover:bg-panel-2"
                      >
                        <item.icon size={22} className="text-accent-soft" aria-hidden />
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 space-y-3 border-t border-line pt-5">
                <div className="space-y-1 border border-line bg-page p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-soft">Paciente</p>
                  <p className="font-semibold text-fg">{user?.name ?? 'Cuenta Pa’Casa'}</p>
                  <p className="text-sm text-fg-subtle">{user?.email}</p>
                </div>
                <Button
                  tone="secondary"
                  className="w-full"
                  onClick={async () => {
                    await logout();
                    closeDrawer();
                    navigate('/login', { replace: true });
                  }}
                >
                  Cerrar sesión
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    resetSession();
                    closeDrawer();
                  }}
                  className="flex min-h-14 w-full items-center gap-4 border border-line bg-panel px-4 text-left text-base text-fg hover:border-accent-soft hover:bg-panel-2"
                >
                  <RotateCcw size={22} className="text-accent-soft" aria-hidden />
                  Reiniciar sesión
                </button>
                <p className="px-1 text-sm text-fg-subtle">
                  {canListen() ? (
                    <span className="flex items-center gap-2">
                      <Mic size={16} aria-hidden /> Dictado disponible
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <MicOff size={16} aria-hidden /> Dictado no disponible aquí
                    </span>
                  )}
                </p>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function TabItem({ tab, active }) {
  return (
    <Link
      to={tab.to}
      aria-current={active ? 'page' : undefined}
      aria-label={tab.label}
      className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 border border-transparent px-0.5 ${
        active ? 'bg-panel-2' : 'hover:bg-panel'
      }`}
    >
      <tab.icon size={20} className={active ? 'text-accent-soft' : 'text-fg-subtle'} aria-hidden />
      <span className={`text-xs ${active ? 'font-semibold text-fg' : 'text-fg-muted'}`}>{tab.label}</span>
    </Link>
  );
}