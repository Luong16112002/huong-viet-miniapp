import { useEffect, useMemo, useRef, useState } from "react";
import { Row, money } from "./admin-api";
import { AdminDialog } from "./admin-components";
import { AdminIcon } from "./admin-shell";
import { menuImages } from "@/services/product/menu-images";
import "./menu-management.css";

export const DEFAULT_FOOD_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112"><rect width="112" height="112" rx="24" fill="#E8F4EC"/><g fill="none" stroke="#7A9584" stroke-width="3" stroke-linecap="round"><path d="M34 25v16a7 7 0 0 0 14 0V25M41 25v42M69 25v23h10M79 25v42"/></g><text x="56" y="90" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#607869">Chưa có ảnh</text></svg>',
  );
const statusLabels = {
  selling: "Đang bán",
  hidden: "Tạm ẩn",
  soldout: "Hết món",
};
export function foodStatus(item: Row): keyof typeof statusLabels {
  if (item.available === false) return "hidden";
  if (
    item.soldOut === true ||
    item.outOfStock === true ||
    ["sold_out", "out_of_stock"].includes(item.status)
  )
    return "soldout";
  return "selling";
}
export function FoodImage({ item }: { item: Row }) {
  const imageUrl =
    [item.imageUrl, item.image, item.thumbnail, menuImages[item.id]].find(
      (v) => typeof v === "string" && v.trim(),
    ) || DEFAULT_FOOD_IMAGE;
  return (
    <img
      className="fm-image"
      src={imageUrl}
      alt={`Ảnh ${item.name}`}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = DEFAULT_FOOD_IMAGE;
      }}
    />
  );
}
export function CategoryBadge({ category }: { category: string }) {
  return <span className="fm-category">{category || "Chưa phân loại"}</span>;
}
export function FoodStatusBadge({ item }: { item: Row }) {
  const status = foodStatus(item);
  return (
    <span className={`fm-status fm-${status}`}>
      <span aria-hidden="true">●</span> {statusLabels[status]}
    </span>
  );
}
export function MenuStats({ rows }: { rows: Row[] }) {
  return (
    <div className="fm-stats">
      {[
        ["Tổng món", rows.length, "food"],
        ...Object.entries(statusLabels).map(([key, label]) => [
          label,
          rows.filter((r) => foodStatus(r) === key).length,
          key === "selling" ? "bag" : "clock",
        ]),
      ].map(([label, value, icon]) => (
        <article key={label} className="fm-stat">
          <div>
            <p>{label}</p>
            <strong>{value}</strong>
            <small>Món trong thực đơn</small>
          </div>
          <span>
            <AdminIcon name={String(icon)} />
          </span>
        </article>
      ))}
    </div>
  );
}
type Filters = {
  search: string;
  category: string;
  status: string;
  price: string;
};
const clearFilters: Filters = {
  search: "",
  category: "",
  status: "",
  price: "",
};
export function MenuToolbar({
  filters,
  setFilters,
  rows,
  busy,
  onAdd,
  onRefresh,
}: {
  filters: Filters;
  setFilters: (v: Filters) => void;
  rows: Row[];
  busy: boolean;
  onAdd: () => void;
  onRefresh: () => void;
}) {
  const set = (key: keyof Filters, value: string) =>
    setFilters({ ...filters, [key]: value });
  return (
    <div className="fm-toolbar">
      <label className="fm-search">
        <AdminIcon name="search" />
        <input
          aria-label="Tìm món"
          placeholder="Tìm món, mã món…"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
        />
      </label>
      <select
        aria-label="Lọc danh mục"
        value={filters.category}
        onChange={(e) => set("category", e.target.value)}
      >
        <option value="">Tất cả danh mục</option>
        {[...new Set(rows.map((r) => r.category).filter(Boolean))].map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <select
        aria-label="Lọc trạng thái"
        value={filters.status}
        onChange={(e) => set("status", e.target.value)}
      >
        <option value="">Tất cả trạng thái</option>
        {Object.entries(statusLabels).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <select
        aria-label="Khoảng giá"
        value={filters.price}
        onChange={(e) => set("price", e.target.value)}
      >
        <option value="">Khoảng giá</option>
        <option value="low">Dưới 100.000đ</option>
        <option value="mid">100.000–200.000đ</option>
        <option value="high">Trên 200.000đ</option>
      </select>
      {Object.values(filters).some(Boolean) && (
        <button onClick={() => setFilters(clearFilters)}>Xóa bộ lọc</button>
      )}
      <button
        title="Làm mới thực đơn"
        aria-label="Làm mới thực đơn"
        disabled={busy}
        onClick={onRefresh}
      >
        ↻
      </button>
      <button className="primary fm-add" disabled={busy} onClick={onAdd}>
        + Thêm món
      </button>
    </div>
  );
}
type Actions = {
  onEdit: (row: Row) => void;
  onToggle: (row: Row) => void;
  onDuplicate: (row: Row) => void;
  onDetail: (row: Row) => void;
  onDelete: (row: Row) => void;
  busy: boolean;
};
export function FoodActionMenu({ item, ...actions }: Actions & { item: Row }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>(".fm-more")?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div className="fm-actions" ref={ref}>
      <button
        disabled={actions.busy}
        onClick={() => actions.onEdit(item)}
        aria-label={`Sửa ${item.name}`}
      >
        ✎ <span>Sửa</span>
      </button>
      <button
        className="fm-more"
        disabled={actions.busy}
        aria-label={`Thao tác với ${item.name}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ⋯
      </button>
      {open && (
        <div className="fm-action-popover">
          {[
            [
              item.available === false ? "Hiện món" : "Ẩn món",
              actions.onToggle,
            ],
            ["Nhân bản", actions.onDuplicate],
            ["Xem chi tiết", actions.onDetail],
            ["Xóa món", actions.onDelete],
          ].map(([label, handler]) => (
            <button
              key={String(label)}
              className={label === "Xóa món" ? "fm-danger" : ""}
              onClick={() => {
                setOpen(false);
                (handler as (r: Row) => void)(item);
              }}
            >
              {String(label)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export function MenuRow({
  item,
  sold,
  ...actions
}: Actions & { item: Row; sold: number }) {
  return (
    <tr>
      <td className="fm-food">
        <div className="fm-food-content">
          <FoodImage item={item} />
          <div>
            <b>{item.name}</b>
            <small>
              {item.code || `FOOD-${String(item.id).padStart(3, "0")}`}
            </small>
          </div>
        </div>
      </td>
      <td className="fm-category-cell">
        <CategoryBadge category={item.category} />
      </td>
      <td className="fm-price">{money(item.price)}</td>
      <td className="fm-sold">
        {sold.toLocaleString("vi-VN")} lượt
        {sold > 100 && <small className="fm-bestseller">Bán chạy</small>}
      </td>
      <td className="fm-status-cell">
        <FoodStatusBadge item={item} />
      </td>
      <td className="fm-action-cell">
        <FoodActionMenu item={item} {...actions} />
      </td>
    </tr>
  );
}
export function MenuTable({
  rows,
  sales,
  ...actions
}: Actions & { rows: Row[]; sales: Map<string, number> }) {
  return (
    <div className="fm-table-scroll">
      <table className="fm-table">
        <thead>
          <tr>
            {[
              "Món ăn",
              "Danh mục",
              "Giá",
              "Đã bán",
              "Trạng thái",
              "Thao tác",
            ].map((label, i) => (
              <th
                key={label}
                className={
                  i === 3 ? "fm-sold" : i === 1 ? "fm-category-cell" : ""
                }
                scope="col"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <MenuRow
              key={item.id}
              item={item}
              sold={sales.get(String(item.id)) || 0}
              {...actions}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Pagination({
  total,
  page,
  size,
  setPage,
  setSize,
}: {
  total: number;
  page: number;
  size: number;
  setPage: (n: number) => void;
  setSize: (n: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  return (
    <footer className="fm-pagination">
      <span>
        Hiển thị {total ? (page - 1) * size + 1 : 0}–
        {Math.min(page * size, total)} / {total} món
      </span>
      <select
        aria-label="Số món mỗi trang"
        value={size}
        onChange={(e) => setSize(Number(e.target.value))}
      >
        {[20, 40, 60].map((n) => (
          <option key={n} value={n}>
            {n} / trang
          </option>
        ))}
      </select>
      <nav aria-label="Phân trang thực đơn">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          ← Trước
        </button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => start + i).map(
          (n) => (
            <button
              key={n}
              aria-label={`Trang ${n}`}
              aria-current={n === page ? "page" : undefined}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ),
        )}
        <button disabled={page >= pages} onClick={() => setPage(page + 1)}>
          Sau →
        </button>
      </nav>
    </footer>
  );
}
export function DeleteFoodModal({
  item,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  item: Row;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AdminDialog title="Xóa món ăn?" onClose={() => !busy && onClose()}>
      <div className="fm-delete">
        <span className="fm-delete-icon" aria-hidden="true">
          !
        </span>
        <p>
          Bạn có chắc muốn xóa <strong>“{item.name}”</strong>?
        </p>
        <p className="fm-muted">Hành động này không thể hoàn tác.</p>
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        <footer>
          <button disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button className="danger" disabled={busy} onClick={onConfirm}>
            {busy ? "Đang xóa…" : "Xóa món"}
          </button>
        </footer>
      </div>
    </AdminDialog>
  );
}
export function MenuManagement({
  rows,
  orders,
  busy,
  error,
  onEdit,
  onAdd,
  onRefresh,
  onSave,
}: {
  rows: Row[];
  orders: Row[];
  busy: boolean;
  error: string;
  onEdit: (r: Row) => void;
  onAdd: () => void;
  onRefresh: () => void;
  onSave: (r: Row, method?: string) => Promise<boolean>;
}) {
  const [filters, setFilters] = useState<Filters>(clearFilters),
    [page, setPage] = useState(1),
    [size, setSize] = useState(20),
    [deleting, setDeleting] = useState<Row | null>(null),
    [detail, setDetail] = useState<Row | null>(null);
  const sales = useMemo(() => {
    const result = new Map<string, number>();
    for (const o of orders.filter((o) => o.state === "completed"))
      for (const i of o.items || [])
        result.set(
          String(i.productId),
          (result.get(String(i.productId)) || 0) + Number(i.quantity || 0),
        );
    return result;
  }, [orders]);
  const filtered = rows.filter(
    (r) =>
      `${r.name} ${r.code || `FOOD-${String(r.id).padStart(3, "0")}`}`
        .toLocaleLowerCase("vi")
        .includes(filters.search.trim().toLocaleLowerCase("vi")) &&
      (!filters.category || r.category === filters.category) &&
      (!filters.status || foodStatus(r) === filters.status) &&
      (!filters.price ||
        (filters.price === "low"
          ? r.price < 100000
          : filters.price === "mid"
            ? r.price >= 100000 && r.price <= 200000
            : r.price > 200000)),
  );
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / size)),
  );
  const changeFilters = (v: Filters) => {
    setFilters(v);
    setPage(1);
  };
  return (
    <section className="fm-management" aria-label="Quản lý thực đơn">
      <MenuStats rows={rows} />
      <MenuToolbar
        filters={filters}
        setFilters={changeFilters}
        rows={rows}
        busy={busy}
        onAdd={onAdd}
        onRefresh={onRefresh}
      />
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      <div className="fm-card" aria-busy={busy}>
        <header className="fm-card-heading">
          <div>
            <h2>Danh sách món ăn</h2>
            <p>Quản lý món ăn, giá bán và trạng thái phục vụ</p>
          </div>
          <span aria-live="polite">
            {busy ? "Đang cập nhật…" : `${filtered.length} món ăn`}
          </span>
        </header>
        <MenuTable
          rows={filtered.slice((currentPage - 1) * size, currentPage * size)}
          sales={sales}
          busy={busy}
          onEdit={onEdit}
          onToggle={(r) =>
            void onSave({ ...r, available: r.available === false })
          }
          onDetail={setDetail}
          onDuplicate={(r) =>
            onEdit({
              ...r,
              id: undefined,
              code: undefined,
              _new: true,
              name: `${r.name} (bản sao)`,
            })
          }
          onDelete={setDeleting}
        />
        {!filtered.length && (
          <div className="fm-empty">
            <AdminIcon name="food" />
            <h3>{busy ? "Đang tải thực đơn…" : "Không tìm thấy món ăn"}</h3>
            <p>
              {rows.length
                ? "Thử thay đổi từ khóa hoặc xóa bộ lọc."
                : "Thêm món ăn đầu tiên để bắt đầu quản lý thực đơn."}
            </p>
          </div>
        )}
        <Pagination
          total={filtered.length}
          page={currentPage}
          size={size}
          setPage={setPage}
          setSize={(n) => {
            setSize(n);
            setPage(1);
          }}
        />
      </div>
      {deleting && (
        <DeleteFoodModal
          item={deleting}
          busy={busy}
          error={error}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            void onSave(deleting, "DELETE").then((ok) => {
              if (ok) setDeleting(null);
            })
          }
        />
      )}
      {detail && (
        <AdminDialog title="Chi tiết món ăn" onClose={() => setDetail(null)}>
          <div className="fm-detail">
            <FoodImage item={detail} />
            <h3>{detail.name}</h3>
            <p className="fm-price">{money(detail.price)}</p>
            <CategoryBadge category={detail.category} />{" "}
            <FoodStatusBadge item={detail} />
            <p>{detail.description || "Chưa có mô tả món ăn."}</p>
            <button
              className="primary"
              onClick={() => {
                onEdit({ ...detail });
                setDetail(null);
              }}
            >
              ✎ Sửa món
            </button>
          </div>
        </AdminDialog>
      )}
    </section>
  );
}
