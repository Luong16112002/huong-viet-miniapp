import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PersonalReview {
  id: string;
  userId: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}
interface ReviewStore {
  reviews: PersonalReview[];
  saveReview: (userId: string, rating: number, content: string, id?: string) => void;
  deleteReview: (userId: string, id: string) => void;
}
export const useReviewStore = create<ReviewStore>()(persist((set, get) => ({
  reviews: [],
  saveReview: (userId, rating, content, id) => {
    if (!userId) throw new Error("Vui lòng đăng nhập để lưu đánh giá.");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Vui lòng chọn từ 1 đến 5 sao.");
    if (content.trim().length < 10 || content.trim().length > 1000) throw new Error("Nội dung cần từ 10 đến 1.000 ký tự.");
    const existing = id ? get().reviews.find(review => review.id === id && review.userId === userId) : undefined;
    if (id && !existing) throw new Error("Không tìm thấy đánh giá của bạn.");
    const now = new Date().toISOString();
    const review: PersonalReview = { id: existing?.id || Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, "0")).join(""), userId, rating, content: content.trim(), createdAt: existing?.createdAt || now, updatedAt: now };
    set(state => ({ reviews: existing ? state.reviews.map(item => item.id === id ? review : item) : [review, ...state.reviews] }));
  },
  deleteReview: (userId, id) => set(state => ({ reviews: state.reviews.filter(review => !(review.id === id && review.userId === userId)) })),
}), { name: "huong-viet-personal-reviews-v1" }));
