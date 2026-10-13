/**
 * Inicio workflow metadata. Serializable and platform-neutral: on web the page
 * hands it to the client screen across the RSC boundary; on native the screen
 * uses it as its default. The slugs are the preserved workflow routes from
 * docs/adr/0002; the labels are the Spanish workflow names patients see.
 */
export interface ShowcaseDemo {
  readonly href: string;
  readonly title: string;
  readonly layout: string;
  readonly line: string;
}

export const SHOWCASE_DEMOS: readonly ShowcaseDemo[] = [
  {
    href: '/native',
    title: 'Formularios',
    layout: 'Flujo de la visita',
    line: 'Pa’Casa le pregunta cada campo en español, una pregunta a la vez. Conteste hablando o escribiendo.',
  },
  {
    href: '/hybrid',
    title: 'Documentos',
    layout: 'Documentos de la clínica',
    line: 'Vea los documentos de esta visita y qué preguntas encontró Pa’Casa, con su página y etiqueta original.',
  },
  {
    href: '/game',
    title: 'Revisar',
    layout: 'Antes de terminar',
    line: 'Escuche y corrija cada respuesta antes de dar el formulario por completo.',
  },
  {
    href: '/immersive',
    title: 'Ayuda',
    layout: 'Apoyo y privacidad',
    line: 'Cómo funciona Pa’Casa, accesibilidad y qué pasa con sus datos durante esta visita.',
  },
];
