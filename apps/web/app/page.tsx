import { ShowcaseScreen, SHOWCASE_DEMOS } from '@acme/app';

// Authored data is already static and travels in the RSC payload. No runtime
// cache is needed, so this route also works on Base44 static hosting.
export default function Page() {
  return <ShowcaseScreen demos={SHOWCASE_DEMOS} />;
}
