import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { and, count, desc, eq, gt, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, pool } from './db/client.js';
import { challengeMemberships, challenges, products, routes, runPoints, runs, safetySessions, userSettings, users } from './db/schema.js';
import { getShopProductImage, getShopProducts } from './integrations/prestashop.js';

const app = express();
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');

app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], frameAncestors: ["'none'"] } } }));
const origins = (process.env.CORS_ORIGINS ?? '').split(',').map((value) => value.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || origins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed.'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 600,
}));
app.use(express.json({ limit: '8mb', strict: true }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false });
const safetyLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });

type AuthenticatedRequest = Request & { userId?: string };

function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Log in om verder te gaan.' });
  try {
    const decoded = jwt.verify(token, jwtSecret!) as JwtPayload;
    if (typeof decoded.sub !== 'string') return res.status(401).json({ error: 'Deze sessie is verlopen.' });
    req.userId = decoded.sub;
    return next();
  } catch {
    return res.status(401).json({ error: 'Deze sessie is verlopen.' });
  }
}

function issueToken(userId: string) {
  return jwt.sign({}, jwtSecret!, { subject: userId, expiresIn: '7d', issuer: 'gatosports-running-api', audience: 'gatosports-running-mobile' });
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown, res: Response): T | null {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Controleer de ingevulde gegevens.' });
    return null;
  }
  return parsed.data;
}

const credentialsSchema = z.object({ email: z.email().max(254).transform((value) => value.toLowerCase().trim()), password: z.string().min(10).max(128) });
const registerSchema = credentialsSchema.extend({ name: z.string().trim().min(2).max(80) });
const preferencesSchema = z.object({
  goal: z.string().trim().min(2).max(100),
  runsPerWeek: z.string().trim().min(2).max(40),
  preferredDistance: z.string().trim().min(2).max(40),
  terrain: z.string().trim().min(2).max(60),
});
const trackPointSchema = z.object({ latitude: z.number().finite().min(-90).max(90), longitude: z.number().finite().min(-180).max(180), altitude: z.number().finite().optional(), accuracy: z.number().finite().nonnegative().optional(), timestamp: z.number().int().positive() });
const runSchema = z.object({
  id: z.uuid(), startedAt: z.iso.datetime(), endedAt: z.iso.datetime(), durationMs: z.number().int().min(0).max(86_400_000),
  distanceM: z.number().finite().min(0).max(250_000), averagePaceSecPerKm: z.number().finite().min(0).max(3600),
  maxPaceSecPerKm: z.number().finite().min(0).max(3600).optional(), elevationM: z.number().finite().min(-1000).max(12_000).optional(),
  calories: z.number().int().min(0).max(10_000).optional(), feeling: z.string().max(80).optional(), note: z.string().max(2000).optional(),
  discomfort: z.string().max(120).optional(), routeId: z.string().max(100).optional(), points: z.array(trackPointSchema).max(30_000).default([]),
  weatherSnapshot: z.record(z.string(), z.unknown()).optional(),
});
const locationSchema = z.object({ latitude: z.number().finite().min(-90).max(90), longitude: z.number().finite().min(-180).max(180) });

app.get('/v1/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    return res.json({ ok: true, database: 'connected', service: 'gatosports-running-api' });
  } catch {
    return res.status(503).json({ ok: false, database: 'unavailable', service: 'gatosports-running-api' });
  }
});

