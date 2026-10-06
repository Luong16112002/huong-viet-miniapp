import { create } from "zustand";
import type { OrderPayment } from "@/types/order.types";

export type PaymentMethod = OrderPayment["method"];

export interface PaymentMethodConfig {
  id: PaymentMethod;
  label: string;
  description: string;
  enabled: boolean;
}

const STORAGE_KEY = "maison-payment-methods";

const defaultMethods: PaymentMethodConfig[] = [
  { id: "cash", label: "Tiền mặt", description: "Tại nhà hàng / khi nhận hàng", enabled: true },
  { id: "zalopay", label: "ZaloPay", description: "Thanh toán nhanh qua ZaloPay", enabled: true },
  { id: "momo", label: "MoMo", description: "Ví điện tử MoMo", enabled: true },
  { id: "credit_card", label: "Thẻ tín dụng", description: "Visa / Master / JCB", enabled: true },
];

const loadMethods = (): PaymentMethodConfig[] => {
  if (typeof window === "undefined") return defaultMethods;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultMethods;
    const parsed = JSON.parse(saved) as PaymentMethodConfig[];
    return defaultMethods.map((method) => ({
      ...method,
      enabled: parsed.find((item) => item.id === method.id)?.enabled ?? method.enabled,
    }));
  } catch {
    return defaultMethods;
  }
};

export interface PaymentMethodStore {
  methods: PaymentMethodConfig[];
  toggleMethod: (id: PaymentMethod) => void;
}

export const usePaymentMethodStore = create<PaymentMethodStore>((set) => ({
  methods: loadMethods(),
  toggleMethod: (id) => {
    set((state) => {
      const enabledCount = state.methods.filter((method) => method.enabled).length;
      const nextMethods = state.methods.map((method) =>
        method.id === id && !(method.enabled && enabledCount === 1)
          ? { ...method, enabled: !method.enabled }
          : method,
      );
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMethods));
      }
      return { methods: nextMethods };
    });
  },
}));
