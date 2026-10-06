import { Reservation, ReservationArea } from "@/types/reservation.types";

export const reservationAreas: { id: ReservationArea; name: string; description: string; symbol: string }[] = [
  { id: "floor1", name: "Tầng 1", description: "Không gian tầng 1", symbol: "⌂" },
  { id: "floor2", name: "Tầng 2", description: "Không gian tầng 2", symbol: "⌂" },
  { id: "indoor", name: "Trong nhà", description: "Ấm cúng, thoải mái bên người thân", symbol: "⌂" },
  { id: "garden", name: "Sân vườn", description: "Thoáng đãng, gần gũi thiên nhiên", symbol: "❧" },
  { id: "private", name: "Phòng riêng", description: "Riêng tư cho những dịp đặc biệt", symbol: "◇" },
];
export const reservationTimes = Array.from({ length: 23 }, (_, i) => {
  const minutes = 10 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});
export function restaurantToday(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function reservationDateLabel(date: string) {
  return new Date(`${date}T12:00:00+07:00`).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short", day: "2-digit", month: "2-digit" });
}
export function canReserveTime(date: string, time: string, now = new Date()) {
  const today = restaurantToday(now);
  return date >= today && date <= addDays(today, 30) && reservationTimes.includes(time) &&
    new Date(`${date}T${time}:00+07:00`).getTime() >= now.getTime() + 30 * 60_000;
}
export function normalizeReservationPhone(phone: string) {
  return phone.replace(/[\s().-]/g, "").replace(/^(\+84|84)/, "0");
}
export type ReservationDraft = Omit<Reservation, "id" | "createdAt" | "code">;
export function validateReservation(draft: ReservationDraft, now = new Date()) {
  const errors: Record<string, string> = {};
  if (!canReserveTime(draft.date, draft.time, now)) errors.time = "Chọn giờ đến cách hiện tại ít nhất 30 phút và trong 30 ngày tới.";
  if (!Number.isInteger(draft.guests) || draft.guests < 1 || draft.guests > 20) errors.guests = "Số khách phải từ 1 đến 20 người.";
  if (!reservationAreas.some(area => area.id === draft.area)) errors.area = "Vui lòng chọn không gian mong muốn.";
  if (draft.name.trim().length < 2 || draft.name.trim().length > 80) errors.name = "Nhập họ tên từ 2 đến 80 ký tự.";
  if (!/^0[35789]\d{8}$/.test(normalizeReservationPhone(draft.phone))) errors.phone = "Nhập số điện thoại di động hợp lệ (10 chữ số hoặc dùng mã quốc gia +84).";
  if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = "Địa chỉ email chưa đúng định dạng.";
  if ((draft.note || "").length > 500) errors.note = "Lời nhắn tối đa 500 ký tự.";
  return errors;
}
