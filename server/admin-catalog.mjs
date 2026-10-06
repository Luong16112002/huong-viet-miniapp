import { normalizeFoodImage, migrateFoodImages } from './food-images.mjs';
// Persistent overrides share the live arrays used by pricing and AI.
export function createAdminCatalog(db, menu, vouchers) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS admin_catalog (kind TEXT,id TEXT,data TEXT,PRIMARY KEY(kind,id))",
  );
  if (db.dialect === 'postgres') {
    const insert = db.prepare("INSERT OR IGNORE INTO admin_catalog(kind,id,data) VALUES(?,?,?)");
    for (const row of menu) insert.run('menu', String(row.id), JSON.stringify(row));
    for (const row of vouchers) insert.run('promotions', String(row.code), JSON.stringify(row));
  }
  migrateFoodImages(db, menu);
  for (let i = 0; i < menu.length; i++) menu[i] = normalizeFoodImage(menu[i]);
  const source = (kind) => (kind === "menu" ? menu : vouchers);
  const key = (kind, r) => String(kind === "menu" ? r.id : r.code);
  const apply = (kind, r) => {
    const list = source(kind),
      i = list.findIndex((x) => key(kind, x) === key(kind, r));
    if (i < 0) list.push(r);
    else list[i] = r;
  };
  for (const row of db.prepare("SELECT * FROM admin_catalog").all())
    apply(row.kind, JSON.parse(row.data));
  const fail = (message, code) => {
    throw Object.assign(new Error(message), { status: 400, ...(code ? { code } : {}) });
  };
  return {
    list(kind) {
      return source(kind).filter((r) => !r.deleted).map(r => kind === 'menu' ? normalizeFoodImage(r) : r);
    },
    change(kind, id, method, input) {
      if (!["POST", "PUT", "DELETE"].includes(method))
        fail("Thao tác không hợp lệ.");
      const current = source(kind).find((r) => key(kind, r) === id);
      if (method !== "POST" && !current) fail("Không tìm thấy dữ liệu.");
      if (method === "POST" && id) fail("Đường dẫn không hợp lệ.");
      let next;
      if (method === "DELETE")
        next = { ...current, deleted: true, available: false, enabled: false };
      else if (kind === "menu") {
        const rawImage = input.imageUrl ?? input.image ?? current?.imageUrl ?? current?.image;
        const imageUrl = typeof rawImage === 'string' ? rawImage.trim() : null;
        if (imageUrl && !/^(https:\/\/|\/[^/])/.test(imageUrl))
          fail("Ảnh phải là đường dẫn nội bộ hoặc HTTPS.");
        next = {
          ...current,
          id:
            current?.id ??
            Math.max(0, ...menu.map((r) => Number(r.id) || 0)) + 1,
          name: String(input.name ?? current?.name ?? "").trim(),
          price: Number(input.price ?? current?.price),
          category: String(input.category ?? current?.category ?? "").trim(),
          description: String(
            input.description ?? current?.description ?? "",
          ).slice(0, 2000),
          imageUrl,
          available: input.available ?? current?.available ?? true,
        };
        next.categoryId = {
          "Món chính": "main-dish",
          "mon-chinh": "main-dish",
          "main-dish": "main-dish",
          "Khai vị": "starter",
          "khai-vi": "starter",
          starter: "starter",
          "Đồ uống": "drink",
          "nuoc-uong": "drink",
          drink: "drink",
          "Tráng miệng": "dessert",
          "trang-mieng": "dessert",
          dessert: "dessert",
        }[next.category];
        next.features ??= [];
        next.variantGroups ??= [];
        next = normalizeFoodImage(next);
        if (
          !next.name ||
          next.name.length > 120 ||
          !Number.isFinite(next.price) ||
          next.price < 0 ||
          next.price > 1e9 ||
          !next.categoryId ||
          typeof next.available !== "boolean"
        )
          fail("Vui lòng kiểm tra tên món, danh mục và giá.");
      } else {
        next = {
          ...current,
          code:
            current?.code ||
            String(input.code || "")
              .trim()
              .toUpperCase(),
          name: String(input.name ?? current?.name ?? "").trim(),
          amount: Number(input.amount ?? current?.amount),
          minSubtotal: Number(input.minSubtotal ?? current?.minSubtotal ?? 0),
          expiresAt: input.expiresAt ?? current?.expiresAt,
          startsAt: input.startsAt === null || input.startsAt === ""
            ? undefined
            : input.startsAt ?? current?.startsAt,
          enabled: input.enabled ?? current?.enabled ?? true,
        };
        if (
          !/^[A-Z0-9_-]{2,30}$/.test(next.code) ||
          !next.name ||
          next.name.length > 120 ||
          !Number.isFinite(next.amount) ||
          next.amount <= 0 ||
          next.amount > 1e9 ||
          !Number.isFinite(next.minSubtotal) ||
          next.minSubtotal < 0 ||
          !Number.isFinite(Date.parse(next.expiresAt)) ||
          (next.startsAt && (!Number.isFinite(Date.parse(next.startsAt)) || Date.parse(next.startsAt) >= Date.parse(next.expiresAt))) ||
          typeof next.enabled !== "boolean"
        )
          fail("Vui lòng kiểm tra mã, mức giảm và ngày hết hạn.");
        if (method === "POST" && vouchers.some((v) => v.code === next.code))
          fail("Mã ưu đãi đã tồn tại.", "PROMO_CODE_EXISTS");
      }
      db.prepare(
        "INSERT INTO admin_catalog(kind,id,data) VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data",
      ).run(kind, key(kind, next), JSON.stringify(next));
      return next;
    },
    apply,
  };
}
