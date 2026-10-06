import { useEffect, useRef, useState } from "react";
import { Row, labels, money, transitions } from "./admin-api";
import { AdminIcon } from "./admin-shell";
import { AdminDialog } from "./admin-components";
import "./order-management.css";

export const orderActionLabels: Record<string, string> = {
  confirmed: "Xác nhận",
  preparing: "Bắt đầu chuẩn bị",
  ready: "Đánh dấu sẵn sàng",
  serving: "Phục vụ món",
  delivering: "Giao món",
  completed: "Hoàn tất",
  cancelled: "Hủy đơn",
};
export function orderCustomer(row: Row) {
  return (
    row.customerName ||
    row.name ||
    row.deliveryAddress?.recipientName ||
    "Khách tại quầy"
  );
}
export function orderPhone(row: Row) {
  return row.phone || row.deliveryAddress?.phoneNumber || "";
}
export function orderDateTime(value: string) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return { date: "—", time: "—" };
  return {
    date: date.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}
export function OrderStatusBadge({ state }: { state: string }) {
  return (
    <span className={`om-status om-${state}`}>
      <i aria-hidden="true" />
      {state === "delivered" ? "Hoàn tất" : labels[state] || state}
    </span>
  );
}
export function OrderCustomer({ row }: { row: Row }) {
  const name = orderCustomer(row),
    phone = orderPhone(row),
    named = name !== "Khách tại quầy";
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word: string) => word[0])
    .join("")
    .toLocaleUpperCase("vi");
  return (
    <div className="om-customer">
      <span className="om-avatar">
        {named ? initials : <AdminIcon name="users" />}
      </span>
      <div>
        <b>{name}</b>
        {phone ? (
          <a href={`tel:${phone}`}>{phone}</a>
        ) : (
          <small>Không có SĐT</small>
        )}
      </div>
    </div>
  );
}
export function OrderDelivery({ row }: { row: Row }) {
  const type = row.deliveryType;
  const text =
    (
      {
        dinein: "Phục vụ tại bàn",
        pickup: "Tự đến lấy",
        delivery: "Giao hàng",
      } as Record<string, string>
    )[type] ||
    row.deliveryTypeLabel ||
    "Chưa có hình thức";
  return (
    <div className="om-delivery">
      <AdminIcon
        name={
          type === "dinein" ? "table" : type === "delivery" ? "truck" : "bag"
        }
      />
      <div>
        <b>{text}</b>
        <small title={row.deliveryAddress?.address}>
          {type === "dinein"
            ? row.tableId || row.tableNumber || "Chưa gán bàn"
            : type === "delivery"
              ? row.deliveryAddress?.address || "Chưa có địa chỉ"
              : "—"}
        </small>
      </div>
    </div>
  );
}
export function printOrderInvoice(row: Row) {
  const escape = (value: unknown) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  const stamp = orderDateTime(row.createdAt);
  const frame = document.createElement("iframe");
  frame.title = "In hóa đơn đơn hàng";
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;opacity:0";
  frame.onload = () => {
    const target = frame.contentWindow;
    if (!target) return;
    target.onafterprint = () => frame.remove();
    target.focus();
    target.print();
  };
  frame.srcdoc = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Hóa đơn ${escape(row.orderCode || row.id)}</title><style>body{font:14px Arial,sans-serif;color:#1d3027;max-width:720px;margin:32px auto}h1{font-size:24px;color:#0b5a3c}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #ddd}th:last-child,td:last-child{text-align:right}.total{text-align:right;font-size:20px;font-weight:700}small{display:block;color:#666;margin-top:4px}@media print{body{margin:0}}</style></head><body><h1>NHÀ HÀNG HƯƠNG VIỆT</h1><h2>Hóa đơn #${escape(row.orderCode || row.id)}</h2><p>${escape(stamp.date)} · ${escape(stamp.time)}</p><p>Khách hàng: ${escape(orderCustomer(row))}<br>SĐT: ${escape(orderPhone(row) || "Không có SĐT")}</p><p>${escape(row.deliveryTypeLabel || { dinein: "Phục vụ tại bàn", pickup: "Tự đến lấy", delivery: "Giao hàng" }[row.deliveryType])}${row.tableId || row.tableNumber ? " · " + escape(row.tableId || row.tableNumber) : ""}</p><table><thead><tr><th>Món ăn</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${(row.items || []).map((item: Row) => `<tr><td>${escape(item.name)}${item.note ? `<small>${escape(item.note)}</small>` : ""}</td><td>${escape(item.quantity)}</td><td>${escape(money(item.price))}</td><td>${escape(money(item.price * item.quantity))}</td></tr>`).join("")}</tbody></table>${row.payment?.subtotal != null ? `<p>Tạm tính: ${escape(money(row.payment.subtotal))}</p>` : ""}${row.payment?.discount ? `<p>Giảm giá: ${escape(money(row.payment.discount))}</p>` : ""}${row.payment?.shippingFee ? `<p>Phí giao hàng: ${escape(money(row.payment.shippingFee))}</p>` : ""}<p class="total">Tổng tiền: ${escape(money(row.totalAmount))}</p>${row.note ? `<p>Ghi chú: ${escape(row.note)}</p>` : ""}<p>Cảm ơn quý khách!</p></body></html>`;
  document.body.appendChild(frame);
}
type Filters = {
  search: string;
  status: string;
  table: string;
  type: string;
  from: string;
  to: string;
};
type Actions = {
  busy: boolean;
  onOpen: (row: Row) => void;
  onStatus: (row: Row, state: string) => void;
};
export function OrderStats({ orders }: { orders: Row[] }) {
  return (
    <div className="om-stats">
      {[
        ["Tổng đơn", orders.length, "bag", "all"],
        ...[
          ["pending", "Chờ xác nhận", "clock"],
          ["preparing", "Đang chuẩn bị", "food"],
          ["ready", "Sẵn sàng", "check"],
          ["completed", "Hoàn tất", "ticket"],
        ].map(([state, label, icon]) => [
          label,
          orders.filter((row) => row.state === state).length,
          icon,
          state,
        ]),
      ].map(([label, value, icon, state]) => (
        <article key={label} className={`om-stat om-stat-${state}`}>
          <span>
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
export function OrderFilters({
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
    <section className="om-filters" aria-label="Bộ lọc đơn hàng">
      <label className="om-search">
        <AdminIcon name="search" />
        <input
          aria-label="Tìm mã đơn hoặc tên khách"
          placeholder="Mã đơn / tên khách…"
          value={filters.search}
          onChange={(e) => onFilters({ search: e.target.value })}
        />
      </label>
      <select
        aria-label="Lọc trạng thái đơn hàng"
        value={filters.status}
        onChange={(e) => onFilters({ status: e.target.value })}
      >
        <option value="">Tất cả trạng thái</option>
        {[
          "pending",
          "confirmed",
          "preparing",
          "ready",
          "serving",
          "delivering",
          "completed",
          "cancelled",
        ].map((state) => (
          <option key={state} value={state}>
            {labels[state]}
          </option>
        ))}
      </select>
      <label className="om-table-filter">
        <AdminIcon name="table" />
        <input
          aria-label="Lọc mã bàn"
          placeholder="Mã bàn"
          value={filters.table}
          onChange={(e) => onFilters({ table: e.target.value })}
        />
      </label>
      <select
        aria-label="Lọc hình thức nhận món"
        value={filters.type}
        onChange={(e) => onFilters({ type: e.target.value })}
      >
        <option value="">Tất cả hình thức</option>
        <option value="dinein">Phục vụ tại bàn</option>
        <option value="pickup">Tự đến lấy</option>
        <option value="delivery">Giao hàng</option>
      </select>
      <label className="om-date-filter">
        <span>Từ ngày</span>
        <input
          type="date"
          aria-label="Từ ngày đơn hàng"
          value={filters.from}
          onChange={(e) => onFilters({ from: e.target.value })}
        />
      </label>
      <label className="om-date-filter">
        <span>Đến ngày</span>
        <input
          type="date"
          aria-label="Đến ngày đơn hàng"
          value={filters.to}
          onChange={(e) => onFilters({ to: e.target.value })}
        />
      </label>
      <div className="om-filter-actions">
        <button
          disabled={!Object.values(filters).some(Boolean)}
          onClick={onClear}
        >
          Xóa bộ lọc
        </button>
        <button disabled={refreshing} onClick={onRefresh}>
          <AdminIcon name="refresh" />
          {refreshing ? "Đang tải…" : "Làm mới"}
        </button>
      </div>
    </section>
  );
}
export function OrderStatusTabs({
  orders,
  status,
  onChange,
}: {
  orders: Row[];
  status: string;
  onChange: (state: string) => void;
}) {
  return (
    <nav className="om-status-tabs" aria-label="Lọc nhanh trạng thái đơn">
      {["", "pending", "preparing", "ready", "completed", "cancelled"].map(
        (state) => (
          <button
            key={state}
            aria-pressed={status === state}
            onClick={() => onChange(state)}
          >
            {labels[state] || "Tất cả"}
            <span>
              {state
                ? orders.filter((row) => row.state === state).length
                : orders.length}
            </span>
          </button>
        ),
      )}
    </nav>
  );
}
function OrderCode({ row }: { row: Row }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="om-code">
      <b>#{row.orderCode || row.id}</b>
      <button
        aria-label={`Sao chép mã ${row.orderCode || row.id}`}
        title={copied ? "Đã sao chép" : "Sao chép mã đơn"}
        onClick={() =>
          void navigator.clipboard
            .writeText(row.orderCode || row.id)
            .then(() => setCopied(true))
            .catch(() => setCopied(false))
        }
      >
        {copied ? "✓" : "⧉"}
      </button>
    </div>
  );
}
function OrderActions({
  row,
  onCancel,
  ...actions
}: Actions & { row: Row; onCancel: (row: Row) => void }) {
  const [open, setOpen] = useState(false),
    ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>(".om-more")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const allowed = transitions(row, false);
  return (
    <div className="om-actions" ref={ref}>
      <button
        disabled={actions.busy}
        aria-label={`Xem đơn ${row.orderCode || row.id}`}
        onClick={() => actions.onOpen(row)}
      >
        <AdminIcon name="eye" />
        Xem
      </button>
      <button
        className="om-more"
        disabled={actions.busy}
        aria-label={`Thao tác đơn ${row.orderCode || row.id}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ⋯
      </button>
      {open && (
        <div className="om-action-menu">
          <button
            onClick={() => {
              setOpen(false);
              actions.onOpen(row);
            }}
          >
            Xem chi tiết
          </button>
          {allowed.map((state) => (
            <button
              key={state}
              className={state === "cancelled" ? "om-danger" : undefined}
              onClick={() => {
                setOpen(false);
                if (state === "cancelled") onCancel(row);
                else if (row.deliveryType === "dinein" && !row.tableId)
                  actions.onOpen(row);
                else actions.onStatus(row, state);
              }}
            >
              {orderActionLabels[state] || labels[state]}
            </button>
          ))}
          {["completed", "delivered"].includes(row.state) && (
            <button
              onClick={() => {
                setOpen(false);
                printOrderInvoice(row);
              }}
            >
              <AdminIcon name="printer" />
              In hóa đơn
            </button>
          )}
        </div>
      )}
    </div>
  );
}
function OrderRow({
  row,
  ...actions
}: Actions & { row: Row; onCancel: (row: Row) => void }) {
  const stamp = orderDateTime(row.createdAt),
    items = row.items || [];
  return (
    <tr className={`om-row om-row-${row.state}`}>
      <td className="om-code-cell">
        <OrderCode row={row} />
      </td>
      <td className="om-customer-cell">
        <OrderCustomer row={row} />
      </td>
      <td className="om-delivery-cell">
        <OrderDelivery row={row} />
      </td>
      <td className="om-items-cell">
        <span
          title={items
            .map((item: Row) => `${item.name} ×${item.quantity}`)
            .join("\n")}
        >
          {items.reduce((n: number, item: Row) => n + item.quantity, 0)} món
        </span>
      </td>
      <td className="om-price-cell">
        <strong>{money(row.totalAmount)}</strong>
      </td>
      <td className="om-status-cell">
        <OrderStatusBadge state={row.state} />
      </td>
      <td className="om-time-cell">
        <b>{stamp.date}</b>
        <small>
          <AdminIcon name="clock" />
          {stamp.time}
        </small>
      </td>
      <td className="om-action-cell">
        <OrderActions row={row} {...actions} />
      </td>
    </tr>
  );
}
export function OrderManagement({
  orders,
  rows,
  filters,
  onFilters,
  onClear,
  onRefresh,
  refreshing,
  autoRefresh,
  onAutoRefresh,
  ...actions
}: Actions & {
  orders: Row[];
  rows: Row[];
  filters: Filters;
  onFilters: (patch: Partial<Filters>) => void;
  onClear: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  autoRefresh: boolean;
  onAutoRefresh: (enabled: boolean) => void;
}) {
  const [page, setPage] = useState(1),
    [size, setSize] = useState(20),
    [cancelling, setCancelling] = useState<Row | null>(null);
  const key = JSON.stringify(filters);
  useEffect(() => {
    setPage(1);
  }, [key]);
  const pages = Math.max(1, Math.ceil(rows.length / size)),
    current = Math.min(page, pages),
    start = Math.max(1, Math.min(current - 2, pages - 4));
  return (
    <section className="om-management" aria-label="Quản lý đơn hàng">
      <OrderStats orders={orders} />
      <OrderStatusTabs
        orders={orders}
        status={filters.status}
        onChange={(state) => onFilters({ status: state })}
      />
      <OrderFilters
        filters={filters}
        onFilters={onFilters}
        onClear={onClear}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
      <div className="om-toolbar">
        <b>
          {rows.length} <span>đơn hàng</span>
        </b>
        <div className="om-live">
          <span
            className={autoRefresh ? "om-live-dot active" : "om-live-dot"}
          />
          {autoRefresh ? "Tự làm mới mỗi 10 giây" : "Đã tắt tự làm mới"}
          <label className="om-toggle">
            <input
              type="checkbox"
              role="switch"
              aria-label="Tự làm mới đơn hàng"
              checked={autoRefresh}
              onChange={(e) => onAutoRefresh(e.target.checked)}
            />
            <span aria-hidden="true" />
          </label>
        </div>
      </div>
      <div className="om-card" aria-busy={refreshing}>
        <div className="om-table-scroll">
          <table className="om-table">
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
                ].map((label, i) => (
                  <th
                    scope="col"
                    key={label}
                    className={
                      i === 3
                        ? "om-items-cell"
                        : i === 6
                          ? "om-time-cell"
                          : undefined
                    }
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice((current - 1) * size, current * size).map((row) => (
                <OrderRow
                  key={row.id}
                  row={row}
                  {...actions}
                  onCancel={setCancelling}
                />
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <div className="om-empty">
            <span>
              <AdminIcon name="bag" />
            </span>
            <h3>Không tìm thấy đơn hàng phù hợp</h3>
            <p>Hãy thử thay đổi bộ lọc.</p>
            <button onClick={onClear}>Xóa bộ lọc</button>
          </div>
        )}
        <footer className="om-pagination">
          <span>
            Hiển thị {rows.length ? (current - 1) * size + 1 : 0}–
            {Math.min(current * size, rows.length)} / {rows.length} đơn
          </span>
          <select
            aria-label="Số đơn mỗi trang"
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[20, 40, 60].map((n) => (
              <option value={n} key={n}>
                {n} / trang
              </option>
            ))}
          </select>
          <nav aria-label="Phân trang đơn hàng">
            <button
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              ← Trước
            </button>
            {Array.from(
              { length: Math.min(5, pages) },
              (_, i) => start + i,
            ).map((n) => (
              <button
                key={n}
                aria-label={`Trang đơn ${n}`}
                aria-current={n === current ? "page" : undefined}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
            >
              Sau →
            </button>
          </nav>
        </footer>
      </div>
      {cancelling && (
        <AdminDialog
          title="Hủy đơn hàng?"
          onClose={() => !actions.busy && setCancelling(null)}
        >
          <div className="om-confirm-dialog">
            <p>
              Bạn có chắc muốn hủy đơn <strong>#{cancelling.orderCode}</strong>?
            </p>
            <footer>
              <button
                disabled={actions.busy}
                onClick={() => setCancelling(null)}
              >
                Quay lại
              </button>
              <button
                className="danger"
                disabled={actions.busy}
                onClick={() => {
                  actions.onStatus(cancelling, "cancelled");
                  setCancelling(null);
                }}
              >
                Hủy đơn
              </button>
            </footer>
          </div>
        </AdminDialog>
      )}
    </section>
  );
}
