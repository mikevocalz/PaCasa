import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

const baseURL = process.env.EXPO_PUBLIC_PACASA_AUTH_URL;

if (!baseURL && process.env.NODE_ENV !== 'test') {
  console.warn("EXPO_PUBLIC_PACASA_AUTH_URL is not configured; Pa'Casa account login is unavailable.");
}

export const authClient = createAuthClient({
  baseURL: baseURL ?? 'http://localhost:3000',
  plugins: [
    expoClient({
      scheme: 'pacasa',
      storagePrefix: 'pacasa',
      storage: SecureStore,
    }),
  ],
});
