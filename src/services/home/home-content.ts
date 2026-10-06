import { mockListOfProduct } from "../product/product.mock";
import { mockRestaurant } from "../restaurant/restaurant.mock";
import { categories } from "../category/menu-categories";
export function getHomeContent() {
  const featured = [
    ...mockListOfProduct.filter((p) => p.features.includes("bestseller")),
    ...mockListOfProduct.filter(
      (p) =>
        !p.features.includes("bestseller") &&
        (p.features.includes("new") || p.newMarked),
    ),
  ].slice(0, 8);
  return {
    restaurant: mockRestaurant,
    featured,
    categories,
    promotions: [
      {
        id: "MAISON20",
        eyebrow: "ƯU ĐÃI ĐẶC BIỆT",
        title: "THỨ 2 - THỨ 6",
        description: "Giảm đến 30%",
        action: "Xem ngay",
        route: "/promotions",
        foodId: featured[0]?.id,
        tone: "warm",
      },
      {
        id: "family",
        eyebrow: "COMBO Gia đình",
        title: "Ngon hơn khi có nhau",
        description: "",
        action: "Khám phá",
        route: "/ai-chat",
        foodId: featured[1]?.id,
        tone: "cream",
      },
    ],
  };
}
export type HomeContent = ReturnType<typeof getHomeContent>;
