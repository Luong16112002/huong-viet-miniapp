export function createDomainViews(db) {
  db.exec(`
    CREATE OR REPLACE VIEW tables AS SELECT id,data FROM restaurant_tables;
    CREATE OR REPLACE VIEW bookings AS SELECT id,owner,data FROM records WHERE kind='reservation';
    CREATE OR REPLACE VIEW orders AS SELECT id,owner,data FROM records WHERE kind='order';
    CREATE OR REPLACE VIEW promotions AS SELECT id,data FROM admin_catalog WHERE kind='promotions';
    CREATE OR REPLACE VIEW customers AS
      SELECT owner AS id, jsonb_build_object('owner',owner,'records',jsonb_agg(data::jsonb ORDER BY rowid)) AS data
      FROM records GROUP BY owner
  `);
}
