import type { Metadata } from 'next';
import { AppShell } from '@acme/app';
import { Document } from './Document';
import './rn-globals';
import './globals.css';

// All product and preserved workflow routes are statically rendered; Base44 uses Next static export.
export const metadata: Metadata = {
  title: { default: "Pa'Casa", template: "%s | Pa'Casa" },
  description:
    "Pa'Casa te ayuda en español a preparar tu visita a la clínica: llena formularios, revisa documentos y confirma tus respuestas antes de tu cita.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Document>
      <AppShell>{children}</AppShell>
    </Document>
  );
}
