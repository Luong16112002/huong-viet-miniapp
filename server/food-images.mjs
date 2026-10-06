import HOTPOT_IMAGES from "../src/data/hotpot-images.json" with { type: "json" };
export { HOTPOT_IMAGES };

// Legacy names are accepted only at the boundary; records and responses use imageUrl.
export function normalizeFoodImage(food) {
  const { image, imageURL, thumbnail, photo, ...rest } = food;
  const imageUrl =
    [food.imageUrl, image, imageURL, thumbnail, photo].find(
      (value) => typeof value === "string" && value.trim(),
    ) || null;
  return { ...rest, imageUrl };
}

export function normalizeOrderImages(order, menu) {
  if (!Array.isArray(order.items)) return order;
  return {
    ...order,
    items: order.items.map((item) => {
      const food = menu.find(
        (food) => String(food.id) === String(item.productId),
      );
      return normalizeFoodImage({
        ...item,
        imageUrl:
          food?.imageUrl || item.imageUrl || HOTPOT_IMAGES[item.name] || null,
      });
    }),
  };
}

export function migrateFoodImages(db, menu = []) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS food_image_migrations (version TEXT PRIMARY KEY)",
  );
  const version = "canonical-image-url-hotpot-v1";
  if (
    db
      .prepare("SELECT version FROM food_image_migrations WHERE version=?")
      .get(version)
  )
    return { migrated: false, updated: 0 };
  const exists = (name) =>
    !!db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(name);
  let updated = 0;
  const migrate = (food) =>
    normalizeFoodImage({
      ...food,
      ...(HOTPOT_IMAGES[food.name]
        ? { imageUrl: HOTPOT_IMAGES[food.name] }
        : {}),
    });
  db.exec("BEGIN IMMEDIATE");
  try {
    if (exists("foods")) {
      const update = db.prepare("UPDATE foods SET data=? WHERE id=?");
      for (const row of db.prepare("SELECT id,data FROM foods").all()) {
        update.run(JSON.stringify(migrate(JSON.parse(row.data))), row.id);
        updated++;
      }
    }
    if (exists("admin_catalog")) {
      const update = db.prepare(
        "UPDATE admin_catalog SET data=? WHERE kind='menu' AND id=?",
      );
      for (const row of db
        .prepare("SELECT id,data FROM admin_catalog WHERE kind='menu'")
        .all()) {
        update.run(JSON.stringify(migrate(JSON.parse(row.data))), row.id);
        updated++;
      }
      const insert = db.prepare(
        "INSERT OR IGNORE INTO admin_catalog(kind,id,data) VALUES('menu',?,?)",
      );
      for (const food of menu.filter((food) => HOTPOT_IMAGES[food.name]))
        updated += Number(
          insert.run(String(food.id), JSON.stringify(migrate(food))).changes,
        );
    }
    db.prepare("INSERT INTO food_image_migrations(version) VALUES(?)").run(
      version,
    );
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return { migrated: true, updated };
}
