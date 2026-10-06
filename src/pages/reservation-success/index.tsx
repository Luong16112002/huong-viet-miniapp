import { notificationText } from "@/services/commerce.api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useReservationStore } from "@/stores/reservation.store";
import { reservationAreas, reservationDateLabel } from "@/utils/reservation";
import "../reservation/reservation.css";
import "./success.css";

export default function ReservationSuccessPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reservation = useReservationStore(state => params.get("id") ? state.reservations.find(item => item.id === params.get("id")) : state.current);
  if (!reservation) return <div className="reservation-page booking-success-page"><div className="booking-success"><div className="booking-success-mark">⌂</div><h1>Chưa có yêu cầu đặt bàn</h1><p>Chọn một lịch hẹn để bắt đầu bữa ngon cùng Hương Việt.</p><button className="booking-primary" style={{ width: "100%" }} onClick={() => navigate("/reservation")}>Đặt bàn ngay</button></div></div>;
  const rows = [["Ngày đến", reservationDateLabel(reservation.date)], ["Giờ đến", `${reservation.time} · Giờ Việt Nam`], ["Số khách", `${reservation.guests} người`], ["Không gian", reservationAreas.find(area => area.id === reservation.area)?.name || "Trong nhà"], ["Người đặt", reservation.name], ["Điện thoại", reservation.phone], ...(reservation.email ? [["Email", reservation.email]] : [])];
  const statuses = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", cancelled: "Đã hủy", completed: "Đã hoàn tất", noShow: "Không đến" };
  return <div className="reservation-page booking-success-page"><main className="booking-success"><div className="booking-success-mark" aria-hidden="true">✓</div><span className="booking-eyebrow">HƯƠNG VIỆT · LỊCH HẸN</span><h1>Đã lưu yêu cầu đặt bàn</h1><p>Bạn có thể xem lại yêu cầu trong Lịch đặt bàn.<br />Cảm ơn bạn đã chọn Hương Việt cho bữa hẹn này.</p><article className="booking-ticket"><header className="booking-ticket-header"><div><small>MÃ ĐẶT BÀN</small><strong>{reservation.code}</strong></div><span className="booking-status" data-status={reservation.status}>{statuses[reservation.status]}</span></header><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{reservation.note && <div className="booking-note"><small>LỜI NHẮN</small><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12 }}>{reservation.note}</p></div>}</article>{reservation.status === "pending" && <div className="booking-notice" role="status"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg><span>{notificationText(reservation.notification)}</span></div>}<div className="booking-actions"><button className="booking-secondary" onClick={() => navigate("/")}>Trang chủ</button><button className="booking-primary" onClick={() => navigate("/order?tab=reservation")}>Lịch đặt bàn →</button></div></main></div>;
}
