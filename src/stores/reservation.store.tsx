import { commerceRequest, createCommerceRecord } from "@/services/commerce.api";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Reservation } from "@/types/reservation.types";
import { normalizeReservationPhone, ReservationDraft, validateReservation } from "@/utils/reservation";

interface ReservationStore {
  reservations: Reservation[];
  current: Reservation | null;
  addReservation: (reservation: ReservationDraft) => Promise<Reservation>;
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  cancelReservation: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  getReservations: () => Reservation[];
  setCurrent: (reservation: Reservation | null) => void;
}

export const useReservationStore = create<ReservationStore>()(persist((set, get) => ({
  reservations: [],
  current: null,
  addReservation: async (draft) => {
    const errors = validateReservation(draft);
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
    const phone = normalizeReservationPhone(draft.phone);
    const duplicate = get().reservations.find(r => r.date === draft.date && r.time === draft.time && r.phone === phone && (r.status === "pending" || r.status === "confirmed"));
    if (duplicate) throw new Error("Bạn đã có yêu cầu cho khung giờ này. Hãy kiểm tra trong Lịch đặt bàn.");
    const reservation = await createCommerceRecord<Reservation>("reservation", draft);
    // Zustand updates memory before persisting; a cache quota error must not undo server success.
    try { set(state => ({ reservations: [...state.reservations, reservation], current: reservation })); } catch { /* Server remains authoritative. */ }
    return reservation;
  },
  updateReservation: (id, updates) => set(state => ({
    reservations: state.reservations.map(r => r.id === id ? { ...r, ...updates, id: r.id } : r),
    current: state.current?.id === id ? { ...state.current, ...updates, id } : state.current,
  })),
  cancelReservation: async id => {
    const updated = await commerceRequest<Reservation>(`reservations/${encodeURIComponent(id)}/cancel`, {});
    get().updateReservation(id, updated);
  },
  refresh: async () => { const reservations = await commerceRequest<Reservation[]>("reservations"); set({ reservations }); },
  getReservations: () => get().reservations,
  setCurrent: current => set({ current }),
}), { name: "huong-viet-reservations-v2", partialize: state => ({ reservations: state.reservations, current: state.current }) }));
