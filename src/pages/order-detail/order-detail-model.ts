import type { Order } from "@/types/order.types";
export type DetailOrder = Order & {
  timeline?: { at: string; status: string; label?: string }[];
  cancelReason?: string;
  cancelledAt?: string;
};
export function orderSteps(order: DetailOrder) {
  const type = String(order.deliveryType);
  const titles = [
    "Chờ xác nhận",
    "Đã xác nhận",
    "Đang chuẩn bị",
    type === "delivery"
      ? "Đang giao"
      : ["dinein", "dine_in"].includes(type)
        ? "Đang phục vụ"
        : "Sẵn sàng nhận",
    "Hoàn tất",
  ];
  const keys = [
    "pending",
    "confirmed",
    "preparing",
    type === "delivery"
      ? "delivering"
      : ["dinein", "dine_in"].includes(type)
        ? "serving"
        : "ready",
    "completed",
  ];
  const index =
    (
      {
        pending: 0,
        confirmed: 1,
        preparing: 2,
        ready: 3,
        delivering: 3,
        serving: 3,
        delivered: 4,
        completed: 4,
      } as Record<string, number>
    )[order.state] ?? -1;
  return keys.map((key, i) => ({
    key,
    title: titles[i],
    description: [
      "Yêu cầu đặt món đã được ghi nhận",
      "Nhà hàng đã tiếp nhận yêu cầu",
      "Bếp đang chuẩn bị các món ăn",
      type === "delivery"
        ? "Món ăn đang trên đường đến bạn"
        : type === "pickup"
          ? "Bạn có thể đến nhận món"
          : "Món ăn được phục vụ tại bàn",
      "Đã nhận món",
    ][i],
    done: i < index || index === 4,
    active: i === index,
    time:
      order.timeline?.find(
        (t) => t.status === key || (i === 4 && t.status === "delivered"),
      )?.at || (i === 0 ? String(order.createdAt) : null),
  }));
}
export function detailDate(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
}
