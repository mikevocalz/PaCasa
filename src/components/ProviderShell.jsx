import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, Home, Inbox, LogOut, Menu, Mic, Settings, Users, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/AuthContext';

const TABS = [
  { to: '/provider', label: 'Inicio', icon: Home, exact: true },
  { to: '/provider/patients', label: 'Pacientes', icon: Users },
  { to: '/provider/forms', label: 'Formularios', icon: ClipboardList },
  { to: '/provider/inbox', label: 'Pendientes', icon: Inbox },
];

export default function ProviderShell() {
  const { user, organizations, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const org = organizations[0];
  const active = (tab) => tab.exact ? location.pathname === tab.to : location.pathname.startsWith(tab.to);

  const signOut = async () => { await logout(); navigate('/login', { replace: true }); };

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-line bg-page/95 px-4 backdrop-blur">
        <div className="min-w-0"><Link to="/provider" className="font-display text-lg text-fg">Pa’Casa</Link><div className="mt-0.5 flex items-center gap-2 text-xs text-fg-subtle"><Badge tone="provider">Portal proveedor</Badge><span className="truncate">{org?.name ?? 'Organización'}</span></div></div>
        <nav aria-label="Portal de proveedores" className="hidden items-center gap-1 md:flex">{TABS.map((tab) => <Link key={tab.to} to={tab.to} aria-current={active(tab) ? 'page' : undefined} className={`min-h-11 border-b-2 px-3 py-3 text-sm font-semibold ${active(tab) ? 'border-sky-400 text-fg' : 'border-transparent text-fg-muted hover:bg-panel'}`}>{tab.label}</Link>)}</nav>
        <button type="button" className="flex h-11 w-11 items-center justify-center border border-line bg-panel text-fg" onClick={() => setDrawer(true)} aria-label="Abrir menú"><Menu size={22} aria-hidden /></button>
      </header>

      <main className="min-h-0 flex-1 pb-24 md:pb-0"><Outlet /></main>

      <nav aria-label="Portal de proveedores" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-page/95 px-1 pb-2 pt-1 md:hidden">
        {TABS.slice(0, 2).map((tab) => <ProviderTab key={tab.to} tab={tab} active={active(tab)} />)}
        <div className="flex flex-1 flex-col items-center justify-end"><button type="button" onClick={() => navigate('/provider/pacasa')} className="-mt-6 flex h-16 w-16 items-center justify-center rounded-full border-4 border-page bg-accent text-silver-50 shadow-raised" aria-label="Abrir Pa’Casa para proveedores"><Mic size={26} aria-hidden /></button><span className="pt-1 text-xs font-semibold text-fg">Pa’Casa</span></div>
        {TABS.slice(2).map((tab) => <ProviderTab key={tab.to} tab={tab} active={active(tab)} />)}
      </nav>

      {drawer ? <div className="fixed inset-0 z-40 flex"><button type="button" className="absolute inset-0 bg-ink-950/70" aria-label="Cerrar menú" onClick={() => setDrawer(false)} /><aside className="relative ml-auto flex h-full w-full max-w-sm flex-col border-l border-line bg-panel p-5 shadow-card" aria-label="Menú de proveedor"><header className="flex items-start justify-between gap-3 border-b border-line pb-4"><div><p className="font-display text-xl text-fg">{user?.name}</p><p className="text-sm text-fg-subtle">{user?.email}</p></div><button type="button" onClick={() => setDrawer(false)} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center border border-line"><X size={22} aria-hidden /></button></header><section className="space-y-3 py-5"><Button tone="secondary" className="w-full justify-start"><Settings size={18} aria-hidden /> Organización y equipo</Button><Button tone="secondary" className="w-full justify-start" onClick={signOut}><LogOut size={18} aria-hidden /> Cerrar sesión</Button></section></aside></div> : null}
    </div>
  );
}

function ProviderTab({ tab, active }) {
  return <Link to={tab.to} aria-current={active ? 'page' : undefined} className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 ${active ? 'bg-panel-2' : ''}`}><tab.icon size={20} className={active ? 'text-sky-300' : 'text-fg-subtle'} aria-hidden /><span className={`text-xs ${active ? 'font-semibold text-fg' : 'text-fg-muted'}`}>{tab.label}</span></Link>;
}
