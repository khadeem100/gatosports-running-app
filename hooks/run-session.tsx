import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import * as Crypto from 'expo-crypto';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert, AppState } from 'react-native';
import { api } from '@/lib/api';
import { secureSession } from '@/lib/auth-storage';
import { RUN_LOCATION_TASK } from '@/lib/location-task';
import { appendRunPoint, calculateDistance, createActiveRun, finishLocalRun, listRunPoints, markRunSynced, updateRunFeedback, type TrackPoint } from '@/storage/run-store';
import type { Run } from '@/types/domain';

type SessionStatus = 'idle' | 'starting' | 'running' | 'paused' | 'completed';
type RunSessionContextValue = {
  status: SessionStatus;
  runId: string | null;
  elapsedMs: number;
  distanceM: number;
  points: TrackPoint[];
  completedRun: Run | null;
  locationMessage: string;
  backgroundEnabled: boolean;
  startRun: () => Promise<boolean>;
  pauseRun: () => Promise<void>;
  resumeRun: () => Promise<void>;
  enableBackgroundTracking: () => Promise<boolean>;
  endRun: () => Promise<Run | null>;
  saveFeeling: (feeling: string, note?: string) => Promise<void>;
};

const RunSessionContext = createContext<RunSessionContextValue | null>(null);

