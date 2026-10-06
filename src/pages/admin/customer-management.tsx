import { useEffect, useMemo, useState } from "react";
import { Row, labels, money } from "./admin-api";
import { AdminIcon } from "./admin-shell";
import { AdminDialog } from "./admin-components";
import {
  Customer,
  collectCustomers,
  customerDate,
  customerDay,
  customerTier,
} from "./customer-data";
import "./customer-management.css";

type Tab = "overview" | "orders" | "bookings" | "offers";
function Avatar({ customer }: { customer: Customer }) {
  const words = customer.name.trim().split(/\s+/);
  return (
    <span
      className={
        "crm-avatar" + (customerTier(customer) === "VIP" ? " is-vip" : "")
      }
    >
      {(words.length > 1
        ? words[0][0] + words[words.length - 1][0]
        : words[0]?.slice(0, 2) || "KH"
      ).toLocaleUpperCase("vi")}
    </span>
  );
}
function Tier({ customer }: { customer: Customer }) {
  return (
    <span
      className={
        "crm-tier tier-" +
        (customer.orders.length >= 10
          ? "vip"
          : customer.orders.length >= 5
            ? "loyal"
            : customer.orders.length
              ? "regular"
              : "new")
      }
    >
      {customerTier(customer)}
    </span>
  );
}
function DateCell({ value }: { value: string }) {
  const [date, time] = customerDate(value);
  return (
    <span className="crm-date">
      <b>{date}</b>
      <small>{time}</small>
    </span>
  );
}

