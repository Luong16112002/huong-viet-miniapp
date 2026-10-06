import { normalizeOrderImages } from './food-images.mjs';
﻿import { timingSafeEqual } from "node:crypto";
import { planBulkTables } from "./bulk-tables.mjs";
import { createAdminAuth } from './admin-auth.mjs';
import {canonicalArea,validateTablePolicy} from './table-policy.mjs';
import { createAdminCatalog } from "./admin-catalog.mjs";
export const tableStatuses = [
  "AVAILABLE",
  "RESERVED",
  "OCCUPIED",
  "CLEANING",
  "DISABLED",
];
export const areas = ["indoor", "garden", "private", "floor1", "floor2"];
export const stateLabels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  checked_in: "Đã check-in",
  preparing: "Đang chuẩn bị",
  ready: "Sẵn sàng",
  serving: "Đang phục vụ",
  delivering: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  rejected: "Từ chối",
};
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const start = (b) => Date.parse(`${b.date}T${b.time}:00+07:00`);
const end = (b) => start(b) + (b.durationMinutes || 120) * 60000;
const activeBooking = (b) =>
  ["pending", "confirmed", "checked_in"].includes(b.status);
export function createAdmin(
  db,
  { key, username = process.env.ADMIN_USERNAME, passwordHash = process.env.ADMIN_PASSWORD_HASH, menu = [], vouchers = [] } = {},
) {
  const auth = createAdminAuth({username,passwordHash});
  const catalog = createAdminCatalog(db, menu, vouchers);
  db.exec(
    "CREATE TABLE IF NOT EXISTS restaurant_tables (id TEXT PRIMARY KEY,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS admin_audit (id INTEGER PRIMARY KEY,created_at TEXT NOT NULL,entity_id TEXT NOT NULL,action TEXT NOT NULL,data TEXT NOT NULL)",
  );
  const tables = () =>
    db
      .prepare("SELECT data FROM restaurant_tables ORDER BY id")
      .all()
      .map((r) => {const t=JSON.parse(r.data);return {...t,code:t.id,area:canonicalArea(t.area)};});
  const records = (kind) =>
    db
      .prepare("SELECT data FROM records WHERE kind=? ORDER BY rowid DESC")
      .all(kind)
      .map((r) => {const record=JSON.parse(r.data);return kind === 'order' ? normalizeOrderImages(record, menu) : record;});
  const saveTable = (t) =>
    db
      .prepare(
        "INSERT INTO restaurant_tables(id,data) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
      )
      .run(t.id, JSON.stringify(t));
  const save = (r) =>
    db
      .prepare("UPDATE records SET data=? WHERE id=?")
      .run(JSON.stringify(r), r.id);
  const occupiedByOther = (tableId, except) =>
    records("reservation").some(
      (b) =>
        b.id !== except && b.tableId === tableId && b.status === "checked_in",
    );
  const conflict = (tableId, b, bookings = records("reservation")) =>
    bookings.some(
      (other) =>
        other.id !== b.id &&
        other.tableId === tableId &&
        activeBooking(other) &&
        start(b) < end(other) &&
        end(b) > start(other),
    );
  function suitable(t, b, bookings = records("reservation")) {
    return (
      ["AVAILABLE", "RESERVED"].includes(t.status) &&
      t.active === true &&
      t.capacity >= b.guests &&
      t.area === b.area &&
      !conflict(t.id, b, bookings)
    );
  }
  const suggestions = (b) => {
    const bookings = records("reservation");
    return tables().filter(t => suitable(t, b, bookings)).sort((a, c) => {
      const proximity = t => bookings.filter(r => r.tableId === t.id && activeBooking(r)).reduce((n, r) => Math.min(n, Math.abs(start(r) - start(b))), Infinity);
      return a.capacity - c.capacity || (proximity(c) - proximity(a) || 0) || a.id.localeCompare(c.id);
    });
  };
  const audit = (id, action, data) =>
    db
      .prepare(
        "INSERT INTO admin_audit(created_at,entity_id,action,data) VALUES(?,?,?,?)",
      )
      .run(new Date().toISOString(), id, action, JSON.stringify(data));
  function stamp(r, status) {
    const now = new Date().toISOString();
    r.updatedAt = now;
    r.timeline = [
      ...(r.timeline || [
        { at: r.createdAt, status: "pending", label: "Khách gửi yêu cầu" },
      ]),
      { at: now, status, label: stateLabels[status] },
    ];
  }
  function release(tableId, cleaning = false) {
    const t = tables().find((t) => t.id === tableId);
    if (t && !occupiedByOther(tableId)) {
      t.status = cleaning
        ? "CLEANING"
        : records("reservation").some(
              (b) => b.tableId === tableId && activeBooking(b),
            )
          ? "RESERVED"
          : "AVAILABLE";
      saveTable(t);
    }
  }
  async function route(req, res, send, path) {
    if (!path.startsWith("/api/admin/")) return false;
    try {
      if (await auth.route(req,res,send,path)) return true;
      if (!key) auth.requireSession(req);
      const supplied = req.headers.authorization?.replace(/^Bearer /, "") || "";
      if (
        key && (Buffer.byteLength(supplied) !== Buffer.byteLength(key) ||
        !timingSafeEqual(Buffer.from(supplied), Buffer.from(key)))
      )
        fail("Mã truy cập quản trị không hợp lệ.", 401);
      const requestUrl = new URL(req.url || path, 'http://localhost');
      const [, , , collection, rawId, action] = path.split('?')[0].split("/");
      const id = rawId ? decodeURIComponent(rawId) : undefined;
      if (
        ![
          "dashboard",
          "tables",
          "bookings",
          "orders",
          "menu",
          "promotions",
        ].includes(collection)
      )
        fail("Không tìm thấy.", 404);
      if (req.method === "GET") {
        if (collection === "menu" || collection === "promotions") {
          const rows = catalog.list(collection).map((r) =>
            collection === "promotions"
              ? {
                  ...r,
                  usage: records("order").filter(
                    (o) => o.voucherCode === r.code && o.state !== "cancelled",
                  ).length,
                }
              : r,
          );
          send(res, 200, rows);
          return true;
        }
        if (collection === "dashboard") {
          const bookings = records("reservation"),
            orders = records("order");
          send(res, 200, {
            tables: tables().length,
            tableStats: {total:tables().filter(t=>t.active).length,...Object.fromEntries(areas.map(area=>[area,tables().filter(t=>t.active&&t.area===area).length]))},
            available: tables().filter((t) => t.status === "AVAILABLE").length,
            pendingBookings: bookings.filter((b) => b.status === "pending")
              .length,
            pendingOrders: orders.filter((o) => o.state === "pending").length,
            revenue: orders
              .filter((o) => o.state === "completed")
              .reduce((s, o) => s + o.totalAmount, 0),
            recentOrders: orders.slice(0, 8),
            recentBookings: bookings.slice(0, 8),
          });
          return true;
        }
        let rows =
          collection === "tables"
            ? tables()
            : records(collection === "bookings" ? "reservation" : "order");
        if(collection === 'tables' && !id){
          const area=requestUrl.searchParams.get('area');
          if(area && !areas.includes(area)) fail('Khu vực không hợp lệ.');
          if(area) rows=rows.filter(t=>t.area===area);
          console.log('AREA FILTER:',area || 'all');
          console.log('TABLE COUNT:',rows.length);
        }
        if (collection === "bookings")
          rows = rows.map((b) => ({ ...b, suggestedTables: suggestions(b) }));
        const result = id ? rows.find((r) => r.id === id) : rows;
        if (!result) fail("Không tìm thấy.", 404);
        send(res, 200, result);
        return true;
      }
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 16000) fail("Dữ liệu quá lớn.", 413);
      }
      let input = {};
      try {
        if (body) input = JSON.parse(body);
      } catch {
        fail("Dữ liệu không hợp lệ.");
      }
      if (!input || typeof input !== "object" || Array.isArray(input))
        fail("Dữ liệu không hợp lệ.");
      db.exec("BEGIN IMMEDIATE");
      let result;
      try {
        if (
          collection === "tables" &&
          id === "bulk-create" &&
          req.method === "POST"
        ) {
          const plan = planBulkTables(input, tables(), areas, tableStatuses);
          for (const table of plan.tables) saveTable(table);
          result = {
            success: true,
            count: plan.tables.length,
            created: plan.tables.length,
            skipped: plan.skipped,
            message: `Đã tạo ${plan.tables.length} bàn.`,
          };
        } else if (collection === "menu" || collection === "promotions") {
          result = catalog.change(collection, id, req.method, input);
        } else if (collection === "tables") {
          const current = tables().find((t) => t.id === id);
          if (id && !current) fail("Không tìm thấy bàn.", 404);
          if (req.method === "DELETE") {
            if (!id) fail("Thiếu mã bàn.");
            if (
              records("reservation").some(
                (b) => b.tableId === id && activeBooking(b),
              ) ||
              records("order").some(
                (o) =>
                  o.tableId === id &&
                  !["completed", "cancelled"].includes(o.state),
              )
            )
              fail(
                "Bàn đang có lịch hoặc đơn chưa hoàn tất. Hãy xử lý trước khi xóa.",
              );
            // Keep historical table references intact.
            saveTable({ ...current, status: "DISABLED" });
            result = { success: true };
          } else if (req.method === "POST" || req.method === "PUT" || (req.method === "PATCH" && action === "status")) {
            if (action === "status") {
              console.log("UPDATE TABLE:", id, input.status);
              if (!id) fail("Thiếu mã bàn.");
              if (!tableStatuses.includes(input.status)) fail("Trạng thái bàn không hợp lệ");
            }
            if (req.method === "POST" && id) fail("Đường dẫn không hợp lệ.");
            if (req.method === "PUT" && !id) fail("Thiếu mã bàn.");
            const next =
              action === "status"
                ? { ...current, status: input.status }
                : {
                    id:
                      current?.id ||
                      String(input.id || "")
                        .trim()
                        .toUpperCase(),
                    name: String(input.name || "").trim(),
                    area: canonicalArea(input.area),
                    capacity: input.capacity,
                    status: input.status || "AVAILABLE",
                    note: String(input.note || "").slice(0, 500),
                  };
            if (
              !/^[A-Z0-9_-]{1,24}$/.test(next.id) ||
              !next.name ||
              next.name.length > 80 ||
              !areas.includes(next.area) ||
              !Number.isInteger(next.capacity) ||
              next.capacity < 1 ||
              next.capacity > 50 ||
              !tableStatuses.includes(next.status)
            )
              fail("Thông tin bàn chưa hợp lệ.");
            if (!id && tables().some((t) => t.id === next.id))
              fail("Mã bàn đã tồn tại.", 409);
            validateTablePolicy(next,tables(),current);
            next.code=next.id;
            const bookings = records("reservation").filter(
              (b) => b.tableId === next.id && activeBooking(b),
            );
            if (
              next.status === "DISABLED" &&
              records("order").some(
                (o) =>
                  o.tableId === next.id &&
                  !["completed", "cancelled"].includes(o.state),
              )
            )
              fail("Bàn còn đơn chưa hoàn tất.");
            if (
              bookings.some(
                (b) => b.guests > next.capacity || b.area !== next.area,
              ) ||
              (bookings.length && next.status === "DISABLED")
            )
              fail("Bàn đang có lịch đặt; không thể thay đổi thông tin này.");
            if (
              current?.status === "OCCUPIED" &&
              next.status !== "OCCUPIED" &&
              (next.status !== "CLEANING" ||
                bookings.some((b) => b.status === "checked_in") ||
                records("order").some(
                  (o) =>
                    o.tableId === id &&
                    !["completed", "cancelled"].includes(o.state),
                ))
            )
              fail(
                "Hãy hoàn tất lượt khách và đơn tại bàn trước khi chuyển trạng thái.",
              );
            if (bookings.length && next.status === "AVAILABLE")
              next.status = "RESERVED";
            next.active = next.status !== 'DISABLED';
            saveTable(next);
            result = req.method === "PATCH" ? { success: true, table: next } : next;
          } else fail("Thao tác không hợp lệ.", 405);
        } else {
          if (req.method !== "PUT" || !id) fail("Thao tác không hợp lệ.", 405);
          const booking = collection === "bookings",
            r = records(booking ? "reservation" : "order").find(
              (r) => r.id === id,
            );
          if (!r) fail("Không tìm thấy yêu cầu.", 404);
          if (booking && action === "assign-table") {
            if (!["pending", "confirmed"].includes(r.status))
              fail("Chỉ xếp bàn cho lịch chưa check-in.");
            const t = tables().find((t) => t.id === input.tableId);
            const next = {
              ...r,
              durationMinutes:
                input.durationMinutes ?? r.durationMinutes ?? 120,
            };
            if (
              !Number.isInteger(next.durationMinutes) ||
              next.durationMinutes < 30 ||
              next.durationMinutes > 360
            )
              fail("Thời lượng phải từ 30 đến 360 phút.");
            if (
              !t ||
              t.capacity < r.guests ||
              t.area !== r.area ||
              !["AVAILABLE", "RESERVED"].includes(t.status)
            )
              fail("Bàn không phù hợp số khách, khu vực hoặc trạng thái.");
            if (conflict(t.id, next))
              fail("Bàn này đã có khách trong khung giờ được chọn.", 409);
            const old = r.tableId;
            Object.assign(r, next, { tableId: t.id, tableName: t.name });
            save(r);
            saveTable({ ...t, status: "RESERVED" });
            if (old && old !== t.id) release(old);
            result = r;
          } else if (action === "status") {
            const status = String(input.status || "").toLowerCase(),
              previous = booking ? r.status : r.state;
            const transitions = booking
              ? {
                  pending: ["confirmed", "rejected", "cancelled"],
                  confirmed: ["checked_in", "cancelled", "rejected"],
                  checked_in: ["completed"],
                }
              : {
                  pending: ["confirmed", "cancelled"],
                  confirmed: ["preparing", "cancelled"],
                  preparing: ["ready", "cancelled"],
                  ready:
                    r.deliveryType === "delivery"
                      ? ["delivering", "cancelled"]
                      : r.deliveryType === "dinein"
                        ? ["serving", "cancelled"]
                        : ["completed", "cancelled"],
                  serving: ["completed"],
                  delivering: ["completed"],
                };
            if (!transitions[previous]?.includes(status))
              fail("Chuyển trạng thái không hợp lệ.", 409);
            if (
              !booking &&
              r.deliveryType === "dinein" &&
              !r.tableId &&
              input.tableId
            )
              r.tableId = String(input.tableId);
            const t = tables().find((t) => t.id === r.tableId);
            if (booking && status === "confirmed" && (!t || !suitable(t, r)))
              fail("Vui lòng gán bàn phù hợp trước khi xác nhận.");
            if (booking && status === "checked_in") {
              if (
                !t ||
                !["AVAILABLE", "RESERVED"].includes(t.status) ||
                occupiedByOther(t.id, r.id) ||
                conflict(t.id, r)
              )
                fail("Bàn chưa sẵn sàng để check-in.", 409);
              if (Date.now() < start(r) - 30 * 60000 || Date.now() >= end(r))
                fail("Chỉ check-in trong khung giờ đặt, sớm tối đa 30 phút.");
              saveTable({ ...t, status: "OCCUPIED" });
            }
            if (
              !booking &&
              r.deliveryType === "dinein" &&
              (!t || t.status === "DISABLED")
            )
              fail("Đơn tại bàn cần được gắn với bàn hợp lệ.");
            if (!booking && status === "serving") {
              if (!["AVAILABLE", "RESERVED", "OCCUPIED"].includes(t.status))
                fail("Bàn chưa sẵn sàng phục vụ.", 409);
              if (t.status !== "OCCUPIED")
                saveTable({ ...t, status: "OCCUPIED" });
            }
            if (booking) r.status = status;
            else
              Object.assign(r, {
                state: status,
                stateLabel: stateLabels[status],
                canCancel: ["pending", "confirmed"].includes(status),
                canPickup: status === "ready" && r.deliveryType === "pickup",
                canReorder: ["completed", "cancelled"].includes(status),
              });
            stamp(r, status);
            save(r);
            if (
              booking &&
              ["cancelled", "rejected"].includes(status) &&
              r.tableId
            )
              release(r.tableId);
            if (
              (booking && status === "completed") ||
              (!booking &&
                status === "completed" &&
                input.customerLeft &&
                r.deliveryType === "dinein")
            ) {
              if (
                records("order").some(
                  (o) =>
                    o.id !== r.id &&
                    o.tableId === r.tableId &&
                    !["completed", "cancelled"].includes(o.state),
                )
              )
                fail("Bàn còn đơn chưa hoàn tất.", 409);
              for (const b of records("reservation").filter(
                (b) => b.tableId === r.tableId && b.status === "checked_in",
              )) {
                b.status = "completed";
                stamp(b, "completed");
                save(b);
              }
              release(r.tableId, true);
            }
            result = r;
          } else fail("Thao tác không hợp lệ.", 405);
        }
        audit(
          id || result.id || result.code,
          `${req.method} ${collection}/${action || ""}`,
          input,
        );
        db.exec("COMMIT");
        if (collection === "menu" || collection === "promotions")
          catalog.apply(collection, result);
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      send(res, 200, result);
    } catch (error) {
      if (path.split('?')[0].endsWith('/status') && path.includes('/tables/'))
        console.error("[UPDATE TABLE STATUS]", error);
      send(res, error.status || 500, {
        success: false,
        message: error.status ? error.message : "Không thể cập nhật dữ liệu quản trị.",
        ...(error.code === "PROMO_CODE_EXISTS" ? { success: false, code: error.code } : {}),
        error: error.status
          ? error.message
          : "Chưa xử lý được yêu cầu quản trị.",
      });
    }
    return true;
  }
  return { route, tables, suggestions, release };
}
