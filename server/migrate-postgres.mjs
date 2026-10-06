import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PostgresDatabase } from './postgres-database.mjs';
import { seedTables } from './seed-tables.mjs';
import { createDomainViews } from './postgres-views.mjs';

const identifier = name => {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error('Unsupported migration identifier');
  return `"${name}"`;
};
export function readSQLiteDataset(files) {
  const datasets = [];
  for (const filename of files) {
    const source = new DatabaseSync(filename, { readOnly: true });
    try {
      source.exec('BEGIN');
      for (const table of source.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()) {
        identifier(table.name);
        const columns = source.prepare(`PRAGMA table_info(${identifier(table.name)})`).all();
        const ordered = ['records','personal_reviews'].includes(table.name);
        const rows = source.prepare(`SELECT ${ordered ? 'rowid AS rowid,' : ''}* FROM ${identifier(table.name)}${ordered ? ' ORDER BY rowid' : ''}`).all();
        datasets.push({ name: table.name, schema: table.sql, columns, rows });
      }
      source.exec('COMMIT');
    } finally { source.close(); }
  }
  return datasets;
}
export function migrateDataset(db, datasets) {
  const counts = {};
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const table of datasets) {
      db.exec(table.schema.replace(/^CREATE TABLE\s+/i, 'CREATE TABLE IF NOT EXISTS '));
      const pk = table.columns.filter(column => column.pk).sort((a,b) => a.pk-b.pk).map(column => column.name);
      if (!pk.length) throw new Error(`Migration requires primary key: ${table.name}`);
      for (const row of table.rows) {
        const keys = Object.keys(row);
        const previous = db.prepare(`SELECT * FROM ${identifier(table.name)} WHERE ${pk.map(key => `${identifier(key)}=?`).join(' AND ')}`).get(...pk.map(key => row[key]));
        if (previous) {
          if (keys.some(key => String(previous[key]) !== String(row[key]))) throw new Error(`Target differs from source: ${table.name}. Migration rolled back; no records overwritten.`);
          continue;
        }
        db.prepare(`INSERT INTO ${identifier(table.name)}(${keys.map(identifier).join(',')}) VALUES(${keys.map(() => '?').join(',')})`).run(...keys.map(key => row[key]));
      }
      counts[table.name] = db.prepare(`SELECT COUNT(*) AS count FROM ${identifier(table.name)}`).get().count;
    }
    for (const name of ['records','personal_reviews','admin_audit']) {
      const column = name === 'admin_audit' ? 'id' : 'rowid';
      if (datasets.some(table => table.name === name))
        db.query(`SELECT setval(pg_get_serial_sequence('${name}','${column}'), COALESCE((SELECT MAX(${column}) FROM ${name}),1), EXISTS(SELECT 1 FROM ${name}))`);
    }
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  const seed = seedTables(db);
  createDomainViews(db);
  return { counts, seed, fingerprint: createHash('sha256').update(JSON.stringify(datasets)).digest('hex') };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const files = process.argv.slice(2).filter(argument => argument !== '--inspect');
  const datasets = readSQLiteDataset(files.length ? files : ['server/data/commerce.sqlite','server/data/foods.sqlite']);
  if (process.argv.includes('--inspect')) {
    console.log(JSON.stringify(datasets.map(table => ({ table:table.name, rows:table.rows.length })),null,2));
  } else {
    const db = new PostgresDatabase();
    try { console.log(JSON.stringify(migrateDataset(db,datasets),null,2)); } finally { db.close(); }
  }
}
