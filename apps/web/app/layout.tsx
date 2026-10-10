import type { Metadata } from 'next';
import { AppShell } from '@acme/app';
import { Document } from './Document';
import './rn-globals';
import './globals.css';

// Product tabs and preserved lab routes are statically rendered for Base44.
export const metadata: Metadata = {
  title: { default: "Pa'Casa", template: "%s | Pa'Casa" },
  description: 'Pa’Casa: Spanish-first questions, translation and form guidance at your pace.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Document>
      <AppShell>{children}</AppShell>
    </Document>
  );
}
