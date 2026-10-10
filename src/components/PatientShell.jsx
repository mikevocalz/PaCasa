import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Accessibility,
  Globe2,
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
import { useLocale } from '@/i18n/store';
import { resetSession, setDemoMode, setReturnTo, useSession } from '@/session/store';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/AuthContext';
import { canListen, canSpeak, microphoneAvailable } from '@/session/voice';

/** The five visible positions. Pa'Casa is the raised center action, not a tab. */
const TABS = [
  { to: '/', key: 'nav.home', icon: Home },
  { to: '/formularios', key: 'nav.forms', icon: ClipboardList },
  { to: '/documentos', key: 'nav.documents', icon: FileText },
  { to: '/revisar', key: 'nav.review', icon: ListChecks },
];

/** Settings stay in overflow; the fifth/center action always opens Pa'Casa Live. */
const DRAWER_ITEMS = [
  { id: 'idioma', key: 'drawer.language', icon: Globe2 },
  { id: 'accesibilidad', key: 'drawer.accessibility', icon: Accessibility },
  { id: 'voz', key: 'drawer.voice', icon: Volume2 },
  { id: 'funciona', key: 'drawer.how', icon: Info },
  { id: 'privacidad', key: 'drawer.privacy', icon: HelpCircle },
  { id: 'demo', key: 'drawer.demo', icon: RotateCcw },
  { id: 'microfono', key: 'drawer.microphone', icon: Mic },
  { id: 'acerca', key: 'drawer.about', icon: FileText },
];

function DrawerPanel({ id, onClose }) {
  const { demoMode } = useSession();
  const { preference, setPreference, t } = useLocale();

  if (id === 'idioma') {
    return (
      <DrawerText title={t('locale.heading')}>
        <p>{t('locale.help')}</p>
        <label className="block space-y-2" htmlFor="patient-language-setting">
          <span className="block text-sm font-semibold">{t('locale.heading')}</span>
          <select
            id="patient-language-setting"
            value={preference}
            onChange={(event) => setPreference(event.target.value)}
            className="min-h-12 w-full border border-line bg-page px-4 text-base text-fg"
          >
            <option value="auto">{t('locale.auto')}</option>
            <option value="en">{t('locale.en')}</option>
            <option value="es">{t('locale.es')}</option>
          </select>
        </label>
      </DrawerText>
    );
  }

  if (id === 'accesibilidad') {
    return (
      <DrawerText title={t('drawer.accessibility')}>
        <p>{t('drawer.a11yText')}</p>
        <p>{t('drawer.a11yMotion')}</p>
      </DrawerText>
    );
  }
  if (id === 'voz') {
    return (
      <DrawerText title={t('drawer.voice')}>
        <p>{t(canSpeak() ? 'drawer.voiceSpeak' : 'drawer.voiceNoSpeak')}</p>
        <p>{t(canListen() ? 'drawer.voiceListen' : 'drawer.voiceNoListen')}</p>
      </DrawerText>
    );
  }
  if (id === 'funciona') {
    return <DrawerText title={t('drawer.how')}><p>{t('drawer.howText')}</p></DrawerText>;
  }
  if (id === 'privacidad') {
    return <DrawerText title={t('drawer.privacy')}><p>{t('drawer.privacyText')}</p></DrawerText>;
  }
  if (id === 'microfono') {
    return (
      <DrawerText title={t('drawer.microphone')}>
        <p>{t(microphoneAvailable() ? 'drawer.micYes' : 'drawer.micNo')}</p>
        <p>{t(canListen() ? 'drawer.voiceListen' : 'drawer.voiceNoListen')}</p>
      </DrawerText>
    );
  }
  if (id === 'demo') {
    return (
      <DrawerText title={t('drawer.demo')}>
        <p>{t('drawer.demoText')}</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setDemoMode(!demoMode)}
            className="min-h-12 border border-royal-400 bg-accent px-6 text-sm font-semibold uppercase tracking-[0.12em] text-silver-50"
          >
            {t(demoMode ? 'drawer.demoClear' : 'drawer.demoStart')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 border border-line bg-panel px-6 text-sm font-semibold uppercase tracking-[0.12em] text-fg-muted"
          >
            {t('drawer.close')}
          </button>
        </div>
      </DrawerText>
    );
  }
  return <DrawerText title={t('drawer.about')}><p>{t('drawer.aboutText')}</p></DrawerText>;
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
  const { t } = useLocale();
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

        <nav aria-label={t('nav.primary')} className="hidden flex-row items-center gap-1 md:flex">
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={isActive(tab.to) ? 'page' : undefined}
              className={`flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold ${
                isActive(tab.to) ? 'border-royal-400 text-fg' : 'border-transparent text-fg-muted hover:bg-panel'
              }`}
            >
              {t(tab.key)}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={t('nav.menuOpen')}
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
        aria-label={t('nav.primary')}
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-line bg-page/95 px-1 pb-2 pt-1.5 backdrop-blur md:hidden"
      >
        {TABS.slice(0, 2).map((tab) => (
          <TabItem key={tab.to} tab={tab} active={isActive(tab.to)} />
        ))}

        <div className="flex flex-1 flex-col items-center justify-end">
          <button
            type="button"
            onClick={openPaCasaLive}
            aria-label={t('nav.assistant')}
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
            aria-label={t('nav.menuClose')}
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
                    ‹ {t('nav.back')}
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
                        {t(item.key)}
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
                  {t('drawer.restart')}
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
  const { t } = useLocale();
  return (
    <Link
      to={tab.to}
      aria-current={active ? 'page' : undefined}
      aria-label={t(tab.key)}
      className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 border border-transparent px-0.5 ${
        active ? 'bg-panel-2' : 'hover:bg-panel'
      }`}
    >
      <tab.icon size={20} className={active ? 'text-accent-soft' : 'text-fg-subtle'} aria-hidden />
      <span className={`text-xs ${active ? 'font-semibold text-fg' : 'text-fg-muted'}`}>{t(tab.key)}</span>
    </Link>
  );
}