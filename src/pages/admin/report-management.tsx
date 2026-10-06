import { useMemo, useState } from "react";
import { Row, money } from "./admin-api";
import { AdminIcon } from "./admin-shell";
import { Bars } from "./dashboard-charts";
import { FoodImage } from "./menu-management";
import {
  reportData,
  reportDate,
  reportRange,
  validReportRange,
  ReportRange,
} from "./report-data";
import "./restaurant-dashboard.css";
import "./report-management.css";
const periods: Record<string, string> = {
  "1": "Hôm nay",
  "7": "7 ngày qua",
  "30": "30 ngày qua",
  month: "Tháng này",
  custom: "Tùy chọn ngày",
};
function ReportEmpty({
  title = "Chưa có dữ liệu thống kê",
  note = "Dữ liệu sẽ hiển thị khi nhà hàng có đơn hàng hoặc lịch đặt bàn.",
}: {
  title?: string;
  note?: string;
}) {
  return (
    <div className="rp-empty">
      <span>
        <AdminIcon name="chart" />
      </span>
      <h3>{title}</h3>
      <p>{note}</p>
    </div>
  );
}
export function ReportsPage({
  orders,
  bookings,
  loading = false,
  onRefresh,
}: {
  orders: Row[];
  bookings: Row[];
  loading?: boolean;
  onRefresh?: () => void;
}) {
  const [draft, setDraft] = useState("7"),
    [preset, setPreset] = useState("7"),
    [custom, setCustom] = useState<ReportRange>(reportRange("7")),
    [applied, setApplied] = useState<ReportRange>(reportRange("7")),
    [error, setError] = useState(""),
    [page, setPage] = useState(1),
    [size, setSize] = useState(20);
  const range = preset === "custom" ? applied : reportRange(preset),
    data = useMemo(
      () => reportData(orders, bookings, range),
      [orders, bookings, range.from, range.to],
    );
  const apply = () => {
    if (draft === "custom" && !validReportRange(custom)) {
      setError(
        "Vui lòng chọn đủ hai ngày hợp lệ. Từ ngày không được sau Đến ngày.",
      );
      return;
    }
    setPreset(draft);
    setApplied(draft === "custom" ? { ...custom } : reportRange(draft));
    setError("");
    setPage(1);
  };
  const reset = () => {
    setDraft("7");
    setPreset("7");
    setCustom(reportRange("7"));
    setApplied(reportRange("7"));
    setError("");
    setPage(1);
  };
  const stats = [
    ["money", "Doanh thu", money(data.revenue), "Từ đơn đã hoàn tất", "green"],
    [
      "check",
      "Tổng đơn hoàn tất",
      data.completed.length,
      "Trong kỳ thống kê",
      "blue",
    ],
    [
      "calendar",
      "Lượt đặt bàn",
      data.book.length,
      "Theo ngày khách đến",
      "gold",
    ],
    [
      "clock",
      "Tỷ lệ hủy đơn",
      data.cancelRate + "%",
      `${data.cancelled} / ${data.recent.length} đơn trong kỳ`,
      "red",
    ],
    [
      "users",
      "Giờ cao điểm",
      data.peakHour?.label || "—",
      data.peakHour
        ? data.peakHour.value + " lượt đặt"
        : "Chưa có lượt đặt hợp lệ",
      "gold",
    ],
    [
      "food",
      "Món bán chạy",
      data.sold[0]?.name || "—",
      data.sold[0]
        ? data.sold[0].quantity + " phần đã bán"
        : "Chưa có món bán ra",
      "green",
    ],
  ];
  const days = [...data.days].reverse(),
    pages = Math.max(1, Math.ceil(days.length / size)),
    current = Math.min(page, pages),
    shown = days.slice((current - 1) * size, current * size);
  let offset = 0;
  const stops = data.states.map((s) => {
    const start = offset;
    offset += data.book.length ? (s.count / data.book.length) * 100 : 0;
    return `${s.color} ${start}% ${offset}%`;
  });
  const initial = loading && !orders.length && !bookings.length;
  return (
    <div className="rd-dashboard rp-page">
      <section className="rp-filters">
        <div className="rp-filter-heading">
          <span>
            <AdminIcon name="chart" />
          </span>
          <div>
            <h2>Hiệu suất nhà hàng</h2>
            <p>Chọn khoảng thời gian để theo dõi hoạt động</p>
          </div>
          <small>
            {reportDate(range.from)} – {reportDate(range.to)}
          </small>
        </div>
        <div className="rp-filter-controls">
          <label>
            <span>Kỳ thống kê</span>
            <select
              aria-label="Kỳ thống kê"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError("");
              }}
            >
              {Object.entries(periods).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {draft === "custom" && (
            <>
              <label>
                <span>Từ ngày</span>
                <input
                  aria-label="Thống kê từ ngày"
                  type="date"
                  value={custom.from}
                  onChange={(e) => {
                    setCustom({ ...custom, from: e.target.value });
                    setError("");
                  }}
                />
              </label>
              <label>
                <span>Đến ngày</span>
                <input
                  aria-label="Thống kê đến ngày"
                  type="date"
                  value={custom.to}
                  onChange={(e) => {
                    setCustom({ ...custom, to: e.target.value });
                    setError("");
                  }}
                />
              </label>
            </>
          )}
          <div className="rp-filter-actions">
            <button className="rp-primary" onClick={apply}>
              Áp dụng
            </button>
            <button onClick={reset}>Đặt lại</button>
            {onRefresh && (
              <button disabled={loading} onClick={onRefresh}>
                <AdminIcon name="refresh" />
                {loading ? "Đang tải…" : "Làm mới"}
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="rp-error" role="alert">
            {error}
          </p>
        )}
        <p className="rp-filter-note">
          Đơn hàng tính theo ngày tạo, đặt bàn theo ngày khách đến · Giờ Việt
          Nam
        </p>
      </section>
      {initial ? (
        <div
          className="rp-skeleton"
          role="status"
          aria-label="Đang tải thống kê"
        >
          <div className="rd-kpis">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="rd-skeleton rd-skeleton-kpi" />
            ))}
          </div>
          <div className="rd-skeleton rd-skeleton-panel" />
        </div>
      ) : (
        <div className="rp-content" key={range.from + range.to}>
          <div className="rp-kpis">
            {stats.map(([icon, label, value, note, tone], i) => (
              <article
                className={
                  "rp-kpi rp-tone-" + tone + (i === 5 ? " rp-food-kpi" : "")
                }
                key={label}
              >
                <div>
                  <span>
                    <AdminIcon name={String(icon)} />
                  </span>
                  <p>{label}</p>
                </div>
                <strong>{value}</strong>
                <small>{note}</small>
              </article>
            ))}
          </div>
          {!data.recent.length && !data.book.length && (
            <section className="rd-panel">
              <ReportEmpty note="Chưa có đơn hàng hoặc lịch đặt bàn trong kỳ này. Hãy thử chọn khoảng thời gian khác." />
            </section>
          )}
          <section className="rd-panel rp-revenue">
            <header className="rd-panel-heading">
              <div>
                <h2>
                  {preset === "7"
                    ? "Doanh thu 7 ngày"
                    : preset === "30"
                      ? "Doanh thu 30 ngày"
                      : "Doanh thu theo thời gian"}
                </h2>
                <p>Giá trị các đơn hàng đã hoàn tất</p>
              </div>
              <span className="rp-period-pill">{periods[preset]}</span>
            </header>
            <div className="rp-revenue-summary">
              <strong>{money(data.revenue)}</strong>
              <span
                className={
                  "rp-comparison " +
                  (data.change !== null && data.change < 0 ? "is-down" : "")
                }
              >
                {data.change !== null
                  ? `${data.change >= 0 ? "↑ +" : "↓ "}${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(data.change)}% so với kỳ trước`
                  : "Chưa có doanh thu kỳ trước để so sánh"}
              </span>
            </div>
            <div className="rp-chart-scroll">
              <div
                style={{
                  minWidth:
                    data.bars.length > 14
                      ? data.bars.length * 32 + 60
                      : undefined,
                }}
              >
                <Bars
                  entries={data.bars}
                  type="revenue"
                  emptyLabel="Chưa có doanh thu trong kỳ đã chọn"
                />
              </div>
            </div>
            <footer className="rd-chart-footer">
              <span>
                <i />
                {data.group > 1
                  ? `Mỗi cột tổng hợp ${data.group} ngày`
                  : "Doanh thu theo ngày"}
              </span>
              <b>
                Kỳ trước: {reportDate(data.previousFrom)} –{" "}
                {reportDate(data.previousTo)} · {money(data.previous)}
              </b>
            </footer>
          </section>
          <div className="rd-chart-row">
            <section className="rd-panel rp-hours">
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
              <div className="rp-hour-insight">
                <span>
                  <AdminIcon name="clock" />
                  Khung giờ cao điểm: <b>{data.peakHour?.label || "Chưa có"}</b>
                </span>
                <span>
                  Số lượt đặt nhiều nhất: <b>{data.peakHour?.value || 0}</b>
                </span>
              </div>
              <Bars entries={data.hours} type="hours" />
              <p className="rp-note">
                Chỉ tính lịch trong kỳ đã chọn, không gồm lịch hủy hoặc từ chối.
              </p>
            </section>
            <section className="rd-panel rp-booking-effect">
              <header className="rd-panel-heading">
                <div>
                  <h2>Hiệu quả đặt bàn</h2>
                  <p>Trạng thái lịch đặt trong kỳ</p>
                </div>
                <AdminIcon name="calendar" />
              </header>
              <div className="rd-donut-layout">
                <div
                  className="rd-donut"
                  role="img"
                  aria-label={data.states
                    .map((s) => s.label + ": " + s.count)
                    .join("; ")}
                  style={{
                    background: data.book.length
                      ? `conic-gradient(${stops.join(",")})`
                      : "#edf1ec",
                  }}
                >
                  <div>
                    <strong>{data.book.length}</strong>
                    <span>booking</span>
                  </div>
                </div>
                <div className="rp-booking-legend">
                  {data.states
                    .filter(
                      (s) =>
                        s.count ||
                        ["completed", "cancelled", "waiting"].includes(s.key),
                    )
                    .map((s) => (
                      <div key={s.key}>
                        <i style={{ background: s.color }} />
                        <span>{s.label}</span>
                        <b>{s.count}</b>
                        <small>
                          {data.book.length
                            ? Math.round((s.count / data.book.length) * 100)
                            : 0}
                          %
                        </small>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          </div>
          <div className="rp-food-row">
            <section className="rd-panel rp-bestsellers">
              <header className="rd-panel-heading">
                <div>
                  <h2>Món bán chạy</h2>
                  <p>Top 5 món theo số lượng đã bán</p>
                </div>
                <AdminIcon name="food" />
              </header>
              {data.sold.length ? (
                <ol>
                  {data.sold.slice(0, 5).map((f, i) => (
                    <li key={f.name}>
                      <span className="rp-rank">{i + 1}</span>
                      <FoodImage item={f} />
                      <div>
                        <b>{f.name}</b>
                        <small>
                          {f.quantity} phần · {money(f.revenue)}
                        </small>
                        <div className="rp-food-progress">
                          <i
                            style={{
                              width:
                                (f.quantity / data.sold[0].quantity) * 100 +
                                "%",
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <ReportEmpty
                  title="Chưa có món bán ra"
                  note="Món ăn được thống kê từ đơn đã hoàn tất."
                />
              )}
            </section>
            <section className="rd-panel rp-food-revenue">
              <header className="rd-panel-heading">
                <div>
                  <h2>Doanh thu theo món</h2>
                  <p>Top 8 món · Giá trị trước voucher và phí giao hàng</p>
                </div>
                <span className="rp-period-pill">
                  {data.byRevenue.length} món
                </span>
              </header>
              {data.byRevenue.length ? (
                <div className="rp-food-revenue-list">
                  {data.byRevenue.slice(0, 8).map((f) => (
                    <article key={f.name}>
                      <div>
                        <b>{f.name}</b>
                        <strong>{money(f.revenue)}</strong>
                      </div>
                      <div className="rp-revenue-bar">
                        <i
                          style={{
                            width:
                              (f.revenue /
                                Math.max(1, data.byRevenue[0].revenue)) *
                                100 +
                              "%",
                          }}
                        />
                      </div>
                      <small>
                        {f.quantity} phần · Tỷ trọng{" "}
                        {data.foodRevenue
                          ? new Intl.NumberFormat("vi-VN", {
                              maximumFractionDigits: 1,
                            }).format((f.revenue / data.foodRevenue) * 100)
                          : 0}
                        %
                      </small>
                    </article>
                  ))}
                </div>
              ) : (
                <ReportEmpty
                  title="Chưa có doanh thu theo món"
                  note="Dữ liệu sẽ xuất hiện sau khi đơn hoàn tất."
                />
              )}
            </section>
          </div>
          <section className="rp-insights">
            <span>
              <AdminIcon name="chart" />
            </span>
            <div>
              <h2>Nhận định nhanh</h2>
              <ul>
                {data.peakDay && (
                  <li>
                    Doanh thu cao nhất ngày{" "}
                    <b>{reportDate(data.peakDay.day)}</b>:{" "}
                    <b>{money(data.peakDay.revenue)}</b>.
                  </li>
                )}
                {data.peakHour && (
                  <li>
                    Khung giờ <b>{data.peakHour.label}</b> có lượng đặt bàn cao
                    nhất: <b>{data.peakHour.value} lượt</b>.
                  </li>
                )}
                {data.byRevenue[0] && (
                  <li>
                    <b>{data.byRevenue[0].name}</b> là món mang doanh thu cao
                    nhất trong kỳ.
                  </li>
                )}
                {!data.peakDay && !data.peakHour && !data.byRevenue.length && (
                  <li>Chưa có đủ dữ liệu trong kỳ để đưa ra nhận định.</li>
                )}
              </ul>
            </div>
          </section>
          <section className="rd-panel rp-detail">
            <header className="rd-panel-heading">
              <div>
                <h2>Chi tiết hoạt động</h2>
                <p>Doanh thu, đơn hàng và đặt bàn theo từng ngày</p>
              </div>
              <span className="rp-period-pill">{data.days.length} ngày</span>
            </header>
            <div className="rp-table-scroll">
              <table className="rp-table">
                <thead>
                  <tr>
                    {[
                      "Ngày",
                      "Doanh thu",
                      "Đơn hoàn tất",
                      "Đặt bàn",
                      "Tỷ lệ hủy đơn",
                    ].map((s) => (
                      <th key={s}>{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((d) => (
                    <tr key={d.day}>
                      <td data-label="Ngày">
                        <b>{reportDate(d.day)}</b>
                      </td>
                      <td data-label="Doanh thu">
                        <strong>{money(d.revenue)}</strong>
                      </td>
                      <td data-label="Đơn hoàn tất">{d.completed} đơn</td>
                      <td data-label="Đặt bàn">{d.bookings} lượt</td>
                      <td data-label="Tỷ lệ hủy đơn">
                        <span className={d.cancelled ? "rp-cancelled" : ""}>
                          {d.orders
                            ? Math.round((d.cancelled / d.orders) * 100)
                            : 0}
                          %
                        </span>
                        <small>
                          {d.cancelled} / {d.orders} đơn
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="rp-pagination">
              <span>
                Hiển thị {(current - 1) * size + 1}–
                {Math.min(current * size, days.length)} / {days.length} ngày
              </span>
              <nav aria-label="Phân trang thống kê">
                <button
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                >
                  ← Trước
                </button>
                <span>
                  {current} / {pages}
                </span>
                <button
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                >
                  Sau →
                </button>
              </nav>
              <select
                aria-label="Số ngày mỗi trang"
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[20, 40, 60].map((n) => (
                  <option key={n} value={n}>
                    {n} / trang
                  </option>
                ))}
              </select>
            </footer>
          </section>
          <p className="rp-method-note">
            Doanh thu là tổng tiền đơn hoàn tất. Doanh thu món là số lượng × đơn
            giá trước giảm giá; tỷ trọng tính trên tổng giá trị món. Tỷ lệ hủy
            tính trên toàn bộ đơn trong kỳ.
          </p>
        </div>
      )}
    </div>
  );
}
