import { useEffect, useRef, useState } from "react";
import { areas, Row, transitions } from "./admin-api";
import { AdminIcon } from "./admin-shell";
import { AdminDialog } from "./admin-components";
import "./booking-management.css";

export const bookingLabels: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  checked_in: "Đã check-in",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  rejected: "Từ chối",
};
export function bookingDay(offset = 0) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(Date.now() + offset * 86400000));
}
export function bookingDate(date: string) {
  return date
    ? new Date(`${date}T12:00:00+07:00`).toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Chưa có ngày";
}
export function bookingInitials(name: string) {
  return (name || "Khách hàng")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase("vi");
}
export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span className={`bm-status bm-${status}`}>
      <i aria-hidden="true" />
      {bookingLabels[status] || status}
    </span>
  );
}
type Filters = {
  search: string;
  status: string;
  area: string;
  capacity: string;
  from: string;
  to: string;
};
type Actions = {
  busy: boolean;
  onOpen: (row: Row) => void;
  onStatus: (row: Row, status: string) => void;
};
export function BookingStats({ bookings }: { bookings: Row[] }) {
  const today = bookings.filter((r) => r.date === bookingDay());
  return (
    <div className="bm-stats">
      {[
        ["Đặt bàn hôm nay", today.length, "calendar", "today"],
        ...["pending", "confirmed", "checked_in", "cancelled"].map((status) => [
          bookingLabels[status],
          today.filter((r) => r.status === status).length,
          status === "checked_in"
            ? "users"
            : status === "pending"
              ? "clock"
              : "calendar",
          status,
        ]),
      ].map(([label, value, icon, status]) => (
        <article key={label} className={`bm-stat bm-stat-${status}`}>
          <span>
            <AdminIcon name={String(icon)} />
          </span>
          <div>
            <p>{label}</p>
            <strong>{value}</strong>
            <small>
              {status === "today" ? "Lịch hẹn trong ngày" : "Hôm nay"}
            </small>
          </div>
        </article>
      ))}
    </div>
  );
}
export function BookingFilters({
  filters,
  onFilters,
  onClear,
  onRefresh,
  refreshing,
}: {
  filters: Filters;
  onFilters: (patch: Partial<Filters>) => void;
  onClear: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <section className="bm-filters" aria-label="Bộ lọc lịch đặt bàn">
      <label className="bm-search">
        <AdminIcon name="search" />
        <input
          aria-label="Tìm tên, số điện thoại hoặc mã đặt bàn"
          placeholder="Tìm tên / SĐT / mã đặt…"
          value={filters.search}
          onChange={(e) => onFilters({ search: e.target.value })}
        />
      </label>
      <select
        aria-label="Lọc trạng thái đặt bàn"
        value={filters.status}
        onChange={(e) => onFilters({ status: e.target.value })}
      >
        <option value="">Tất cả trạng thái</option>
        {Object.entries(bookingLabels).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <select
        aria-label="Lọc khu vực đặt bàn"
        value={filters.area}
        onChange={(e) => onFilters({ area: e.target.value })}
      >
        <option value="">Tất cả khu vực</option>
        {Object.entries(areas).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <label className="bm-guests-filter">
        <AdminIcon name="users" />
        <input
          type="number"
          min={1}
          aria-label="Lọc số khách"
          placeholder="Số khách"
          value={filters.capacity}
          onChange={(e) => onFilters({ capacity: e.target.value })}
        />
      </label>
      <label className="bm-date-filter">
        <span>Từ ngày</span>
        <input
          type="date"
          aria-label="Từ ngày đặt bàn"
          value={filters.from}
          onChange={(e) => onFilters({ from: e.target.value })}
        />
      </label>
      <label className="bm-date-filter">
        <span>Đến ngày</span>
        <input
          type="date"
          aria-label="Đến ngày đặt bàn"
          value={filters.to}
          onChange={(e) => onFilters({ to: e.target.value })}
        />
      </label>
      <div className="bm-filter-actions">
        <button
          disabled={!Object.values(filters).some(Boolean)}
          onClick={onClear}
        >
          Xóa bộ lọc
        </button>
        <button disabled={refreshing} onClick={onRefresh}>
          ↻ {refreshing ? "Đang tải…" : "Làm mới"}
        </button>
      </div>
    </section>
  );
}
export function BookingQuickFilters({
  filters,
  onFilters,
}: {
  filters: Filters;
  onFilters: (patch: Partial<Filters>) => void;
}) {
  return (
    <nav className="bm-quick-filters" aria-label="Lọc nhanh lịch đặt bàn">
      {[
        ["Hôm nay", bookingDay()],
        ["Ngày mai", bookingDay(1)],
      ].map(([label, day]) => (
        <button
          key={day}
          aria-pressed={filters.from === day && filters.to === day}
          onClick={() =>
            onFilters(
              filters.from === day && filters.to === day
                ? { from: "", to: "" }
                : { from: day, to: day },
            )
          }
        >
          <AdminIcon name="calendar" />
          {label}
        </button>
      ))}
      {["pending", "confirmed", "checked_in", "cancelled"].map((status) => (
        <button
          key={status}
          aria-pressed={filters.status === status}
          onClick={() =>
            onFilters({ status: filters.status === status ? "" : status })
          }
        >
          <span className={`bm-chip-dot bm-${status}`} />
          {status === "checked_in" ? "Check-in" : bookingLabels[status]}
        </button>
      ))}
    </nav>
  );
}
function BookingCode({ row }: { row: Row }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bm-code">
      <b>#{row.code || row.id}</b>
      <button
        title={copied ? "Đã sao chép" : "Sao chép mã đặt"}
        aria-label={`Sao chép mã ${row.code || row.id}`}
        onClick={() =>
          void navigator.clipboard
            .writeText(row.code || row.id)
            .then(() => setCopied(true))
            .catch(() => setCopied(false))
        }
      >
        {copied ? "✓" : "⧉"}
      </button>
    </div>
  );
}
function BookingActions({
  row,
  onRequestStatus,
  ...actions
}: Actions & {
  row: Row;
  onRequestStatus: (row: Row, status: string) => void;
}) {
  const [open, setOpen] = useState(false),
    ref = useRef<HTMLDivElement>(null);
  const allowed = transitions(row, true),
    assignable = ["pending", "confirmed"].includes(row.status);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>(".bm-more")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const confirm = () =>
    row.tableId ? actions.onStatus(row, "confirmed") : actions.onOpen(row);
  const menus: [string, () => void, boolean?][] = [
    ...(assignable
      ? ([
          ["Gán / đổi bàn", () => actions.onOpen(row)],
          ["Chỉnh sửa", () => actions.onOpen(row)],
        ] as [string, () => void][])
      : []),
    ...(allowed.includes("confirmed")
      ? ([["Xác nhận", confirm]] as [string, () => void][])
      : []),
    ...(allowed.includes("rejected")
      ? ([["Từ chối", () => onRequestStatus(row, "rejected"), true]] as [
          string,
          () => void,
          boolean,
        ][])
      : []),
    ...(allowed.includes("cancelled")
      ? ([["Hủy booking", () => onRequestStatus(row, "cancelled"), true]] as [
          string,
          () => void,
          boolean,
        ][])
      : []),
  ];
  return (
    <div className="bm-actions" ref={ref}>
      <button
        className="bm-view"
        disabled={actions.busy}
        onClick={() => actions.onOpen(row)}
        aria-label={`Xem booking ${row.code || row.id}`}
      >
        <AdminIcon name="eye" />
        Xem
      </button>
      {row.status === "pending" ? (
        <>
          <button
            className="bm-confirm"
            disabled={actions.busy}
            onClick={confirm}
          >
            {row.tableId ? "Xác nhận" : "Gán bàn"}
          </button>
          <button
            className="bm-reject"
            disabled={actions.busy}
            onClick={() => onRequestStatus(row, "rejected")}
          >
            Từ chối
          </button>
        </>
      ) : row.status === "confirmed" ? (
        <button
          className="bm-confirm"
          disabled={actions.busy}
          onClick={() => actions.onStatus(row, "checked_in")}
        >
          <AdminIcon name="check" />
          Check-in
        </button>
      ) : row.status === "checked_in" ? (
        <button
          className="bm-confirm"
          disabled={actions.busy}
          onClick={() => actions.onStatus(row, "completed")}
        >
          Hoàn tất
        </button>
      ) : null}
      {menus.length > 0 && (
        <>
          <button
            className="bm-more"
            aria-label={`Thao tác booking ${row.code || row.id}`}
            aria-expanded={open}
            disabled={actions.busy}
            onClick={() => setOpen(!open)}
          >
            ⋯
          </button>
          {open && (
            <div className="bm-action-menu">
              {menus.map(([label, fn, danger]) => (
                <button
                  key={label}
                  className={danger ? "bm-danger" : undefined}
                  onClick={() => {
                    setOpen(false);
                    fn();
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
function BookingRow({
  row,
  ...actions
}: Actions & {
  row: Row;
  onRequestStatus: (row: Row, status: string) => void;
}) {
  return (
    <tr className={`bm-row bm-row-${row.status}`}>
      <td className="bm-code-cell">
        <BookingCode row={row} />
      </td>
      <td className="bm-customer-cell">
        <div className="bm-customer">
          <span className="bm-avatar">{bookingInitials(row.name)}</span>
          <div>
            <b>{row.name || "Khách hàng"}</b>
            <a href={`tel:${row.phone}`}>{row.phone || "Chưa có SĐT"}</a>
          </div>
        </div>
      </td>
      <td className="bm-date-cell">
        <span>
          <AdminIcon name="calendar" />
          {bookingDate(row.date)}
        </span>
        <small>
          <AdminIcon name="clock" />
          {row.time}
        </small>
      </td>
      <td className="bm-guests-cell">
        <span
          className={
            row.guests >= 10 ? "bm-guests bm-large-group" : "bm-guests"
          }
        >
          <AdminIcon name="users" />
          {row.guests} khách
        </span>
      </td>
      <td className="bm-area-cell">
        <b>{areas[row.area] || row.area}</b>
        {row.tableId ? (
          <small className="bm-table-id">{row.tableId}</small>
        ) : (
          <span className="bm-unassigned">Chưa xếp bàn</span>
        )}
      </td>
      <td className="bm-status-cell">
        <BookingStatusBadge status={row.status} />
      </td>
      <td className="bm-action-cell">
        <BookingActions row={row} {...actions} />
      </td>
    </tr>
  );
}
export function BookingPagination({
  page,
  size,
  total,
  onPage,
  onSize,
}: {
  page: number;
  size: number;
  total: number;
  onPage: (page: number) => void;
  onSize: (size: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size)),
    start = Math.max(1, Math.min(page - 2, pages - 4));
  return (
    <footer className="bm-pagination">
      <span>
        Hiển thị {total ? (page - 1) * size + 1 : 0}–
        {Math.min(page * size, total)} / {total} booking
      </span>
      <select
        aria-label="Số booking mỗi trang"
        value={size}
        onChange={(e) => onSize(Number(e.target.value))}
      >
        {[20, 40, 60].map((n) => (
          <option key={n} value={n}>
            {n} / trang
          </option>
        ))}
      </select>
      <nav aria-label="Phân trang đặt bàn">
        <button disabled={page === 1} onClick={() => onPage(page - 1)}>
          ← Trước
        </button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => start + i).map(
          (n) => (
            <button
              key={n}
              aria-label={`Trang booking ${n}`}
              aria-current={n === page ? "page" : undefined}
              onClick={() => onPage(n)}
            >
              {n}
            </button>
          ),
        )}
        <button disabled={page === pages} onClick={() => onPage(page + 1)}>
          Sau →
        </button>
      </nav>
    </footer>
  );
}
export function BookingManagement({
  bookings,
  rows,
  filters,
  onFilters,
  onClear,
  onRefresh,
  refreshing,
  ...actions
}: Actions & {
  bookings: Row[];
  rows: Row[];
  filters: Filters;
  onFilters: (patch: Partial<Filters>) => void;
  onClear: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const [page, setPage] = useState(1),
    [size, setSize] = useState(20),
    [confirm, setConfirm] = useState<{ row: Row; status: string } | null>(null);
  const key = JSON.stringify(filters);
  useEffect(() => {
    setPage(1);
  }, [key]);
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / size)));
  return (
    <section className="bm-management" aria-label="Quản lý đặt bàn">
      <BookingStats bookings={bookings} />
      <BookingFilters
        filters={filters}
        onFilters={onFilters}
        onClear={onClear}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
      <BookingQuickFilters filters={filters} onFilters={onFilters} />
      <div className="bm-card" aria-busy={refreshing}>
        <header className="bm-card-header">
          <div>
            <h2>Danh sách đặt bàn</h2>
            <p>Theo dõi lịch hẹn và xử lý yêu cầu của khách</p>
          </div>
          <span aria-live="polite">{rows.length} booking</span>
        </header>
        <div className="bm-table-scroll">
          <table className="bm-table">
            <thead>
              <tr>
                {[
                  "Mã đặt",
                  "Khách hàng",
                  "Ngày giờ",
                  "Số khách",
                  "Khu vực / Bàn",
                  "Trạng thái",
                  "Thao tác",
                ].map((label, i) => (
                  <th
                    key={label}
                    scope="col"
                    className={i === 3 ? "bm-guests-cell" : undefined}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice((current - 1) * size, current * size).map((row) => (
                <BookingRow
                  key={row.id}
                  row={row}
                  {...actions}
                  onRequestStatus={(row, status) => setConfirm({ row, status })}
                />
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <div className="bm-empty">
            <span>
              <AdminIcon name="calendar" />
            </span>
            <h3>Chưa có lịch đặt bàn phù hợp</h3>
            <p>Hãy thử thay đổi bộ lọc.</p>
            <button onClick={onClear}>Xóa bộ lọc</button>
          </div>
        )}
        <BookingPagination
          total={rows.length}
          page={current}
          size={size}
          onPage={setPage}
          onSize={(n) => {
            setSize(n);
            setPage(1);
          }}
        />
      </div>
      {confirm && (
        <AdminDialog
          title={
            confirm.status === "cancelled" ? "Hủy booking?" : "Từ chối booking?"
          }
          onClose={() => !actions.busy && setConfirm(null)}
        >
          <div className="bm-confirm-dialog">
            <p>
              Bạn có chắc muốn{" "}
              {confirm.status === "cancelled" ? "hủy" : "từ chối"} lịch đặt{" "}
              <strong>#{confirm.row.code}</strong> của{" "}
              <strong>{confirm.row.name}</strong>?
            </p>
            <footer>
              <button disabled={actions.busy} onClick={() => setConfirm(null)}>
                Quay lại
              </button>
              <button
                className="danger"
                disabled={actions.busy}
                onClick={() => {
                  actions.onStatus(confirm.row, confirm.status);
                  setConfirm(null);
                }}
              >
                {confirm.status === "cancelled" ? "Hủy booking" : "Từ chối"}
              </button>
            </footer>
          </div>
        </AdminDialog>
      )}
    </section>
  );
}
