import { ShowcaseScreen, SHOWCASE_DEMOS } from '@acme/app';
import { Base44RouteRecovery } from './Base44RouteRecovery';

// Authored data is already static and travels in the RSC payload. No runtime
// cache is needed, so this route also works on Base44 static hosting.
export default function Page() {
  return (
    <>
      {process.env.BASE44_EXPORT === '1' ? <Base44RouteRecovery /> : null}
      <ShowcaseScreen demos={SHOWCASE_DEMOS} />
    </>
  );
}
