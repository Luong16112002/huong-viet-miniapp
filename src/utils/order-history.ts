import { Order } from "@/types/order.types";
import { Reservation } from "@/types/reservation.types";
export const historyTabs = ["all", "food", "ongoing", "reservation", "completed", "cancelled"] as const;
export type HistoryTab = typeof historyTabs[number];
export type HistoryEntry = { kind: "order"; value: Order } | { kind: "reservation"; value: Reservation };
export const isUpcomingReservation = (item: Reservation, now = Date.now()) => ["pending", "confirmed"].includes(item.status) && new Date(`${item.date}T${item.time}:00+07:00`).getTime() > now;
export const isOngoingOrder = (item: Order) => !["completed", "delivered", "cancelled"].includes(item.state);
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
export function filterHistory(entries: HistoryEntry[], tab: HistoryTab, query: string, upcomingOnly: boolean, sort: string, now = Date.now()) {
  return entries.filter(entry => {
    const reservation = entry.kind === "reservation";
    const state = reservation ? entry.value.status : entry.value.state;
    if (tab === "reservation" && !reservation) return false;
    if (tab === "food" && reservation) return false;
    if (upcomingOnly && (!reservation || !isUpcomingReservation(entry.value, now))) return false;
    if (tab === "ongoing" && !(reservation ? isUpcomingReservation(entry.value, now) : isOngoingOrder(entry.value))) return false;
    if (tab === "completed" && !["completed", "delivered"].includes(state)) return false;
    if (tab === "cancelled" && state !== "cancelled") return false;
    const text = reservation ? `${entry.value.code} ${entry.value.id} ${entry.value.name} ${entry.value.phone} ${entry.value.date} ${entry.value.time} đặt bàn` : `${entry.value.orderCode} ${entry.value.id} ${entry.value.deliveryAddress?.recipientName || ""} ${entry.value.items.map(item => item.name).join(" ")} đơn hàng`;
    return normalize(text).includes(normalize(query.trim()));
  }).sort((a, b) => {
    if (sort === "price-high" || sort === "price-low") {
      if (a.kind !== b.kind) return a.kind === "order" ? -1 : 1;
      if (a.kind === "order" && b.kind === "order") return sort === "price-high" ? b.value.totalAmount - a.value.totalAmount : a.value.totalAmount - b.value.totalAmount;
    }
    const timestamp = (item: HistoryEntry) => new Date(sort === "appointment" && item.kind === "reservation" ? `${item.value.date}T${item.value.time}:00+07:00` : item.value.createdAt || 0).getTime() || 0;
    return sort === "oldest" || sort === "appointment" ? timestamp(a) - timestamp(b) : timestamp(b) - timestamp(a);
  });
}
