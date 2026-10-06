import { RestaurantDashboard } from "./restaurant-dashboard";
import { OrderManagement } from "./order-management";
import { BookingManagement } from "./booking-management";
import { TableManagement } from "./table-management";
import { BulkTablesModal, TableInventory } from "./bulk-tables";
import { AdminLayout, AdminIcon } from "./admin-shell";
import { OrderTable, BookingTable, EmptyState } from "./admin-tables";
import {
  CatalogManagement,
  CustomersPage,
  ReportsPage,
} from "./admin-management";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { adminRequest, areas, labels, money, Row } from "./admin-api";
import {
  AdminDialog,
  DashboardStatCard,
  FilterBar,
  TableCard,
  TableForm,
  RecordDetailDrawer,
} from "./admin-components";
import "./admin.css";
export default function AdminPage() {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [orderAutoRefresh, setOrderAutoRefresh] = useState(true);
  const section = useLocation().pathname.split("/")[2] || "dashboard";
  const [authorized, setAuthorized] = useState(false),
    [username, setUsername] = useState("admin"),
    [password, setPassword] = useState("admin123"),
    [showPassword, setShowPassword] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [toast, setToast] = useState("");
  const [data, setData] = useState<{
    tables: Row[];
    bookings: Row[];
    orders: Row[];
    dashboard: Row;
  }>({ tables: [], bookings: [], orders: [], dashboard: {} });
  const [selected, setSelected] = useState<Row | null>(null),
    [edit, setEdit] = useState<Row | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    area: "",
    status: "",
    capacity: "",
    from: "",
    to: "",
    type: "",
    table: "",
  });
  const seen = useRef<Set<string> | null>(null);
  const [areaTables, setAreaTables] = useState<{ area: string; rows: Row[] }>({
    area: "",
    rows: [],
  });
  useEffect(() => {
    if (!authorized || section !== "tables" || !filters.area) return;
    let active = true;
    adminRequest("/tables?area=" + encodeURIComponent(filters.area))
      .then((rows) => {
        if (active) setAreaTables({ area: filters.area, rows });
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [authorized, section, filters.area, data.tables]);
  const refreshing = useRef(false);
  const load = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    setLoading(true);
    try {
      const [tables, bookings, orders, dashboard] = await Promise.all(
        ["tables", "bookings", "orders", "dashboard"].map((p) =>
          adminRequest("/" + p),
        ),
      );
      const latest = [...orders, ...bookings];
      if (seen.current) {
        const fresh = latest.find((r) => !seen.current!.has(r.id));
        if (fresh)
          setToast(
            fresh.orderCode
              ? `Có đơn hàng mới #${fresh.orderCode}`
              : `Có yêu cầu đặt bàn mới lúc ${fresh.time}`,
          );
      }
      seen.current = new Set(latest.map((r) => r.id));
      setData({ tables, bookings, orders, dashboard });
      setAuthorized(true);
      setError("");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa tải được dữ liệu.");
      return false;
    } finally {
      refreshing.current = false;
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    sessionStorage.removeItem("hv-admin-key");
    if (sessionStorage.getItem("hv-admin-session")) void load();
    const expire = () => setAuthorized(false);
    window.addEventListener("hv-admin-session-expired", expire);
    return () => window.removeEventListener("hv-admin-session-expired", expire);
  }, [load]);
  useEffect(() => {
    if (!authorized || (section === "orders" && !orderAutoRefresh)) return;
    const timer = setInterval(() => {
      if (!document.hidden && !busy) void load();
    }, 10000);
    return () => clearInterval(timer);
  }, [authorized, busy, load, section, orderAutoRefresh]);
  useEffect(() => {
    setFilters({
      search: "",
      area: "",
      status: "",
      capacity: "",
      from: "",
      to: "",
      type: "",
      table: "",
    });
    setSelected(null);
    setEdit(null);
  }, [section]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(t);
  }, [toast]);
  async function change(path: string, method: string, body?: Row) {
    if (busy) return;
    setBusy(true);
    try {
      await adminRequest(path, method, body);
      await load();
      setEdit(null);
      setToast("Đã cập nhật dữ liệu");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa cập nhật được dữ liệu.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function updateTableStatus(table: Row, status: string): Promise<boolean> {
    if (!table.id || busy) return false;
    setBusy(true);
    setError("");
    try {
      const response = await adminRequest("/tables/" + encodeURIComponent(table.id) + "/status", "PATCH", { status });
      const updated = response.table;
      setData((prev) => ({ ...prev, tables: prev.tables.map((t) => t.id === table.id ? updated : t) }));
      setAreaTables((prev) => ({ ...prev, rows: prev.rows.map((t) => t.id === table.id ? updated : t) }));
      await load();
      setToast("Cập nhật trạng thái bàn thành công");
      return true;
    } catch (error) {
      console.error("[UPDATE TABLE STATUS]", error);
      const message = error instanceof Error ? error.message : "Không thể cập nhật trạng thái";
      setError(message);
      setToast(message);
      throw error;
    } finally {
      setBusy(false);
    }
  }
  const set = (name: string, value: string) =>
    setFilters((f) => ({ ...f, [name]: value }));
  const rows = (
    section === "tables"
      ? filters.area
        ? areaTables.area === filters.area
          ? areaTables.rows
          : []
        : data.tables
      : section === "bookings"
        ? data.bookings
        : data.orders
  ).filter((r) => {
    const text = [
      r.id,
      r.code,
      r.orderCode,
      r.name,
      r.customerName,
      r.phone,
      r.tableId,
      r.tableNumber,
      r.deliveryAddress?.recipientName,
    ]
      .join(" ")
      .toLocaleLowerCase("vi");
    const day =
      r.date ||
      (r.createdAt
        ? new Intl.DateTimeFormat("sv-SE", {
            timeZone: "Asia/Ho_Chi_Minh",
          }).format(new Date(r.createdAt))
        : "");
    return (
      text.includes(filters.search.toLocaleLowerCase("vi")) &&
      (!filters.area || r.area === filters.area) &&
      (!filters.status || (r.status || r.state) === filters.status) &&
      (!filters.capacity ||
        (section === "tables"
          ? r.capacity >= Number(filters.capacity)
          : r.guests === Number(filters.capacity))) &&
      (!filters.from || day >= filters.from) &&
      (!filters.to || day <= filters.to) &&
      (!filters.type || r.deliveryType === filters.type) &&
      (!filters.table ||
        (r.tableId || r.tableNumber || "").includes(filters.table))
    );
  });
  const title =
    (
      {
        dashboard: "Tổng quan nhà hàng",
        tables: "Quản lý bàn",
        bookings: "Quản lý đặt bàn",
        orders: "Quản lý đơn hàng",
        menu: "Thực đơn",
        customers: "Khách hàng",
        promotions: "Ưu đãi",
        reports: "Thống kê",
        settings: "Cài đặt",
      } as Record<string, string>
    )[section] || "Quản trị";
  const detail = selected
    ? (selected.code ? data.bookings : data.orders).find(
        (r) => r.id === selected.id,
      ) || selected
    : null;
  if (!authorized)
    return (
      <div className="admin-login">
        <form
          aria-labelledby="admin-login-title"
          aria-busy={loading}
          onSubmit={async (e) => {
            e.preventDefault();
            if (loading) return;
            setLoading(true);
            setError("");
            try {
              const result = await adminRequest("/login", "POST", {
                username: username.trim(),
                password,
              });
              sessionStorage.setItem("hv-admin-session", result.token);
              setPassword("");
              setShowPassword(false);
              if (!(await load()))
                sessionStorage.removeItem("hv-admin-session");
            } catch (error) {
              setError(
                error instanceof Error ? error.message : "Không thể đăng nhập.",
              );
            } finally {
              setLoading(false);
            }
          }}
        >
          <header className="admin-login-heading">
            <small>HƯƠNG VIỆT • QUẢN TRỊ</small>
            <h1 id="admin-login-title">Đăng nhập quản trị</h1>
            <p>Đăng nhập để quản lý nhà hàng của bạn</p>
          </header>
          <label>
            Tên đăng nhập
            <input
              required
              name="username"
              type="text"
              placeholder="Nhập tên đăng nhập"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={100}
              value={username}
              aria-invalid={!!error}
              aria-describedby={error ? "admin-login-error" : undefined}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
            />
          </label>
          <label>
            Mật khẩu
            <span className="admin-login-password">
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                id="admin-login-password"
                name="password"
                autoComplete="current-password"
                value={password}
                aria-invalid={!!error}
                aria-describedby={error ? "admin-login-error" : undefined}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />
              <button
                type="button"
                className="admin-login-eye"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showPassword}
                aria-controls="admin-login-password"
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {showPassword ? (
                    <>
                      <path d="m3 3 18 18 M10.6 10.6a2 2 0 0 0 2.8 2.8 M9.9 5.2A10.9 10.9 0 0 1 12 5c7 0 10 7 10 7a17.6 17.6 0 0 1-3.1 4.2 M6.3 6.3C3.4 8.3 2 12 2 12s3 7 10 7a11 11 0 0 0 5.7-1.7" />
                    </>
                  ) : (
                    <>
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </span>
          </label>
          {error && (
            <p
              className="admin-login-error"
              id="admin-login-error"
              role="alert"
            >
              {error.replace(/\.$/, "")}
            </p>
          )}
          <button type="submit" disabled={loading} className="primary">
            {loading && (
              <span className="admin-login-spinner" aria-hidden="true" />
            )}
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>
      </div>
    );
  return (
    <AdminLayout
      title={title}
      orders={data.orders}
      bookings={data.bookings}
      onOpen={setSelected}
      onLogout={() => {
        void adminRequest("/logout", "POST").catch(() => {});
        sessionStorage.removeItem("hv-admin-session");
        seen.current = null;
        setData({ tables: [], bookings: [], orders: [], dashboard: {} });
        setAuthorized(false);
        setPassword("");
      }}
    >
      {!["dashboard", "reports", "bookings", "orders", "promotions"].includes(
        section,
      ) && (
        <div className="admin-toolbar">
          <p>Hoạt động nhà hàng · {new Date().toLocaleDateString("vi-VN")}</p>
          <button disabled={loading || busy} onClick={() => void load()}>
            {loading ? "Đang tải…" : "Làm mới"}
          </button>
        </div>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {toast && (
        <p className="admin-toast" role="status">
          {toast}
        </p>
      )}
      {section === "dashboard" ? (
        <RestaurantDashboard
          orders={data.orders}
          bookings={data.bookings}
          tables={data.tables}
          loading={loading || busy}
          onRefresh={() => void load()}
          onOpen={setSelected}
        />
      ) : section === "menu" || section === "promotions" ? (
        <CatalogManagement kind={section} orders={data.orders} />
      ) : section === "customers" ? (
        <CustomersPage
          orders={data.orders}
          bookings={data.bookings}
          onOpen={setSelected}
        />
      ) : section === "reports" ? (
        <ReportsPage
          orders={data.orders}
          bookings={data.bookings}
          loading={loading || busy}
          onRefresh={() => void load()}
        />
      ) : section === "settings" ? (
        <section className="admin-panel admin-settings">
          <h2>Thiết lập quản trị</h2>
          <p>Phiên làm việc: Quản trị viên · Quản lý nhà hàng</p>
          <p>Dữ liệu tự động cập nhật mỗi 10 giây khi cửa sổ đang mở.</p>
          <label>
            <input
              type="checkbox"
              defaultChecked={
                localStorage.getItem("hv-admin-compact") === "true"
              }
              onChange={(e) => {
                localStorage.setItem(
                  "hv-admin-compact",
                  String(e.target.checked),
                );
                document.documentElement.classList.toggle(
                  "admin-compact",
                  e.target.checked,
                );
              }}
            />{" "}
            Bảng dữ liệu gọn hơn
          </label>
          <p>Tài khoản quản trị được quản lý trên máy chủ.</p>
        </section>
      ) : section === "orders" ? (
        <OrderManagement
          orders={data.orders}
          rows={rows}
          filters={{
            search: filters.search,
            status: filters.status,
            table: filters.table,
            type: filters.type,
            from: filters.from,
            to: filters.to,
          }}
          onFilters={(patch) =>
            setFilters((previous) => ({ ...previous, ...patch }))
          }
          onClear={() =>
            setFilters({
              search: "",
              area: "",
              status: "",
              capacity: "",
              from: "",
              to: "",
              type: "",
              table: "",
            })
          }
          onRefresh={() => void load()}
          refreshing={loading || busy}
          autoRefresh={orderAutoRefresh}
          onAutoRefresh={setOrderAutoRefresh}
          busy={busy}
          onOpen={setSelected}
          onStatus={(r, status) =>
            void change("/orders/" + r.id + "/status", "PUT", { status })
          }
        />
      ) : section === "bookings" ? (
        <BookingManagement
          bookings={data.bookings}
          rows={rows}
          filters={{
            search: filters.search,
            status: filters.status,
            area: filters.area,
            capacity: filters.capacity,
            from: filters.from,
            to: filters.to,
          }}
          onFilters={(patch) =>
            setFilters((previous) => ({ ...previous, ...patch }))
          }
          onClear={() =>
            setFilters({
              search: "",
              area: "",
              status: "",
              capacity: "",
              from: "",
              to: "",
              type: "",
              table: "",
            })
          }
          onRefresh={() => void load()}
          refreshing={loading || busy}
          busy={busy}
          onOpen={setSelected}
          onStatus={(r, status) =>
            void change("/bookings/" + r.id + "/status", "PUT", { status })
          }
        />
      ) : section === "tables" ? (
        <TableManagement
          tables={data.tables}
          rows={rows}
          bookings={data.bookings}
          total={
            data.dashboard.tableStats?.total ??
            data.tables.filter((t) => t.active).length
          }
          filters={{
            search: filters.search,
            status: filters.status,
            area: filters.area,
            capacity: filters.capacity,
          }}
          onFilter={set}
          onClear={() =>
            setFilters({
              search: "",
              area: "",
              status: "",
              capacity: "",
              from: "",
              to: "",
              type: "",
              table: "",
            })
          }
          onAdd={() =>
            setEdit({ area: "indoor", capacity: 4, status: "AVAILABLE" })
          }
          onBulk={() => setBulkOpen(true)}
          busy={busy}
          onEdit={setEdit}
          onStatus={updateTableStatus}
          onDelete={(t) => void change("/tables/" + t.id, "DELETE")}
        />
      ) : (
        <>
          {section === "orders" && (
            <>
              <div className="admin-order-summary">
                <b>{data.orders.length} đơn</b>
                <span>
                  {data.orders.filter((o) => o.state === "pending").length} chờ
                  xử lý
                </span>
                <span>
                  {data.orders.filter((o) => o.state === "preparing").length}{" "}
                  đang chuẩn bị
                </span>
                <span>
                  {data.orders.filter((o) => o.state === "completed").length}{" "}
                  hoàn tất
                </span>
              </div>
              <div className="admin-status-tabs">
                {[
                  "",
                  "pending",
                  "preparing",
                  "ready",
                  "completed",
                  "cancelled",
                ].map((v) => (
                  <button
                    key={v}
                    className={filters.status === v ? "active" : ""}
                    onClick={() => set("status", v)}
                  >
                    {labels[v] || "Tất cả"}
                  </button>
                ))}
              </div>
            </>
          )}
          {section === "tables" && (
            <div className="admin-order-summary">
              <b>
                Tổng bàn:{" "}
                {data.dashboard.tableStats?.total ??
                  data.tables.filter((t) => t.active).length}
                /500
              </b>
              {Object.entries(areas).map(([a, label]) => (
                <span key={a}>
                  {label}:{" "}
                  {data.dashboard.tableStats?.[a] ??
                    data.tables.filter((t) => t.active && t.area === a).length}
                  /100 bàn
                </span>
              ))}
              {[
                "AVAILABLE",
                "RESERVED",
                "OCCUPIED",
                "CLEANING",
                "DISABLED",
              ].map((v) => (
                <span key={v}>
                  {labels[v]}:{" "}
                  {data.tables.filter((t) => t.status === v).length}
                </span>
              ))}
            </div>
          )}
          <FilterBar>
            <input
              aria-label="Tìm kiếm"
              placeholder={
                section === "tables"
                  ? "Tìm mã / tên bàn"
                  : section === "bookings"
                    ? "Tên, số điện thoại, mã đặt bàn"
                    : "Mã đơn, tên khách"
              }
              value={filters.search}
              onChange={(e) => set("search", e.target.value)}
            />
            <select
              aria-label="Lọc trạng thái"
              value={filters.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {(section === "tables"
                ? ["AVAILABLE", "RESERVED", "OCCUPIED", "CLEANING", "DISABLED"]
                : section === "bookings"
                  ? [
                      "pending",
                      "confirmed",
                      "checked_in",
                      "completed",
                      "cancelled",
                      "rejected",
                    ]
                  : [
                      "pending",
                      "confirmed",
                      "preparing",
                      "ready",
                      "serving",
                      "delivering",
                      "completed",
                      "cancelled",
                    ]
              ).map((s) => (
                <option key={s} value={s}>
                  {labels[s]}
                </option>
              ))}
            </select>
            {section !== "orders" ? (
              <>
                <select
                  aria-label="Khu vực"
                  value={filters.area}
                  onChange={(e) => set("area", e.target.value)}
                >
                  <option value="">Tất cả khu vực</option>
                  {Object.entries(areas).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  aria-label="Số khách"
                  placeholder={
                    section === "tables" ? "Sức chứa tối thiểu" : "Số khách"
                  }
                  value={filters.capacity}
                  onChange={(e) => set("capacity", e.target.value)}
                />
              </>
            ) : (
              <>
                <input
                  placeholder="Mã bàn"
                  aria-label="Lọc theo bàn"
                  value={filters.table}
                  onChange={(e) => set("table", e.target.value)}
                />
                <select
                  aria-label="Hình thức nhận món"
                  value={filters.type}
                  onChange={(e) => set("type", e.target.value)}
                >
                  <option value="">Mọi hình thức</option>
                  <option value="dinein">Tại bàn</option>
                  <option value="pickup">Tại quầy</option>
                  <option value="delivery">Giao hàng</option>
                </select>
              </>
            )}
            {section !== "tables" && (
              <>
                <label>
                  Từ ngày
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => set("from", e.target.value)}
                  />
                </label>
                <label>
                  Đến ngày
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => set("to", e.target.value)}
                  />
                </label>
              </>
            )}
            {section === "tables" && (
              <button
                onClick={() =>
                  setFilters({
                    search: "",
                    area: "",
                    status: "",
                    capacity: "",
                    from: "",
                    to: "",
                    type: "",
                    table: "",
                  })
                }
              >
                Xóa bộ lọc
              </button>
            )}
          </FilterBar>
          <div className="admin-toolbar">
            <b>{rows.length} kết quả</b>
            {section === "tables" && (
              <button className="primary" onClick={() => setBulkOpen(true)}>
                + Thêm hàng loạt
              </button>
            )}
            {section === "tables" && (
              <button
                className="primary"
                onClick={() =>
                  setEdit({ area: "indoor", capacity: 4, status: "AVAILABLE" })
                }
              >
                + Thêm bàn
              </button>
            )}
          </div>
          {section === "tables" ? (
            <TableInventory
              key={JSON.stringify(filters)}
              rows={rows}
              bookings={data.bookings}
              busy={busy}
              onEdit={setEdit}
              onStatus={updateTableStatus}
              onDelete={(t) => void change("/tables/" + t.id, "DELETE")}
            />
          ) : section === "bookings" ? (
            <BookingTable
              rows={rows}
              onOpen={setSelected}
              busy={busy}
              onQuick={(r, status) =>
                void change("/bookings/" + r.id + "/status", "PUT", { status })
              }
            />
          ) : (
            <OrderTable rows={rows} onOpen={setSelected} />
          )}{" "}
          {!rows.length &&
            (section === "tables" ? (
              <EmptyState
                title={
                  data.tables.length
                    ? "Không có bàn phù hợp"
                    : "Chưa có bàn nào"
                }
                description="Hãy thêm bàn đầu tiên để bắt đầu quản lý sơ đồ nhà hàng."
                onAdd={() =>
                  setEdit({ area: "indoor", capacity: 4, status: "AVAILABLE" })
                }
              />
            ) : null)}
        </>
      )}
      {bulkOpen && (
        <BulkTablesModal onClose={() => setBulkOpen(false)} onCreated={load} />
      )}
      {edit && (
        <AdminDialog
          title={edit.id ? "Chi tiết bàn" : "Thêm bàn mới"}
          onClose={() => !busy && setEdit(null)}
        >
          <TableForm
            table={edit}
            busy={busy}
            onSave={(r) =>
              void change(
                "/tables" + (edit.id ? "/" + edit.id : ""),
                edit.id ? "PUT" : "POST",
                r,
              )
            }
          />
        </AdminDialog>
      )}
      {detail && (
        <AdminDialog
          drawer
          title={detail.code || detail.orderCode}
          onClose={() => !busy && setSelected(null)}
        >
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
          <RecordDetailDrawer
            key={detail.id}
            row={detail}
            tables={data.tables}
            booking={!!detail.code}
            busy={busy}
            onStatus={(status, customerLeft, tableId) =>
              void change(
                "/" +
                  (detail.code ? "bookings" : "orders") +
                  "/" +
                  detail.id +
                  "/status",
                "PUT",
                {
                  status,
                  customerLeft,
                  tableId,
                },
              )
            }
            onAssign={(tableId, durationMinutes) =>
              void change("/bookings/" + detail.id + "/assign-table", "PUT", {
                tableId,
                durationMinutes,
              })
            }
          />
        </AdminDialog>
      )}
    </AdminLayout>
  );
}
import "./admin-premium.css";
import "./admin-login.css";
