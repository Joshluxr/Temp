/**
 * Secure storage boundary (T-PLAT-01 / D9).
 *
 * Rule: bearer material and any server-derived secret go to expo-secure-store
 * (Keychain / Android Keystore-backed). AsyncStorage-equivalent plaintext
 * storage is reserved for non-sensitive UI preferences. There is deliberately
 * no AsyncStorage import anywhere in this app — see
 * __tests__/secure-storage.test.tsx, which fails the build if one appears.
 */

import * as SecureStore from "expo-secure-store";

import type { MobileTokens } from "../contracts/types";

const ACCESS_TOKEN_KEY = "kita.auth.accessToken";
const REFRESH_TOKEN_KEY = "kita.auth.refreshToken";

/** Non-secret UI preference cache key; holds a JSON draft, never a token. */
export const PREFERENCES_CACHE_KEY = "kita.notifications.preferencesDraft";

export interface KitaSecretStore {
  readAccessToken(): Promise<string | null>;
  readRefreshToken(): Promise<string | null>;
  saveTokens(tokens: MobileTokens): Promise<void>;
  clearTokens(): Promise<void>;
  /** Preference drafts are not secrets, but they can contain locale/timezone
   * tied to an account; keeping them in the same encrypted store is cheap. */
  savePreferencesDraft(raw: string): Promise<void>;
  readPreferencesDraft(): Promise<string | null>;
  clearPreferencesDraft(): Promise<void>;
}

const options = {
  /** Device unlock required before the OS hands the value back. */
  requireAuthentication: true,
} as const satisfies SecureStore.SecureStoreOptions;

export const secretStore: KitaSecretStore = {
  async readAccessToken() {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY, options);
  },
  async readRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY, options);
  },
  async saveTokens(tokens) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken, options);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken, options);
  },
  async clearTokens() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY, options);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, options);
  },
  async savePreferencesDraft(raw) {
    await SecureStore.setItemAsync(PREFERENCES_CACHE_KEY, raw, options);
  },
  async readPreferencesDraft() {
    return SecureStore.getItemAsync(PREFERENCES_CACHE_KEY, options);
  },
  async clearPreferencesDraft() {
    await SecureStore.deleteItemAsync(PREFERENCES_CACHE_KEY, options);
  },
};
