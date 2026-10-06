import { OrderIcon } from "./order-icon";
import restaurantImage from "@/static/order-dining-v1.webp";
import { useNavigate } from "react-router-dom";
import { useHome } from "@/services/home/home.queries";
import { getPaymentMethodLabel } from "@/utils/order";
import { detailDate, orderSteps, type DetailOrder } from "./order-detail-model";
import { CheckoutIcon } from "../checkout/checkout-layout";
export function OrderProgressStepper({ order }: { order: DetailOrder }) {
  const labels = [
    "Nhận đơn",
    "Xác nhận",
    "Chuẩn bị",
    order.deliveryType === "delivery"
      ? "Đang giao"
      : order.deliveryType === "pickup"
        ? "Sẵn sàng"
        : "Phục vụ",
    "Hoàn tất",
  ];
  return (
    <ol className="op-progress" aria-label="Tiến trình đơn hàng">
      {orderSteps(order).map((s, i) => (
        <li
          key={s.key}
          className={s.active ? "active" : s.done ? "done" : ""}
          aria-current={s.active ? "step" : undefined}
        >
          <span>{s.done ? "✓" : s.active ? "●" : ""}</span>
          <b>{labels[i]}</b>
        </li>
      ))}
    </ol>
  );
}
export function OrderStatusSummary({ order }: { order: DetailOrder }) {
  const steps = orderSteps(order),
    step = steps.find((s) => s.active),
    cancel = order.state === "cancelled";
  const event = order.timeline?.find((s) => s.status === "cancelled");
  return (
    <>
      <section className="op-status" data-state={order.state} aria-label="Trạng thái đơn hàng">
        <div className="op-status-top">
          <span className={"op-status-icon " + (cancel ? "cancelled" : "")}>
            <OrderIcon
              name={
                cancel
                  ? "receipt"
                  : order.state === "completed"
                    ? "receipt"
                    : "clock"
              }
            />
          </span>
          <div>
            <strong>
              {cancel ? "Đơn hàng đã hủy" : step?.title || order.stateLabel}
            </strong>
            <p>
              {cancel
                ? order.cancelReason ||
                  event?.label ||
                  "Chưa ghi nhận lý do hủy"
                : step?.description}
            </p>
            <time>
              {detailDate(cancel ? order.cancelledAt || event?.at : step?.time)}
            </time>
          </div>
        </div>
      </section>
      {!cancel && <OrderProgressStepper order={order} />}
    </>
  );
}
export function OrderQuickInfoGrid({ order: o }: { order: DetailOrder }) {
  const info = [
    ["receipt", "Mã đơn hàng", "#" + (o.orderCode || o.id)],
    ["clock", "Thời gian đặt", detailDate(o.createdAt)],
    [
      "card",
      "Thanh toán",
      o.payment ? getPaymentMethodLabel(o.payment.method) : "Chưa cập nhật",
    ],
    [o.deliveryType, "Nhận món", o.deliveryTypeLabel],
  ];
  return (
    <section className="op-grid" aria-label="Thông tin nhanh">
      {info.map(([icon, label, value]) => (
        <div key={label}>
          <span>
            {["receipt", "clock", "card"].includes(icon) ? (
              <OrderIcon name={icon} />
            ) : (
              <CheckoutIcon name={icon} />
            )}
          </span>
          <div>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        </div>
      ))}
    </section>
  );
}
export function PickupLocationCard({ order: o }: { order: DetailOrder }) {
  const { data } = useHome();
  const pickup = o.deliveryType === "pickup",
    delivery = o.deliveryType === "delivery";
  const address = delivery
    ? o.deliveryAddress?.address
    : o.pickupStore?.address || data?.restaurant.address;
  return (
    <section className="od-card op-location">
      <h2 className="op-section-title">
        <CheckoutIcon
          name={delivery ? "delivery" : pickup ? "pickup" : "dinein"}
        />
        {delivery
          ? "Giao món đến"
          : pickup
            ? "Nhận món tại"
            : "Phục vụ tại bàn"}
      </h2>
      <div className="op-location-body">
        {!delivery && (
          <img src={restaurantImage} alt="Không gian ẩm thực Hương Việt" />
        )}
        <div>
          <strong>
            {delivery
              ? o.deliveryAddress?.recipientName || "Người nhận"
              : pickup
                ? o.pickupStore?.name ||
                  data?.restaurant.name ||
                  "Nhà hàng Hương Việt"
                : "Bàn " + (o.tableNumber || "Chờ xác nhận")}
          </strong>
          {address && (pickup || delivery) && <p>{address}</p>}
          {pickup && data?.restaurant.openHours && (
            <small className="op-hours">
              Giờ mở cửa · {data.restaurant.openHours}
            </small>
          )}
          {address && (pickup || delivery) && (
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={
                "https://www.google.com/maps/search/?api=1&query=" +
                encodeURIComponent(address)
              }
            >
              <OrderIcon name="map" /> Xem bản đồ
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
export function OrderSupportCard({ onAI }: { onAI: () => void }) {
  const nav = useNavigate();
  return (
    <section className="od-card op-support">
      <h2 className="op-section-title">
        <OrderIcon name="support" />
        Cần hỗ trợ?
      </h2>
      {[
        ["phone", "Liên hệ nhà hàng", () => nav("/profile/support")],
        ["receipt", "Xem chính sách", () => nav("/profile/faq")],
        ["sparkle", "Hỏi AI Chef về đơn này", onAI],
      ].map(([icon, label, action]) => (
        <button key={String(label)} onClick={action as () => void}>
          <span>
            <OrderIcon name={String(icon)} />
          </span>
          {label as string}
          <b>›</b>
        </button>
      ))}
    </section>
  );
}
