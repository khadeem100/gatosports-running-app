import * as SQLite from 'expo-sqlite';
import type { Run } from '@/types/domain';

export type TrackPoint = { latitude: number; longitude: number; altitude?: number; accuracy?: number; timestamp: number };

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function database() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('gato-running.db').then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS runs (
          id TEXT PRIMARY KEY NOT NULL,
          started_at TEXT NOT NULL,
          ended_at TEXT,
          duration_ms INTEGER NOT NULL DEFAULT 0,
          distance_m REAL NOT NULL DEFAULT 0,
          average_pace_sec_per_km REAL NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'active',
          feeling TEXT,
          note TEXT,
          synced INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS run_points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          altitude REAL,
          accuracy REAL,
          recorded_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS run_points_run_id ON run_points(run_id, recorded_at);
        CREATE INDEX IF NOT EXISTS runs_started_at ON runs(started_at DESC);
      `);
      return db;
    });
  }
  return databasePromise;
}

export async function createActiveRun(id: string, startedAt = new Date()) {
  const db = await database();
  await db.runAsync('INSERT INTO runs (id, started_at, status) VALUES (?, ?, ?)', id, startedAt.toISOString(), 'active');
}

export async function getActiveRunId() {
  const db = await database();
  const row = await db.getFirstAsync<{ id: string }>("SELECT id FROM runs WHERE status = 'active' ORDER BY started_at DESC LIMIT 1");
  return row?.id ?? null;
}

function haversineMeters(a: TrackPoint, b: TrackPoint) {
  const earth = 6_371_000;
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earth * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export async function appendRunPoint(runId: string, point: TrackPoint) {
  if (point.accuracy && point.accuracy > 45) return;
  const db = await database();
  const previousRow = await db.getFirstAsync<Omit<TrackPoint, 'timestamp'> & { recorded_at: string }>(
    'SELECT latitude, longitude, altitude, accuracy, recorded_at FROM run_points WHERE run_id = ? ORDER BY id DESC LIMIT 1', runId,
  );
  const previous = previousRow ? { ...previousRow, timestamp: new Date(previousRow.recorded_at).getTime() } : null;
  if (previous && point.timestamp <= previous.timestamp) return;
  if (previous && haversineMeters(previous, point) < 2.5) return;
  await db.runAsync(
    'INSERT INTO run_points (run_id, latitude, longitude, altitude, accuracy, recorded_at) VALUES (?, ?, ?, ?, ?, ?)',
    runId, point.latitude, point.longitude, point.altitude ?? null, point.accuracy ?? null, new Date(point.timestamp).toISOString(),
  );
}

export async function listRunPoints(runId: string): Promise<TrackPoint[]> {
  const db = await database();
  const rows = await db.getAllAsync<{ latitude: number; longitude: number; altitude: number | null; accuracy: number | null; recorded_at: string }>(
    'SELECT latitude, longitude, altitude, accuracy, recorded_at FROM run_points WHERE run_id = ? ORDER BY id ASC', runId,
  );
  return rows.map((row) => ({ ...row, altitude: row.altitude ?? undefined, accuracy: row.accuracy ?? undefined, timestamp: new Date(row.recorded_at).getTime() }));
}

export async function finishLocalRun(runId: string, values: { endedAt: Date; durationMs: number; distanceM: number }) {
  const db = await database();
  const pace = values.distanceM > 0 ? values.durationMs / 1000 / (values.distanceM / 1000) : 0;
  await db.runAsync(
    "UPDATE runs SET ended_at = ?, duration_ms = ?, distance_m = ?, average_pace_sec_per_km = ?, status = 'completed' WHERE id = ?",
    values.endedAt.toISOString(), Math.round(values.durationMs), values.distanceM, pace, runId,
  );
}

export async function updateRunFeedback(runId: string, feeling: string, note = '') {
  const db = await database();
  await db.runAsync('UPDATE runs SET feeling = ?, note = ? WHERE id = ?', feeling, note, runId);
}

export async function markRunSynced(runId: string) {
  const db = await database();
  await db.runAsync('UPDATE runs SET synced = 1 WHERE id = ?', runId);
}

export async function getRun(runId: string): Promise<Run | null> {
  const db = await database();
  const row = await db.getFirstAsync<{ id: string; started_at: string; ended_at: string | null; duration_ms: number; distance_m: number; average_pace_sec_per_km: number; feeling: string | null; note: string | null; status: string }>(
    "SELECT * FROM runs WHERE id = ? AND status = 'completed'", runId,
  );
  if (!row?.ended_at) return null;
  const points = await listRunPoints(runId);
  return {
    id: row.id, startedAt: row.started_at, endedAt: row.ended_at, durationMs: row.duration_ms,
    distanceM: row.distance_m, averagePaceSecPerKm: row.average_pace_sec_per_km,
    feeling: row.feeling ?? undefined, note: row.note ?? undefined,
    points: points.map(({ latitude, longitude, timestamp }) => ({ latitude, longitude, timestamp })),
  };
}

export async function listRuns(): Promise<Run[]> {
  const db = await database();
  const rows = await db.getAllAsync<{ id: string; started_at: string; ended_at: string | null; duration_ms: number; distance_m: number; average_pace_sec_per_km: number; feeling: string | null; note: string | null }>(
    "SELECT * FROM runs WHERE status = 'completed' ORDER BY started_at DESC LIMIT 100",
  );
  return Promise.all(rows.filter((row) => row.ended_at).map(async (row) => {
    const points = await listRunPoints(row.id);
    return {
      id: row.id, startedAt: row.started_at, endedAt: row.ended_at!, durationMs: row.duration_ms,
      distanceM: row.distance_m, averagePaceSecPerKm: row.average_pace_sec_per_km,
      feeling: row.feeling ?? undefined, note: row.note ?? undefined,
      points: points.map(({ latitude, longitude, timestamp }) => ({ latitude, longitude, timestamp })),
    };
  }));
}

export async function listUnsyncedRuns(): Promise<Run[]> {
  const db = await database();
  const rows = await db.getAllAsync<{ id: string; started_at: string; ended_at: string | null; duration_ms: number; distance_m: number; average_pace_sec_per_km: number; feeling: string | null; note: string | null }>(
    "SELECT * FROM runs WHERE status = 'completed' AND synced = 0 ORDER BY started_at ASC LIMIT 25",
  );
  return Promise.all(rows.filter((row) => row.ended_at).map(async (row) => {
    const points = await listRunPoints(row.id);
    return {
      id: row.id, startedAt: row.started_at, endedAt: row.ended_at!, durationMs: row.duration_ms,
      distanceM: row.distance_m, averagePaceSecPerKm: row.average_pace_sec_per_km,
      feeling: row.feeling ?? undefined, note: row.note ?? undefined,
      points: points.map(({ latitude, longitude, timestamp }) => ({ latitude, longitude, timestamp })),
    };
  }));
}

export function calculateDistance(points: TrackPoint[]) {
  return points.slice(1).reduce((sum, point, index) => sum + haversineMeters(points[index], point), 0);
}
