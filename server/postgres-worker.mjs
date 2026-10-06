import { parentPort, workerData } from 'node:worker_threads';
let client;
async function connect() {
  const { Client, types } = await import('pg');
  types.setTypeParser(20, value => Number(value));
  const connection = new Client({ connectionString: workerData.connectionString, connectionTimeoutMillis: 20000, statement_timeout: 20000 });
  connection.on('error', () => { if (client === connection) client = null; });
  await connection.connect();
  client = connection;
}
try {
  if (workerData.testMode) {
    const { PGlite } = await import('@electric-sql/pglite');
    client = new PGlite();
    await client.waitReady;
  } else {
    await connect();
  }
} catch {
  // Credentials/connection strings can appear in driver errors. Never expose them.
  client = null;
}
parentPort.on('message', async ({ sql, params, close, controlBuffer, dataBuffer }) => {
  const control = new Int32Array(controlBuffer), data = new Uint8Array(dataBuffer);
  let result;
  try {
    if (!client && !workerData.testMode) await connect();
    if (!client) throw new Error('PostgreSQL connection unavailable; check DATABASE_URL and TLS');
    if (close) {
      if (workerData.testMode) await client.close(); else await client.end();
      result = { rows: [], changes: 0 };
    } else {
      const response = await client.query(sql, params);
      result = { rows: response.rows, changes: response.rowCount ?? response.affectedRows ?? 0 };
      if (sql === 'BEGIN' && !workerData.testMode)
        await client.query('SELECT pg_advisory_xact_lock(728194501)');
    }
  } catch (error) {
    result = { error: 'PostgreSQL query failed', code: error.code || 'DATABASE_UNAVAILABLE' };
  }
  const encoded = new TextEncoder().encode(JSON.stringify(result));
  if (encoded.length > data.length) {
    const fallback = new TextEncoder().encode(JSON.stringify({ error: 'Database result exceeds transfer limit', code: 'RESULT_TOO_LARGE' }));
    data.set(fallback); Atomics.store(control, 1, fallback.length);
  } else { data.set(encoded); Atomics.store(control, 1, encoded.length); }
  Atomics.store(control, 0, 1); Atomics.notify(control, 0);
});
