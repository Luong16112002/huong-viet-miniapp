import { Row } from "./admin-api";
import { dashboardDay } from "./dashboard-data";
export type ReportRange = { from: string; to: string };
export const reportDate = (day: string) => day.split("-").reverse().join("/");
export function reportRange(preset: string, now = Date.now()): ReportRange {
  const to = dashboardDay(now),
    n = preset === "1" ? 1 : preset === "30" ? 30 : 7;
  return {
    from:
      preset === "month"
        ? to.slice(0, 7) + "-01"
        : dashboardDay(now - (n - 1) * 86400000),
    to,
  };
}
export function validReportRange(range: ReportRange) {
  return (
    [range.from, range.to].every(
      (day) =>
        /^\d{4}-\d{2}-\d{2}$/.test(day) &&
        Number.isFinite(Date.parse(day)) &&
        new Date(day + "T00:00:00Z").toISOString().slice(0, 10) === day,
    ) && range.from <= range.to
  );
}
export function reportData(orders: Row[], bookings: Row[], range: ReportRange) {
  const inRange = (day: string) =>
      Boolean(day && day >= range.from && day <= range.to),
    recent = orders.filter((o) => inRange(dashboardDay(o.createdAt))),
    book = bookings.filter((b) => inRange(b.date)),
    completed = recent.filter((o) => o.state === "completed");
  const revenue = completed.reduce(
      (sum, o) => sum + (Number(o.totalAmount) || 0),
      0,
    ),
    cancelled = recent.filter((o) => o.state === "cancelled").length;
  const days: {
    day: string;
    revenue: number;
    completed: number;
    bookings: number;
    orders: number;
    cancelled: number;
  }[] = [];
  const byDay = new Map<string, (typeof days)[number]>();
  for (
    let at = Date.parse(range.from + "T00:00:00Z"),
      end = Date.parse(range.to + "T00:00:00Z");
    at <= end;
    at += 86400000
  ) {
    const day = new Date(at).toISOString().slice(0, 10),
      row = {
        day,
        revenue: 0,
        completed: 0,
        bookings: 0,
        orders: 0,
        cancelled: 0,
      };
    days.push(row);
    byDay.set(day, row);
  }
  for (const o of recent) {
    const row = byDay.get(dashboardDay(o.createdAt));
    if (!row) continue;
    row.orders++;
    if (o.state === "completed") {
      row.completed++;
      row.revenue += Number(o.totalAmount) || 0;
    }
    if (o.state === "cancelled") row.cancelled++;
  }
  for (const b of book) {
    const row = byDay.get(b.date);
    if (row) row.bookings++;
  }
  const group = Math.max(1, Math.ceil(days.length / 31)),
    bars = [];
  for (let i = 0; i < days.length; i += group) {
    const bucket = days.slice(i, i + group),
      first = bucket[0].day,
      last = bucket[bucket.length - 1].day;
    bars.push({
      key:
        first === last
          ? reportDate(first)
          : reportDate(first) + " – " + reportDate(last),
      label: first.slice(8) + "/" + first.slice(5, 7),
      value: bucket.reduce((sum, d) => sum + d.revenue, 0),
    });
  }
  const foods = new Map<
    string,
    {
      name: string;
      quantity: number;
      revenue: number;
      imageUrl: string;
      id?: number;
    }
  >();
  for (const o of completed)
    for (const item of o.items || []) {
      const row = foods.get(item.name) || {
        name: item.name || "Món ăn",
        quantity: 0,
        revenue: 0,
        imageUrl: item.imageUrl || item.image || item.thumbnail || "",
        id: item.productId,
      };
      row.quantity += Number(item.quantity) || 0;
      row.revenue += (Number(item.quantity) || 0) * (Number(item.price) || 0);
      row.imageUrl ||= item.imageUrl || item.image || item.thumbnail || "";
      foods.set(item.name, row);
    }
  const sold = [...foods.values()].sort(
      (a, b) =>
        b.quantity - a.quantity ||
        b.revenue - a.revenue ||
        a.name.localeCompare(b.name),
    ),
    byRevenue = [...sold].sort(
      (a, b) => b.revenue - a.revenue || b.quantity - a.quantity,
    ),
    foodRevenue = sold.reduce((sum, f) => sum + f.revenue, 0);
  const hours = Array.from({ length: 12 }, (_, i) => ({
      key: i + 10 + "h",
      label: i + 10 + "h",
      value: book.filter(
        (b) =>
          Number(b.time?.split(":")[0]) === i + 10 &&
          !["cancelled", "rejected"].includes(b.status),
      ).length,
    })),
    peakHour = hours.find(
      (h) => h.value === Math.max(...hours.map((h) => h.value)) && h.value > 0,
    );
  const states = [
    {
      key: "completed",
      label: "Hoàn tất",
      color: "#0B5A3C",
      count: book.filter((b) => b.status === "completed").length,
    },
    {
      key: "cancelled",
      label: "Đã hủy",
      color: "#D95E52",
      count: book.filter((b) => b.status === "cancelled").length,
    },
    {
      key: "waiting",
      label: "Chờ / đã xác nhận",
      color: "#E6A846",
      count: book.filter((b) => ["pending", "confirmed"].includes(b.status))
        .length,
    },
    {
      key: "checked_in",
      label: "Đã check-in",
      color: "#6EA698",
      count: book.filter((b) => b.status === "checked_in").length,
    },
    {
      key: "rejected",
      label: "Từ chối",
      color: "#C68F69",
      count: book.filter((b) => b.status === "rejected").length,
    },
  ];
  const other = book.length - states.reduce((sum, s) => sum + s.count, 0);
  if (other)
    states.push({
      key: "other",
      label: "Trạng thái khác",
      color: "#9DA99F",
      count: other,
    });
  const length = days.length,
    previousFrom = dashboardDay(
      Date.parse(range.from + "T00:00:00+07:00") - length * 86400000,
    ),
    previousTo = dashboardDay(
      Date.parse(range.from + "T00:00:00+07:00") - 86400000,
    ),
    previous = orders
      .filter(
        (o) =>
          o.state === "completed" &&
          dashboardDay(o.createdAt) >= previousFrom &&
          dashboardDay(o.createdAt) <= previousTo,
      )
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const peakValue = days.reduce((max, d) => Math.max(max, d.revenue), 0);
  const peakDay = days.find((d) => d.revenue === peakValue && d.revenue > 0);
  return {
    recent,
    book,
    completed,
    revenue,
    cancelled,
    cancelRate: recent.length
      ? Math.round((cancelled / recent.length) * 100)
      : 0,
    days,
    bars,
    group,
    sold,
    byRevenue,
    foodRevenue,
    hours,
    peakHour,
    states,
    previous,
    previousFrom,
    previousTo,
    change: previous ? ((revenue - previous) / previous) * 100 : null,
    peakDay,
  };
}
