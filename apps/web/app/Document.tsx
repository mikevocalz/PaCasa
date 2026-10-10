import NextTopLoader from 'nextjs-toploader';
import { display, sans } from './fonts';

const THEME_SCRIPT =
  "try{var m=document.cookie.match(/(?:^|; )app-theme=(light|dark|system)/);" +
  "if(m)document.documentElement.setAttribute('data-theme',m[1]);}catch(e){}";

type Props = {
  children: React.ReactNode;
};

export function Document({ children }: Props) {
  // suppressHydrationWarning: THEME_SCRIPT sets data-theme from the cookie
  // before hydration — an intentional server/client attribute difference.
  return (
    <html lang="es" data-theme="light" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex h-dvh flex-col overflow-hidden font-sans">
        <NextTopLoader color="var(--color-accent)" height={3} showSpinner={false} />
        {children}
      </body>
    </html>
  );
}
