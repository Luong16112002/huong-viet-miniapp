export interface Restaurant {
  id: string;
  name: string;
  shortName: string;
  type: string;
  address: string;
  phone: string;
  openHours: string;
  description: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  images: string[];
}

export const mockRestaurant: Restaurant = {
  id: "restaurant-1",
  name: "Nhà hàng Hương Việt",
  shortName: "Hương Việt",
  type: "Nhà hàng ẩm thực Việt Nam",
  address: "123 Nguyễn Văn Cừ, TP. Đồng Hới, Quảng Bình",
  phone: "0232 123 4567",
  openHours: "10:00 - 22:00 (Tất cả các ngày)",
  description:
    "Không gian ấm cúng, phục vụ các món ăn truyền thống Việt Nam với nguyên liệu tươi ngon, đậm hương vị Quảng Bình. Đặc sản phải thử: Bò nướng lá lốt, Cá kho tộ, Bún chả Hà Nội và Phở bò truyền thống.",
  lat: 17.4778,
  lng: 106.6023,
  rating: 4.8,
  reviewCount: 1204,
  images: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
  ],
};
