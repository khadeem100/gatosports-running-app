import 'dotenv/config';
import app from './app.js';
import { pool } from './db/client.js';

const port = Number(process.env.PORT ?? 4100);
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`GatoSports Running API listening on 127.0.0.1:${port}`);
});

async function shutdown(signal: string) {
  console.log(`${signal}: shutting down GatoSports Running API`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
process.on('SIGINT', () => { void shutdown('SIGINT'); });
