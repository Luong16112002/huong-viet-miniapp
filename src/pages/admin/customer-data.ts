import { Row } from "./admin-api";

export type Customer = {
  phone: string;
  name: string;
  email: string;
  zaloLinked: boolean;
  orders: Row[];
  bookings: Row[];
  total: number;
  first: string;
  last: string;
};
export const customerDay = (value: string | number | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date)
    : "";
};
export function customerDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return ["—", ""];
  return [
    date.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    date.toLocaleTimeString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
    }),
  ];
}
export const customerTier = (c: Customer) =>
  c.orders.length >= 10
    ? "VIP"
    : c.orders.length >= 5
      ? "Khách thân thiết"
      : c.orders.length
        ? "Khách thường"
        : "Khách mới";
export function collectCustomers(orders: Row[], bookings: Row[]): Customer[] {
  const customers = new Map<string, Customer>();
  for (const r of [...orders, ...bookings]) {
    const phone = r.phone || r.deliveryAddress?.phoneNumber;
    if (!phone) continue;
    const c = customers.get(phone) || {
      phone,
      name:
        r.customerName ||
        r.name ||
        r.deliveryAddress?.recipientName ||
        "Khách hàng",
      email: "",
      zaloLinked: false,
      orders: [],
      bookings: [],
      total: 0,
      first: r.createdAt || "",
      last: r.createdAt || "",
    };
    if (r.orderCode) {
      c.orders.push(r);
      if (r.state === "completed") c.total += Number(r.totalAmount) || 0;
    } else c.bookings.push(r);
    c.email ||= r.email || r.deliveryAddress?.email || "";
    c.zaloLinked ||= Boolean(r.zaloId || r.zaloUserId);
    if (
      r.createdAt &&
      (!c.last || new Date(r.createdAt).getTime() > new Date(c.last).getTime())
    )
      c.last = r.createdAt;
    if (
      r.createdAt &&
      (!c.first ||
        new Date(r.createdAt).getTime() < new Date(c.first).getTime())
    )
      c.first = r.createdAt;
    customers.set(phone, c);
  }
  return [...customers.values()];
}
