import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('Set DATABASE_URL_UNPOOLED or DATABASE_URL in server/.env first.');

const client = new pg.Client({ connectionString: databaseUrl, connectionTimeoutMillis: 8000 });
try {
  await client.connect();
  await client.query('BEGIN');
  const schema = await readFile(new URL('../src/db/schema.sql', import.meta.url), 'utf8');
  await client.query(schema);
  await client.query('COMMIT');
  console.log('GatoSports Running database schema is ready.');
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
