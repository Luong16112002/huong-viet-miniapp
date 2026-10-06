export type ReservationArea = "indoor" | "garden" | "private" | "floor1" | "floor2";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "rejected"
  | "cancelled"
  | "completed"
  | "noShow";

export interface Reservation {
  tableId?: string;
  tableName?: string;
  durationMinutes?: number;
  notification?: import("@/services/commerce.api").NotificationState;
  id: string;
  date: string;
  time: string;
  guests: number;
  name: string;
  phone: string;
  email?: string;
  note?: string;
  area?: ReservationArea;
  status: ReservationStatus;
  createdAt?: string;
  code?: string;
}
