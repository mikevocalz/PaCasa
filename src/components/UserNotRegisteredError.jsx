export default function UserNotRegisteredError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-6 py-16">
      <section className="w-full max-w-md space-y-4 border border-line bg-panel p-8 text-center">
        <h1 className="font-display text-2xl leading-tight text-fg">Su acceso todavía no está activo</h1>
        <p className="text-base leading-7 text-fg-muted">
          Pida a la clínica que le dé de alta con este correo y vuelva a intentarlo.
        </p>
      </section>
    </main>
  );
}