import { Row, money, dateTime, areas } from "./admin-api";
import { StatusBadge } from "./admin-components";
import { AdminIcon } from "./admin-shell";
export function EmptyState({
  title = "Chưa có dữ liệu phù hợp",
  description = "Thử thay đổi bộ lọc hoặc quay lại khi có hoạt động mới.",
  onAdd,
}: {
  title?: string;
  description?: string;
  onAdd?: () => void;
}) {
  return (
    <div className="admin-empty">
      <span>
        <AdminIcon name="table" />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {onAdd && (
        <button className="primary" onClick={onAdd}>
          + Thêm bàn
        </button>
      )}
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
    <div className="admin-data-wrap">
      <table className="admin-data-table">
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
            ].map((s) => (
              <th key={s}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td data-label="Mã đơn">
                <b>#{r.orderCode}</b>
              </td>
              <td data-label="Khách hàng">
                {r.customerName ||
                  r.deliveryAddress?.recipientName ||
                  "Khách tại quầy"}
                <small>{r.phone || r.deliveryAddress?.phoneNumber}</small>
              </td>
              <td data-label="Hình thức">
                {r.deliveryTypeLabel}
                <small>{r.tableId || r.tableNumber || "—"}</small>
              </td>
              <td data-label="Món">
                {r.items.reduce((n: number, i: Row) => n + i.quantity, 0)} món
              </td>
              <td data-label="Tổng tiền">
                <strong>{money(r.totalAmount)}</strong>
              </td>
              <td data-label="Trạng thái">
                <StatusBadge status={r.state} />
              </td>
              <td data-label="Thời gian">{dateTime(r.createdAt)}</td>
              <td>
                <button onClick={() => onOpen(r)}>Xem ↗</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <EmptyState />}
    </div>
  );
}
export function BookingTable({
  rows,
  onOpen,
  onQuick,
  busy = false,
}: {
  rows: Row[];
  onOpen: (r: Row) => void;
  onQuick?: (r: Row, s: string) => void;
  busy?: boolean;
}) {
  return (
    <div className="admin-data-wrap">
      <table className="admin-data-table">
        <thead>
          <tr>
            {[
              "Mã đặt",
              "Khách hàng / SĐT",
              "Ngày giờ",
              "Số khách",
              "Khu vực",
              "Bàn",
              "Trạng thái",
              "Thao tác",
            ].map((s) => (
              <th key={s}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td data-label="Mã đặt">
                <b>{r.code}</b>
              </td>
              <td data-label="Khách hàng">
                {r.name}
                <small>{r.phone}</small>
              </td>
              <td data-label="Ngày giờ">
                {r.date}
                <small>{r.time}</small>
              </td>
              <td data-label="Số khách">{r.guests}</td>
              <td data-label="Khu vực">{areas[r.area] || r.area}</td>
              <td data-label="Bàn">{r.tableId || "Chưa gán"}</td>
              <td data-label="Trạng thái">
                <StatusBadge status={r.status} />
              </td>
              <td>
                <div className="admin-quick-actions">
                  <button onClick={() => onOpen(r)}>
                    {r.tableId ? "Xem" : "Gán bàn"}
                  </button>
                  {onQuick && r.status === "pending" && (
                    <>
                      <button
                        className="primary"
                        disabled={busy}
                        onClick={() =>
                          r.tableId ? onQuick(r, "confirmed") : onOpen(r)
                        }
                      >
                        Xác nhận
                      </button>
                      <button
                        className="danger"
                        disabled={busy}
                        onClick={() => onQuick(r, "rejected")}
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  {onQuick && r.status === "confirmed" && (
                    <button
                      disabled={busy}
                      onClick={() => onQuick(r, "checked_in")}
                    >
                      Check-in
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <EmptyState />}
    </div>
  );
}
