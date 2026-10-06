import { useState } from "react";
import { money } from "./admin-api";
import { AdminIcon } from "./admin-shell";
import { dashboardData } from "./dashboard-data";
type Data = ReturnType<typeof dashboardData>;
export function Bars({
  entries,
  type,
  emptyLabel,
}: {
  entries: { key: string; label: string; value: number }[];
  type: "revenue" | "hours";
  emptyLabel?: string;
}) {
  const [hover, setHover] = useState<string | null>(null),
    max = Math.max(0, ...entries.map((e) => e.value));
  const axis =
    type === "hours"
      ? Math.max(4, Math.ceil(max / 4) * 4)
      : Math.max(
          1000,
          Math.ceil(
            max / Math.pow(10, Math.max(0, Math.floor(Math.log10(max || 1)))),
          ) * Math.pow(10, Math.max(0, Math.floor(Math.log10(max || 1)))),
        );
  const format = (n: number) => (type === "hours" ? n + " lượt" : money(n)),
    compact = (n: number) =>
      type === "hours"
        ? String(n)
        : new Intl.NumberFormat("vi-VN", {
            notation: "compact",
            maximumFractionDigits: 1,
          }).format(n) + "đ";
  const peak = max > 0 ? entries.find((e) => e.value === max)?.key : null;
  return (
    <div className={"rd-chart rd-chart-" + type}>
      <div className="rd-y-axis" aria-hidden="true">
        {[1, 0.75, 0.5, 0.25, 0].map((n) => (
          <span key={n} style={{ bottom: `${n * 100}%` }}>
            {compact(axis * n)}
          </span>
        ))}
      </div>
      <div className="rd-chart-plot">
        <div className="rd-grid-lines" aria-hidden="true">
          {[1, 0.75, 0.5, 0.25, 0].map((n) => (
            <i key={n} style={{ bottom: `${n * 100}%` }} />
          ))}
        </div>
        <div className="rd-chart-columns">
          {entries.map((e) => (
            <div className="rd-chart-column" key={e.key}>
              <button
                aria-label={`${e.key}: ${format(e.value)}${e.key === peak ? ", cao nhất" : ""}`}
                className={e.key === peak ? "is-peak" : ""}
                onMouseEnter={() => setHover(e.key)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(e.key)}
                onBlur={() => setHover(null)}
                onClick={() => setHover(hover === e.key ? null : e.key)}
              >
                <span
                  className="rd-bar"
                  style={{
                    height: `${(e.value / axis) * 100}%`,
                    minHeight: e.value > 0 ? "3px" : "0",
                  }}
                />
                {hover === e.key && (
                  <span className="rd-chart-tooltip" role="tooltip">
                    <small>{e.label}</small>
                    <b>{format(e.value)}</b>
                    {e.key === peak && <em>Cao nhất</em>}
                  </span>
                )}
              </button>
              <span className="rd-x-label">{e.label}</span>
            </div>
          ))}
        </div>
        {!max && (
          <span className="rd-chart-no-data">
            {emptyLabel ||
              (type === "hours"
                ? "Chưa có lượt đặt trong khung giờ này"
                : "Chưa có doanh thu trong 7 ngày")}
          </span>
        )}
      </div>
    </div>
  );
}
export function DashboardRevenue({ data }: { data: Data }) {
  const total = data.revenue.reduce((sum, e) => sum + e.value, 0),
    max = Math.max(...data.revenue.map((e) => e.value)),
    peak = data.revenue.find((e) => e.value === max);
  return (
    <section className="rd-panel rd-revenue">
      <header className="rd-panel-heading">
        <div>
          <h2>Doanh thu 7 ngày</h2>
          <p>Giá trị các đơn hàng đã hoàn tất</p>
        </div>
        <span className="rd-chart-key">
          <i />
          Doanh thu
        </span>
      </header>
      <div className="rd-chart-summary">
        <strong>{money(total)}</strong>
        <span>
          {data.revenue[0].day.slice(8)}/{data.revenue[0].day.slice(5, 7)} –{" "}
          {data.today.slice(8)}/{data.today.slice(5, 7)}
        </span>
      </div>
      <Bars
        type="revenue"
        entries={data.revenue.map((e) => ({
          key: e.day,
          label: e.day.slice(8) + "/" + e.day.slice(5, 7),
          value: e.value,
        }))}
      />
      <footer className="rd-chart-footer">
        <span>
          <i />
          Giá trị đơn hoàn tất
        </span>
        <b>
          {max > 0 && peak
            ? `Cao nhất: ${peak.day.slice(8)}/${peak.day.slice(5, 7)} · ${money(max)}`
            : "Doanh thu cập nhật từ đơn hàng"}
        </b>
      </footer>
    </section>
  );
}
export function DashboardDonut({ data }: { data: Data }) {
  const total = data.states.reduce((sum, s) => sum + s.count, 0);
  let offset = 0;
  const slices = data.states.map((s) => {
    const start = offset;
    offset += total ? (s.count / total) * 100 : 0;
    return `${s.color} ${start}% ${offset}%`;
  });
  return (
    <section className="rd-panel rd-order-states">
      <header className="rd-panel-heading">
        <div>
          <h2>Đơn hàng theo trạng thái</h2>
          <p>Toàn bộ đơn hàng ghi nhận</p>
        </div>
        <AdminIcon name="bag" />
      </header>
      <div className="rd-donut-layout">
        <div
          className="rd-donut"
          role="img"
          aria-label={data.states
            .map((s) => s.label + ": " + s.count)
            .join("; ")}
          style={{
            background: total
              ? `conic-gradient(${slices.join(",")})`
              : "#edf1ec",
          }}
        >
          <div>
            <strong>{total}</strong>
            <span>đơn hàng</span>
          </div>
        </div>
        <div className="rd-donut-legend">
          {data.states
            .filter(
              (s) =>
                s.count ||
                ["pending", "preparing", "completed", "cancelled"].includes(
                  s.state,
                ),
            )
            .map((s) => (
              <div key={s.state}>
                <i style={{ background: s.color }} />
                <span>{s.label}</span>
                <b>{s.count}</b>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
export function DashboardHours({ data }: { data: Data }) {
  const max = Math.max(...data.hours.map((h) => h.value)),
    peak = data.hours.find((h) => h.value === max);
  return (
    <section className="rd-panel rd-hours">
      <header className="rd-panel-heading">
        <div>
          <h2>Đặt bàn theo khung giờ</h2>
          <p>Lịch đặt còn hiệu lực và đã hoàn tất</p>
        </div>
        <span className="rd-chart-key is-gold">
          <i />
          Lượt đặt
        </span>
      </header>
      <div className="rd-hours-summary">
        <span>
          <AdminIcon name="clock" />
          {max > 0 && peak ? (
            <>
              Khung giờ cao điểm: <b>{peak.hour}h</b>
            </>
          ) : (
            "Chưa ghi nhận khung giờ cao điểm"
          )}
        </span>
        <b>{max} lượt cao nhất</b>
      </div>
      <Bars
        type="hours"
        entries={data.hours.map((e) => ({
          key: e.hour + "h",
          label: e.hour + "h",
          value: e.value,
        }))}
      />
      <footer className="rd-chart-footer">
        <span>Toàn bộ lịch đặt trong hệ thống</span>
        <b>Không gồm lịch hủy hoặc từ chối</b>
      </footer>
    </section>
  );
}
