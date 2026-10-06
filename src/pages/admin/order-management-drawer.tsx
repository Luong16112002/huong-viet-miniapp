import { useState } from "react";
import { Row, money, labels, transitions } from "./admin-api";
import { AdminIcon } from "./admin-shell";
import {
  OrderCustomer,
  OrderDelivery,
  OrderStatusBadge,
  orderActionLabels,
  orderDateTime,
  printOrderInvoice,
} from "./order-management";
import { getPaymentMethodLabel } from "@/utils/order";
import { menuImages } from "@/services/product/menu-images";
import { DEFAULT_FOOD_IMAGE } from "./menu-management";

export function OrderManagementDrawer({
  row,
  tables,
  busy,
  onStatus,
}: {
  row: Row;
  tables: Row[];
  busy: boolean;
  onStatus: (state: string, customerLeft: boolean, tableId: string) => void;
}) {
  const [table, setTable] = useState(row.tableId || ""),
    [left, setLeft] = useState(false),
    [confirmCancel, setConfirmCancel] = useState(false);
  const allowed = transitions(row, false),
    stamp = orderDateTime(row.createdAt),
    items: Row[] = row.items || [];
  const subtotal =
    row.payment?.subtotal ??
    items.reduce((total, item) => total + item.price * item.quantity, 0);
  const timeline: Row[] = row.timeline?.length
    ? row.timeline
    : row.createdAt
      ? [{ at: row.createdAt, status: "pending", label: "Khách gửi yêu cầu" }]
      : [];
  const steps = [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    ...(row.deliveryType === "dinein"
      ? ["serving"]
      : row.deliveryType === "delivery"
        ? ["delivering"]
        : []),
    "completed",
  ];
  const index = steps.indexOf(row.state),
    upcoming =
      ["cancelled", "completed", "delivered"].includes(row.state) || index < 0
        ? []
        : steps.slice(index + 1);
  const update = (state: string) =>
    state === "cancelled"
      ? setConfirmCancel(true)
      : onStatus(state, left, table);
  return (
    <div className="om-drawer">
      <div className="om-drawer-summary">
        <small>ĐƠN HÀNG HƯƠNG VIỆT</small>
        <div>
          <h3>#{row.orderCode || row.id}</h3>
          <OrderStatusBadge state={row.state} />
        </div>
        <p>
          <AdminIcon name="calendar" />
          {stamp.date}
          <span>· {stamp.time}</span>
        </p>
      </div>
      <section className="om-drawer-section">
        <h3>Khách hàng & hình thức nhận</h3>
        <OrderCustomer row={row} />
        <div className="om-drawer-delivery">
          <OrderDelivery row={row} />
        </div>
        {row.deliveryType === "dinein" &&
          !row.tableId &&
          allowed.length > 0 && (
            <label className="om-assign-order">
              Bàn phục vụ
              <select
                aria-label="Bàn phục vụ đơn hàng"
                value={table}
                disabled={busy}
                onChange={(e) => setTable(e.target.value)}
              >
                <option value="">Chọn bàn</option>
                {tables
                  .filter((t) => t.status !== "DISABLED")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} · {t.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
      </section>
      <section className="om-drawer-section">
        <header className="om-section-title">
          <h3>Danh sách món</h3>
          <span>{items.reduce((n, item) => n + item.quantity, 0)} món</span>
        </header>
        <div className="om-ordered-items">
          {items.map((item, i) => (
            <article key={item.id || i}>
              <img
                src={
                  item.imageUrl ||
                  item.image ||
                  menuImages[item.productId] ||
                  DEFAULT_FOOD_IMAGE
                }
                alt={item.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_FOOD_IMAGE;
                }}
              />
              <div>
                <b>
                  {item.quantity} × {item.name}
                </b>
                {item.options?.length > 0 && (
                  <small>
                    {item.options
                      .map((o: Row) => `${o.name}: ${o.value}`)
                      .join(" · ")}
                  </small>
                )}
                {item.note && <p className="om-item-note">{item.note}</p>}
              </div>
              <strong>{money(item.price * item.quantity)}</strong>
            </article>
          ))}
        </div>
      </section>
      <section className="om-drawer-section">
        <h3>Thanh toán</h3>
        <div className="om-payment-meta">
          <div>
            <small>Voucher</small>
            <b>{row.voucherCode || "Không dùng"}</b>
          </div>
          <div>
            <small>Phương thức</small>
            <b>
              {row.payment?.method
                ? getPaymentMethodLabel(row.payment.method)
                : "Chưa cập nhật"}
            </b>
          </div>
        </div>
        <dl className="om-totals">
          <div>
            <dt>Tạm tính</dt>
            <dd>{money(subtotal)}</dd>
          </div>
          {(row.payment?.shippingFee ?? row.shippingFee) > 0 && (
            <div>
              <dt>Phí giao hàng</dt>
              <dd>{money(row.payment?.shippingFee ?? row.shippingFee)}</dd>
            </div>
          )}
          {(row.payment?.discount ?? row.discount) > 0 && (
            <div>
              <dt>Giảm giá</dt>
              <dd>−{money(row.payment?.discount ?? row.discount)}</dd>
            </div>
          )}
          <div className="om-grand-total">
            <dt>Tổng tiền</dt>
            <dd>{money(row.totalAmount)}</dd>
          </div>
        </dl>
      </section>
      <section className="om-drawer-section">
        <h3>Ghi chú đơn hàng</h3>
        <p className="om-order-note">{row.note || "Không có ghi chú"}</p>
      </section>
      <section className="om-drawer-section">
        <h3>Timeline đơn hàng</h3>
        <ol className="om-timeline">
          {timeline.map((event, i) => (
            <li
              className={
                event.status === "cancelled" ? "is-cancelled" : "is-done"
              }
              key={i}
            >
              <span className="om-timeline-dot" aria-hidden="true" />
              <div>
                <strong>
                  {event.label || labels[event.status] || event.status}
                </strong>
                <time dateTime={event.at}>
                  {orderDateTime(event.at).time}
                  <span>{orderDateTime(event.at).date}</span>
                </time>
              </div>
            </li>
          ))}
          {upcoming.map((state) => (
            <li className="is-next" key={state}>
              <span className="om-timeline-dot" aria-hidden="true" />
              <div>
                <strong>{labels[state]}</strong>
                <small>Chưa thực hiện</small>
              </div>
            </li>
          ))}
        </ol>
      </section>
      {row.deliveryType === "dinein" && allowed.includes("completed") && (
        <label className="om-customer-left">
          <input
            type="checkbox"
            disabled={busy}
            checked={left}
            onChange={(e) => setLeft(e.target.checked)}
          />
          <span>
            Khách đã rời bàn<small>Chuyển bàn sang đang dọn khi hoàn tất</small>
          </span>
        </label>
      )}
      {confirmCancel && (
        <section className="om-drawer-cancel" role="alert">
          <p>Bạn có chắc muốn hủy đơn này?</p>
          <button disabled={busy} onClick={() => setConfirmCancel(false)}>
            Quay lại
          </button>
          <button
            className="danger"
            disabled={busy}
            onClick={() => {
              onStatus("cancelled", left, table);
              setConfirmCancel(false);
            }}
          >
            Hủy đơn
          </button>
        </section>
      )}
      <footer className="om-drawer-actions">
        {allowed.map((state) => (
          <button
            disabled={
              busy ||
              (row.deliveryType === "dinein" &&
                !row.tableId &&
                !table &&
                state !== "cancelled")
            }
            className={state === "cancelled" ? "om-danger-action" : "primary"}
            key={state}
            onClick={() => update(state)}
          >
            {orderActionLabels[state] || labels[state]}
          </button>
        ))}
        {["completed", "delivered"].includes(row.state) && (
          <button onClick={() => printOrderInvoice(row)}>
            <AdminIcon name="printer" />
            In hóa đơn
          </button>
        )}
        {!allowed.length && !["completed", "delivered"].includes(row.state) && (
          <span className="om-closed-order">Đơn hàng đã kết thúc</span>
        )}
      </footer>
    </div>
  );
}
