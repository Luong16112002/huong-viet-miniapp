import { MenuManagement } from "./menu-management";
import { PromotionManagement } from "./promotion-management";
import { useEffect, useState } from "react";
import { adminRequest, Row, money, dateTime } from "./admin-api";
import { AdminDialog, FilterBar } from "./admin-components";
import { EmptyState } from "./admin-tables";
import { menuImages } from "@/services/product/menu-images";
export function CatalogManagement({
  kind,
  orders,
}: {
  kind: "menu" | "promotions";
  orders: Row[];
}) {
  return kind === "promotions" ? (
    <PromotionManagement orders={orders} />
  ) : (
    <MenuCatalogManagement kind={kind} orders={orders} />
  );
}
function MenuCatalogManagement({
  kind,
  orders,
}: {
  kind: "menu" | "promotions";
  orders: Row[];
}) {
  const [rows, setRows] = useState<Row[]>([]),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [category, setCategory] = useState(""),
    [edit, setEdit] = useState<Row | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const menu = kind === "menu";
  async function load() {
    setBusy(true);
    try {
      setRows(await adminRequest("/" + kind));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    setRows([]);
    setEdit(null);
    setSearch("");
    setCategory("");
    setStatus("");
    void load();
  }, [kind]);
  async function save(row: Row, method = "PUT") {
    setBusy(true);
    try {
      const id = menu ? row.id : row.code;
      await adminRequest(
        "/" + kind + (method === "POST" ? "" : "/" + encodeURIComponent(id)),
        method,
        row,
      );
      setEdit(null);
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const filtered = rows.filter(
    (r) =>
      [r.name, r.code].join(" ").toLowerCase().includes(search.toLowerCase()) &&
      (!category || r.category === category) &&
      (!status ||
        String(menu ? r.available !== false : r.enabled === true) === status),
  );
  return (
    <>
      {menu ? (
        <MenuManagement
          rows={rows}
          orders={orders}
          busy={busy}
          error={error}
          onEdit={(r) => setEdit({ ...r })}
          onAdd={() => {
            setError("");
            setEdit({
              _new: true,
              name: "",
              price: 0,
              category: "Món chính",
              available: true,
            });
          }}
          onRefresh={() => void load()}
          onSave={save}
        />
      ) : (
        <>
          <FilterBar>
            <input
              aria-label="Tìm kiếm"
              placeholder={menu ? "Tìm tên món…" : "Tìm mã hoặc tên ưu đãi…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Trạng thái"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang bật</option>
              <option value="false">Đã ẩn / tắt</option>
            </select>
            {menu && (
              <select
                aria-label="Danh mục"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Mọi danh mục</option>
                {[...new Set(rows.map((r) => r.category))].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            )}
            <button disabled={busy} onClick={() => void load()}>
              ↻ Làm mới
            </button>
            <button
              className="primary"
              onClick={() =>
                setEdit(
                  menu
                    ? {
                        _new: true,
                        name: "",
                        price: 0,
                        category: "Món chính",
                        available: true,
                      }
                    : {
                        _new: true,
                        code: "",
                        name: "",
                        amount: 0,
                        minSubtotal: 0,
                        enabled: true,
                        expiresAt: "",
                      },
                )
              }
            >
              {menu ? "+ Thêm món" : "+ Tạo ưu đãi"}
            </button>
          </FilterBar>
          {error && (
            <p role="alert" className="admin-error">
              {error}
            </p>
          )}
          <div className="admin-toolbar">
            <b>
              {filtered.length} {menu ? "món ăn" : "ưu đãi"}
            </b>
            {busy && <span>Đang cập nhật…</span>}
          </div>
          <div className="admin-data-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  {(menu
                    ? [
                        "Món ăn",
                        "Danh mục",
                        "Giá",
                        "Đã bán",
                        "Trạng thái",
                        "Thao tác",
                      ]
                    : [
                        "Ưu đãi",
                        "Mã giảm giá",
                        "Mức giảm",
                        "Hết hạn",
                        "Lượt sử dụng",
                        "Trạng thái",
                        "Thao tác",
                      ]
                  ).map((s) => (
                    <th key={s}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id || r.code}>
                    {menu ? (
                      <>
                        <td data-label="Món ăn">
                          <div className="admin-food-cell">
                            <img
                              src={r.image || menuImages[r.id]}
                              alt=""
                              onError={(e) => {
                                e.currentTarget.style.visibility = "hidden";
                              }}
                            />
                            <b>{r.name}</b>
                          </div>
                        </td>
                        <td data-label="Danh mục">{r.category}</td>
                        <td data-label="Giá">{money(r.price)}</td>
                        <td data-label="Đã bán">
                          {orders
                            .filter((o) => o.state === "completed")
                            .flatMap((o) => o.items)
                            .filter((i) => i.productId === r.id)
                            .reduce((s, i) => s + i.quantity, 0)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td data-label="Ưu đãi">
                          <b>{r.name || r.title}</b>
                        </td>
                        <td data-label="Mã">{r.code}</td>
                        <td data-label="Mức giảm">{money(r.amount)}</td>
                        <td data-label="Hết hạn">{dateTime(r.expiresAt)}</td>
                        <td data-label="Lượt sử dụng">{r.usage || 0}</td>
                      </>
                    )}
                    <td data-label="Trạng thái">
                      <span
                        className={
                          "admin-badge s-" +
                          ((menu ? r.available !== false : r.enabled)
                            ? "AVAILABLE"
                            : "DISABLED")
                        }
                      >
                        {menu
                          ? r.available !== false
                            ? "Đang bán"
                            : "Đã ẩn"
                          : r.enabled
                            ? Date.parse(r.expiresAt) < Date.now()
                              ? "Hết hạn"
                              : "Đang bật"
                            : "Đã tắt"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-quick-actions">
                        <button onClick={() => setEdit({ ...r })}>Sửa</button>
                        <button
                          disabled={busy}
                          onClick={() =>
                            void save({
                              ...r,
                              ...(menu
                                ? { available: r.available === false }
                                : { enabled: !r.enabled }),
                            })
                          }
                        >
                          {menu
                            ? r.available === false
                              ? "Hiện"
                              : "Ẩn"
                            : r.enabled
                              ? "Tắt"
                              : "Bật"}
                        </button>
                        <button
                          className="danger"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm("Xóa " + (r.name || r.code) + "?")
                            )
                              void save(r, "DELETE");
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && !busy && <EmptyState />}
          </div>
        </>
      )}
      {edit && (
        <AdminDialog
          title={menu ? "Thông tin món ăn" : "Thông tin ưu đãi"}
          onClose={() => !busy && setEdit(null)}
        >
          <form
            className="admin-form"
            onSubmit={(e) => {
              e.preventDefault();
              void save(edit, edit._new ? "POST" : "PUT");
            }}
          >
            {error && (
              <p role="alert" className="admin-error">
                {error}
              </p>
            )}
            {(menu
              ? [
                  ["name", "Tên món", "text"],
                  ["category", "Danh mục", "text"],
                  ["price", "Giá bán", "number"],
                  ["imageUrl", "Đường dẫn ảnh HTTPS hoặc nội bộ", "text"],
                  ["description", "Mô tả", "text"],
                ]
              : [
                  ["name", "Tên ưu đãi", "text"],
                  ["code", "Mã giảm giá", "text"],
                  ["amount", "Số tiền giảm", "number"],
                  ["minSubtotal", "Đơn tối thiểu", "number"],
                  ["expiresAt", "Hết hạn", "date"],
                ]
            ).map(([k, label, type]) => (
              <label key={k}>
                {label}
                {k === "category" ? (
                  <select
                    value={edit.category}
                    onChange={(e) =>
                      setEdit({ ...edit, category: e.target.value })
                    }
                  >
                    {["Món chính", "Khai vị", "Đồ uống", "Tráng miệng"].map(
                      (v) => (
                        <option key={v}>{v}</option>
                      ),
                    )}
                  </select>
                ) : (
                  <input
                    required={!["imageUrl", "description"].includes(k)}
                    type={type}
                    min={type === "number" ? 0 : undefined}
                    disabled={k === "code" && !edit._new}
                    value={
                      type === "date"
                        ? edit[k]?.slice(0, 10) || ""
                        : (edit[k] ?? "")
                    }
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        [k]:
                          type === "number"
                            ? Number(e.target.value)
                            : type === "date"
                              ? e.target.value + "T23:59:59+07:00"
                              : e.target.value,
                      })
                    }
                  />
                )}
              </label>
            ))}
            <button className="primary" disabled={busy}>
              {busy ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
          </form>
        </AdminDialog>
      )}
    </>
  );
}
export { CustomersPage } from "./customer-management";
export { ReportsPage } from "./report-management";
