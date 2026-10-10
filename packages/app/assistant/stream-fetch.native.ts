import { fetch as nitroFetch } from 'react-native-nitro-fetch';

// React Native fetch buffers the response body. Follow Moyo Learn's streaming transport.
export const streamFetch: typeof fetch = (input, init) =>
  nitroFetch(input as RequestInfo | URL, { ...init, stream: true });
