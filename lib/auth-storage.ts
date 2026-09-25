import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'gato-running-access-token';
const ONBOARDING_KEY = 'gato-running-onboarding-complete';
const PROFILE_KEY = 'gato-running-profile';

export const secureSession = {
  getToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  setToken: (token: string) => SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
  clearToken: () => SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
  getOnboardingComplete: () => SecureStore.getItemAsync(ONBOARDING_KEY),
  setOnboardingComplete: () => SecureStore.setItemAsync(ONBOARDING_KEY, 'yes'),
  getProfile: async <T,>(): Promise<T | null> => {
    const raw = await SecureStore.getItemAsync(PROFILE_KEY);
    return raw ? JSON.parse(raw) as T : null;
  },
  setProfile: (profile: unknown) => SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile)),
};
