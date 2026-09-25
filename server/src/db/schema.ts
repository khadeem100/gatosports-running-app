import { sql } from 'drizzle-orm';
import {
  boolean, doublePrecision, index, integer, jsonb, pgTable, primaryKey,
  text, timestamp, uniqueIndex, uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('app_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ emailLowerUnique: uniqueIndex('app_users_email_lower_uidx').on(sql`lower(${table.email})`) }));

export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  goal: text('goal').notNull().default('Blijf lekker in beweging'),
  runsPerWeek: text('runs_per_week').notNull().default('2 keer per week'),
  preferredDistance: text('preferred_distance').notNull().default('5–10 km'),
  terrain: text('terrain').notNull().default('Parken'),
  locationSharing: boolean('location_sharing').notNull().default(false),
  darkMode: text('dark_mode').notNull().default('system'),
  notificationPreferences: jsonb('notification_preferences').notNull().default({ training: true, weather: true, races: false, safety: true, challenges: false }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const runs = pgTable('runs', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }).notNull(),
  durationMs: integer('duration_ms').notNull(),
  distanceM: doublePrecision('distance_m').notNull(),
  averagePaceSecPerKm: doublePrecision('average_pace_sec_per_km').notNull().default(0),
  maxPaceSecPerKm: doublePrecision('max_pace_sec_per_km'),
  elevationM: doublePrecision('elevation_m'),
  calories: integer('calories'),
  feeling: text('feeling'),
  discomfort: text('discomfort'),
  notes: text('notes'),
  weatherSnapshot: jsonb('weather_snapshot'),
  routeId: text('route_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ userStartedIndex: index('runs_user_started_idx').on(table.userId, table.startedAt) }));

export const runPoints = pgTable('run_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  sequence: integer('sequence').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  altitudeM: doublePrecision('altitude_m'),
  accuracyM: doublePrecision('accuracy_m'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
}, (table) => ({ runSequenceUnique: uniqueIndex('run_points_run_sequence_uidx').on(table.runId, table.sequence), runIndex: index('run_points_run_idx').on(table.runId, table.recordedAt) }));

export const routes = pgTable('routes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  area: text('area').notNull(),
  distanceKm: doublePrecision('distance_km').notNull(),
  durationMin: integer('duration_min').notNull(),
  type: text('type').notNull(),
  difficulty: text('difficulty').notNull(),
  elevationM: integer('elevation_m').notNull().default(0),
  loop: boolean('loop').notNull().default(false),
  points: jsonb('points').notNull().default([]),
  description: text('description').notNull().default(''),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ activeTypeIdx: index('routes_active_type_idx').on(table.active, table.type) }));

export const savedRoutes = pgTable('saved_routes', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  routeId: text('route_id').notNull().references(() => routes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ pk: primaryKey({ columns: [table.userId, table.routeId] }) }));

export const challenges = pgTable('challenges', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  goalKm: doublePrecision('goal_km').notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  accent: text('accent').notNull().default('#C7F36B'),
  active: boolean('active').notNull().default(true),
});

export const challengeMemberships = pgTable('challenge_memberships', {
  challengeId: text('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  progressKm: doublePrecision('progress_km').notNull().default(0),
}, (table) => ({ pk: primaryKey({ columns: [table.challengeId, table.userId] }), memberIndex: index('challenge_members_user_idx').on(table.userId, table.joinedAt) }));

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  prestashopId: text('prestashop_id'),
  sku: text('sku'),
  name: text('name').notNull(),
  category: text('category').notNull(),
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').notNull().default('EUR'),
  description: text('description').notNull().default(''),
  imageUrl: text('image_url'),
  productUrl: text('product_url').notNull(),
  reasonTags: jsonb('reason_tags').notNull().default([]),
  active: boolean('active').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ activeCategoryIndex: index('products_active_category_idx').on(table.active, table.category) }));

export const gearItems = pgTable('gear_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  purchaseDate: timestamp('purchase_date', { withTimezone: true }),
  distanceUsedM: doublePrecision('distance_used_m').notNull().default(0),
  replacementAtM: doublePrecision('replacement_at_m'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ gearOwnerIndex: index('gear_items_user_idx').on(table.userId, table.category) }));

export const weatherSnapshots = pgTable('weather_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  temperatureC: doublePrecision('temperature_c').notNull(),
  windKmh: doublePrecision('wind_kmh').notNull(),
  precipitationMm: doublePrecision('precipitation_mm').notNull(),
  sunsetAt: timestamp('sunset_at', { withTimezone: true }),
  sampledAt: timestamp('sampled_at', { withTimezone: true }).notNull().defaultNow(),
});

export const safetySessions = pgTable('safety_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  shareTokenHash: text('share_token_hash').notNull().unique(),
  status: text('status').notNull().default('active'),
  lastLatitude: doublePrecision('last_latitude'),
  lastLongitude: doublePrecision('last_longitude'),
  lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
}, (table) => ({ liveTokenIdx: index('safety_sessions_token_expiry_idx').on(table.shareTokenHash, table.expiresAt) }));

export const emergencyContacts = pgTable('emergency_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  contact: text('contact').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ contactUserIndex: index('emergency_contacts_user_idx').on(table.userId) }));

export const trainingGoals = pgTable('training_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  targetDistanceM: doublePrecision('target_distance_m'),
  targetAt: timestamp('target_at', { withTimezone: true }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ userGoalIndex: index('training_goals_user_active_idx').on(table.userId, table.active) }));
