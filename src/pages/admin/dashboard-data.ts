import { areas, labels, Row } from "./admin-api";
export const dashboardDay = (value: string | number | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(
        date,
      )
    : "";
};
export function dashboardData(
  orders: Row[],
  bookings: Row[],
  tables: Row[],
  now = Date.now(),
) {
  const today = dashboardDay(now),
    daily = orders.filter((o) => dashboardDay(o.createdAt) === today),
    completed = daily.filter((o) => o.state === "completed");
  const revenue = Array.from({ length: 7 }, (_, i) => {
    const day = dashboardDay(now - (6 - i) * 86400000);
    return {
      day,
      value: orders
        .filter(
          (o) => o.state === "completed" && dashboardDay(o.createdAt) === day,
        )
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
    };
  });
  const stateColors: Record<string, string> = {
    pending: "#E6A846",
    confirmed: "#7FA6CD",
    preparing: "#DC9362",
    ready: "#9382BD",
    serving: "#609C91",
    delivering: "#5D8CAB",
    completed: "#0B5A3C",
    cancelled: "#D95E52",
  };
  const states = Object.entries(stateColors).map(([state, color]) => ({
    state,
    color,
    label: labels[state],
    count: orders.filter((o) => o.state === state).length,
  }));
  const other = orders.filter((o) => !stateColors[o.state]).length;
  if (other)
    states.push({
      state: "other",
      color: "#9DA99F",
      label: "Trạng thái khác",
      count: other,
    });
  const hours = Array.from({ length: 12 }, (_, i) => ({
    hour: i + 10,
    value: bookings.filter(
      (b) =>
        Number(b.time?.split(":")[0]) === i + 10 &&
        !["cancelled", "rejected"].includes(b.status),
    ).length,
  }));
  const areaKeys = [
    ...new Set([
      ...Object.keys(areas),
      ...tables.map((t) => t.area).filter(Boolean),
    ]),
  ];
  const areaRows = areaKeys.map((area) => {
    const active = tables.filter(
      (t) => t.area === area && t.active !== false && t.status !== "DISABLED",
    );
    return {
      area,
      label: areas[area] || area,
      total: active.length,
      available: active.filter((t) => t.status === "AVAILABLE").length,
      occupied: active.filter((t) => t.status === "OCCUPIED").length,
    };
  });
  const foods = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();
  for (const o of completed)
    for (const item of o.items || []) {
      const key = String(item.productId ?? item.name),
        row = foods.get(key) || {
          name: item.name || "Món ăn",
          quantity: 0,
          revenue: 0,
        };
      row.quantity += Number(item.quantity) || 0;
      row.revenue += (Number(item.quantity) || 0) * (Number(item.price) || 0);
      foods.set(key, row);
    }
  const activities: {
    id: string;
    at: string;
    label: string;
    detail: string;
    row: Row;
    kind: string;
  }[] = [];
  for (const row of [...orders, ...bookings]) {
    const booking = !row.orderCode,
      kind = booking ? "calendar" : "bag",
      code = row.orderCode || row.code || row.id;
    const timeline = row.timeline?.length
      ? row.timeline
      : row.createdAt
        ? [
            {
              at: row.createdAt,
              label: booking
                ? `Khách đặt bàn ${row.guests} người`
                : "Khách gửi đơn hàng",
            },
          ]
        : [];
    timeline.forEach((event: Row, i: number) => {
      if (!Number.isFinite(Date.parse(event.at))) return;
      activities.push({
        id: kind + row.id + "-" + i,
        at: event.at,
        label: event.label || labels[event.status] || "Cập nhật yêu cầu",
        detail:
          code +
          " · " +
          (booking
            ? `${row.guests} khách`
            : row.customerName ||
              row.deliveryAddress?.recipientName ||
              "Khách tại quầy"),
        row,
        kind,
      });
    });
    if (
      !booking &&
      row.voucherCode &&
      row.state !== "cancelled" &&
      Number.isFinite(Date.parse(row.createdAt))
    )
      activities.push({
        id: "voucher-" + row.id,
        at: row.createdAt,
        label: "Đơn áp dụng voucher " + row.voucherCode,
        detail: code,
        row,
        kind: "ticket",
      });
  }
  const recent = (rows: Row[], limit: number) =>
    [...rows]
      .sort(
        (a, b) =>
          (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
      )
      .slice(0, limit);
  return {
    today,
    daily,
    completed,
    revenue,
    states,
    hours,
    areaRows,
    topFoods: [...foods.values()]
      .sort(
        (a, b) =>
          b.quantity - a.quantity ||
          b.revenue - a.revenue ||
          a.name.localeCompare(b.name),
      )
      .slice(0, 3),
    activities: activities
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 6),
    recentOrders: recent(orders, 8),
    recentBookings: recent(bookings, 5),
  };
}
