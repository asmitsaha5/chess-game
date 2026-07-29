import { app } from './app.js';
import { config } from './config.js';
import { pool } from './db/pool.js';

async function start() {
  await pool.query('SELECT 1');
  app.listen(config.port, () => console.log(`Chess API listening at http://localhost:${config.port}`));
}

start().catch((error) => {
  console.error('Unable to start server:', error.message);
  process.exit(1);
});
