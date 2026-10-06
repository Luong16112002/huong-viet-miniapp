import { useState } from "react";
import { adminRequest, areas, labels, Row } from "./admin-api";
import { AdminDialog } from "./admin-components";
export function BulkTablesModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<unknown>;
}) {
  const [form, setForm] = useState({
      quantity: 100,

      startNumber: 1,
      capacity: 4,
      area: "indoor",
      status: "AVAILABLE",
    }),
    [autoArea, setAutoArea] = useState(false),
    [autoCapacity, setAutoCapacity] = useState(false),
    [zone, setZone] = useState<Record<string, number>>({
      indoor: 20,
      garden: 20,
      floor2: 20,
      private: 20,
      floor1: 20,
    }),
    [seats, setSeats] = useState<Record<string, number>>({
      "2": 20,
      "4": 40,
      "6": 25,
      "8": 10,
      "10": 5,
      "12": 0,
      "20": 0,
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<Row | null>(null);
  const areaTotal = Object.values(zone).reduce((a, b) => a + b, 0),
    seatTotal = Object.values(seats).reduce((a, b) => a + b, 0),
    valid =
      (!autoArea || areaTotal === form.quantity) &&
      (!autoCapacity || seatTotal === form.quantity);
  return (
    <AdminDialog title="Thêm bàn hàng loạt" onClose={() => !busy && onClose()}>
      <form
        className="admin-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy || !valid) return;
          setBusy(true);
          setError("");
          try {
            const r = await adminRequest("/tables/bulk-create", "POST", {
              ...form,
              ...(autoArea
                ? {
                    areaAllocation: Object.entries(zone).map(
                      ([area, quantity]) => ({ area, quantity }),
                    ),
                  }
                : {}),
              ...(autoCapacity
                ? {
                    capacityAllocation: Object.entries(seats).map(
                      ([capacity, quantity]) => ({
                        capacity: Number(capacity),
                        quantity,
                      }),
                    ),
                  }
                : {}),
            });
            setResult(r);
            await onCreated();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy || !!result} className="bulk-fields">
          <div className="bulk-form-grid">
            {[
              ["quantity", "Số lượng bàn", 1, autoArea ? 500 : 100],
              ["startNumber", "Bắt đầu từ số", 1, 100],
            ].map(([key, label, min, max]) => (
              <label key={String(key)}>
                {label}
                <input
                  required
                  type={key === "prefix" ? "text" : "number"}
                  min={Number(min)}
                  max={Number(max)}
                  maxLength={key === "prefix" ? 16 : undefined}
                  pattern={
                    key === "prefix" ? "[A-Za-z][A-Za-z0-9_-]{0,15}" : undefined
                  }
                  value={form[key as keyof typeof form]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [key]:
                        key === "prefix"
                          ? e.target.value.toUpperCase()
                          : Number(e.target.value),
                    })
                  }
                />
              </label>
            ))}
            <label>
              Khu vực
              <select
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              >
                {Object.entries(areas).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Trạng thái
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {[
                  "AVAILABLE",
                  "RESERVED",
                  "OCCUPIED",
                  "CLEANING",
                  "DISABLED",
                ].map((k) => (
                  <option key={k} value={k}>
                    {labels[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Sức chứa mặc định
            <select
              value={form.capacity}
              onChange={(e) =>
                setForm({ ...form, capacity: Number(e.target.value) })
              }
            >
              {[2, 4, 6, 8, 10, 12, 20].map((n) => (
                <option key={n} value={n}>
                  {n} khách
                </option>
              ))}
            </select>
          </label>
          <label className="bulk-toggle">
            <input
              type="checkbox"
              checked={autoArea}
              onChange={(e) => setAutoArea(e.target.checked)}
            />
            Phân khu tự động
          </label>
          {autoArea && (
            <div className="bulk-allocation">
              {Object.entries(zone).map(([k, n]) => (
                <label key={k}>
                  {areas[k]}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={n}
                    onChange={(e) =>
                      setZone({ ...zone, [k]: Number(e.target.value) })
                    }
                  />
                </label>
              ))}
              <p>
                Tổng: {areaTotal}/{form.quantity} bàn
              </p>
            </div>
          )}
          <label className="bulk-toggle">
            <input
              type="checkbox"
              checked={autoCapacity}
              onChange={(e) => setAutoCapacity(e.target.checked)}
            />
            Phân bổ sức chứa tự động
          </label>
          {autoCapacity && (
            <div className="bulk-allocation">
              {Object.entries(seats).map(([k, n]) => (
                <label key={k}>
                  {k} khách
                  <input
                    type="number"
                    min={0}
                    max={500}
                    required
                    value={n}
                    onChange={(e) =>
                      setSeats({ ...seats, [k]: Number(e.target.value) })
                    }
                  />
                </label>
              ))}
              <p>
                Tổng: {seatTotal}/{form.quantity} bàn
              </p>
            </div>
          )}
          <p className="admin-footnote">
            Mã tự động theo khu: T1-, T2-, IN-, SV-, PR-. Mỗi khu tối đa 100
            bàn, số 001–100. Mã trùng được bỏ qua; không thay đổi bàn đã có.
          </p>
        </fieldset>
        {!valid && (
          <p role="alert" className="admin-error">
            Tổng mỗi phân bổ phải bằng {form.quantity} bàn.
          </p>
        )}
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        {result && (
          <div role="status" className="bulk-result">
            <strong>Đã tạo {result.created} bàn.</strong>
            <p>Bỏ qua {result.skipped.length} mã đã tồn tại.</p>
            {result.skipped.length > 0 && (
              <details>
                <summary>Xem mã trùng</summary>
                <p>{result.skipped.join(", ")}</p>
              </details>
            )}
          </div>
        )}
        <div className="admin-quick-actions">
          <button type="button" disabled={busy} onClick={onClose}>
            {result ? "Đóng" : "Hủy"}
          </button>
          {!result && (
            <button className="primary" disabled={busy || !valid}>
              {busy ? "Đang tạo…" : `Tạo ${form.quantity} bàn`}
            </button>
          )}
        </div>
      </form>
    </AdminDialog>
  );
}
export { TableInventory } from "./table-management";
