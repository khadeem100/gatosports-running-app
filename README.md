# GatoSports Running

GatoSports Running is a Dutch-first Expo / React Native running companion. The mobile client and the private API live together in this repository, while the API uses its own Neon Postgres database. It is a separate project from the PrestaShop installation.

The first build follows Phase 1 of the supplied product brief: onboarding, running conditions, route discovery, GPS run recording, run history, Safety Mode, contextual gear suggestions, a basic catalogue, challenges, profile, and privacy settings. Sample routes, products, weather and challenges are provided as development fixtures until their integrations are configured.

## Project layout

- `app/`, `components/`, `hooks/`, `storage/`: Expo Router mobile app
- `server/`: authenticated Node API, Drizzle schema and migrations
- `server/src/db/schema.sql`: idempotent first-time schema setup for PostgreSQL
- `server/.env.example`: server-only credentials and integrations

The phone never connects directly to Neon. The server owns the database URL, password hashing, access tokens, run synchronization, weather proxy, and safety-share token handling.

## Local development

1. Copy `.env.example` to `.env` and point `EXPO_PUBLIC_API_URL` at the API.
2. Copy `server/.env.example` to `server/.env`; fill in Neon credentials after the app database has been provisioned.
3. Install root and server dependencies with `npm install` in each directory.
4. Run `npm run db:setup` and then `npm run db:seed` from the repository root.
5. Start the API with `npm run server:dev`, then start Expo with `npm start`.

The app remains useful in guest/demo mode if the API URL or database is not configured. Runs are saved locally first; authenticated runs can be synchronized when connectivity returns.

## GPS and builds

Foreground GPS works while a run is open. Background GPS is configured through Expo Location and requires a native development/production build; Expo Go does not support background location. Ask for background access only when a runner starts a run and explain that tracking stops when the user ends it. Test background tracking on real iOS and Android devices before release.

The weather provider uses Open-Meteo behind the API. The included routes and products are labeled development examples; shop links remain disabled until the PrestaShop credentials and shop URL are configured. A real route/map provider is still needed for local route discovery. No PrestaShop password, Neon URL, or JWT secret belongs in an `EXPO_PUBLIC_` variable.

## Deployment

`server/systemd/gatosports-running-api.service.example` and `server/nginx/gatosports-running-api.conf.example` document a separate API service and reverse proxy. Keep this project in `/var/www/gatosports-running-app`; do not place its files in the PrestaShop document root. Create the dedicated service account, set the secret environment file with restricted permissions, and configure a dedicated API hostname and TLS before exposing the service publicly.
