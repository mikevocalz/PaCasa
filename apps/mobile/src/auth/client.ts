import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import { configuredBase44Origin, createBase44AuthFetch } from './base44-fetch';

const baseURL = configuredBase44Origin(process.env.EXPO_PUBLIC_PACASA_AUTH_URL);

export const authClient = createAuthClient({
  // The invalid sentinel never receives requests: the custom transport fails closed without configuration.
  baseURL: baseURL ?? 'https://pacasa.invalid',
  disableDefaultFetchPlugins: true,
  fetchOptions: { customFetchImpl: createBase44AuthFetch(baseURL) },
  plugins: [
    expoClient({ scheme: 'pacasa', storagePrefix: 'pacasa', storage: SecureStore }),
  ],
});

/** For explicit native requests outside Better Auth's own client (never a query-string token). */
export async function getPaCasaSessionHeaders(): Promise<Record<string, string>> {
  if (!baseURL) throw new Error('PaCasa Base44 authentication is not configured.');
  const cookie = await authClient.getCookie();
  if (!cookie) throw new Error('Sign in before accessing the PaCasa backend.');
  return { Cookie: cookie, 'expo-origin': 'pacasa://', 'X-PaCasa-Request': '1' };
}
