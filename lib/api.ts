import { secureSession } from '@/lib/auth-storage';
import { demoChallenges, demoProducts, demoProfile, demoRoutes, demoWeather } from '@/data/demo';
import type { Challenge, Product, Route, UserProfile, Weather } from '@/types/domain';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export const hasApi = Boolean(API_URL);

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiAccount = Partial<UserProfile> & { id: string; name: string; email: string };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new ApiError('De API is nog niet ingesteld.');
  const token = await secureSession.getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new ApiError(body?.error ?? 'Er ging iets mis. Probeer het zo nog eens.', response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  async routes(): Promise<Route[]> {
    if (!hasApi) return demoRoutes;
    try { return await request<Route[]>('/v1/routes'); } catch { return demoRoutes; }
  },
  async products(): Promise<Product[]> {
    if (!hasApi) return demoProducts;
    try { return await request<Product[]>('/v1/products'); } catch { return demoProducts; }
  },
  async challenges(): Promise<Challenge[]> {
    if (!hasApi) return demoChallenges;
    try { return await request<Challenge[]>('/v1/challenges'); } catch { return demoChallenges; }
  },
  async weather(latitude = 52.3676, longitude = 4.9041): Promise<Weather> {
    if (!hasApi) return demoWeather;
    try {
      return await request<Weather>(`/v1/weather?latitude=${latitude}&longitude=${longitude}`);
    } catch {
      return demoWeather;
    }
  },
  async profile(): Promise<UserProfile> {
    if (!hasApi) return demoProfile;
    const [user, local] = await Promise.all([
      request<ApiAccount>('/v1/me'),
      secureSession.getProfile<Partial<UserProfile>>(),
    ]);
    const profile = { ...demoProfile, ...local, ...user };
    await secureSession.setProfile(profile);
    return profile;
  },
  async signIn(email: string, password: string) {
    const session = await request<{ token: string; user: ApiAccount }>('/v1/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    await secureSession.setToken(session.token);
    try { return await api.profile(); }
    catch {
      const local = await secureSession.getProfile<Partial<UserProfile>>();
      const profile = { ...demoProfile, ...local, id: session.user.id, name: session.user.name };
      await secureSession.setProfile(profile);
      return profile;
    }
  },
  async register(email: string, password: string, name: string) {
    const session = await request<{ token: string; user: ApiAccount }>('/v1/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password, name }),
    });
    await secureSession.setToken(session.token);
    const local = await secureSession.getProfile<Partial<UserProfile>>();
    const profile = { ...demoProfile, ...local, id: session.user.id, name: session.user.name };
    try {
      const preferences = await request<Pick<UserProfile, 'goal' | 'runsPerWeek' | 'preferredDistance' | 'terrain'>>('/v1/me/preferences', {
        method: 'PATCH', body: JSON.stringify(profile),
      });
      Object.assign(profile, preferences);
    } catch { /* Account creation still succeeds if optional preferences sync is temporarily offline. */ }
    await secureSession.setProfile(profile);
    return profile;
  },
  async uploadRun(run: unknown) {
    return request<{ id: string }>('/v1/runs', { method: 'POST', body: JSON.stringify(run) });
  },
  async joinChallenge(challengeId: string) {
    return request<void>(`/v1/challenges/${challengeId}/join`, { method: 'POST' });
  },
  async startSafetySession() {
    return request<{ id: string; shareUrl: string }>('/v1/safety-sessions', { method: 'POST' });
  },
  async updateSafetySession(id: string, latitude: number, longitude: number) {
    return request<void>(`/v1/safety-sessions/${id}/location`, {
      method: 'PATCH', body: JSON.stringify({ latitude, longitude }),
    });
  },
  async endSafetySession(id: string) {
    return request<void>(`/v1/safety-sessions/${id}/finish`, { method: 'POST' });
  },
};
