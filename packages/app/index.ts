// @acme/app: the five shared screens. Route files in apps/mobile and apps/web only render these.
export { ShowcaseScreen } from './screens/ShowcaseScreen';
export { SHOWCASE_DEMOS, type ShowcaseDemo } from './screens/showcase-demos';
export { NativeScreen } from './screens/NativeScreen';
export { HybridScreen } from './screens/HybridScreen';
export { GameScreen } from './screens/GameScreen';
export { ImmersiveScreen, type ImmersiveScreenProps } from './screens/ImmersiveScreen';
export { AppShell } from './screens/AppShell';
export { SafeAreaProvider } from './providers/safe-area';
export { useLiveOverlay, type LiveMode } from './session/live-overlay';
export { startExampleForm, startFormFromDocument, addUploadedDocument } from './session/actions';
export { PaCasaHomeScreen } from './screens/PaCasaHomeScreen';
export { MiPlanScreen, CitasScreen, ApoyoScreen } from './screens/PaCasaTabScreens';