app.post('/v1/auth/register', authLimiter, async (req, res) => {
  const input = parseBody(registerSchema, req.body, res);
  if (!input) return;
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    const [user] = await db.insert(users).values({ email: input.email, displayName: input.name, passwordHash }).returning({ id: users.id, email: users.email, name: users.displayName });
    if (!user) throw new Error('Account creation did not return a user.');
    await db.insert(userSettings).values({ userId: user.id }).onConflictDoNothing();
    return res.status(201).json({ token: issueToken(user.id), user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') return res.status(409).json({ error: 'Er is al een account met dit e-mailadres.' });
    throw error;
  }
});

app.post('/v1/auth/login', authLimiter, async (req, res) => {
  const input = parseBody(credentialsSchema, req.body, res);
  if (!input) return;
  const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${input.email}`).limit(1);
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: 'E-mailadres of wachtwoord klopt niet.' });
  return res.json({ token: issueToken(user.id), user: { id: user.id, name: user.displayName, email: user.email } });
});

app.get('/v1/me', requireUser, async (req: AuthenticatedRequest, res) => {
  const [user] = await db.select({
    id: users.id, name: users.displayName, email: users.email,
    goal: userSettings.goal, runsPerWeek: userSettings.runsPerWeek,
    preferredDistance: userSettings.preferredDistance, terrain: userSettings.terrain,
  }).from(users).leftJoin(userSettings, eq(userSettings.userId, users.id)).where(eq(users.id, req.userId!)).limit(1);
  if (!user) return res.status(404).json({ error: 'Account niet gevonden.' });
  return res.json({
    ...user,
    goal: user.goal ?? 'Blijf lekker in beweging',
    runsPerWeek: user.runsPerWeek ?? '2 keer per week',
    preferredDistance: user.preferredDistance ?? '5–10 km',
    terrain: user.terrain ?? 'Parken',
  });
});

app.patch('/v1/me/preferences', requireUser, async (req: AuthenticatedRequest, res) => {
  const input = parseBody(preferencesSchema, req.body, res);
  if (!input) return;
  await db.insert(userSettings).values({ userId: req.userId!, ...input }).onConflictDoUpdate({
    target: userSettings.userId,
    set: { ...input, updatedAt: new Date() },
  });
  return res.json(input);
});

app.get('/v1/routes', async (_req, res) => {
  const rows = await db.select().from(routes).where(eq(routes.active, true)).orderBy(routes.name).limit(100);
  return res.json(rows.map((route) => ({ ...route, points: route.points as Array<{ latitude: number; longitude: number }> })));
});

app.get('/v1/products', async (_req, res) => {
  const shopProducts = await getShopProducts();
  if (shopProducts) return res.json(shopProducts.map(({ imageId: _imageId, prestashopId: _prestashopId, ...product }) => product));
  const rows = await db.select().from(products).where(eq(products.active, true)).orderBy(products.name).limit(100);
  return res.json(rows.map((product) => ({
    id: product.id, name: product.name, category: product.category, price: product.priceCents / 100,
    currency: product.currency, description: product.description, imageUrl: product.imageUrl,
    productUrl: product.productUrl, reasonTags: product.reasonTags as string[],
  })));
});

app.get('/v1/products/:id/image', async (req, res) => {
  const id = z.string().regex(/^prestashop-[0-9]+$/).safeParse(req.params.id);
  if (!id.success) return res.status(404).end();
  try {
    const image = await getShopProductImage(id.data);
    if (!image) return res.status(404).end();
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', image.contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.send(image.body);
  } catch {
    return res.status(502).end();
  }
});

app.get('/v1/challenges', async (_req, res) => {
  const rows = await db.select({ challenge: challenges, joinedCount: count(challengeMemberships.userId) })
    .from(challenges).leftJoin(challengeMemberships, eq(challengeMemberships.challengeId, challenges.id))
    .where(eq(challenges.active, true)).groupBy(challenges.id).orderBy(challenges.endsAt).limit(50);
  return res.json(rows.map(({ challenge, joinedCount }) => ({
    id: challenge.id, name: challenge.name, description: challenge.description,
    goalKm: challenge.goalKm, joinedCount, endsAt: challenge.endsAt.toISOString(), accent: challenge.accent,
  })));
});

app.post('/v1/challenges/:challengeId/join', requireUser, async (req: AuthenticatedRequest, res) => {
  const challengeId = z.string().min(1).max(100).safeParse(req.params.challengeId);
  if (!challengeId.success) return res.status(400).json({ error: 'Deze uitdaging bestaat niet.' });
  const [challenge] = await db.select({ id: challenges.id }).from(challenges).where(and(eq(challenges.id, challengeId.data), eq(challenges.active, true))).limit(1);
  if (!challenge) return res.status(404).json({ error: 'Deze uitdaging is niet beschikbaar.' });
  await db.insert(challengeMemberships).values({ challengeId: challenge.id, userId: req.userId! }).onConflictDoNothing();
  return res.status(204).end();
});

app.get('/v1/runs', requireUser, async (req: AuthenticatedRequest, res) => {
  const items = await db.select().from(runs).where(eq(runs.userId, req.userId!)).orderBy(desc(runs.startedAt)).limit(100);
  return res.json(items.map((run) => ({ ...run, points: undefined })));
});

app.post('/v1/runs', requireUser, async (req: AuthenticatedRequest, res) => {
  const input = parseBody(runSchema, req.body, res);
  if (!input) return;
  const [existing] = await db.select({ id: runs.id, userId: runs.userId }).from(runs).where(eq(runs.id, input.id)).limit(1);
  if (existing && existing.userId !== req.userId) return res.status(409).json({ error: 'Deze run-id is al in gebruik.' });
  await db.transaction(async (tx) => {
    const values = {
      userId: req.userId!, startedAt: new Date(input.startedAt), endedAt: new Date(input.endedAt),
      durationMs: input.durationMs, distanceM: input.distanceM, averagePaceSecPerKm: input.averagePaceSecPerKm,
      maxPaceSecPerKm: input.maxPaceSecPerKm, elevationM: input.elevationM, calories: input.calories,
      feeling: input.feeling, discomfort: input.discomfort, notes: input.note, routeId: input.routeId,
      weatherSnapshot: input.weatherSnapshot,
    };
    if (existing) await tx.update(runs).set(values).where(and(eq(runs.id, input.id), eq(runs.userId, req.userId!)));
    else await tx.insert(runs).values({ id: input.id, ...values });
    await tx.delete(runPoints).where(eq(runPoints.runId, input.id));
    if (input.points.length) await tx.insert(runPoints).values(input.points.map((point, sequence) => ({
      runId: input.id, sequence, latitude: point.latitude, longitude: point.longitude,
      altitudeM: point.altitude, accuracyM: point.accuracy, recordedAt: new Date(point.timestamp),
    })));
    if (!existing && input.distanceM > 0) {
      const activeChallenges = await tx.select({ id: challenges.id }).from(challenges)
        .where(and(eq(challenges.active, true), gt(challenges.endsAt, new Date())));
      if (activeChallenges.length) {
        await tx.update(challengeMemberships).set({
          progressKm: sql`${challengeMemberships.progressKm} + ${input.distanceM / 1000}`,
        }).where(and(eq(challengeMemberships.userId, req.userId!), inArray(challengeMemberships.challengeId, activeChallenges.map(({ id }) => id))));
      }
    }
  });
  return res.status(existing ? 200 : 201).json({ id: input.id, saved: true });
});

app.get('/v1/weather', async (req, res) => {
  const query = z.object({ latitude: z.coerce.number().min(-90).max(90), longitude: z.coerce.number().min(-180).max(180) }).safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: 'Controleer de locatie.' });
  const params = new URLSearchParams({
    latitude: String(query.data.latitude), longitude: String(query.data.longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,is_day',
    daily: 'sunset', forecast_days: '1', timezone: 'Europe/Amsterdam',
  });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new Error('weather provider unavailable');
    const data = await response.json() as {
      current?: { temperature_2m?: number; apparent_temperature?: number; relative_humidity_2m?: number; precipitation?: number; wind_speed_10m?: number; is_day?: number };
      daily?: { sunset?: string[] };
    };
    const current = data.current ?? {};
    return res.json({
      temperatureC: current.temperature_2m ?? 0, apparentTemperatureC: current.apparent_temperature ?? 0,
      humidityPercent: current.relative_humidity_2m ?? 0, precipitationMm: current.precipitation ?? 0,
      windKmh: current.wind_speed_10m ?? 0, sunset: data.daily?.sunset?.[0]?.slice(11, 16) ?? '20:00',
      isDay: current.is_day === 1, source: 'live',
    });
  } catch {
    return res.status(502).json({ error: 'We konden het weer niet ophalen.' });
  }
});

app.post('/v1/safety-sessions', safetyLimiter, requireUser, async (req: AuthenticatedRequest, res) => {
  await db.update(safetySessions).set({ status: 'ended', endedAt: new Date() })
    .where(and(eq(safetySessions.userId, req.userId!), eq(safetySessions.status, 'active')));
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
  const [session] = await db.insert(safetySessions).values({ userId: req.userId!, shareTokenHash: tokenHash, expiresAt }).returning({ id: safetySessions.id });
  if (!session) throw new Error('Safety session creation did not return a session.');
  const publicApiUrl = (process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 4100}`).replace(/\/$/, '');
  return res.status(201).json({ id: session.id, shareUrl: `${publicApiUrl}/safety/${rawToken}`, expiresAt: expiresAt.toISOString() });
});

