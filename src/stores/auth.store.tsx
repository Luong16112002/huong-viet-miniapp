import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types/auth.types";

interface AuthStore {
  user: User | null;
  isLoggedIn: boolean;
  login: (userData: Omit<User, "id"> & { id?: string }) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(persist((set) => ({
  user: {
    id: "user-001",
    name: "Bình Nguyễn",
    avatar: "/static/logo.png",
    phone: "0901234567",
    email: "binh.nguyen@example.com",
    zaloId: "zalo-123456",
    loyaltyLevel: "gold",
    points: 2580,
  },
  isLoggedIn: true,

  login: (userData) => {
    const id = userData.id || `user-${Date.now()}`;
    const user: User = {
      ...userData,
      id,
    } as User;
    set({ user, isLoggedIn: true });
  },

  logout: () => {
    set({ user: null, isLoggedIn: false });
  },

  updateUser: (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : state.user,
    }));
  },
}), { name: "huong-viet-profile-v1", partialize: state => ({ user: state.user, isLoggedIn: state.isLoggedIn }) }));