export function RunSessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [runId, setRunId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [distanceM, setDistanceM] = useState(0);
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [completedRun, setCompletedRun] = useState<Run | null>(null);
  const [locationMessage, setLocationMessage] = useState('GPS nog niet gestart');
  const [backgroundEnabled, setBackgroundEnabled] = useState(false);
  const watcher = useRef<Location.LocationSubscription | null>(null);
  const pausedTotal = useRef(0);
  const pausedAt = useRef<number | null>(null);

  const ingest = useCallback(async (location: Location.LocationObject, activeRunId: string) => {
    const point: TrackPoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude ?? undefined,
      accuracy: location.coords.accuracy ?? undefined,
      timestamp: location.timestamp,
    };
    await appendRunPoint(activeRunId, point);
    const next = await listRunPoints(activeRunId);
    setPoints(next);
    setDistanceM(calculateDistance(next));
    setLocationMessage(location.coords.accuracy && location.coords.accuracy < 25 ? 'GPS-signaal is goed' : 'GPS-signaal wordt gezocht');
  }, []);

  const startForegroundWatcher = useCallback(async (activeRunId: string) => {
    watcher.current?.remove();
    watcher.current = await Location.watchPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1000,
      distanceInterval: 3,
      mayShowUserSettingsDialog: true,
    }, (location) => { void ingest(location, activeRunId); });
  }, [ingest]);

  const stopBackgroundTask = useCallback(async () => {
    try {
      if (await TaskManager.isTaskRegisteredAsync(RUN_LOCATION_TASK)) {
        await Location.stopLocationUpdatesAsync(RUN_LOCATION_TASK);
      }
    } catch { /* Native tracking may not be available in Expo Go. */ }
    setBackgroundEnabled(false);
  }, []);

  const startRun = useCallback(async () => {
    if (status === 'running' || status === 'starting') return false;
    setStatus('starting');
    setLocationMessage('We zoeken een nauwkeurig gps-signaal.');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setStatus('idle');
        setLocationMessage('Locatie is nodig om je afstand te meten.');
        Alert.alert('Locatie nodig', 'Sta locatie toe om je afstand en route tijdens het hardlopen vast te leggen.');
        return false;
      }
      const last = await Location.getLastKnownPositionAsync({ maxAge: 30_000, requiredAccuracy: 80 }).catch(() => null);
      const first = last ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const id = Crypto.randomUUID();
      const start = Date.now();
      await createActiveRun(id, new Date(start));
      const firstPoint: TrackPoint = {
        latitude: first.coords.latitude, longitude: first.coords.longitude,
        altitude: first.coords.altitude ?? undefined, accuracy: first.coords.accuracy ?? undefined, timestamp: first.timestamp,
      };
      await appendRunPoint(id, firstPoint);
      setRunId(id);
      setStartedAt(start);
      setElapsedMs(0);
      setDistanceM(0);
      setPoints([firstPoint]);
      pausedTotal.current = 0;
      pausedAt.current = null;
      setStatus('running');
      setLocationMessage('GPS-signaal is actief');
      await startForegroundWatcher(id);
      return true;
    } catch {
      setStatus('idle');
      setLocationMessage('We konden gps niet starten. Ga naar buiten en probeer het opnieuw.');
      Alert.alert('GPS niet beschikbaar', 'We konden je locatie niet starten. Ga naar buiten of controleer je locatie-instellingen.');
      return false;
    }
  }, [startForegroundWatcher, status]);

  const enableBackgroundTracking = useCallback(async () => {
    if (!runId) return false;
    try {
      const permission = await Location.requestBackgroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationMessage('Achtergrondlocatie staat uit. Houd het scherm open om te blijven meten.');
        return false;
      }
      const available = await TaskManager.isAvailableAsync();
      if (!available) {
        setLocationMessage('Achtergrond-gps werkt pas in de GatoSports ontwikkelbuild.');
        return false;
      }
      const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(RUN_LOCATION_TASK);
      if (!alreadyRegistered) {
        await Location.startLocationUpdatesAsync(RUN_LOCATION_TASK, {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 3000,
          distanceInterval: 5,
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'Hardloopsessie actief',
            notificationBody: 'Je locatie wordt vastgelegd zolang deze run loopt.',
            killServiceOnDestroy: false,
          },
        });
      }
      setBackgroundEnabled(true);
      return true;
    } catch {
      setLocationMessage('Achtergrond-gps is niet beschikbaar op dit apparaat.');
      return false;
    }
  }, [runId]);

  const pauseRun = useCallback(async () => {
    if (status !== 'running') return;
    watcher.current?.remove();
    watcher.current = null;
    await stopBackgroundTask();
    pausedAt.current = Date.now();
    setStatus('paused');
  }, [status, stopBackgroundTask]);

  const resumeRun = useCallback(async () => {
    if (!runId || status !== 'paused') return;
    const now = Date.now();
    if (pausedAt.current) pausedTotal.current += now - pausedAt.current;
    pausedAt.current = null;
    await startForegroundWatcher(runId);
    setStatus('running');
  }, [runId, startForegroundWatcher, status]);

  const endRun = useCallback(async () => {
    if (!runId || !startedAt) return null;
    watcher.current?.remove();
    watcher.current = null;
    await stopBackgroundTask();
    const endedAt = Date.now();
    const durationMs = status === 'paused' && pausedAt.current
      ? pausedAt.current - startedAt - pausedTotal.current
      : endedAt - startedAt - pausedTotal.current;
    const freshPoints = await listRunPoints(runId);
    const freshDistance = calculateDistance(freshPoints);
    await finishLocalRun(runId, { endedAt: new Date(endedAt), durationMs: Math.max(0, durationMs), distanceM: freshDistance });
    const run: Run = {
      id: runId,
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      durationMs: Math.max(0, durationMs),
      distanceM: freshDistance,
      averagePaceSecPerKm: freshDistance > 0 ? durationMs / 1000 / (freshDistance / 1000) : 0,
      points: freshPoints.map(({ latitude, longitude, timestamp }) => ({ latitude, longitude, timestamp })),
    };
    setCompletedRun(run);
    setStatus('completed');
    setElapsedMs(Math.max(0, durationMs));
    setDistanceM(freshDistance);
    setPoints(freshPoints);
    try {
      if (await secureSession.getToken()) {
        await api.uploadRun({ ...run, points: freshPoints });
        await markRunSynced(runId);
      }
    } catch { /* The completed run stays local and can be synchronized later. */ }
    return run;
  }, [runId, startedAt, status, stopBackgroundTask]);

  const saveFeeling = useCallback(async (feeling: string, note = '') => {
    if (!completedRun) return;
    await updateRunFeedback(completedRun.id, feeling, note);
    const updated = { ...completedRun, feeling, note };
    setCompletedRun(updated);
    try {
      if (await secureSession.getToken()) await api.uploadRun(updated);
    } catch { /* Keep the feedback in the device journal while offline. */ }
    setRunId(null);
    setStartedAt(null);
    setStatus('idle');
    setCompletedRun(null);
  }, [completedRun]);

  useEffect(() => {
    if (status !== 'running' || startedAt === null) return;
    const update = () => setElapsedMs(Math.max(0, Date.now() - startedAt - pausedTotal.current));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startedAt, status]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active' && runId && status === 'running') {
        void listRunPoints(runId).then((latest) => {
          setPoints(latest);
          setDistanceM(calculateDistance(latest));
        });
      }
    });
    return () => subscription.remove();
  }, [runId, status]);

  useEffect(() => () => { watcher.current?.remove(); }, []);

  const value = useMemo<RunSessionContextValue>(() => ({
    status, runId, elapsedMs, distanceM, points, completedRun, locationMessage, backgroundEnabled,
    startRun, pauseRun, resumeRun, enableBackgroundTracking, endRun, saveFeeling,
  }), [status, runId, elapsedMs, distanceM, points, completedRun, locationMessage, backgroundEnabled, startRun, pauseRun, resumeRun, enableBackgroundTracking, endRun, saveFeeling]);

  return <RunSessionContext.Provider value={value}>{children}</RunSessionContext.Provider>;
}

export function useRunSession() {
  const value = useContext(RunSessionContext);
  if (!value) throw new Error('useRunSession must be used inside RunSessionProvider');
  return value;
}