app.patch('/v1/safety-sessions/:id/location', safetyLimiter, requireUser, async (req: AuthenticatedRequest, res) => {
  const id = z.uuid().safeParse(req.params.id);
  const location = locationSchema.safeParse(req.body);
  if (!id.success || !location.success) return res.status(400).json({ error: 'Locatie is niet geldig.' });
  const [updated] = await db.update(safetySessions).set({
    lastLatitude: location.data.latitude, lastLongitude: location.data.longitude, lastUpdatedAt: new Date(),
  }).where(and(eq(safetySessions.id, id.data), eq(safetySessions.userId, req.userId!), eq(safetySessions.status, 'active'), gt(safetySessions.expiresAt, new Date())))
    .returning({ id: safetySessions.id });
  if (!updated) return res.status(404).json({ error: 'Deze Safety Mode-sessie is afgelopen.' });
  return res.status(204).end();
});

app.post('/v1/safety-sessions/:id/finish', requireUser, async (req: AuthenticatedRequest, res) => {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ error: 'Sessie niet gevonden.' });
  await db.update(safetySessions).set({ status: 'ended', endedAt: new Date() })
    .where(and(eq(safetySessions.id, id.data), eq(safetySessions.userId, req.userId!), eq(safetySessions.status, 'active')));
  return res.status(204).end();
});

