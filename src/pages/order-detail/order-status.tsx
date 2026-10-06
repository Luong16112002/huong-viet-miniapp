import { OrderIcon } from "./order-icon";
import { useNavigate } from "react-router-dom";
import hero from "@/static/order-detail-serving-v1.webp";
import { orderSteps, detailDate, type DetailOrder } from "./order-detail-model";
export function OrderDetailHeader({ order }: { order?: DetailOrder }) {
  const nav = useNavigate();
  return (
    <header className="od-hero">
      <img
        src={hero}
        alt="Khay món Việt nóng hổi tại quầy phục vụ Hương Việt"
      />
      <div>
        <nav>
          <button aria-label="Quay lại đơn hàng" onClick={() => nav("/order")}>
            ←
          </button>
          <span className="od-nav-spacer" />
          <button aria-label="Thông báo" onClick={() => nav("/notifications")}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 8a6 6 0 0 0-12 0c0 6-3 7-3 9h18c0-2-3-3-3-9M10 21h4"
                stroke="currentColor"
                strokeWidth="1.7"
              />
            </svg>
          </button>
        </nav>
        <div className="od-brand">NHÀ HÀNG HƯƠNG VIỆT</div>
        <h1>Chi tiết đơn hàng</h1>
        <p className="od-hero-meta">
          {order ? <><span>#{order.orderCode || order.id}</span><span>{order.deliveryTypeLabel}</span></> : "Theo dõi bữa ngon của bạn"}
        </p>
      </div>
    </header>
  );
}
export function OrderStatusBadge({ order }: { order: DetailOrder }) {
  const label =
    order.state === "cancelled"
      ? "Đã hủy"
      : orderSteps(order).find((s) => s.active)?.title || order.stateLabel;
  return (
    <span
      className={
        "od-badge " +
        (order.state === "cancelled"
          ? "cancelled"
          : order.state === "pending"
            ? "pending"
            : "")
      }
      role="status"
    >
      {label}
    </span>
  );
}
export function OrderTimeline({ order }: { order: DetailOrder }) {
  return (
    <ol className="od-timeline">
      {orderSteps(order).map((s) => (
        <li
          key={s.key}
          className={[s.active ? "active" : "", s.done ? "done" : ""].join(" ")}
          aria-current={s.active ? "step" : undefined}
        >
          <span className="od-dot">{s.done ? "✓" : ""}</span>
          <div>
            <strong>{s.title}</strong>
            <p>{s.description}</p>
            {s.time && <time dateTime={s.time}>{detailDate(s.time)}</time>}
          </div>
        </li>
      ))}
    </ol>
  );
}
export function OrderStatusCard({ order }: { order: DetailOrder }) {
  const event = order.timeline?.find((t) => t.status === "cancelled");
  return (
    <section className="od-card">
      <div className="od-heading">
        <h2>TRẠNG THÁI ĐƠN HÀNG</h2>
        <OrderStatusBadge order={order} />
      </div>
      {order.state === "cancelled" ? (
        <div className="od-cancel">
          <strong>Đơn hàng đã bị hủy</strong>
          <p>
            Lý do:{" "}
            {order.cancelReason || event?.label || "Chưa ghi nhận lý do hủy"}
          </p>
          {(order.cancelledAt || event?.at) && (
            <time>{detailDate(order.cancelledAt || event?.at)}</time>
          )}
        </div>
      ) : (
        <OrderTimeline order={order} />
      )}
    </section>
  );
}
export function OrderActionBar({
  onAI,
  onReorder,
  cancelled,
  busy,
}: {
  onAI: () => void;
  onReorder: () => void;
  cancelled: boolean;
  busy: boolean;
}) {
  const nav = useNavigate();
  return (
    <footer className="od-actions">
      <button
        disabled={busy}
        onClick={cancelled ? onReorder : () => nav("/menu")}
      >
        <OrderIcon name="cart" />
        {busy ? "Đang đặt lại…" : cancelled ? "Đặt lại đơn" : "Đặt thêm món"}
      </button>
      <button onClick={onAI}>
        <OrderIcon name="sparkle" /> Hỏi AI Chef
      </button>
    </footer>
  );
}
