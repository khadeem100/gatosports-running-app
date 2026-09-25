import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/api';
import { appendRunPoint, getActiveRunId } from '@/storage/run-store';

export const RUN_LOCATION_TASK = 'gato-running-background-location';
const SAFETY_SESSION_KEY = 'gato-running-live-safety-session';
const SAFETY_LAST_UPDATE_KEY = 'gato-running-live-safety-last-update';

async function syncSafetyLocation(location: Location.LocationObject) {
  try {
    const raw = await SecureStore.getItemAsync(SAFETY_SESSION_KEY);
    if (!raw) return;
    const { id } = JSON.parse(raw) as { id?: string };
    if (!id) return;
    const lastUpdate = Number(await SecureStore.getItemAsync(SAFETY_LAST_UPDATE_KEY) ?? 0);
    if (Date.now() - lastUpdate < 12_000) return;
    await api.updateSafetySession(id, location.coords.latitude, location.coords.longitude);
    await SecureStore.setItemAsync(SAFETY_LAST_UPDATE_KEY, String(Date.now()));
  } catch {
    // A live link keeps its last successful position when the phone has no connection.
  }
}

TaskManager.defineTask(RUN_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const runId = await getActiveRunId();
  if (!runId) return;
  const locations = (data as { locations?: Location.LocationObject[] }).locations ?? [];
  for (const item of locations) {
    await appendRunPoint(runId, {
      latitude: item.coords.latitude,
      longitude: item.coords.longitude,
      altitude: item.coords.altitude ?? undefined,
      accuracy: item.coords.accuracy ?? undefined,
      timestamp: item.timestamp,
    });
  }
  const latest = locations.at(-1);
  if (latest && latest.coords.accuracy !== null && latest.coords.accuracy < 100) {
    await syncSafetyLocation(latest);
  }
});
