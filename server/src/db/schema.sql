CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_lower_uidx ON app_users (lower(email));

CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  goal text NOT NULL DEFAULT 'Blijf lekker in beweging',
  runs_per_week text NOT NULL DEFAULT '2 keer per week',
  preferred_distance text NOT NULL DEFAULT '5–10 km',
  terrain text NOT NULL DEFAULT 'Parken',
  location_sharing boolean NOT NULL DEFAULT false,
  dark_mode text NOT NULL DEFAULT 'system',
  notification_preferences jsonb NOT NULL DEFAULT '{"training":true,"weather":true,"races":false,"safety":true,"challenges":false}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS routes (
  id text PRIMARY KEY,
  name text NOT NULL,
  area text NOT NULL,
  distance_km double precision NOT NULL,
  duration_min integer NOT NULL,
  type text NOT NULL,
  difficulty text NOT NULL,
  elevation_m integer NOT NULL DEFAULT 0,
  loop boolean NOT NULL DEFAULT false,
  points jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS routes_active_type_idx ON routes (active, type);

CREATE TABLE IF NOT EXISTS saved_routes (
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  route_id text NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, route_id)
);

CREATE TABLE IF NOT EXISTS runs (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  duration_ms integer NOT NULL,
  distance_m double precision NOT NULL,
  average_pace_sec_per_km double precision NOT NULL DEFAULT 0,
  max_pace_sec_per_km double precision,
  elevation_m double precision,
  calories integer,
  feeling text,
  discomfort text,
  notes text,
  weather_snapshot jsonb,
  route_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS runs_user_started_idx ON runs (user_id, started_at);

CREATE TABLE IF NOT EXISTS run_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  altitude_m double precision,
  accuracy_m double precision,
  recorded_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS run_points_run_sequence_uidx ON run_points (run_id, sequence);
CREATE INDEX IF NOT EXISTS run_points_run_idx ON run_points (run_id, recorded_at);

CREATE TABLE IF NOT EXISTS challenges (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  goal_km double precision NOT NULL,
  ends_at timestamptz NOT NULL,
  accent text NOT NULL DEFAULT '#C7F36B',
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS challenge_memberships (
  challenge_id text NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  progress_km double precision NOT NULL DEFAULT 0,
  PRIMARY KEY (challenge_id, user_id)
);
CREATE INDEX IF NOT EXISTS challenge_members_user_idx ON challenge_memberships (user_id, joined_at);

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  prestashop_id text,
  sku text,
  name text NOT NULL,
  category text NOT NULL,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  description text NOT NULL DEFAULT '',
  image_url text,
  product_url text NOT NULL DEFAULT '',
  reason_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_active_category_idx ON products (active, category);

CREATE TABLE IF NOT EXISTS gear_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  purchase_date timestamptz,
  distance_used_m double precision NOT NULL DEFAULT 0,
  replacement_at_m double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gear_items_user_idx ON gear_items (user_id, category);

CREATE TABLE IF NOT EXISTS weather_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  temperature_c double precision NOT NULL,
  wind_kmh double precision NOT NULL,
  precipitation_mm double precision NOT NULL,
  sunset_at timestamptz,
  sampled_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS safety_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  share_token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  last_latitude double precision,
  last_longitude double precision,
  last_updated_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
CREATE INDEX IF NOT EXISTS safety_sessions_token_expiry_idx ON safety_sessions (share_token_hash, expires_at);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS emergency_contacts_user_idx ON emergency_contacts (user_id);

CREATE TABLE IF NOT EXISTS training_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_distance_m double precision,
  target_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS training_goals_user_active_idx ON training_goals (user_id, active);
