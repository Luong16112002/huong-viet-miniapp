export type NotificationType =
  | "order"
  | "reservation"
  | "reservation_rejected"
  | "promotion"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  image?: string;
  metadata?: Record<string, unknown>;
}
