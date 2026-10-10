import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { withUniwind } from "uniwind";
import { AppShell, SafeAreaProvider } from "@acme/app";
import { semantic } from "@acme/theme";
import { setThemePreference } from "@acme/theme/switch";
import "../global.css";

// className-capable gesture root (third-party component → withUniwind).
// Module scope, not render scope — withUniwind builds the wrapper eagerly.
const GestureRoot = withUniwind(GestureHandlerRootView);

// Pa'Casa is daylit-first: follow the OS appearance instead of forcing a scheme.
setThemePreference("system");

export default function RootLayout() {
  return (
    <GestureRoot className="flex-1">
      <StatusBar style="auto" />
      <KeyboardProvider>
        <SafeAreaProvider>
          <AppShell>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: semantic.bg.light } }} />
          </AppShell>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureRoot>
  );
}
