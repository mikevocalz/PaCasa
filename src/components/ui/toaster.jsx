import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        className: 'border border-line bg-panel text-fg',
      }}
    />
  );
}