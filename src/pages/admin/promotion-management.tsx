import { useEffect, useState } from "react";
import { adminRequest, money, Row } from "./admin-api";
import { AdminIcon } from "./admin-shell";
import { AdminDialog } from "./admin-components";
import {
  promoDate,
  promoDay,
  promoLabels,
  promoPayload,
  promoState,
  promoUsage,
} from "./promotion-data";
import {
  PromotionDrawer,
  PromotionForm,
  PromoStatus,
} from "./promotion-details";
import "./promotion-management.css";

const blank = () => ({
  _new: true,
  name: "",
  code: "",
  amount: "",
  minSubtotal: 0,
  expiresAt: "",
  startsAt: null,
  enabled: true,
});
export function PromotionManagement({ orders }: { orders: Row[] }) {
  const [rows, setRows] = useState<Row[]>([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [type, setType] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [page, setPage] = useState(1),
    [size, setSize] = useState(20),
    [edit, setEdit] = useState<Row | null>(null),
    [selected, setSelected] = useState<{ code: string; usage: boolean } | null>(
      null,
    ),
    [remove, setRemove] = useState<Row | null>(null),
    [menu, setMenu] = useState<string | null>(null),
    [copied, setCopied] = useState(""),
    [now, setNow] = useState(Date.now());
  async function load() {
    setLoading(true);
    try {
      const data = await adminRequest("/promotions");
      setRows(data);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setPage(1);
    setMenu(null);
  }, [search, status, type, from, to, size]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".pm-actions")) setMenu(null);
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
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(""), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  async function save(row: Row, method = "PUT") {
    setBusy(true);
    setError("");
    try {
      await adminRequest(
        "/promotions" +
          (method === "POST" ? "" : "/" + encodeURIComponent(row.code)),
        method,
        method === "DELETE" ? undefined : promoPayload(row),
      );
      setEdit(null);
      setRemove(null);
      setMenu(null);
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const startEdit = (row: Row) => {
    setError("");
    setSelected(null);
    setMenu(null);
    setEdit({ ...row });
  };
  const add = () => startEdit(blank());
  const open = (row: Row, usage = false) => {
    setMenu(null);
    setSelected({ code: row.code, usage });
  };
  const duplicate = (row: Row) => {
    const base = String(row.code).slice(0, 20) + "_COPY";
    let code = base,
      n = 2;
    while (rows.some((r) => r.code === code)) {
      code = base + "_" + n++;
    }
    startEdit({
      ...row,
      _new: true,
      code,
      name: (row.name || row.title || "Ưu đãi").slice(0, 110) + " (bản sao)",
      enabled: false,
    });
  };
  const clear = () => {
    setSearch("");
    setStatus("");
    setType("");
    setFrom("");
    setTo("");
    setPage(1);
  };
  const count = (value: string) =>
    rows.filter((r) =>
      value === "active"
        ? ["active", "soon"].includes(promoState(r, now))
        : promoState(r, now) === value,
    ).length;
  const dateInvalid = Boolean(from && to && from > to);
  const filtered = rows.filter(
    (r) =>
      !dateInvalid &&
      [r.name, r.title, r.code]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")) &&
      (!status ||
        (status === "active"
          ? ["active", "soon"].includes(promoState(r, now))
          : promoState(r, now) === status)) &&
      (!type || type === "fixed") &&
      (!from || !promoDay(r.expiresAt) || promoDay(r.expiresAt) >= from) &&
      (!to || !promoDay(r.expiresAt) || promoDay(r.expiresAt) <= to),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / size)),
    current = Math.min(page, pages),
    shown = filtered.slice((current - 1) * size, current * size),
    isBusy = busy || loading;
  const detail = selected && rows.find((r) => r.code === selected.code);
  const stats = [
    ["Tổng ưu đãi", rows.length, "ticket", "green"],
    ["Đang hoạt động", count("active"), "check", "green"],
    ["Sắp hết hạn", count("soon"), "clock", "gold"],
    ["Đã hết hạn", count("expired"), "calendar", "red"],
    [
      "Lượt sử dụng",
      rows.reduce((sum, r) => sum + promoUsage(r, orders), 0),
      "chart",
      "blue",
    ],
  ];
  const tabs = [
    ["", "Tất cả", rows.length],
    ["active", "Đang hoạt động", count("active")],
    ["soon", "Sắp hết hạn", count("soon")],
    ["expired", "Hết hạn", count("expired")],
    ["disabled", "Đã tắt", count("disabled")],
  ];
  return (
    <div className="pm-page">
      <div className="pm-stats">
        {stats.map(([label, value, icon, tone]) => (
          <article className={"pm-stat pm-tone-" + tone} key={label}>
            <span>
              <AdminIcon name={String(icon)} />
            </span>
            <div>
              <p>{label}</p>
              <strong>{loading && rows.length === 0 ? "—" : value}</strong>
            </div>
          </article>
        ))}
      </div>
      <section className="pm-filters" aria-label="Bộ lọc ưu đãi">
        <label className="pm-search">
          <span>Tìm kiếm ưu đãi</span>
          <div>
            <AdminIcon name="search" />
            <input
              aria-label="Tìm mã hoặc tên ưu đãi"
              placeholder="Tìm mã / tên ưu đãi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </label>
        <label>
          <span>Trạng thái</span>
          <select
            aria-label="Lọc trạng thái ưu đãi"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(promoLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {v === "active" ? "Đang hoạt động" : l}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Loại ưu đãi</span>
          <select
            aria-label="Lọc loại ưu đãi"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Tất cả loại ưu đãi</option>
            <option value="fixed">₫ Giảm tiền</option>
            <option disabled>Phần trăm · Chưa hỗ trợ</option>
            <option disabled>Thành viên · Chưa hỗ trợ</option>
            <option disabled>Món ăn · Chưa hỗ trợ</option>
          </select>
        </label>
        <label>
          <span>Hết hạn từ ngày</span>
          <input
            aria-label="Hết hạn từ ngày"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          <span>Đến ngày</span>
          <input
            aria-label="Hết hạn đến ngày"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <div className="pm-filter-buttons">
          <button
            disabled={!search && !status && !type && !from && !to}
            onClick={clear}
          >
            Xóa bộ lọc
          </button>
          <button className="pm-primary" disabled={isBusy} onClick={add}>
            + Tạo ưu đãi
          </button>
        </div>
      </section>
      {dateInvalid && (
        <p className="pm-error" role="alert">
          Từ ngày không được sau Đến ngày.
        </p>
      )}
      {error && !edit && !remove && (
        <p className="pm-error" role="alert">
          {error}
        </p>
      )}
      <div className="pm-toolbar">
        <nav className="pm-tabs" aria-label="Lọc nhanh ưu đãi">
          {tabs.map(([key, label, count]) => (
            <button
              key={key}
              aria-pressed={status === key}
              onClick={() => setStatus(String(key))}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </nav>
        <button
          className="pm-refresh"
          disabled={isBusy}
          onClick={() => void load()}
        >
          <AdminIcon name="refresh" />
          {loading ? "Đang tải…" : "Làm mới"}
        </button>
      </div>
      <section className="pm-table-card">
        <header className="pm-table-heading">
          <div>
            <h2>Chương trình ưu đãi</h2>
            <p>
              <b>{filtered.length}</b> ưu đãi
              {search || status || type || from || to
                ? " phù hợp bộ lọc"
                : " trong hệ thống"}
            </p>
          </div>
          <span>
            <AdminIcon name="clock" /> Cảnh báo trước khi hết hạn 3 ngày
          </span>
        </header>
        <div className="pm-table-scroll">
          <table className="pm-table">
            <thead>
              <tr>
                {[
                  "Ưu đãi",
                  "Mã",
                  "Loại",
                  "Điều kiện",
                  "Mức giảm",
                  "Thời gian",
                  "Lượt dùng",
                  "Trạng thái",
                  "Thao tác",
                ].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr
                  key={row.code}
                  className={
                    promoState(row, now) === "soon" ? "pm-row-soon" : ""
                  }
                >
                  <td data-label="Ưu đãi">
                    <div className="pm-name">
                      <span>
                        <AdminIcon name="ticket" />
                      </span>
                      <div>
                        <b>{row.name || row.title}</b>
                        <small>
                          {row.description || "Áp dụng cho tất cả món ăn"}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td data-label="Mã">
                    <div className="pm-code">
                      <code>{row.code}</code>
                      <button
                        disabled={isBusy}
                        aria-label={"Sao chép mã " + row.code}
                        title={
                          copied === row.code ? "Đã sao chép" : "Sao chép mã"
                        }
                        onClick={() => {
                          void navigator.clipboard
                            .writeText(row.code)
                            .then(() => setCopied(row.code))
                            .catch(() =>
                              setError(
                                "Không sao chép được mã. Bạn có thể chọn mã và sao chép thủ công.",
                              ),
                            );
                        }}
                      >
                        <AdminIcon
                          name={copied === row.code ? "check" : "copy"}
                        />
                      </button>
                    </div>
                  </td>
                  <td data-label="Loại">
                    <span className="pm-type">₫ Giảm tiền</span>
                  </td>
                  <td data-label="Điều kiện">
                    <b className="pm-condition">
                      {row.minSubtotal
                        ? "Đơn từ " + money(row.minSubtotal)
                        : "Không yêu cầu đơn tối thiểu"}
                    </b>
                    <small>Không giảm phí giao hàng</small>
                  </td>
                  <td data-label="Mức giảm">
                    <b className="pm-discount">
                      Giảm trực tiếp {money(row.amount)}
                    </b>
                  </td>
                  <td data-label="Thời gian">
                    <div className="pm-dates">
                      <b>
                        {row.startsAt
                          ? promoDate(row.startsAt)
                          : "Không giới hạn bắt đầu"}
                      </b>
                      <small>→ {promoDate(row.expiresAt)}</small>
                    </div>
                    {promoState(row, now) === "soon" && (
                      <span className="pm-expiring">Còn dưới 3 ngày</span>
                    )}
                  </td>
                  <td data-label="Lượt dùng">
                    <button
                      className="pm-usage"
                      onClick={() => open(row, true)}
                    >
                      <b>{promoUsage(row, orders)}</b> lượt
                    </button>
                    <small>Không giới hạn</small>
                  </td>
                  <td data-label="Trạng thái">
                    <PromoStatus row={row} />
                  </td>
                  <td data-label="Thao tác">
                    <div className="pm-actions">
                      <button disabled={isBusy} onClick={() => startEdit(row)}>
                        <AdminIcon name="edit" /> Sửa
                      </button>
                      <button
                        className="pm-more"
                        disabled={isBusy}
                        aria-label={"Thao tác " + row.code}
                        aria-expanded={menu === row.code}
                        onClick={() =>
                          setMenu(menu === row.code ? null : row.code)
                        }
                      >
                        ⋯
                      </button>
                      {menu === row.code && (
                        <div className="pm-action-menu">
                          <button onClick={() => open(row)}>
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() =>
                              void save({ ...row, enabled: !row.enabled })
                            }
                          >
                            {row.enabled ? "Tắt ưu đãi" : "Bật ưu đãi"}
                          </button>
                          <button onClick={() => duplicate(row)}>
                            Nhân bản
                          </button>
                          <button onClick={() => open(row, true)}>
                            Xem lượt sử dụng
                          </button>
                          <button
                            className="pm-danger"
                            onClick={() => {
                              setError("");
                              setMenu(null);
                              setRemove(row);
                            }}
                          >
                            Xóa ưu đãi
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <div className="pm-empty">
            <span>
              <AdminIcon name="ticket" />
            </span>
            <h3>
              {loading
                ? "Đang tải ưu đãi…"
                : rows.length
                  ? "Không tìm thấy ưu đãi phù hợp"
                  : error
                    ? "Chưa tải được ưu đãi"
                    : "Chưa có chương trình ưu đãi"}
            </h3>
            <p>
              {rows.length
                ? "Hãy thử thay đổi bộ lọc."
                : error
                  ? "Hãy thử làm mới dữ liệu."
                  : "Tạo ưu đãi đầu tiên cho khách hàng."}
            </p>
            {!loading &&
              (rows.length ? (
                <button onClick={clear}>Xóa bộ lọc</button>
              ) : error ? (
                <button onClick={() => void load()}>Thử lại</button>
              ) : (
                <button className="pm-primary" onClick={add}>
                  + Tạo ưu đãi
                </button>
              ))}
          </div>
        )}
        <footer className="pm-pagination">
          <span>
            Hiển thị {filtered.length ? (current - 1) * size + 1 : 0}–
            {Math.min(current * size, filtered.length)} / {filtered.length} ưu
            đãi
          </span>
          <nav aria-label="Phân trang ưu đãi">
            <button
              disabled={current === 1}
              onClick={() => {
                setPage(current - 1);
                setMenu(null);
              }}
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
                    <span className="pm-ellipsis">…</span>
                  )}
                  <button
                    aria-current={current === p ? "page" : undefined}
                    onClick={() => {
                      setPage(p);
                      setMenu(null);
                    }}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              disabled={current === pages}
              onClick={() => {
                setPage(current + 1);
                setMenu(null);
              }}
            >
              Sau →
            </button>
          </nav>
          <select
            aria-label="Số ưu đãi mỗi trang"
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
      {edit && (
        <PromotionForm
          key={edit._new ? "new-" + edit.code : edit.code}
          row={edit}
          rows={rows}
          busy={busy}
          error={error}
          onClose={() => setEdit(null)}
          onSave={save}
        />
      )}
      {detail && selected && (
        <PromotionDrawer
          key={selected.code + String(selected.usage)}
          row={detail}
          orders={orders}
          usageTab={selected.usage}
          busy={isBusy}
          onClose={() => setSelected(null)}
          onEdit={() => startEdit(detail)}
          onToggle={() => void save({ ...detail, enabled: !detail.enabled })}
        />
      )}
      {remove && (
        <AdminDialog
          title="Xóa ưu đãi?"
          onClose={() => !busy && setRemove(null)}
        >
          <div className="pm-delete">
            <span>
              <AdminIcon name="ticket" />
            </span>
            <p>
              Bạn có chắc muốn xóa <b>“{remove.name || remove.code}”</b>?
            </p>
            <small>
              Mã {remove.code} sẽ ngừng áp dụng. Lịch sử đơn hàng được giữ lại.
            </small>
            {error && (
              <p className="pm-error" role="alert">
                {error}
              </p>
            )}
            <footer>
              <button disabled={busy} onClick={() => setRemove(null)}>
                Hủy
              </button>
              <button
                className="pm-danger"
                disabled={busy}
                onClick={() => void save(remove, "DELETE")}
              >
                {busy ? "Đang xóa…" : "Xóa ưu đãi"}
              </button>
            </footer>
          </div>
        </AdminDialog>
      )}
    </div>
  );
}
