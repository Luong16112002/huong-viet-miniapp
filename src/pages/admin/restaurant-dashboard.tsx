import { useRef } from "react";
import { Link } from "react-router-dom";
import { areas, money, Row } from "./admin-api";
import { AdminIcon } from "./admin-shell";
import {
  OrderCustomer,
  OrderDelivery,
  OrderStatusBadge,
  orderDateTime,
} from "./order-management";
import {
  bookingDate,
  bookingInitials,
  BookingStatusBadge,
} from "./booking-management";
import { dashboardData } from "./dashboard-data";
import {
  DashboardDonut,
  DashboardHours,
  DashboardRevenue,
} from "./dashboard-charts";
import "./restaurant-dashboard.css";

type Data = ReturnType<typeof dashboardData>;
function DashboardKpis({
  data,
  orders,
  bookings,
  tables,
}: {
  data: Data;
  orders: Row[];
  bookings: Row[];
  tables: Row[];
}) {
  const stats = [
    [
      "money",
      "Doanh thu hôm nay",
      money(
        data.completed.reduce(
          (sum, o) => sum + (Number(o.totalAmount) || 0),
          0,
        ),
      ),
      "Từ đơn đã hoàn tất",
      "green",
      "orders",
    ],
    [
      "bag",
      "Đơn hàng hôm nay",
      data.daily.length,
      "Tất cả hình thức nhận",
      "blue",
      "orders",
    ],
    [
      "calendar",
      "Đặt bàn hôm nay",
      bookings.filter((b) => b.date === data.today).length,
      "Theo ngày khách đến",
      "gold",
      "bookings",
    ],
    [
      "table",
      "Bàn đang sử dụng",
      tables.filter((t) => t.status === "OCCUPIED").length,
      "Đang phục vụ khách",
      "orange",
      "tables",
    ],
    [
      "table",
      "Bàn trống",
      tables.filter((t) => t.status === "AVAILABLE").length,
      "Sẵn sàng đón khách",
      "mint",
      "tables",
    ],
    [
      "clock",
      "Đơn chờ xử lý",
      orders.filter((o) => o.state === "pending").length,
      "Cần xác nhận từ nhà hàng",
      "red",
      "orders",
    ],
  ];
  return (
    <section className="rd-kpis" aria-label="Thống kê hoạt động nhà hàng">
      {stats.map(([icon, label, value, note, tone, path]) => (
        <Link
          to={"/admin/" + path}
          className={"rd-kpi rd-tone-" + tone}
          key={label}
        >
          <div className="rd-kpi-top">
            <span>
              <AdminIcon name={String(icon)} />
            </span>
            <p>{label}</p>
            <span className="rd-kpi-arrow">↗</span>
          </div>
          <strong>{value}</strong>
          <small>{note}</small>
        </Link>
      ))}
    </section>
  );
}
function DashboardAreas({ data }: { data: Data }) {
  return (
    <section className="rd-panel rd-area-panel">
      <header className="rd-panel-heading">
        <div>
          <h2>Tình trạng bàn</h2>
          <p>Theo từng khu vực đang khai thác</p>
        </div>
        <Link to="/admin/tables" aria-label="Xem quản lý bàn">
          ↗
        </Link>
      </header>
      <div className="rd-areas">
        {data.areaRows.map((r) => (
          <article key={r.area}>
            <div>
              <b>{r.label}</b>
              <span>{r.total} bàn</span>
            </div>
            <div className="rd-area-numbers">
              <span>
                <i />
                {r.available} trống
              </span>
              <span>{r.occupied} đang dùng</span>
            </div>
            <div
              className="rd-area-progress"
              role="progressbar"
              aria-label={r.label + " đang sử dụng"}
              aria-valuenow={r.occupied}
              aria-valuemin={0}
              aria-valuemax={r.total || 1}
              aria-valuetext={`${r.occupied} / ${r.total} bàn đang sử dụng`}
            >
              <i
                style={{
                  width: r.total ? (r.occupied / r.total) * 100 + "%" : "0%",
                }}
              />
            </div>
          </article>
        ))}
      </div>
      <footer className="rd-area-footer">
        <span>
          <i />
          Đang sử dụng / tổng số bàn
        </span>
        <Link to="/admin/tables">Quản lý bàn →</Link>
      </footer>
    </section>
  );
}
function DashboardRecentOrders({
  data,
  onOpen,
}: {
  data: Data;
  onOpen: (row: Row) => void;
}) {
  return (
    <section className="rd-panel rd-recent">
      <header className="rd-panel-heading">
        <div>
          <h2>Đơn hàng gần đây</h2>
          <p>8 đơn được ghi nhận gần nhất</p>
        </div>
        <Link to="/admin/orders">Xem tất cả →</Link>
      </header>
      <div className="rd-table-scroll">
        <table className="rd-table rd-orders-table">
          <thead>
            <tr>
              {[
                "Mã đơn",
                "Khách hàng",
                "Hình thức / Bàn",
                "Món",
                "Tổng tiền",
                "Trạng thái",
                "Thời gian",
                "Thao tác",
              ].map((s) => (
                <th key={s}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.recentOrders.map((row) => {
              const stamp = orderDateTime(row.createdAt);
              return (
                <tr
                  key={row.id}
                  className={row.state === "pending" ? "rd-needs-action" : ""}
                >
                  <td data-label="Mã đơn">
                    <b className="rd-code">#{row.orderCode || row.id}</b>
                  </td>
                  <td data-label="Khách hàng">
                    <OrderCustomer row={row} />
                  </td>
                  <td data-label="Hình thức / Bàn">
                    <OrderDelivery row={row} />
                  </td>
                  <td data-label="Món">
                    <span
                      className="rd-items"
                      title={(row.items || [])
                        .map((i: Row) => i.name + " ×" + i.quantity)
                        .join("\n")}
                    >
                      {(row.items || []).reduce(
                        (sum: number, i: Row) =>
                          sum + (Number(i.quantity) || 0),
                        0,
                      )}{" "}
                      món
                    </span>
                  </td>
                  <td data-label="Tổng tiền">
                    <b className="rd-money">{money(row.totalAmount)}</b>
                  </td>
                  <td data-label="Trạng thái">
                    <OrderStatusBadge state={row.state} />
                  </td>
                  <td data-label="Thời gian">
                    <span className="rd-date">
                      <b>{stamp.date}</b>
                      <small>{stamp.time}</small>
                    </span>
                  </td>
                  <td data-label="Thao tác">
                    <button className="rd-view" onClick={() => onOpen(row)}>
                      <AdminIcon name="eye" /> Xem
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!data.recentOrders.length && (
        <DashboardEmpty
          icon="bag"
          title="Chưa có đơn hàng"
          note="Đơn hàng mới sẽ xuất hiện tại đây."
        />
      )}
    </section>
  );
}
function DashboardRecentBookings({
  data,
  onOpen,
}: {
  data: Data;
  onOpen: (row: Row) => void;
}) {
  return (
    <section className="rd-panel rd-recent">
      <header className="rd-panel-heading">
        <div>
          <h2>Đặt bàn gần đây</h2>
          <p>5 lịch đặt được ghi nhận gần nhất</p>
        </div>
        <Link to="/admin/bookings">Xem tất cả →</Link>
      </header>
      <div className="rd-table-scroll">
        <table className="rd-table rd-bookings-table">
          <thead>
            <tr>
              {[
                "Mã đặt",
                "Khách",
                "Số khách",
                "Khu vực",
                "Giờ đến",
                "Trạng thái",
              ].map((s) => (
                <th key={s}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.recentBookings.map((row) => (
              <tr key={row.id}>
                <td data-label="Mã đặt">
                  <button
                    className="rd-booking-code"
                    onClick={() => onOpen(row)}
                  >
                    #{row.code || row.id}
                    <AdminIcon name="eye" />
                  </button>
                </td>
                <td data-label="Khách">
                  <div className="rd-booking-customer">
                    <span>{bookingInitials(row.name)}</span>
                    <div>
                      <b>{row.name || "Khách hàng"}</b>
                      <small>{row.phone || "Chưa có SĐT"}</small>
                    </div>
                  </div>
                </td>
                <td data-label="Số khách">
                  <span className="rd-guests">
                    <AdminIcon name="users" />
                    {row.guests} khách
                  </span>
                </td>
                <td data-label="Khu vực">
                  <b>{areas[row.area] || row.area || "Chưa chọn khu vực"}</b>
                  <small>{row.tableId || "Chưa xếp bàn"}</small>
                </td>
                <td data-label="Giờ đến">
                  <span className="rd-date">
                    <b>{bookingDate(row.date)}</b>
                    <small>{row.time}</small>
                  </span>
                </td>
                <td data-label="Trạng thái">
                  <BookingStatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data.recentBookings.length && (
        <DashboardEmpty
          icon="calendar"
          title="Chưa có lịch đặt bàn"
          note="Lịch đặt mới sẽ được cập nhật tại đây."
        />
      )}
    </section>
  );
}
function DashboardEmpty({
  icon,
  title,
  note,
}: {
  icon: string;
  title: string;
  note: string;
}) {
  return (
    <div className="rd-empty">
      <AdminIcon name={icon} />
      <b>{title}</b>
      <p>{note}</p>
    </div>
  );
}
function DashboardSkeleton() {
  return (
    <div
      className="rd-dashboard rd-loading"
      role="status"
      aria-label="Đang tải tổng quan nhà hàng"
    >
      <div className="rd-skeleton rd-skeleton-hero" />
      <div className="rd-kpis">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="rd-skeleton rd-skeleton-kpi" key={i} />
        ))}
      </div>
      <div className="rd-chart-row">
        {[0, 1].map((i) => (
          <div className="rd-skeleton rd-skeleton-panel" key={i} />
        ))}
      </div>
      <span className="rd-screen-reader">Đang tải dữ liệu nhà hàng…</span>
    </div>
  );
}
export function RestaurantDashboard({
  orders,
  bookings,
  tables,
  loading,
  onRefresh,
  onOpen,
}: {
  orders: Row[];
  bookings: Row[];
  tables: Row[];
  loading: boolean;
  onRefresh: () => void;
  onOpen: (row: Row) => void;
}) {
  const activityRef = useRef<HTMLElement>(null),
    data = dashboardData(orders, bookings, tables);
  const attention =
    orders.filter((o) => o.state === "pending").length +
    bookings.filter((b) => b.status === "pending").length;
  const date = new Date().toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  if (loading && !orders.length && !bookings.length && !tables.length)
    return <DashboardSkeleton />;
  return (
    <div className="rd-dashboard">
      <section className="rd-hero">
        <div className="rd-hero-content">
          <small>HƯƠNG VIỆT • MỖI NGÀY TRỌN VẸN</small>
          <h2>Chào ngày mới, đón trải nghiệm ngon.</h2>
          <p>Nắm bắt hoạt động và chăm sóc từng bữa ăn của khách hàng.</p>
          <div className="rd-hero-meta">
            <span>
              <AdminIcon name="calendar" />
              {date}
            </span>
            <span className={attention ? "rd-attention" : ""}>
              <i />
              {attention
                ? `${attention} yêu cầu cần xử lý`
                : "Không có yêu cầu chờ xác nhận"}
            </span>
          </div>
        </div>
        <div className="rd-hero-controls">
          <button
            onClick={() =>
              activityRef.current?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "auto"
                  : "smooth",
                block: "start",
              })
            }
          >
            Xem hoạt động ↓
          </button>
          <button className="rd-refresh" disabled={loading} onClick={onRefresh}>
            <AdminIcon name="refresh" />
            {loading ? "Đang cập nhật…" : "Làm mới dữ liệu"}
          </button>
          <small>Dữ liệu tự làm mới mỗi 10 giây khi đang xem</small>
        </div>
        <svg
          className="rd-hero-art"
          viewBox="0 0 320 220"
          aria-hidden="true"
          fill="none"
        >
          <circle cx="205" cy="110" r="80" />
          <circle cx="205" cy="110" r="65" />
          <circle cx="205" cy="110" r="38" />
          <path d="M70 30v50m12-50v50m12-50v50M70 55c0 30 24 30 24 0M82 80v115M125 30c-18 30-18 50 0 60v105M148 23l17 173m-5-174 17 173M190 115c-30-35 8-65 25-49 32-7 41 31 5 44m-30 5 48-39M185 130c14 20 41 15 42-2" />
        </svg>
      </section>
      <DashboardKpis
        data={data}
        orders={orders}
        bookings={bookings}
        tables={tables}
      />
      <div className="rd-chart-row">
        <DashboardRevenue data={data} />
        <DashboardDonut data={data} />
      </div>
      <div className="rd-chart-row">
        <DashboardHours data={data} />
        <DashboardAreas data={data} />
      </div>
      <DashboardRecentOrders data={data} onOpen={onOpen} />
      <DashboardRecentBookings data={data} onOpen={onOpen} />
      <div className="rd-bottom-row">
        <section className="rd-panel rd-activity" ref={activityRef}>
          <header className="rd-panel-heading">
            <div>
              <h2>Hoạt động gần đây</h2>
              <p>Những cập nhật mới nhất từ đơn và lịch đặt</p>
            </div>
            <AdminIcon name="clock" />
          </header>
          {data.activities.length ? (
            <ol className="rd-activity-list">
              {data.activities.map((a) => {
                const stamp = orderDateTime(a.at);
                return (
                  <li key={a.id}>
                    <span className="rd-activity-dot">
                      <AdminIcon name={a.kind} />
                    </span>
                    <button onClick={() => onOpen(a.row)}>
                      <span>
                        <b>{a.label}</b>
                        <small>{a.detail}</small>
                      </span>
                      <time dateTime={a.at}>
                        {stamp.time}
                        <small>{stamp.date}</small>
                      </time>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <DashboardEmpty
              icon="clock"
              title="Chưa có hoạt động"
              note="Các hoạt động mới sẽ được hiển thị tại đây."
            />
          )}
        </section>
        <section className="rd-panel rd-top-foods">
          <header className="rd-panel-heading">
            <div>
              <h2>Món bán chạy hôm nay</h2>
              <p>Từ các đơn hàng đã hoàn tất</p>
            </div>
            <AdminIcon name="food" />
          </header>
          {data.topFoods.length ? (
            <ol>
              {data.topFoods.map((f, i) => (
                <li key={f.name + String(i)}>
                  <span className="rd-food-rank">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <b>{f.name}</b>
                    <small>{f.quantity} phần đã bán</small>
                  </div>
                  <strong>{money(f.revenue)}</strong>
                </li>
              ))}
            </ol>
          ) : (
            <DashboardEmpty
              icon="food"
              title="Chưa có món bán ra hôm nay"
              note="Món bán chạy sẽ xuất hiện sau khi đơn hoàn tất."
            />
          )}
          <p className="rd-foods-note">
            Doanh thu món tính trước voucher và phí giao hàng.
          </p>
          <div className="rd-quick-actions">
            <Link to="/admin/menu">
              <AdminIcon name="food" /> Quản lý thực đơn ↗
            </Link>
            <Link to="/admin/orders">
              <AdminIcon name="bag" /> Xử lý đơn hàng ↗
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
