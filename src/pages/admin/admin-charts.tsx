import { Row, money, labels } from "./admin-api";
import { AdminIcon } from "./admin-shell";
export const localDay = (v: string | number | Date) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(v),
  );
export function DashboardStats({
  orders,
  bookings,
  tables,
}: {
  orders: Row[];
  bookings: Row[];
  tables: Row[];
}) {
  const today = localDay(new Date()),
    daily = orders.filter((o) => localDay(o.createdAt) === today);
  const stats = [
    [
      "money",
      "Doanh thu hôm nay",
      money(
        daily
          .filter((o) => o.state === "completed")
          .reduce((s, o) => s + o.totalAmount, 0),
      ),
      "Từ đơn đã hoàn tất",
    ],
    ["bag", "Đơn hàng hôm nay", daily.length, "Tất cả hình thức nhận"],
    [
      "calendar",
      "Đặt bàn hôm nay",
      bookings.filter((b) => b.date === today).length,
      "Theo ngày khách đến",
    ],
    [
      "table",
      "Bàn đang sử dụng",
      tables.filter((t) => t.status === "OCCUPIED").length,
      "Đang phục vụ khách",
    ],
    [
      "table",
      "Bàn trống",
      tables.filter((t) => t.status === "AVAILABLE").length,
      "Sẵn sàng đón khách",
    ],
    [
      "clock",
      "Đơn chờ xử lý",
      orders.filter((o) => o.state === "pending").length,
      "Cần xác nhận từ nhà hàng",
    ],
  ];
  return (
    <div className="admin-stats">
      {stats.map(([icon, label, value, note], i) => (
        <article className={"admin-stat tone-" + i} key={label}>
          <span className="admin-stat-icon">
            <AdminIcon name={String(icon)} />
          </span>
          <p>{label}</p>
          <strong>{value}</strong>
          <small>{note}</small>
        </article>
      ))}
    </div>
  );
}
export function RevenueChart({
  orders,
  days = 7,
}: {
  orders: Row[];
  days?: number;
}) {
  const entries = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const day = localDay(d);
      return {
        day,
        value: orders
          .filter(
            (o) => o.state === "completed" && localDay(o.createdAt) === day,
          )
          .reduce((s, o) => s + o.totalAmount, 0),
      };
    }),
    max = Math.max(1, ...entries.map((e) => e.value));
  return (
    <section className="admin-panel revenue-chart">
      <div className="admin-panel-heading">
        <div>
          <h2>Doanh thu {days} ngày</h2>
          <p>Giá trị các đơn hàng đã hoàn tất</p>
        </div>
        <span className="admin-chart-key">● Doanh thu</span>
      </div>
      <strong className="admin-chart-total">
        {money(entries.reduce((s, e) => s + e.value, 0))}
      </strong>
      <div
        className="admin-bars"
        role="img"
        aria-label={`Doanh thu ${days} ngày: ${entries.map((e) => e.day + ": " + money(e.value)).join("; ")}`}
      >
        {entries.map((e) => (
          <div
            className="admin-bar-column"
            key={e.day}
            title={e.day + ": " + money(e.value)}
          >
            <div>
              <i style={{ height: Math.max(2, (e.value / max) * 100) + "%" }} />
              <span>{money(e.value)}</span>
            </div>
            <small>
              {e.day.slice(8)}/{e.day.slice(5, 7)}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}
export function OrderStatusChart({ orders }: { orders: Row[] }) {
  const states = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "serving",
      "delivering",
      "completed",
      "cancelled",
    ],
    colors = [
      "#e5b655",
      "#7ca8ca",
      "#dc9663",
      "#a6bf6d",
      "#639690",
      "#a68bba",
      "#0b5a3c",
      "#dc746a",
    ];
  let offset = 0;
  const slices = states.map((s, i) => {
    const count = orders.filter((o) => o.state === s).length,
      start = offset;
    offset += orders.length ? (count / orders.length) * 100 : 0;
    return {
      s,
      count,
      color: colors[i],
      stop: `${colors[i]} ${start}% ${offset}%`,
    };
  });
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h2>Đơn hàng theo trạng thái</h2>
          <p>Toàn bộ đơn hàng ghi nhận</p>
        </div>
      </div>
      <div
        className="admin-donut"
        style={{
          background: orders.length
            ? `conic-gradient(${slices.map((s) => s.stop).join(",")})`
            : "#e8ede8",
        }}
        role="img"
        aria-label={slices.map((s) => labels[s.s] + ": " + s.count).join(", ")}
      >
        <div>
          <strong>{orders.length}</strong>
          <small>đơn hàng</small>
        </div>
      </div>
      <div className="admin-chart-legend">
        {slices
          .filter(
            (s) =>
              s.count ||
              ["pending", "preparing", "completed", "cancelled"].includes(s.s),
          )
          .map((s) => (
            <div key={s.s}>
              <i style={{ background: s.color }} />
              {labels[s.s]}
              <b>{s.count}</b>
            </div>
          ))}
      </div>
    </section>
  );
}
export function BookingHoursChart({ bookings }: { bookings: Row[] }) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 10),
    values = hours.map(
      (h) =>
        bookings.filter(
          (b) =>
            Number(b.time?.split(":")[0]) === h &&
            !["cancelled", "rejected"].includes(b.status),
        ).length,
    ),
    max = Math.max(1, ...values);
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h2>Đặt bàn theo khung giờ</h2>
          <p>Lịch đặt còn hiệu lực và đã hoàn tất</p>
        </div>
        <AdminIcon name="calendar" />
      </div>
      <div className="admin-bars admin-hour-bars">
        {hours.map((h, i) => (
          <div
            className="admin-bar-column"
            key={h}
            title={`${h}h: ${values[i]} lượt`}
          >
            <div>
              <i
                style={{ height: Math.max(2, (values[i] / max) * 100) + "%" }}
              />
              <span>{values[i]}</span>
            </div>
            <small>{h}h</small>
          </div>
        ))}
      </div>
    </section>
  );
}
