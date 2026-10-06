import { Worker } from 'node:worker_threads';
import { postgresSql } from './postgres-sql.mjs';

// Existing business rules are synchronous. A dedicated worker owns the network
// connection so their atomic transaction boundaries and API contracts remain intact.
export class PostgresDatabase {
  constructor(connectionString = process.env.DATABASE_URL, { testMode = false } = {}) {
    if (!testMode && !/^postgres(?:ql)?:\/\//.test(connectionString || '')) throw new Error('DATABASE_URL is required');
    this.dialect = 'postgres';
    this.worker = new Worker(new URL('./postgres-worker.mjs', import.meta.url), { workerData: { connectionString, testMode } });
    this.worker.on('error', () => { this.failed = true; });
    this.controlBuffer = new SharedArrayBuffer(8);
    this.dataBuffer = new SharedArrayBuffer(16 * 1024 * 1024);
    try { this.query('SELECT 1 AS connected'); }
    catch (error) { this.failed = true; void this.worker.terminate(); throw error; }
  }
  query(sql, params = [], close = false) {
    if (this.failed) throw new Error('PostgreSQL worker unavailable');
    const control = new Int32Array(this.controlBuffer);
    control.fill(0);
    this.worker.postMessage({ sql, params, close, controlBuffer: this.controlBuffer, dataBuffer: this.dataBuffer });
    if (Atomics.wait(control, 0, 0, 45000) === 'timed-out') {
      this.failed = true;
      void this.worker.terminate();
      throw new Error('PostgreSQL query timed out');
    }
    const result = JSON.parse(new TextDecoder().decode(new Uint8Array(this.dataBuffer, 0, Atomics.load(control, 1))));
    if (result.error) throw Object.assign(new Error(result.error), { code: result.code });
    return result;
  }
  exec(source) {
    for (const statement of source.split(';').map(value => value.trim()).filter(Boolean)) {
      const sql = postgresSql(statement);
      if (sql) this.query(sql);
    }
  }
  prepare(source) {
    const sql = postgresSql(source);
    if (!sql) throw new Error('Unsupported repository statement');
    return {
      all: (...params) => this.query(sql, params).rows,
      get: (...params) => this.query(sql, params).rows[0],
      run: (...params) => ({ changes: this.query(sql, params).changes }),
    };
  }
  close() { try { if (!this.failed) this.query('', [], true); } finally { void this.worker.terminate(); } }
}
