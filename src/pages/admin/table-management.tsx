import { useEffect, useMemo, useRef, useState } from "react";
import { areas, Row } from "./admin-api";
import { AdminIcon } from "./admin-shell";
import { AdminDialog } from "./admin-components";
import "./table-management.css";

const tableStates: Record<string, string> = {
  AVAILABLE: "Trống",
  RESERVED: "Đã đặt",
  OCCUPIED: "Đang sử dụng",
  CLEANING: "Đang dọn",
  DISABLED: "Ngưng sử dụng",
};
type TableActions = {
  busy: boolean;
  onEdit: (table: Row) => void;
  onStatus: (table: Row, status: string) => Promise<boolean>;
  onDelete: (table: Row) => void;
};
type TableFilters = {
  search: string;
  status: string;
  area: string;
  capacity: string;
};
export function TableStatusBadge({ status }: { status: string }) {
  return (
    <span className={`tm-badge tm-${status}`}>
      <i aria-hidden="true" />
      {tableStates[status] || status}
    </span>
  );
}
export function TableStats({
  tables,
  total,
}: {
  tables: Row[];
  total: number;
}) {
  return (
    <div className="tm-stats">
      {[
        ["Tổng bàn", total, "table", "total"],
        ...Object.entries(tableStates)
          .filter(([key]) => key !== "DISABLED")
          .map(([key, label]) => [
            label,
            tables.filter((t) => t.status === key).length,
            key === "RESERVED"
              ? "calendar"
              : key === "OCCUPIED"
                ? "users"
                : key === "CLEANING"
                  ? "clock"
                  : "table",
            key,
          ]),
      ].map(([label, value, icon, key]) => (
        <article key={label} className={`tm-stat tm-stat-${key}`}>
          <span className="tm-stat-icon">
            <AdminIcon name={String(icon)} />
          </span>
          <div>
            <p>{label}</p>
            <strong>{value}</strong>
          </div>
        </article>
      ))}
    </div>
  );
}
export function TableFiltersCard({
  filters,
  onFilter,
  onClear,
}: {
  filters: TableFilters;
  onFilter: (key: string, value: string) => void;
  onClear: () => void;
}) {
  const active = Object.values(filters).some(Boolean);
  return (
    <section className="tm-filters" aria-label="Bộ lọc bàn">
      <label className="tm-search">
        <AdminIcon name="search" />
        <input
          aria-label="Tìm mã hoặc tên bàn"
          placeholder="Tìm mã / tên bàn…"
          value={filters.search}
          onChange={(e) => onFilter("search", e.target.value)}
        />
      </label>
      <select
        aria-label="Lọc trạng thái bàn"
        value={filters.status}
        onChange={(e) => onFilter("status", e.target.value)}
      >
        <option value="">Tất cả trạng thái</option>
        {Object.entries(tableStates).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <select
        aria-label="Lọc khu vực bàn"
        value={filters.area}
        onChange={(e) => onFilter("area", e.target.value)}
      >
        <option value="">Tất cả khu vực</option>
        {Object.entries(areas).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={1}
        aria-label="Sức chứa tối thiểu"
        placeholder="Sức chứa tối thiểu"
        value={filters.capacity}
        onChange={(e) => onFilter("capacity", e.target.value)}
      />
      <button disabled={!active} onClick={onClear}>
        Xóa bộ lọc
      </button>
    </section>
  );
}
export function TableAreaChips({
  tables,
  area,
  onChange,
}: {
  tables: Row[];
  area: string;
  onChange: (area: string) => void;
}) {
  return (
    <nav className="tm-areas" aria-label="Chọn khu vực bàn">
      {[["", "Tất cả"], ...Object.entries(areas)].map(([key, label]) => (
        <button
          key={key}
          aria-pressed={area === key}
          onClick={() => onChange(key)}
        >
          {label}
          <span>
            {
              tables.filter(
                (t) => t.active !== false && (!key || t.area === key),
              ).length
            }
          </span>
        </button>
      ))}
    </nav>
  );
}
function BookingPreview({
  booking,
  compact = false,
}: {
  booking?: Row;
  compact?: boolean;
}) {
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
  const date =
    booking?.date === today
      ? "hôm nay"
      : booking?.date
        ? new Date(`${booking.date}T12:00:00+07:00`).toLocaleDateString(
            "vi-VN",
            { day: "2-digit", month: "2-digit" },
          )
        : "";
  return (
    <div
      className={[
        "tm-booking",
        booking && "has-booking",
        compact && "is-compact",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <AdminIcon name="calendar" />
      <div>
        {!compact && <small>Booking tiếp theo</small>}
        {booking ? (
          <>
            <strong>
              {booking.time} {date} <span>· {booking.guests} khách</span>
            </strong>
            <p>{booking.code || booking.id}</p>
          </>
        ) : (
          <p>Chưa có lịch đặt</p>
        )}
      </div>
    </div>
  );
}
function TableStatusSelect({
  table,
  busy,
  onStatus,
}: Pick<TableActions, "busy" | "onStatus"> & { table: Row }) {
  return (
    <select
      aria-label={`Trạng thái ${table.id}`}
      disabled={busy}
      value={table.status}
      onChange={(e) => onStatus(table, e.target.value)}
    >
      {Object.entries(tableStates).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}
function TableActionMenu({
  table,
  onDetail,
  onDeactivate,
  onChangeStatus,
  busy,
  onEdit,
}: Pick<TableActions, "busy" | "onEdit"> & {
  table: Row;
  onDetail: (t: Row) => void;
  onDeactivate: (t: Row, deleting: boolean) => void;
  onChangeStatus: (t: Row) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>(".tm-more")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const action = (fn: () => void) => {
    setOpen(false);
    fn();
  };
  return (
    <div className="tm-actions" ref={ref}>
      <button
        aria-label={`Sửa bàn ${table.id}`}
        disabled={busy}
        onClick={() => onEdit(table)}
      >
        ✎ Sửa
      </button>
      <button
        className="tm-more"
        aria-label={`Thao tác bàn ${table.id}`}
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen(!open)}
      >
        ⋯
      </button>
      {open && (
        <div className="tm-action-menu">
          <button onClick={() => action(() => onDetail(table))}>
            Xem chi tiết
          </button>
          <button onClick={() => action(() => onChangeStatus(table))}>
            Đổi trạng thái
          </button>
          <button
            disabled={table.status === "DISABLED"}
            onClick={() => action(() => onDeactivate(table, false))}
          >
            Ngưng sử dụng
          </button>
          <button
            className="tm-danger"
            disabled={table.status === "DISABLED"}
            onClick={() => action(() => onDeactivate(table, true))}
          >
            Xóa bàn
          </button>
        </div>
      )}
    </div>
  );
}
type InventoryProps = TableActions & {
  rows: Row[];
  bookings: Row[];
  onAdd?: () => void;
  onBulk?: () => void;
  filterKey?: string;
  onClear?: () => void;
};
export function TableInventory({
  rows,
  bookings,
  onAdd,
  onBulk,
  filterKey = "",
  onClear,
  ...actions
}: InventoryProps) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [view, setView] = useState("grid"),
    [size, setSize] = useState(20),
    [page, setPage] = useState(1),
    [detail, setDetail] = useState<Row | null>(null),
    [statusEdit, setStatusEdit] = useState<Row | null>(null),
    [deactivate, setDeactivate] = useState<{
      table: Row;
      deleting: boolean;
    } | null>(null);
  useEffect(() => {
    setPage(1);
  }, [filterKey]);
  const pages = Math.max(1, Math.ceil(rows.length / size)),
    current = Math.min(page, pages),
    visible = rows.slice((current - 1) * size, current * size);
  const nextBookings = useMemo(() => {
    const next = new Map<string, Row>();
    for (const b of bookings
      .filter(
        (b) =>
          ["pending", "confirmed"].includes(b.status) &&
          Date.parse(`${b.date}T${b.time}:00+07:00`) >= Date.now(),
      )
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)))
      if (!next.has(b.tableId)) next.set(b.tableId, b);
    return next;
  }, [bookings]);
  const actionProps = {
    busy: actions.busy,
    onEdit: actions.onEdit,
    onDetail: setDetail,
    onChangeStatus: (table: Row, status = table.status) => {
      setSelectedStatus(status);
      setStatusError("");
      setStatusEdit(table);
    },
    onDeactivate: (table: Row, deleting: boolean) =>
      setDeactivate({ table, deleting }),
  };
  const sizeSelect = (
    <select
      aria-label="Số bàn mỗi trang"
      value={size}
      onChange={(e) => {
        setSize(Number(e.target.value));
        setPage(1);
      }}
    >
      {[20, 25].map((n) => (
        <option key={n} value={n}>
          {n} bàn / trang
        </option>
      ))}
    </select>
  );
  const start = Math.max(1, Math.min(current - 2, pages - 4));
  return (
    <>
      <div className="tm-toolbar">
        <div className="tm-toolbar-left">
          <b>
            {rows.length.toLocaleString("vi-VN")} <span>kết quả</span>
          </b>
          <div
            className="tm-view"
            role="group"
            aria-label="Chế độ hiển thị bàn"
          >
            <button
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
            >
              <AdminIcon name="grid" />
              Grid
            </button>
            <button
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <AdminIcon name="chart" />
              Danh sách
            </button>
          </div>
        </div>
        <div className="tm-toolbar-right">
          {sizeSelect}
          {onBulk && (
            <button
              className="tm-bulk"
              disabled={actions.busy}
              onClick={onBulk}
            >
              + Thêm hàng loạt
            </button>
          )}
          {onAdd && (
            <button className="primary" disabled={actions.busy} onClick={onAdd}>
              + Thêm bàn
            </button>
          )}
        </div>
      </div>
      {!visible.length ? (
        <div className="tm-empty">
          <span>
            <AdminIcon name="table" />
          </span>
          <h2>Không tìm thấy bàn phù hợp</h2>
          <p>Hãy thử thay đổi bộ lọc.</p>
          {onClear && <button onClick={onClear}>Xóa bộ lọc</button>}
        </div>
      ) : view === "grid" ? (
        <div className="tm-grid">
          {visible.map((table) => (
            <article
              key={table.id}
              className={`tm-table-card tm-card-${table.status}`}
            >
              <div className="tm-card-top">
                <span className="tm-table-icon">
                  <AdminIcon name="table" />
                </span>
                <TableStatusBadge status={table.status} />
              </div>
              <h2>
                <span>{table.id}</span> · {table.name}
              </h2>
              <p className="tm-meta">
                <span>{areas[table.area] || table.area}</span>
                <span>
                  <AdminIcon name="users" />
                  {table.capacity} khách
                </span>
              </p>
              <BookingPreview booking={nextBookings.get(table.id)} />
              <div className="tm-card-footer">
                <label>
                  <span>Trạng thái</span>
                  <TableStatusSelect
                    table={table}
                    busy={actions.busy}
                    onStatus={async (table, status) => {
                      actionProps.onChangeStatus(table, status);
                      return false;
                    }}
                  />
                </label>
                <TableActionMenu table={table} {...actionProps} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="tm-list-wrap">
          <table className="tm-list">
            <thead>
              <tr>
                {[
                  "Mã bàn",
                  "Tên bàn",
                  "Khu vực",
                  "Sức chứa",
                  "Trạng thái",
                  "Booking tiếp theo",
                  "Thao tác",
                ].map((label) => (
                  <th scope="col" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((table) => (
                <tr key={table.id}>
                  <td>
                    <b>{table.id}</b>
                  </td>
                  <td>{table.name}</td>
                  <td>{areas[table.area]}</td>
                  <td>
                    <span className="tm-capacity">
                      <AdminIcon name="users" />
                      {table.capacity} khách
                    </span>
                  </td>
                  <td>
                    <TableStatusBadge status={table.status} />
                  </td>
                  <td>
                    <BookingPreview
                      booking={nextBookings.get(table.id)}
                      compact
                    />
                  </td>
                  <td>
                    <TableActionMenu table={table} {...actionProps} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <footer className="tm-pagination">
        <span>
          Hiển thị {rows.length ? (current - 1) * size + 1 : 0}–
          {Math.min(current * size, rows.length)} / {rows.length} bàn
        </span>
        <nav aria-label="Phân trang bàn">
          <button disabled={current === 1} onClick={() => setPage(current - 1)}>
            ← Trước
          </button>
          {Array.from({ length: Math.min(5, pages) }, (_, i) => start + i).map(
            (n) => (
              <button
                key={n}
                aria-label={`Trang bàn ${n}`}
                aria-current={n === current ? "page" : undefined}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ),
          )}
          <button
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            Sau →
          </button>
        </nav>
        {sizeSelect}
      </footer>
      {detail && (
        <AdminDialog title="Chi tiết bàn" onClose={() => setDetail(null)}>
          <div className="tm-detail">
            <span className="tm-table-icon">
              <AdminIcon name="table" />
            </span>
            <h3>
              {detail.id} · {detail.name}
            </h3>
            <TableStatusBadge status={detail.status} />
            <p>
              {areas[detail.area]} · {detail.capacity} khách
            </p>
            <BookingPreview booking={nextBookings.get(detail.id)} />
            <p>{detail.note || "Chưa có ghi chú."}</p>
            <button
              className="primary"
              disabled={actions.busy}
              onClick={() => {
                setDetail(null);
                actions.onEdit(detail);
              }}
            >
              ✎ Sửa bàn
            </button>
          </div>
        </AdminDialog>
      )}
      {statusEdit && (
        <AdminDialog
          title={`Đổi trạng thái ${statusEdit.id}`}
          onClose={() => !updating && !actions.busy && setStatusEdit(null)}
        >
          <div className="tm-detail">
            <p>Chọn trạng thái phục vụ của bàn.</p>
            {statusError && <p className="admin-error" role="alert">{statusError}</p>}
            <select
              aria-label={`Trạng thái ${statusEdit.id}`}
              value={selectedStatus}
              disabled={updating || actions.busy}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {Object.entries(tableStates).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <footer>
              <button disabled={updating || actions.busy} onClick={() => setStatusEdit(null)}>Hủy</button>
              <button
                className="primary"
                disabled={updating || actions.busy || !selectedStatus}
                onClick={async () => {
                  if (!statusEdit?.id || updating) return;
                  setUpdating(true);
                  setStatusError("");
                  console.log("TABLE ID:", statusEdit.id);
                  console.log("OLD STATUS:", statusEdit.status);
                  console.log("NEW STATUS:", selectedStatus);
                  try {
                    if (await actions.onStatus(statusEdit, selectedStatus)) setStatusEdit(null);
                    else setStatusError("Không thể cập nhật trạng thái. Vui lòng kiểm tra thông báo lỗi và thử lại.");
                  } catch (error) {
                    console.error("[UPDATE TABLE STATUS]", error);
                    setStatusError(error instanceof Error ? error.message : "Không thể cập nhật trạng thái");
                  } finally {
                    setUpdating(false);
                  }
                }}
              >{updating ? "Đang lưu…" : "Lưu trạng thái"}</button>
            </footer>
          </div>
        </AdminDialog>
      )}
      {deactivate && (
        <AdminDialog
          title={deactivate.deleting ? "Xóa bàn?" : "Ngưng sử dụng bàn?"}
          onClose={() => !actions.busy && setDeactivate(null)}
        >
          <div className="tm-detail">
            <p>
              Bạn có chắc muốn ngưng sử dụng{" "}
              <strong>
                {deactivate.table.id} · {deactivate.table.name}
              </strong>
              ?
            </p>
            <p className="tm-muted">
              Bàn sẽ chuyển sang trạng thái Ngưng sử dụng. Lịch sử đặt bàn và
              đơn hàng được giữ lại.
            </p>
            <footer>
              <button
                disabled={actions.busy}
                onClick={() => setDeactivate(null)}
              >
                Hủy
              </button>
              <button
                className="danger"
                disabled={actions.busy}
                onClick={() => {
                  actions.onDelete(deactivate.table);
                  setDeactivate(null);
                }}
              >
                Ngưng sử dụng
              </button>
            </footer>
          </div>
        </AdminDialog>
      )}
    </>
  );
}
export function TableManagement({
  tables,
  rows,
  bookings,
  total,
  filters,
  onFilter,
  onClear,
  ...props
}: InventoryProps & {
  tables: Row[];
  total: number;
  filters: TableFilters;
  onFilter: (key: string, value: string) => void;
  onClear: () => void;
}) {
  return (
    <section className="tm-management" aria-label="Quản lý bàn">
      <TableStats tables={tables} total={total} />
      <TableFiltersCard
        filters={filters}
        onFilter={onFilter}
        onClear={onClear}
      />
      <TableAreaChips
        tables={tables}
        area={filters.area}
        onChange={(area) => onFilter("area", area)}
      />
      <TableInventory
        rows={rows}
        bookings={bookings}
        {...props}
        onClear={onClear}
        filterKey={JSON.stringify(filters)}
      />
    </section>
  );
}
