import { create } from "zustand";
import { OrderDeliveryType } from "@/types/order.types";
export interface CartDraft {
  deliveryType: OrderDeliveryType;
  note: string;
  name: string;
  phone: string;
  address: string;
  tableNumber: string;
  voucherCode: string;
}
const initial: CartDraft = {
  deliveryType: "pickup",
  note: "",
  name: "",
  phone: "",
  address: "",
  tableNumber: "",
  voucherCode: "",
};
export const useCartDraft = create<
  CartDraft & { update: (value: Partial<CartDraft>) => void; reset: () => void }
>((set) => ({
  ...initial,
  update: (value) => set(value),
  reset: () => set(initial),
}));
