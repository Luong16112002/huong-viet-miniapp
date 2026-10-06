import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "@/static/huong-viet-mark.svg";
import { Row } from "./admin-api";

export const adminSections = [
  ["", "Tổng quan", "grid"],
  ["tables", "Quản lý bàn", "table"],
  ["bookings", "Đặt bàn", "calendar"],
  ["orders", "Đơn hàng", "bag"],
  ["menu", "Thực đơn", "food"],
  ["customers", "Khách hàng", "users"],
  ["promotions", "Ưu đãi", "ticket"],
  ["reports", "Thống kê", "chart"],
  ["settings", "Cài đặt", "settings"],
];
export function AdminIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    copy: "M9 9h12v12H9z M15 9V3H3v12h6",
    edit: "M16 3l5 5 M4 16l13-13 4 4L8 20H4z",
    refresh:
      "M20 7a9 9 0 0 0-15-3L2 7 M2 2v5h5 M4 17a9 9 0 0 0 15 3l3-3 M22 22v-5h-5",
    truck:
      "M3 5h11v12H3z M14 9h4l3 4v4h-7 M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
    printer: "M6 8V3h12v5 M6 17H3V8h18v9h-3 M6 13h12v8H6z M17 10h1",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    check: "M5 12l4 4L19 6",
    grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    table: "M5 8h14v8H5z M2 9v6 M22 9v6 M8 3h8 M8 21h8",
    calendar: "M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4 M8 14h2 M14 14h2",
    bag: "M4 7h16l1 14H3z M8 8V6a4 4 0 0 1 8 0v2",
    food: "M4 3v6a3 3 0 0 0 6 0V3 M7 3v18 M16 3v8h4 M20 3v18",
    users:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M18 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4",
    ticket: "M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4z M9 8v8 M15 8v8",
    chart: "M3 3v18h18 M7 16v-5 M12 16V7 M17 16V4",
    settings:
      "M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0",
    bell: "M18 8a6 6 0 0 0-12 0c0 6-3 7-3 9h18c0-2-3-3-3-9 M10 21h4",
    search: "M16 16l5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    money: "M3 5h18v14H3z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    clock: "M12 6v6l4 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  };
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name] || paths.grid} />
    </svg>
  );
}
export function AdminSidebar({ close }: { close: () => void }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <img src={logo} alt="" />
        <div>
          <strong>HƯƠNG VIỆT</strong>
          <small>ĐIỀU HÀNH NHÀ HÀNG</small>
        </div>
      </div>
      <p className="admin-nav-caption">KHÔNG GIAN QUẢN TRỊ</p>
      <nav>
        {adminSections.map(([path, label, icon]) => (
          <NavLink
            end
            key={path}
            title={label}
            onClick={close}
            to={"/admin" + (path ? "/" + path : "")}
          >
            <AdminIcon name={icon} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="admin-sidebar-bottom">
        <Link to="/">
          ← <span>Ứng dụng khách</span>
        </Link>
        <div className="admin-identity">
          <b>HV</b>
          <div>
            Quản trị viên<small>Quản lý nhà hàng</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
export function AdminTopbar({
  title,
  onMenu,
  onLogout,
  orders,
  bookings,
  onOpen,
}: {
  title: string;
  onMenu: () => void;
  onLogout: () => void;
  orders: Row[];
  bookings: Row[];
  onOpen: (r: Row) => void;
}) {
  const [search, setSearch] = useState(""),
    [notifications, setNotifications] = useState(false);
  const pending = [...orders, ...bookings].filter(
    (r) => (r.state || r.status) === "pending",
  );
  const matches = search.trim()
    ? [...orders, ...bookings]
        .filter((r) =>
          [r.orderCode, r.code, r.customerName, r.name, r.phone]
            .join(" ")
            .toLocaleLowerCase("vi")
            .includes(search.toLocaleLowerCase("vi")),
        )
        .slice(0, 6)
    : [];
  return (
    <header className="admin-header">
      <button
        className="admin-menu-toggle"
        aria-label="Mở menu"
        onClick={onMenu}
      >
        ☰
      </button>
      <div className="admin-title">
        <h1>{title}</h1>
        <p>
          {title === "Quản lý đặt bàn"
            ? "Theo dõi và điều hành lịch đặt bàn của nhà hàng"
            : title === "Khách hàng"
              ? "Theo dõi và quản lý thông tin khách hàng"
              : title === "Ưu đãi"
                ? "Quản lý voucher, mã giảm giá và chương trình khuyến mãi"
                : "Theo dõi và điều hành hoạt động nhà hàng"}
        </p>
      </div>
      <div className="admin-global-search">
        <AdminIcon name="search" />
        <input
          aria-label="Tìm kiếm toàn hệ thống"
          placeholder="Tìm đơn, đặt bàn, khách hàng…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <div className="admin-popover">
            {matches.length ? (
              matches.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onOpen(r);
                    setSearch("");
                  }}
                >
                  <b>#{r.orderCode || r.code}</b>
                  <small>{r.customerName || r.name || "Khách hàng"}</small>
                </button>
              ))
            ) : (
              <p>Không tìm thấy kết quả.</p>
            )}
          </div>
        )}
      </div>
      <div className="admin-notifications">
        <button
          aria-label="Yêu cầu chờ xử lý"
          onClick={() => setNotifications(!notifications)}
        >
          <AdminIcon name="bell" />
          {pending.length > 0 && <em>{pending.length}</em>}
        </button>
        {notifications && (
          <div className="admin-popover">
            <h3>Yêu cầu chờ xử lý</h3>
            {pending.length ? (
              pending.slice(0, 5).map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onOpen(r);
                    setNotifications(false);
                  }}
                >
                  #{r.orderCode || r.code}
                  <small>{r.customerName || r.name || "Đơn hàng mới"}</small>
                </button>
              ))
            ) : (
              <p>Đã xử lý hết yêu cầu.</p>
            )}
          </div>
        )}
      </div>
      <details className="admin-account">
        <summary>
          <b>HV</b>
          <span>Quản trị viên</span>⌄
        </summary>
        <div className="admin-popover">
          <Link to="/admin/settings">Cài đặt hệ thống</Link>
          <button onClick={onLogout}>Đăng xuất</button>
        </div>
      </details>
    </header>
  );
}
export function AdminLayout({
  children,
  title,
  onLogout,
  orders = [],
  bookings = [],
  onOpen = () => {},
}: {
  children: ReactNode;
  title: string;
  onLogout: () => void;
  orders?: Row[];
  bookings?: Row[];
  onOpen?: (r: Row) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"admin-app" + (open ? " sidebar-open" : "")}>
      <AdminSidebar close={() => setOpen(false)} />
      {open && (
        <button
          className="admin-scrim"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="admin-main">
        <AdminTopbar
          {...{ title, onLogout, orders, bookings, onOpen }}
          onMenu={() => setOpen(!open)}
        />
        <main>{children}</main>
      </div>
    </div>
  );
}
