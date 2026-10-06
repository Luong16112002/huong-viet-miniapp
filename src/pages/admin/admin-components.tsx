import { OrderManagementDrawer } from "./order-management-drawer";
import { BookingDetailDrawer } from "./booking-drawer";
import { AdminIcon } from "./admin-shell";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { areas, labels, money, dateTime, Row } from "./admin-api";
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`admin-badge s-${status}`}>
      {labels[status] || status}
    </span>
  );
}
export function AdminSidebar({ close }: { close: () => void }) {
  return (
    <aside className="admin-sidebar">
      <strong>HƯƠNG VIỆT</strong>
      <small>ĐIỀU HÀNH NHÀ HÀNG</small>
      <nav>
        {[
          ["", "Tổng quan"],
          ["tables", "Quản lý bàn"],
          ["bookings", "Đặt bàn"],
          ["orders", "Đơn hàng"],
        ].map(([path, label]) => (
          <NavLink
            end
            key={path}
            onClick={close}
            to={"/admin" + (path ? "/" + path : "")}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Link to="/">← Ứng dụng khách</Link>
    </aside>
  );
}
export function AdminLayout({
  children,
  title,
  onLogout,
}: {
  children: ReactNode;
  title: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`admin-app${open ? "sidebar-open" : ""}`}>
      <AdminSidebar close={() => setOpen(false)} />
      {open && (
        <button
          className="admin-scrim"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="admin-main">
        <header className="admin-header">
          <button
            className="admin-menu-toggle"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            ☰
          </button>
          <div>
            <small>KHÔNG GIAN QUẢN TRỊ</small>
            <h1>{title}</h1>
          </div>
          <button onClick={onLogout}>Đăng xuất</button>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
export function DashboardStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="admin-stat">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="admin-filters">{children}</div>;
}
export function AdminDialog({
  drawer = false,
  title,
  onClose,
  children,
}: {
  drawer?: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={"admin-dialog" + (drawer ? " admin-drawer" : "")}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function TableCard({
  nextBooking,
  table,
  onEdit,
  onStatus,
  onDelete,
}: {
  nextBooking?: Row;
  table: Row;
  onEdit: () => void;
  onStatus: (s: string) => void;
  onDelete: () => void;
}) {
  return (
    <article className={"admin-table-card table-" + table.status}>
      <div className="admin-table-visual">
        <AdminIcon name="table" />
      </div>
      <div>
        <h2>
          {table.id} · {table.name}
        </h2>
        <StatusBadge status={table.status} />
      </div>
      <p>
        {areas[table.area]} · {table.capacity} khách
      </p>
      <div className="admin-next-booking">
        <small>BOOKING TIẾP THEO</small>
        <p>
          {nextBooking
            ? `${nextBooking.date} · ${nextBooking.time} · ${nextBooking.guests} khách`
            : "Chưa có lịch đặt tiếp theo"}
        </p>
      </div>
      {table.note && <p>{table.note}</p>}
      <label>
        Đổi trạng thái
        <select
          aria-label={`Trạng thái ${table.id}`}
          value={table.status}
          onChange={(e) => onStatus(e.target.value)}
        >
          {["AVAILABLE", "RESERVED", "OCCUPIED", "CLEANING", "DISABLED"].map(
            (s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ),
          )}
        </select>
      </label>
      <footer>
        <button onClick={onEdit}>Chi tiết / sửa</button>
        <button className="danger" onClick={onDelete}>
          Ngưng sử dụng
        </button>
      </footer>
    </article>
  );
}
export function TableForm({
  table,
  onSave,
  busy,
}: {
  table: Row;
  onSave: (r: Row) => void;
  busy: boolean;
}) {
  const [form, setForm] = useState({ ...table });
  const set = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));
  return (
    <form
      className="admin-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      {[
        ["id", "Mã bàn"],
        ["name", "Tên bàn"],
      ].map(([key, label]) => (
        <label key={key}>
          {label}
          <input
            required
            maxLength={key === "id" ? 24 : 80}
            disabled={key === "id" && !!table.id}
            placeholder={
              key === "id"
                ? "IN-001 / T1-001 / T2-001 / SV-001 / PR-001"
                : undefined
            }
            value={form[key] || ""}
            onChange={(e) => set(key, e.target.value)}
          />
        </label>
      ))}
      <label>
        Khu vực
        <select value={form.area} onChange={(e) => set("area", e.target.value)}>
          {Object.entries(areas).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <p className="admin-footnote">
        Mã bàn theo khu: T1-, T2-, IN-, SV-, PR-; số 001–100. Mỗi khu tối đa 100
        bàn.
      </p>
      <label>
        Sức chứa
        <select
          value={form.capacity}
          onChange={(e) => set("capacity", Number(e.target.value))}
        >
          {[2, 4, 6, 8, 10, 12, 20].map((n) => (
            <option key={n} value={n}>
              {n} khách
            </option>
          ))}
        </select>
      </label>
      <label>
        Trạng thái
        <select
          value={form.status}
          onChange={(e) => set("status", e.target.value)}
        >
          {["AVAILABLE", "RESERVED", "OCCUPIED", "CLEANING", "DISABLED"].map(
            (s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ),
          )}
        </select>
      </label>
      <label>
        Ghi chú
        <textarea
          maxLength={500}
          value={form.note || ""}
          onChange={(e) => set("note", e.target.value)}
        />
      </label>
      <button className="primary" disabled={busy}>
        Lưu bàn
      </button>
    </form>
  );
}
export function BookingTable({
  rows,
  onOpen,
}: {
  rows: Row[];
  onOpen: (r: Row) => void;
}) {
  return (
    <div className="admin-records">
      {rows.map((r) => (
        <button className="admin-record" key={r.id} onClick={() => onOpen(r)}>
          <strong>{r.code}</strong>
          <span>
            {r.name}
            <small>{r.phone}</small>
          </span>
          <span>
            {r.date} · {r.time}
            <small>
              {r.guests} khách · {areas[r.area]}
            </small>
          </span>
          <span>{r.tableId || "Chưa xếp bàn"}</span>
          <StatusBadge status={r.status} />
        </button>
      ))}
    </div>
  );
}
export function OrderTable({
  rows,
  onOpen,
}: {
  rows: Row[];
  onOpen: (r: Row) => void;
}) {
  return (
    <div className="admin-records">
      {rows.map((r) => (
        <button className="admin-record" key={r.id} onClick={() => onOpen(r)}>
          <strong>
            {r.orderCode}
            <small>{dateTime(r.createdAt)}</small>
          </strong>
          <span>
            {r.customerName ||
              r.deliveryAddress?.recipientName ||
              "Khách tại quầy"}
            <small>
              {r.deliveryTypeLabel} · {r.tableId || r.tableNumber || "—"}
            </small>
          </span>
          <span>
            {r.items.reduce((n: number, i: Row) => n + i.quantity, 0)} món
            <small>{money(r.totalAmount)}</small>
          </span>
          <StatusBadge status={r.state} />
        </button>
      ))}
    </div>
  );
}
export function RecordDetailDrawer({
  row,
  booking,
  busy,
  onStatus,
  onAssign,
  tables,
}: {
  row: Row;
  booking: boolean;
  busy: boolean;
  onStatus: (status: string, left: boolean, tableId: string) => void;
  tables: Row[];
  onAssign: (tableId: string, duration: number) => void;
}) {
  if (booking)
    return (
      <BookingDetailDrawer
        row={row}
        busy={busy}
        onStatus={(status) => onStatus(status, false, row.tableId || "")}
        onAssign={onAssign}
      />
    );
  return (
    <OrderManagementDrawer
      row={row}
      tables={tables}
      busy={busy}
      onStatus={onStatus}
    />
  );
}