app.get('/v1/safety/:token', async (req, res) => {
  const rawToken = z.string().regex(/^[A-Za-z0-9_-]{40,60}$/).safeParse(req.params.token);
  if (!rawToken.success) return res.status(404).json({ error: 'Deze veilige link is niet gevonden.' });
  const tokenHash = crypto.createHash('sha256').update(rawToken.data).digest('hex');
  const [session] = await db.select({ id: safetySessions.id, status: safetySessions.status, latitude: safetySessions.lastLatitude, longitude: safetySessions.lastLongitude, updatedAt: safetySessions.lastUpdatedAt, expiresAt: safetySessions.expiresAt })
    .from(safetySessions).where(eq(safetySessions.shareTokenHash, tokenHash)).limit(1);
  if (!session) return res.status(404).json({ error: 'Deze veilige link is niet gevonden.' });
  const live = session.status === 'active' && session.expiresAt > new Date();
  return res.json({ status: live ? 'active' : 'ended', latitude: live ? session.latitude : null, longitude: live ? session.longitude : null, updatedAt: live ? session.updatedAt : null, expiresAt: session.expiresAt });
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}

app.get('/safety/:token', async (req, res) => {
  const parsedToken = z.string().regex(/^[A-Za-z0-9_-]{40,60}$/).safeParse(req.params.token);
  if (!parsedToken.success) return res.status(404).type('html').send('<h1>Link niet gevonden</h1>');
  const tokenHash = crypto.createHash('sha256').update(parsedToken.data).digest('hex');
  const [session] = await db.select({ status: safetySessions.status, latitude: safetySessions.lastLatitude, longitude: safetySessions.lastLongitude, updatedAt: safetySessions.lastUpdatedAt, expiresAt: safetySessions.expiresAt, name: users.displayName })
    .from(safetySessions).innerJoin(users, eq(safetySessions.userId, users.id)).where(eq(safetySessions.shareTokenHash, tokenHash)).limit(1);
  if (!session) return res.status(404).type('html').send('<h1>Veilige link niet gevonden</h1>');
  const live = session.status === 'active' && session.expiresAt > new Date();
  const title = live ? 'Safety Mode is actief' : 'Safety Mode is afgelopen';
  const locationUrl = live && session.latitude !== null && session.longitude !== null
    ? `https://www.openstreetmap.org/?mlat=${session.latitude}&mlon=${session.longitude}#map=16/${session.latitude}/${session.longitude}` : null;
  const mapAction = locationUrl
    ? `<a class="button" href="${escapeHtml(locationUrl)}" target="_blank" rel="noopener noreferrer">Bekijk laatste locatie op de kaart</a>`
    : '<p class="muted">De eerste locatie wordt gedeeld zodra de run begint.</p>';
  const updated = session.updatedAt ? new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' }).format(session.updatedAt) : 'nog niet gedeeld';
  res.setHeader('Cache-Control', 'no-store, private');
  return res.type('html').send(`<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer">${live ? '<meta http-equiv="refresh" content="15">' : ''}<title>GatoSports · Safety Mode</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#101813;color:#f2f6ef;font:16px system-ui,sans-serif}.card{width:min(430px,calc(100% - 36px));box-sizing:border-box;padding:30px;border:1px solid #304438;border-radius:26px;background:#18231c}.brand{color:#c7f36b;font-size:12px;letter-spacing:2px;font-weight:900}.state{display:inline-block;margin:26px 0 12px;padding:8px 11px;border-radius:99px;background:#233b29;color:#c7f36b;font-size:11px;font-weight:800}.off{background:#333b34;color:#bbc8bb}h1{margin:0;font-size:27px;line-height:1.12}p{color:#afbdaf;line-height:1.55;font-size:14px}.button{display:block;margin-top:22px;padding:15px;border-radius:99px;background:#c7f36b;color:#182711;text-decoration:none;text-align:center;font-size:14px;font-weight:900}.muted{margin:22px 0}.foot{border-top:1px solid #304438;margin-top:25px;padding-top:16px;color:#819185;font-size:11px}</style></head><body><main class="card"><div class="brand">GATOSPORTS · RUNNING</div><div class="state ${live ? '' : 'off'}">${live ? 'LIVE DELEN AAN' : 'SESSIE GESLOTEN'}</div><h1>${escapeHtml(session.name.split(' ')[0] ?? 'Een hardloper')} ${live ? 'is aan het hardlopen.' : 'heeft de Safety Mode beëindigd.'}</h1><p>${live ? 'De locatie wordt alleen gedeeld via deze tijdelijke, persoonlijke link. Laatste update: ' + escapeHtml(updated) + '.' : 'Deze link bevat geen live locatie meer.'}</p>${live ? mapAction : ''}<div class="foot">Safety Mode vervangt geen hulpdiensten. Bel 112 bij direct gevaar.</div></main></body></html>`);
});

app.use((_req, res) => res.status(404).json({ error: 'Deze pagina bestaat niet.' }));
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  console.error('Request failed:', error instanceof Error ? error.message : 'unknown error');
  return res.status(500).json({ error: 'Er ging iets mis. Probeer het later opnieuw.' });
});

export default app;
