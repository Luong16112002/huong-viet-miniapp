import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { Readable } from "node:stream";
import { createAdmin } from "./admin.mjs";
test("admin auth, table inventory, overlap boundaries and booking lifecycle are transactional", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE records(id TEXT PRIMARY KEY,kind TEXT,data TEXT)");
  const admin = createAdmin(db, { key: "test-admin-key" });
  const put = (r, kind = "reservation") =>
    db
      .prepare("INSERT OR REPLACE INTO records VALUES(?,?,?)")
      .run(r.id, kind, JSON.stringify(r));
  const get = (id) =>
    JSON.parse(db.prepare("SELECT data FROM records WHERE id=?").get(id).data);
  async function call(path, method = "GET", body = {}, key = "test-admin-key") {
    let result;
    const req = Readable.from(method === "GET" ? [] : [JSON.stringify(body)]);
    req.method = method;
    req.headers = { authorization: "Bearer " + key };
    await admin.route(
      req,
      {},
      (_r, status, data) => {
        result = { status, data };
      },
      "/api/admin" + path,
    );
    return result;
  }
  try {
    assert.equal((await call("/tables", "GET", {}, "guest")).status, 401);
    const table = {
      id: "IN-001",
      name: "Bàn 01",
      area: "indoor",
      capacity: 4,
      status: "AVAILABLE",
    };
    assert.equal((await call("/tables", "POST", table)).status, 200);
    assert.equal((await call("/tables", "POST", table)).status, 409);
    // Status updates use PATCH and persist canonical values without altering table details.
    for (const status of ["RESERVED", "OCCUPIED", "CLEANING", "DISABLED", "AVAILABLE"]) {
      const response = await call("/tables/IN-001/status", "PATCH", { status });
      assert.equal(response.status, 200);
      assert.equal(response.data.success, true);
      assert.equal(response.data.table.status, status);
      const persisted = JSON.parse(db.prepare("SELECT data FROM restaurant_tables WHERE id=?").get(table.id).data);
      assert.equal(persisted.status, status);
      assert.equal(persisted.name, table.name);
      assert.equal(persisted.active, status !== "DISABLED");
      assert.equal((await call("/tables/IN-001")).data.status, status);
    }
    for (const status of ["Trống", "invalid", null]) {
      assert.equal((await call("/tables/IN-001/status", "PATCH", { status })).status, 400);
      assert.equal(admin.tables()[0].status, "AVAILABLE");
    }
    assert.equal((await call("/tables/IN-099/status", "PATCH", { status: "CLEANING" })).status, 404);
    assert.equal((await call("/tables/IN-001/status", "PATCH", { status: "CLEANING" }, "guest")).status, 401);

    const date = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date());
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date());
    const booking = {
      id: "b1",
      name: "Khách",
      phone: "0901234567",
      date,
      time,
      guests: 4,
      area: "indoor",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    put(booking);
    put({ ...booking, id: "b2" });
    assert.equal(
      (await call("/bookings/b1/status", "PUT", { status: "CONFIRMED" }))
        .status,
      400,
    );
    assert.equal(
      (
        await call("/bookings/b1/assign-table", "PUT", {
          tableId: "IN-001",
          durationMinutes: 120,
        })
      ).status,
      200,
    );
    assert.equal(
      (await call("/bookings/b2/assign-table", "PUT", { tableId: "IN-001" }))
        .status,
      409,
    );
    assert.equal(get("b2").tableId, undefined);
    assert.equal((await call("/tables/IN-001", "DELETE")).status, 400);
    assert.equal(
      (await call("/bookings/b1/status", "PUT", { status: "CONFIRMED" }))
        .status,
      200,
    );
    assert.equal(
      (await call("/bookings/b1/status", "PUT", { status: "CHECKED_IN" }))
        .status,
      200,
    );
    assert.equal(admin.tables()[0].status, "OCCUPIED");
    assert.equal(
      (await call("/tables/IN-001/status", "PUT", { status: "AVAILABLE" })).status,
      400,
    );
    put(
      {
        id: "o1",
        state: "preparing",
        tableId: "IN-001",
        deliveryType: "dinein",
        totalAmount: 100,
        createdAt: new Date().toISOString(),
      },
      "order",
    );
    assert.equal(
      (await call("/bookings/b1/status", "PUT", { status: "COMPLETED" }))
        .status,
      409,
    );
    assert.equal(get("b1").status, "checked_in");
    for (const status of ["READY", "SERVING", "COMPLETED"])
      assert.equal(
        (
          await call("/orders/o1/status", "PUT", {
            status,
            customerLeft: status === "COMPLETED",
          })
        ).status,
        200,
      );
    assert.equal(get("b1").status, "completed");
    assert.equal(admin.tables()[0].status, "CLEANING");
    assert.equal(get("o1").timeline.length, 4);
    assert.equal(
      (await call("/tables/IN-001/status", "PUT", { status: "AVAILABLE" })).status,
      200,
    );
    put({ ...booking, id: "b3", date: "2030-01-01", time: "18:00" });
    put({ ...booking, id: "b4", date: "2030-01-01", time: "20:00" });
    assert.equal(
      (await call("/bookings/b3/assign-table", "PUT", { tableId: "IN-001" }))
        .status,
      200,
    );
    assert.equal(
      (await call("/bookings/b4/assign-table", "PUT", { tableId: "IN-001" }))
        .status,
      200,
    );
    assert.equal(
      (
        await call("/bookings/b4/assign-table", "PUT", {
          tableId: "IN-001",
          durationMinutes: -1,
        })
      ).status,
      400,
    );
    assert.ok(db.prepare("SELECT count(*) AS n FROM admin_audit").get().n > 0);
  } finally {
    db.close();
  }
});
