// Adapt the existing parameterized repository queries to PostgreSQL.
// Data stays in PostgreSQL; no local database, snapshot or filesystem cache.
export function postgresSql(source) {
  let sql = source.trim();
  if (/^PRAGMA\b/i.test(sql)) return null;
  if (/^BEGIN(?: IMMEDIATE)?$/i.test(sql)) return 'BEGIN';
  sql = sql.replace(/CREATE TABLE IF NOT EXISTS (records|personal_reviews)\s*\(/gi, 'CREATE TABLE IF NOT EXISTS $1 (rowid BIGSERIAL UNIQUE,');
  sql = sql.replace(/\bid INTEGER PRIMARY KEY\b/g, 'id BIGSERIAL PRIMARY KEY');
  sql = sql.replace(/INSERT INTO records VALUES/gi, 'INSERT INTO records(id,owner,kind,request_key,fingerprint,data) VALUES');
  sql = sql.replace(/INSERT INTO personal_reviews VALUES/gi, 'INSERT INTO personal_reviews(id,owner,request_key,fingerprint,data) VALUES');
  sql = sql.replace(/SELECT name FROM sqlite_master WHERE type='table' AND name=\?/gi,
    "SELECT table_name AS name FROM information_schema.tables WHERE table_schema=current_schema() AND table_name=?");
  if (/INSERT OR IGNORE/i.test(sql)) sql = sql.replace(/INSERT OR IGNORE/gi, 'INSERT') + ' ON CONFLICT DO NOTHING';
  let index = 0;
  // SQL literals may contain '?'. Replace only placeholders outside literals.
  sql = sql.replace(/'(?:''|[^'])*'|\?/g, token => token === '?' ? `$${++index}` : token);
  return sql;
}
