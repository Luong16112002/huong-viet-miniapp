import { useEffect, useRef } from "react";
import { Reservation } from "@/types/reservation.types";
import { reservationAreas } from "@/utils/reservation";
import { StatusBadge } from "./history-cards";
export function BookingDetails({
  booking,
  close,
}: {
  booking: Reservation | null;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (booking) dialog.current?.showModal();
    else dialog.current?.close();
  }, [booking]);
  return (
    <dialog
      ref={dialog}
      className="oh-dialog oh-booking-dialog"
      aria-labelledby="oh-booking-title"
      onCancel={close}
    >
      {booking && (
        <>
          <h2 id="oh-booking-title">Chi tiết đặt bàn</h2>
          <p>#{booking.code || booking.id}</p>
          <StatusBadge status={booking.status} />
          <dl>
            {[
              ["Họ tên", booking.name],
              ["Số điện thoại", booking.phone],
              [
                "Ngày giờ",
                `${booking.date.split("-").reverse().join("/")} · ${booking.time}`,
              ],
              ["Số khách", `${booking.guests} khách`],
              ["Bàn được xếp", booking.tableId || "Đang chờ xếp bàn"],
              [
                "Không gian",
                reservationAreas.find((a) => a.id === booking.area)?.name ||
                  "Trong nhà",
              ],
              ["Ghi chú", booking.note || "Không có yêu cầu thêm"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <button className="oh-primary" onClick={close}>
            Đóng chi tiết
          </button>
        </>
      )}
    </dialog>
  );
}
