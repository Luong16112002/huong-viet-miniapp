import { OrderIcon } from "./order-icon";
import { useState } from "react";
import { formatCurrency } from "@/utils/format";
import { getPaymentMethodLabel } from "@/utils/order";
import { menuImages } from "@/services/product/menu-images";
import { detailDate, type DetailOrder } from "./order-detail-model";
export function OrderSummaryCard({ order: o }: { order: DetailOrder }) {
  return (
    <section className="od-card">
      <h2>TÓM TẮT ĐƠN HÀNG</h2>
      <dl>
        {[
          ["Mã đơn hàng", "# " + (o.orderCode || o.id)],
          ["Ngày đặt", detailDate(o.createdAt)],
          [
            "Thanh toán",
            o.payment
              ? getPaymentMethodLabel(o.payment.method)
              : "Chưa cập nhật",
          ],
          ["Số món", o.items.reduce((n, p) => n + p.quantity, 0) + " món"],
          [
            "Hình thức",
            o.deliveryTypeLabel ||
              {
                delivery: "Giao hàng",
                pickup: "Tự đến lấy",
                dinein: "Ăn tại nhà hàng",
              }[o.deliveryType],
          ],
          ...(o.tableNumber ? [["Bàn", o.tableNumber]] : []),
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {o.note && <p className="od-note">Ghi chú: {o.note}</p>}
    </section>
  );
}
function ItemImage({ item }: { item: DetailOrder["items"][number] }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={
        failed
          ? menuImages[item.productId || 4] || menuImages[4]
          : item.imageUrl ||
            item.image ||
            menuImages[item.productId || 4] ||
            menuImages[4]
      }
      alt={item.name}
      onError={() => setFailed(true)}
    />
  );
}
export function OrderedItemsSection({ order }: { order: DetailOrder }) {
  return (
    <section className="od-card">
      <div className="op-items-heading">
        <h2 className="op-section-title">
          <OrderIcon name="food" />
          Món trong đơn
        </h2>
        <span>{order.items.reduce((n, i) => n + i.quantity, 0)} món</span>
      </div>
      {order.items.map((item, i) => (
        <article className="od-item" key={item.id || i}>
          <ItemImage item={item} />
          <div>
            <strong>{item.name}</strong>
            {!!item.options?.length && (
              <p>{item.options.map((o) => o.value).join(" · ")}</p>
            )}
            {item.note && <p className="od-note">Ghi chú: {item.note}</p>}
            <div>
              <b>{formatCurrency(item.price)}₫</b>
              <span>×{item.quantity}</span>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
export function PaymentSummaryCard({ order }: { order: DetailOrder }) {
  const p = order.payment;
  return (
    <section className="od-card">
      <h2 className="op-section-title op-payment-title">
        <OrderIcon name="card" />
        Thanh toán
      </h2>
      <dl>
        <div>
          <dt>Tạm tính</dt>
          <dd>
            {formatCurrency(
              p?.subtotal ??
                order.items.reduce((n, i) => n + i.price * i.quantity, 0),
            )}
            ₫
          </dd>
        </div>
        <div>
          <dt>Phí giao hàng</dt>
          <dd>{formatCurrency(p?.shippingFee ?? 0)}₫</dd>
        </div>
        <div>
          <dt>Giảm giá</dt>
          <dd>−{formatCurrency(p?.discount ?? 0)}₫</dd>
        </div>
      </dl>
      <div className="od-total">
        <div>
          <strong>TỔNG CỘNG</strong>
          <small>(đã bao gồm VAT)</small>
        </div>
        <b>{formatCurrency(p?.total ?? order.totalAmount)}₫</b>
      </div>
    </section>
  );
}
