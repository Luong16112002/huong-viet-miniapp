import { HistoryIcon } from "./history-icon";
import { Link } from "react-router-dom";
import { HistoryTab } from "@/utils/order-history";
import mark from "@/static/huong-viet-mark.svg";

export function OrderHeader() {
  return (
    <header className="oh-header">
      <Link to="/" className="oh-brand">
        <img src={mark} alt="" />
        <span>
          <strong>Nhà hàng Hương Việt</strong>
          <small>Ẩm thực Việt – Tinh hoa trong từng món ăn</small>
        </span>
      </Link>
      <Link to="/notifications" aria-label="Thông báo" className="oh-icon">
        <HistoryIcon name="bell" />
      </Link>
      <Link to="/menu" aria-label="Mở thực đơn" className="oh-icon">
        <HistoryIcon name="menu" />
      </Link>
    </header>
  );
}
export function OrderHero() {
  return (
    <section className="oh-hero">
      <span>HƯƠNG VIỆT · GÓC CỦA BẠN</span>
      <h1>Đơn hàng & Đặt bàn</h1>
      <p>Mỗi bữa ngon, mỗi cuộc hẹn — đều ở đây.</p>
      <Link to="/menu" className="oh-new">
        ＋ Đặt món mới <span>→</span>
      </Link>
    </section>
  );
}
export function OrderStatsCards({
  upcoming,
  ongoing,
  completed,
  loading,
  select,
}: {
  upcoming: number;
  ongoing: number;
  completed: number;
  loading: boolean;
  select: (tab: HistoryTab, upcoming?: boolean) => void;
}) {
  return (
    <div className="oh-stats">
      {[
        {
          icon: "bag",
          count: upcoming,
          label: "Sắp tới",
          tab: "reservation",
          upcoming: true,
        },
        {
          icon: "clock",
          count: ongoing,
          label: "Đang diễn ra",
          tab: "ongoing",
        },
        {
          icon: "check",
          count: completed,
          label: "Đã hoàn tất",
          tab: "completed",
        },
      ].map((item) => (
        <button
          key={item.label}
          onClick={() => select(item.tab as HistoryTab, item.upcoming)}
        >
          <span>
            <HistoryIcon name={item.icon} />
          </span>
          <strong>{loading ? "—" : item.count}</strong>
          <small>{item.label}</small>
        </button>
      ))}
    </div>
  );
}
export function OrderStatusTabs({
  tab,
  select,
}: {
  tab: HistoryTab;
  select: (tab: HistoryTab) => void;
}) {
  const tabs: [HistoryTab, string][] = [
    ["all", "Tất cả"],
    ["food", "Đơn món ăn"],
    ["reservation", "Đặt bàn"],
    ["ongoing", "Đang diễn ra"],
    ["completed", "Hoàn tất"],
    ["cancelled", "Đã hủy"],
  ];
  return (
    <div className="oh-tabs" role="group" aria-label="Lọc trạng thái">
      {tabs.map(([id, label]) => (
        <button key={id} aria-pressed={tab === id} onClick={() => select(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}
export function OrderSearchBar({
  query,
  setQuery,
  sort,
  setSort,
  refresh,
  loading,
}: {
  query: string;
  setQuery: (value: string) => void;
  sort: string;
  setSort: (value: string) => void;
  refresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="oh-tools">
      <label className="oh-search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          aria-label="Tìm mã đơn, tên món, người đặt"
          placeholder="Tìm mã đơn, tên món, người đặt…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <select
        aria-label="Sắp xếp lịch sử"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
      >
        <option value="newest">Mới nhất</option>
        <option value="oldest">Cũ nhất</option>
        <option value="price-high">Giá cao nhất</option>
        <option value="price-low">Giá thấp nhất</option>
      </select>
      <button
        className="oh-refresh"
        disabled={loading}
        onClick={refresh}
        aria-label="Làm mới danh sách"
      >
        <span className={loading ? "oh-spin" : ""}>↻</span>
      </button>
    </div>
  );
}
export function OrderEmptyState({
  booking,
  search,
  reset,
}: {
  booking: boolean;
  search: boolean;
  reset: () => void;
}) {
  return (
    <div className="oh-empty">
      <span aria-hidden="true">{booking ? "▦" : "▣"}</span>
      <h2>
        {search
          ? "Không tìm thấy kết quả"
          : booking
            ? "Bạn chưa có lịch đặt bàn nào"
            : "Bạn chưa có đơn hàng nào"}
      </h2>
      <p>
        {search
          ? "Thử từ khóa khác hoặc bỏ bộ lọc."
          : booking
            ? "Chọn một cuộc hẹn để nhà hàng chuẩn bị đón bạn."
            : "Hãy khám phá thực đơn và đặt món yêu thích của bạn."}
      </p>
      {search ? (
        <button className="oh-primary" onClick={reset}>
          Xóa bộ lọc
        </button>
      ) : (
        <Link className="oh-primary" to={booking ? "/reservation" : "/menu"}>
          {booking ? "Đặt bàn ngay" : "Khám phá thực đơn"}
        </Link>
      )}
    </div>
  );
}
