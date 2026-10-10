import { useNavigate } from 'react-router-dom';
import { Mic, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/lib/AuthContext';

export default function ProviderPaCasa() {
  const { organizations } = useAuth();
  const navigate = useNavigate();
  return <main className="min-h-screen bg-page"><header className="flex min-h-16 items-center justify-between border-b border-line px-4"><button type="button" onClick={() => navigate(-1)} aria-label="Cerrar Pa’Casa" className="flex h-11 w-11 items-center justify-center border border-line bg-panel text-fg"><X size={22} aria-hidden /></button><div className="text-center"><h1 className="font-display text-xl text-fg">Pa’Casa</h1><p className="text-xs text-fg-subtle">Modo proveedor · {organizations[0]?.name}</p></div><span className="h-11 w-11" aria-hidden /></header><section className="mx-auto grid max-w-3xl gap-5 px-4 py-10"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-page bg-accent text-white shadow-raised"><Mic size={38} aria-hidden /></div><header className="space-y-2 text-center"><h2 className="font-display text-3xl text-fg">¿Qué necesita revisar?</h2><p className="text-base leading-7 text-fg-muted">Este modo usa el contexto de la organización y del paciente abierto, sin convertirse en un chatbot médico abierto.</p></header><Card as="section" className="space-y-3"><p className="text-sm text-fg-subtle">Sugerencias</p><div className="flex flex-wrap gap-3"><Button tone="secondary">Pacientes que necesitan ayuda</Button><Button tone="secondary">Formularios listos para revisar</Button></div></Card></section></main>;
}