function CustomerDrawer({
  customer: c,
  initialTab,
  onClose,
  onOpen,
}: {
  customer: Customer;
  initialTab: Tab;
  onClose: () => void;
  onOpen?: (row: Row) => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const activities = [
    ...c.orders.map((row) => ({ row, kind: "order", at: row.createdAt })),
    ...c.bookings.map((row) => ({ row, kind: "booking", at: row.createdAt })),
  ].sort(
    (a, b) => (new Date(b.at).getTime() || 0) - (new Date(a.at).getTime() || 0),
  );
  const open = (row: Row) => {
    if (onOpen) {
      onClose();
      onOpen(row);
    }
  };
  const history = (rows: Row[], booking: boolean) =>
    rows.length ? (
      <div className="crm-history">
        {[...rows]
          .sort(
            (a, b) =>
              (new Date(b.createdAt).getTime() || 0) -
              (new Date(a.createdAt).getTime() || 0),
          )
          .map((row, i) => (
            <button
              key={row.id || i}
              disabled={!onOpen}
              onClick={() => open(row)}
            >
              <span>
                <b>{row.orderCode || row.code || row.id}</b>
                <small>
                  {booking
                    ? `${row.date} · ${row.time} · ${row.guests} khách`
                    : `${row.items?.reduce((sum: number, item: Row) => sum + (Number(item.quantity) || 0), 0) || 0} món · ${money(row.totalAmount)}`}
                </small>
                <DateCell value={row.createdAt} />
              </span>
              <span className="crm-history-status">
                {labels[row.state || row.status] || row.state || row.status}
                <AdminIcon name="eye" />
              </span>
            </button>
          ))}
      </div>
    ) : (
      <div className="crm-panel-empty">
        <AdminIcon name={booking ? "calendar" : "bag"} />
        <b>{booking ? "Chưa có lịch đặt bàn" : "Chưa có đơn hàng"}</b>
      </div>
    );
  return (
    <AdminDialog drawer title="Hồ sơ khách hàng" onClose={onClose}>
      <div className="crm-drawer">
        <div className="crm-profile">
          <Avatar customer={c} />
          <div>
            <h2>{c.name}</h2>
            <a href={"tel:" + c.phone}>{c.phone}</a>
            <Tier customer={c} />
          </div>
        </div>
        <div className="crm-profile-metrics">
          <div>
            <small>Tổng đơn</small>
            <b>{c.orders.length}</b>
          </div>
          <div>
            <small>Đặt bàn</small>
            <b>{c.bookings.length}</b>
          </div>
          <div>
            <small>Tổng chi tiêu</small>
            <b>{money(c.total)}</b>
          </div>
        </div>
        <nav className="crm-drawer-tabs" aria-label="Nội dung hồ sơ">
          {(
            [
              ["overview", "Tổng quan"],
              ["orders", "Đơn hàng"],
              ["bookings", "Đặt bàn"],
              ["offers", "Ưu đãi"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              aria-pressed={tab === key}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        {tab === "overview" && (
          <>
            <section className="crm-detail-section">
              <h3>Thông tin khách hàng</h3>
              <dl>
                <div>
                  <dt>Số điện thoại</dt>
                  <dd>{c.phone}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{c.email || "Chưa có email"}</dd>
                </div>
                <div>
                  <dt>Zalo</dt>
                  <dd>{c.zaloLinked ? "Đã liên kết" : "Chưa liên kết Zalo"}</dd>
                </div>
                <div>
                  <dt>Khách từ</dt>
                  <dd>{customerDate(c.first)[0]}</dd>
                </div>
              </dl>
            </section>
            <section className="crm-loyalty">
              <div>
                <AdminIcon name="ticket" />
                <h3>Thành viên</h3>
              </div>
              <dl>
                <div>
                  <dt>Điểm thành viên</dt>
                  <dd>0 điểm</dd>
                </div>
                <div>
                  <dt>Hạng thành viên</dt>
                  <dd>Chưa đăng ký</dd>
                </div>
              </dl>
              <p>Chưa có dữ liệu điểm</p>
              <small>Lịch sử cộng/trừ điểm sẽ xuất hiện tại đây.</small>
            </section>
            <section className="crm-detail-section">
              <h3>Lịch sử hoạt động gần đây</h3>
              <ol className="crm-timeline">
                {activities.slice(0, 10).map(({ row, kind, at }, i) => (
                  <li key={kind + (row.id || i)}>
                    <DateCell value={at} />
                    <b>
                      {kind === "booking"
                        ? `Đặt bàn ${row.guests} khách`
                        : `Đặt món ${money(row.totalAmount)}`}
                    </b>
                    <span>
                      {row.orderCode || row.code} ·{" "}
                      {labels[row.state || row.status] ||
                        row.state ||
                        row.status}
                    </span>
                    {kind === "order" && row.voucherCode && (
                      <small>Voucher áp dụng: {row.voucherCode}</small>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
        {tab === "orders" && history(c.orders, false)}
        {tab === "bookings" && history(c.bookings, true)}
        {tab === "offers" && (
          <section className="crm-detail-section">
            <h3>Ưu đãi đã áp dụng</h3>
            {c.orders.filter((row) => row.voucherCode).length ? (
              c.orders
                .filter((row) => row.voucherCode)
                .map((row, i) => (
                  <article className="crm-offer" key={row.id || i}>
                    <AdminIcon name="ticket" />
                    <div>
                      <b>{row.voucherCode}</b>
                      <small>
                        {row.orderCode} · {labels[row.state] || row.state}
                      </small>
                      <DateCell value={row.createdAt} />
                    </div>
                  </article>
                ))
            ) : (
              <div className="crm-panel-empty">
                <AdminIcon name="ticket" />
                <b>Chưa có ưu đãi được áp dụng</b>
                <p>Ưu đãi sẽ được tổng hợp từ đơn hàng của khách.</p>
              </div>
            )}
          </section>
        )}
        <footer className="crm-drawer-footer">
          <button onClick={() => setTab("orders")}>
            <AdminIcon name="bag" /> Xem đơn hàng
          </button>
          <button onClick={() => setTab("bookings")}>
            <AdminIcon name="calendar" /> Lịch đặt bàn
          </button>
        </footer>
      </div>
    </AdminDialog>
  );
}

export function CustomersPage({
  orders,
  bookings,
  onOpen,
}: {
  orders: Row[];
  bookings: Row[];
  onOpen?: (row: Row) => void;
}) {
  const all = useMemo(
    () => collectCustomers(orders, bookings),
    [orders, bookings],
  );
  const [search, setSearch] = useState(""),
    [kind, setKind] = useState(""),
    [spend, setSpend] = useState(""),
    [recent, setRecent] = useState(""),
    [page, setPage] = useState(1),
    [size, setSize] = useState(20),
    [menu, setMenu] = useState<string | null>(null),
    [selected, setSelected] = useState<{ phone: string; tab: Tab } | null>(
      null,
    );
  useEffect(() => {
    setPage(1);
    setMenu(null);
  }, [search, kind, spend, recent, size]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".crm-actions")) setMenu(null);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", key);
    };
  }, [menu]);
  const today = customerDay(new Date());
  const rows = all.filter((c) => {
    if (
      !(c.name + " " + c.phone)
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi"))
    )
      return false;
    if (
      (kind === "new" && c.orders.length !== 0) ||
      (kind === "returning" && c.orders.length < 2) ||
      (kind === "vip" && c.orders.length < 10) ||
      (kind === "booking" && !c.bookings.length) ||
      (kind === "order" && !c.orders.length)
    )
      return false;
    if (
      (spend === "zero" && c.total !== 0) ||
      (spend === "low" && (c.total <= 0 || c.total >= 1000000)) ||
      (spend === "high" && c.total < 1000000)
    )
      return false;
    const days =
      (new Date(today + "T00:00:00+07:00").getTime() -
        new Date(customerDay(c.last) + "T00:00:00+07:00").getTime()) /
      86400000;
    return (
      !recent || (Number.isFinite(days) && days >= 0 && days < Number(recent))
    );
  });
  const pages = Math.max(1, Math.ceil(rows.length / size)),
    current = Math.min(page, pages),
    shown = rows.slice((current - 1) * size, current * size);
  const clear = () => {
    setSearch("");
    setKind("");
    setSpend("");
    setRecent("");
    setPage(1);
  };
  const open = (c: Customer, tab: Tab = "overview") => {
    setSelected({ phone: c.phone, tab });
    setMenu(null);
  };
  const selectedCustomer =
    selected && all.find((c) => c.phone === selected.phone);
  const stats = [
    ["Tổng khách hàng", all.length, "users", "green"],
    [
      "Khách mới hôm nay",
      all.filter((c) => customerDay(c.first) === today).length,
      "calendar",
      "blue",
    ],
    [
      "Khách quay lại",
      all.filter((c) => c.orders.length > 1).length,
      "refresh",
      "gold",
    ],
    ["Thành viên", 0, "ticket", "purple"],
    [
      "Tổng chi tiêu khách hàng",
      money(all.reduce((sum, c) => sum + c.total, 0)),
      "money",
      "green",
    ],
  ];
  const cell = (c: Customer) => (
    <>
      <td data-label="Khách hàng">
        <div className="crm-person">
          <Avatar customer={c} />
          <div>
            <b>{c.name}</b>
            <Tier customer={c} />
          </div>
        </div>
      </td>
      <td data-label="Liên hệ">
        <a className="crm-phone" href={"tel:" + c.phone}>
          {c.phone}
        </a>
        <small>
          {c.zaloLinked ? "Zalo: Đã liên kết" : "Chưa liên kết Zalo"}
        </small>
        {c.email && (
          <small className="crm-email" title={c.email}>
            {c.email}
          </small>
        )}
      </td>
      <td data-label="Đơn hàng">
        <button className="crm-count" onClick={() => open(c, "orders")}>
          {c.orders.length} đơn
        </button>
      </td>
      <td data-label="Đặt bàn">
        <button className="crm-count" onClick={() => open(c, "bookings")}>
          {c.bookings.length} booking
        </button>
      </td>
      <td data-label="Tổng chi tiêu">
        <b className="crm-money">{money(c.total)}</b>
      </td>
      <td data-label="Điểm">
        <span className="crm-points" title="Chưa có dữ liệu điểm">
          0 <small>điểm</small>
        </span>
      </td>
      <td data-label="Lần gần nhất">
        <DateCell value={c.last} />
      </td>
      <td data-label="Thao tác">
        <div className="crm-actions">
          <button onClick={() => open(c)}>
            <AdminIcon name="eye" /> Xem
          </button>
          <button
            className="crm-more"
            aria-label={"Thao tác " + c.name}
            aria-expanded={menu === c.phone}
            onClick={() => setMenu(menu === c.phone ? null : c.phone)}
          >
            ⋯
          </button>
          {menu === c.phone && (
            <div className="crm-action-menu">
              <button onClick={() => open(c)}>Xem hồ sơ</button>
              <button onClick={() => open(c, "orders")}>Xem đơn hàng</button>
              <button onClick={() => open(c, "bookings")}>
                Xem lịch đặt bàn
              </button>
              <button disabled title="Chưa có dữ liệu điểm và API cộng điểm">
                Cộng điểm <small>Chưa có dữ liệu điểm</small>
              </button>
              <button disabled title="Chưa có dịch vụ gửi ưu đãi">
                Gửi ưu đãi <small>Chưa có dịch vụ gửi</small>
              </button>
            </div>
          )}
        </div>
      </td>
    </>
  );
  return (
    <div className="crm-page">
      <div className="crm-stats">
        {stats.map(([label, value, icon, color], i) => (
          <article key={label} className={"crm-stat tone-" + color}>
            <span className="crm-stat-icon">
              <AdminIcon name={String(icon)} />
            </span>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
              {i === 3 && <small>Chưa có dữ liệu điểm</small>}
            </div>
          </article>
        ))}
      </div>
      <section className="crm-filters" aria-label="Bộ lọc khách hàng">
        <label className="crm-search">
          <span>Tìm kiếm khách hàng</span>
          <div>
            <AdminIcon name="search" />
            <input
              placeholder="Tìm tên / số điện thoại"
              aria-label="Tìm tên hoặc số điện thoại"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </label>
        <label>
          <span>Nhóm khách hàng</span>
          <select
            aria-label="Nhóm khách hàng"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {[
              ["", "Tất cả khách hàng"],
              ["new", "Khách mới"],
              ["returning", "Khách quay lại"],
              ["vip", "VIP"],
              ["booking", "Có booking"],
              ["order", "Có đơn hàng"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Mức chi tiêu</span>
          <select
            aria-label="Mức chi tiêu"
            value={spend}
            onChange={(e) => setSpend(e.target.value)}
          >
            <option value="">Tất cả mức chi tiêu</option>
            <option value="zero">Chưa có chi tiêu</option>
            <option value="low">Dưới 1.000.000đ</option>
            <option value="high">Từ 1.000.000đ</option>
          </select>
        </label>
        <label>
          <span>Lần gần nhất</span>
          <select
            aria-label="Lần gần nhất"
            value={recent}
            onChange={(e) => setRecent(e.target.value)}
          >
            <option value="">Tất cả thời gian</option>
            <option value="1">Hôm nay</option>
            <option value="7">7 ngày qua</option>
            <option value="30">30 ngày qua</option>
          </select>
        </label>
        <button
          className="crm-reset"
          onClick={clear}
          disabled={!search && !kind && !spend && !recent}
        >
          Xóa bộ lọc
        </button>
      </section>
      <nav className="crm-quick" aria-label="Lọc nhanh khách hàng">
        {[
          ["", "Tất cả"],
          ["new", "Khách mới"],
          ["returning", "Khách quay lại"],
          ["vip", "VIP"],
          ["booking", "Có booking"],
          ["order", "Có đơn hàng"],
        ].map(([v, l]) => (
          <button key={v} aria-pressed={kind === v} onClick={() => setKind(v)}>
            {l}
          </button>
        ))}
      </nav>
      <section className="crm-table-card">
        <header className="crm-table-heading">
          <div>
            <h2>Danh sách khách hàng</h2>
            <p>
              <b>{rows.length}</b> khách hàng
              {search || kind || spend || recent
                ? " phù hợp bộ lọc"
                : " trong hệ thống"}
            </p>
          </div>
          <span>
            <AdminIcon name="users" /> Tổng hợp từ đơn hàng & đặt bàn
          </span>
        </header>
        <div className="crm-table-scroll">
          <table className="crm-table">
            <thead>
              <tr>
                {[
                  "Khách hàng",
                  "Liên hệ",
                  "Đơn hàng",
                  "Đặt bàn",
                  "Tổng chi tiêu",
                  "Điểm",
                  "Lần gần nhất",
                  "Thao tác",
                ].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.phone}>{cell(c)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <div className="crm-empty">
            <span>
              <AdminIcon name="users" />
            </span>
            <h3>
              {all.length
                ? "Không tìm thấy khách hàng phù hợp"
                : "Chưa có khách hàng"}
            </h3>
            <p>
              {all.length
                ? "Hãy thử thay đổi bộ lọc."
                : "Khách hàng sẽ xuất hiện sau khi đặt bàn hoặc đặt món."}
            </p>
            {all.length > 0 && <button onClick={clear}>Xóa bộ lọc</button>}
          </div>
        )}
        <footer className="crm-pagination">
          <span>
            Hiển thị {rows.length ? (current - 1) * size + 1 : 0}–
            {Math.min(current * size, rows.length)} / {rows.length} khách
          </span>
          <nav aria-label="Phân trang khách hàng">
            <button
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              ← Trước
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === pages || Math.abs(p - current) <= 1,
              )
              .map((p, i, arr) => (
                <span key={p}>
                  {i > 0 && p - arr[i - 1] > 1 && (
                    <span className="crm-ellipsis">…</span>
                  )}
                  <button
                    aria-current={p === current ? "page" : undefined}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
            >
              Sau →
            </button>
          </nav>
          <select
            aria-label="Số khách mỗi trang"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          >
            {[20, 40, 60].map((n) => (
              <option key={n} value={n}>
                {n} / trang
              </option>
            ))}
          </select>
        </footer>
      </section>
      <p className="crm-footnote">
        Khách hàng được tổng hợp theo số điện thoại. Chi tiêu tính từ đơn hoàn
        tất; hạng khách dựa trên số đơn. Chưa có dữ liệu điểm thành viên.
      </p>
      {selectedCustomer && selected && (
        <CustomerDrawer
          key={selected.phone + selected.tab}
          customer={selectedCustomer}
          initialTab={selected.tab}
          onClose={() => setSelected(null)}
          onOpen={onOpen}
        />
      )}
    </div>
  );
}
