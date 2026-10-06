import { Row } from "./admin-api";
export type PromoState =
  "active" | "soon" | "expired" | "disabled" | "scheduled";
export const promoLabels: Record<PromoState, string> = {
  active: "Đang bật",
  soon: "Sắp hết hạn",
  expired: "Hết hạn",
  disabled: "Đã tắt",
  scheduled: "Chưa bắt đầu",
};
export function promoState(row: Row, now = Date.now()): PromoState {
  if (row.enabled !== true) return "disabled";
  const end = Date.parse(row.expiresAt),
    start = Date.parse(row.startsAt);
  if (Number.isFinite(end) && end <= now) return "expired";
  if (Number.isFinite(start) && start > now) return "scheduled";
  return Number.isFinite(end) && end - now < 3 * 86400000 ? "soon" : "active";
}
export const promoDay = (value?: string) => {
  const date = new Date(value || "");
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date)
    : "";
};
export const promoDate = (value?: string) => {
  const day = promoDay(value);
  return day ? day.split("-").reverse().join("/") : "Không giới hạn";
};
export const promoOrders = (row: Row, orders: Row[]) =>
  orders.filter((o) => o.voucherCode === row.code && o.state !== "cancelled");
export const promoUsage = (row: Row, orders: Row[]) =>
  Number.isFinite(Number(row.usage)) && row.usage != null
    ? Number(row.usage)
    : promoOrders(row, orders).length;
export function promoPerformance(row: Row, orders: Row[]) {
  const completed = promoOrders(row, orders).filter(
    (o) => o.state === "completed",
  );
  const revenue = completed.reduce(
    (sum, o) => sum + (Number(o.totalAmount) || 0),
    0,
  );
  return {
    completed,
    revenue,
    discount: completed.reduce(
      (sum, o) => sum + (Number(o.payment?.discount) || 0),
      0,
    ),
    average: completed.length ? Math.round(revenue / completed.length) : 0,
  };
}
export function promoPayload(row: Row) {
  return {
    code: String(row.code).trim().toUpperCase(),
    name: String(row.name).trim(),
    amount: Number(row.amount),
    minSubtotal: Number(row.minSubtotal),
    enabled: row.enabled === true,
    expiresAt: row.expiresAt,
    startsAt: row.startsAt || null,
  };
}
