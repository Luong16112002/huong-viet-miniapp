import { DatabaseSync } from "node:sqlite";
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import {
  capacityForNumber,
  tablePrefixes,
  tableCode,
  canonicalArea,
  validateTablePolicy,
} from "./table-policy.mjs";
export function seedTables(db, { dryRun = false } = {}) {
  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec(
      "CREATE TABLE IF NOT EXISTS restaurant_tables(id TEXT PRIMARY KEY,data TEXT NOT NULL)",
    );
    const existing = db
      .prepare("SELECT data FROM restaurant_tables")
      .all()
      .map((r) => JSON.parse(r.data));
    if (existing.some((t) => !tablePrefixes[canonicalArea(t.area)]))
      throw Error(
        "Có bàn thuộc khu không hợp lệ. Cần chuẩn hóa trước khi seed.",
      );
    for (const area of Object.keys(tablePrefixes)) {
      const rows = existing.filter((t) => canonicalArea(t.area) === area);
      if (rows.length > 100)
        throw Error(
          `Khu ${area} hiện có ${rows.length} bàn, vượt giới hạn 100. Chưa thay đổi dữ liệu.`,
        );
      if (
        rows.some(
          (t) =>
            !Array.from({ length: 100 }, (_, i) =>
              tableCode(area, i + 1),
            ).includes(t.id),
        )
      )
        throw Error(
          `Khu ${area} có mã bàn cũ. Cần chuyển đổi liên kết trước khi seed; không tự tạo thêm bàn.`,
        );
    }
    const pending = [];
    let skipped = 0;
    for (const area of Object.keys(tablePrefixes))
      for (let number = 1; number <= 100; number++) {
        const code = tableCode(area, number);
        if (existing.some((t) => t.id === code)) {
          skipped++;
          continue;
        }
        const row = {
          id: code,
          code,
          name: "Bàn " + String(number).padStart(3, "0"),
          area,
          capacity: capacityForNumber(number),
          status: "AVAILABLE",
          active: true,
        };
        validateTablePolicy(row, [...existing, ...pending]);
        pending.push(row);
      }
    if (!dryRun) {
      const insert = db.prepare(
        "INSERT INTO restaurant_tables(id,data) VALUES(?,?)",
      );
      for (const row of pending) insert.run(row.id, JSON.stringify(row));
    }
    db.exec(dryRun ? "ROLLBACK" : "COMMIT");
    return { created: pending.length, skipped, dryRun };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const env = fileURLToPath(new URL("./.env", import.meta.url));
  if (existsSync(env)) process.loadEnvFile(env);
  const db = new DatabaseSync(
    process.env.COMMERCE_DB_PATH ||
      fileURLToPath(new URL("./data/commerce.sqlite", import.meta.url)),
  );
  try {
    console.log(
      JSON.stringify(
        seedTables(db, { dryRun: process.argv.includes("--dry-run") }),
      ),
    );
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}
