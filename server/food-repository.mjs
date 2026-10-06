import { PostgresDatabase } from "./postgres-database.mjs";
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enrichFood, isDrink } from './food-enrichment.mjs';
import { normalizeFoodImage, migrateFoodImages } from './food-images.mjs';

const categories = { 'main-dish': 'Món chính', starter: 'Khai vị', drink: 'Đồ uống', dessert: 'Tráng miệng' };
export function foodContext(product) {
  return {
    ...normalizeFoodImage(product),
    unit: product.unit ?? 'phần',
    category: product.category ?? categories[product.categoryId] ?? product.categoryId ?? null,
    description: product.description ?? null,
    ingredients: product.ingredients ?? [],
    spicyLevel: product.spicyLevel ?? (product.features?.includes('spicy') ? 'Cay' : null),
    allergens: product.allergens ?? [],
    suitableForChildren: typeof product.suitableForChildren === 'boolean' ? product.suitableForChildren : null,
    childNotes: product.childNotes ?? null,
    suitableFor: product.suitableFor ?? [],
    notSuitableFor: product.notSuitableFor ?? [],
    customizations: product.customizations ?? product.availableOptions ?? product.variantGroups?.flatMap(g => g.options.map(o => g.title + ': ' + o.name)) ?? [],
    servingSize: product.servingSize ?? null,
    calories: product.calories ?? null,
    available: product.available ?? product.availability ?? null,
    pairings: product.pairings ?? [],
    drinkPairings: product.drinkPairings ?? (product.pairings || []).filter(isDrink),
    nutrition: { calories: product.calories ?? null, protein: null, fat: null, carbs: null, ...product.nutrition },
  };
}

export function createFoodRepository(menu, filename, database) {
  if (process.env.NODE_ENV === 'production' && filename) throw new Error('SQLite is not supported in production');
  if (filename && filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = database || (filename ? new DatabaseSync(filename) : new PostgresDatabase());
  db.exec('CREATE TABLE IF NOT EXISTS foods (id TEXT PRIMARY KEY, data TEXT NOT NULL)');
  // Seed new dishes only: preserve restaurant edits across server restarts.
  const insert = db.prepare('INSERT OR IGNORE INTO foods (id, data) VALUES (?, ?)');
  db.exec('CREATE TABLE IF NOT EXISTS food_migrations (version TEXT PRIMARY KEY)');
  const migrate = !db.prepare('SELECT version FROM food_migrations WHERE version = ?').get('context-v2.1');
  const migrateChildren = !db.prepare('SELECT version FROM food_migrations WHERE version = ?').get('child-context-v1');
  const select = db.prepare('SELECT data FROM foods WHERE id = ?');
  const update = db.prepare('UPDATE foods SET data = ? WHERE id = ?');
  db.exec('BEGIN');
  try {
    for (const product of menu) {
      const seed = foodContext(enrichFood(product));
      insert.run(String(product.id), JSON.stringify(seed));
      if (migrateChildren) {
        const existing = JSON.parse(select.get(String(product.id)).data);
        if (existing.name === 'Bò nướng lá lốt' && existing.ingredientsSource === 'menu_description') {
          for (const key of ['description','ingredients','ingredientsSource','ingredientsComplete','spicyLevel','servingSize','customizations','pairings','drinkPairings']) existing[key] = seed[key];
        }
        existing.suitableForChildren ??= seed.suitableForChildren;
        existing.childNotes ??= seed.childNotes;
        update.run(JSON.stringify(foodContext(existing)), String(product.id));
      }
      if (migrate) {
        const existing = JSON.parse(select.get(String(product.id)).data);
        const fields = ['ingredients', 'spicyLevel', 'allergens', 'suitableFor', 'notSuitableFor', 'customizations', 'servingSize', 'pairings', 'drinkPairings', 'nutrition'];
        for (const key of fields) {
          if (existing[key] == null || existing[key] === '' || (Array.isArray(existing[key]) && !existing[key].length)) existing[key] = seed[key];
        }
        if (seed.ingredientsSource === 'restaurant_verified' && existing.ingredientsSource === 'menu_description') {
          existing.ingredients = seed.ingredients;
          existing.ingredientsSource = seed.ingredientsSource;
          existing.ingredientsComplete = seed.ingredientsComplete;
        }
        update.run(JSON.stringify(foodContext(existing)), String(product.id));
      }
    }
    if (migrate) db.prepare('INSERT INTO food_migrations (version) VALUES (?)').run('context-v2.1');
    if (migrateChildren) db.prepare('INSERT INTO food_migrations (version) VALUES (?)').run('child-context-v1');
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); db.close(); throw error; }
  migrateFoodImages(db);
  return {
    list() {
      return db.prepare('SELECT data FROM foods').all().map(row => foodContext(JSON.parse(row.data)));
    },
    getById(id) {
      const row = db.prepare('SELECT data FROM foods WHERE id = ?').get(String(id));
      return row ? foodContext(JSON.parse(row.data)) : null;
    },
    close() { db.close(); },
  };
}
