import { apiFetch } from "@/services/apiClient";
export type Row = Record<string, any>;
const base =
  ("/api/commerce").replace(
    /\/commerce\/?$/,
    "",
  ) + "/admin";
export async function adminRequest(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<any> {
  const response = await apiFetch(base + path, {
    method,
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("hv-admin-session") || ""}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== "/login") {
      sessionStorage.removeItem("hv-admin-session");
      window.dispatchEvent(new Event("hv-admin-session-expired"));
    }
    throw new Error(data.message || data.error || "Chưa kết nối được máy chủ.");
  }
  return data;
}
export const labels: Record<string, string> = {
  AVAILABLE: "Trống",
  RESERVED: "Đã đặt",
  OCCUPIED: "Đang sử dụng",
  CLEANING: "Đang dọn",
  DISABLED: "Ngưng sử dụng",
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  checked_in: "Đã check-in",
  preparing: "Đang chuẩn bị",
  ready: "Sẵn sàng",
  serving: "Đang phục vụ",
  delivering: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  rejected: "Từ chối",
};
export const areas: Record<string, string> = {
  indoor: "Trong nhà",
  garden: "Sân vườn",
  private: "Phòng riêng",
  floor1: "Tầng 1",
  floor2: "Tầng 2",
};
export const money = (n: number) =>
  Number(n || 0).toLocaleString("vi-VN") + "đ";
export const dateTime = (value: string) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";
export const transitions = (row: Row, booking: boolean): string[] =>
  booking
    ? {
        pending: ["confirmed", "rejected", "cancelled"],
        confirmed: ["checked_in", "cancelled", "rejected"],
        checked_in: ["completed"],
      }[row.status] || []
    : {
        pending: ["confirmed", "cancelled"],
        confirmed: ["preparing", "cancelled"],
        preparing: ["ready", "cancelled"],
        ready:
          row.deliveryType === "delivery"
            ? ["delivering", "cancelled"]
            : row.deliveryType === "dinein"
              ? ["serving", "cancelled"]
              : ["completed", "cancelled"],
        serving: ["completed"],
        delivering: ["completed"],
      }[row.state] || [];
