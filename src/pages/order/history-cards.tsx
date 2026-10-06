import { HistoryIcon } from "./history-icon";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Order } from "@/types/order.types";
import { Reservation } from "@/types/reservation.types";
import { HistoryEntry, isUpcomingReservation } from "@/utils/order-history";
import { reservationAreas, reservationDateLabel } from "@/utils/reservation";
import { formatCurrency } from "@/utils/format";
import { menuImages } from "@/services/product/menu-images";

export const statusLabels: Record<string, string> = {
  checked_in: "Đã check-in",
  rejected: "Đã từ chối",
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  ready: "Sẵn sàng nhận",
  delivering: "Đang giao",
  serving: "Đang phục vụ",
  arrived: "Đã đến",
  delivered: "Hoàn tất",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  noShow: "Không đến",
};
export type HistoryAction = {
  kind: "cancel-order" | "cancel-reservation" | "pickup" | "reorder";
  id: string;
  code: string;
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`oh-badge ${status}`}>
      <i />
      {statusLabels[status] || status}
    </span>
  );
}
function Thumbnail({ order }: { order: Order }) {
  const [failed, setFailed] = useState(false);
  const item = order.items[0];
  const src = item?.imageUrl || item?.image || menuImages[item?.productId || 0];
  return (
    <div className="oh-thumb">
      {src && !failed ? (
        <img
          src={src}
          alt={item?.name || "Món ăn"}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">♨</span>
      )}
    </div>
  );
}
export function OrderCard({
  order,
  ask,
}: {
  order: Order;
  ask: (action: HistoryAction) => void;
}) {
  const code = order.orderCode || order.id;
  const first = order.items[0];
  return (
    <article className="oh-card food">
      <div className="oh-card-heading">
        <div>
          <span className="oh-kind">
            <HistoryIcon name="food" />
          </span>
          <div>
            <h3>Đơn món ăn</h3>
            <small>#{code}</small>
          </div>
        </div>
        <StatusBadge status={order.state} />
      </div>
      <div className="oh-card-body">
        <Thumbnail order={order} />
        <div className="oh-item">
          <strong>{first?.name || "Đơn món ăn"}</strong>
          <p>Số lượng: {first?.quantity || 0}</p>
          {order.items.length > 1 && (
            <small>+{order.items.length - 1} món khác</small>
          )}
        </div>
        <strong className="oh-price">
          {formatCurrency(order.totalAmount)}₫
        </strong>
      </div>
      <p className="oh-meta">
        {order.deliveryTypeLabel ||
          (order.deliveryType === "pickup"
            ? "Nhận tại quầy"
            : "Giao hàng")}{" "}
        ·{" "}
        {new Date(order.createdAt).toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          dateStyle: "short",
          timeStyle: "short",
        })}
      </p>
      <div className="oh-actions">
        {order.canCancel && ["pending", "confirmed"].includes(order.state) && (
          <button
            className="oh-cancel"
            onClick={() => ask({ kind: "cancel-order", id: order.id, code })}
          >
            Hủy đơn
          </button>
        )}
        {order.canPickup && order.state === "ready" && (
          <button onClick={() => ask({ kind: "pickup", id: order.id, code })}>
            Đã nhận món
          </button>
        )}
        {order.canReorder && (
          <button onClick={() => ask({ kind: "reorder", id: order.id, code })}>
            Đặt lại
          </button>
        )}
        <Link
          className="oh-primary"
          to={`/order/${encodeURIComponent(order.id)}`}
        >
          Xem đơn hàng →
        </Link>
      </div>
    </article>
  );
}
export function BookingCard({
  booking,
  ask,
  details,
  now,
}: {
  booking: Reservation;
  ask: (action: HistoryAction) => void;
  details: (booking: Reservation) => void;
  now: number;
}) {
  const code = booking.code || booking.id;
  return (
    <article className="oh-card booking">
      <div className="oh-card-heading">
        <div>
          <span className="oh-kind">
            <HistoryIcon name="calendar" />
          </span>
          <div>
            <h3>Đặt bàn</h3>
            <small>#{code}</small>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <div className="oh-booking-info">
        <span aria-hidden="true">
          <HistoryIcon name="calendar" />
        </span>
        <div>
          <strong>
            {reservationDateLabel(booking.date)} · {booking.time}
          </strong>
          <p>
            {booking.guests} khách <span>·</span>{" "}
            {reservationAreas.find((a) => a.id === booking.area)?.name ||
              "Trong nhà"}
          </p>
          <small>{booking.name}</small>
        </div>
      </div>
      <div className="oh-actions">
        {isUpcomingReservation(booking, now) && (
          <button
            className="oh-cancel"
            onClick={() =>
              ask({ kind: "cancel-reservation", id: booking.id, code })
            }
          >
            Hủy lịch
          </button>
        )}
        <Link to="/reservation" state={{ rebook: booking }}>
          Đặt lại bàn
        </Link>
        <button className="oh-primary" onClick={() => details(booking)}>
          Xem chi tiết →
        </button>
      </div>
    </article>
  );
}
export function OrderHistorySection({
  entries,
  ask,
  details,
  now,
}: {
  entries: HistoryEntry[];
  ask: (action: HistoryAction) => void;
  details: (booking: Reservation) => void;
  now: number;
}) {
  return (
    <div className="oh-list">
      {entries.map((entry) =>
        entry.kind === "order" ? (
          <OrderCard
            key={`o-${entry.value.id}`}
            order={entry.value}
            ask={ask}
          />
        ) : (
          <BookingCard
            key={`b-${entry.value.id}`}
            booking={entry.value}
            ask={ask}
            details={details}
            now={now}
          />
        ),
      )}
    </div>
  );
}
