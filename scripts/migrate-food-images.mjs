import { DatabaseSync } from "node:sqlite";
import { existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { migrateFoodImages } from "../server/food-images.mjs";

const envFile = fileURLToPath(new URL("../server/.env", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);
const foodFile =
  process.env.FOOD_DB_PATH ||
  fileURLToPath(new URL("../server/data/foods.sqlite", import.meta.url));
const commerceFile =
  process.env.COMMERCE_DB_PATH ||
  fileURLToPath(new URL("../server/data/commerce.sqlite", import.meta.url));
let menu = [];
for (const filename of [foodFile, commerceFile]) {
  if (!existsSync(filename)) throw new Error(`Database not found: ${filename}`);
  const db = new DatabaseSync(filename);
  try {
    // Checkpoint before taking a recoverable backup, including WAL contents.
    db.exec("PRAGMA wal_checkpoint(FULL)");
    copyFileSync(
      filename,
      `${filename}.before-food-images-${Date.now()}.sqlite`,
    );
    console.log(filename, migrateFoodImages(db, menu));
    if (filename === foodFile)
      menu = db
        .prepare("SELECT data FROM foods")
        .all()
        .map((row) => JSON.parse(row.data));
  } finally {
    db.close();
  }
}
