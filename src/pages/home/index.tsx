import "./home.css";
import { useEffect, useState } from "react";
import { useHome } from "@/services/home/home.queries";
import { useCartStore } from "@/stores/cart.store";
import { getDefaultVariants } from "@/utils/product";
import type { Product } from "@/types/product.types";
import {
  HomeHeader,
  HeroBanner,
  QuickActions,
  PromotionSection,
  FeaturedFoods,
  CategorySection,
} from "./home-components";

function readFavorites(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem("favorite-dishes") || "[]");
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}
export default function HomePage() {
  const { data, isLoading, isError, refetch } = useHome();
  const { addToCart, totalItems } = useCartStore();
  const [favorites, setFavorites] = useState(readFavorites);
  const [feedback, setFeedback] = useState({ text: "", id: 0 });
  const notify = (text: string) =>
    setFeedback((old) => ({ text, id: old.id + 1 }));
  useEffect(() => {
    if (!feedback.text) return;
    const timer = setTimeout(
      () => setFeedback((old) => ({ ...old, text: "" })),
      2300,
    );
    return () => clearTimeout(timer);
  }, [feedback]);
  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const add = (p: Product) => {
    addToCart({
      productId: p.id,
      productName: p.name,
      productImage: p.image,
      basePrice: p.price,
      selectedVariants: getDefaultVariants(p),
      quantity: 1,
    });
    notify("Đã thêm vào giỏ hàng");
  };
  const favorite = (id: number) => {
    const old = readFavorites();
    const key = String(id);
    const next = old.includes(key)
      ? old.filter((item) => item !== key)
      : [...old, key];
    try {
      localStorage.setItem("favorite-dishes", JSON.stringify(next));
      setFavorites(next);
      notify(
        old.includes(key) ? "Đã bỏ lưu món ăn" : "Đã lưu món ăn yêu thích",
      );
    } catch {
      notify("Chưa lưu được yêu thích trên thiết bị này.");
    }
  };
  return (
    <div className="hv-home">
      <HomeHeader
        name={data?.restaurant.name || "Nhà hàng Hương Việt"}
        count={totalItems}
      />
      <HeroBanner />
      <main className="hv-home-main">
        <QuickActions restaurant={data?.restaurant} />
        {isLoading ? (
          <div
            className="hv-home-skeleton"
            aria-label="Đang tải trang chủ"
            role="status"
          >
            <div />
            <div />
            <div />
          </div>
        ) : isError || !data ? (
          <div className="hv-home-error" role="alert">
            <h2>Chưa tải được thông tin nhà hàng</h2>
            <p>Vui lòng kiểm tra kết nối và thử lại.</p>
            <button onClick={() => refetch()}>Thử lại</button>
          </div>
        ) : (
          <>
            <PromotionSection
              promotions={data.promotions}
              products={data.featured}
            />
            <FeaturedFoods
              products={data.featured}
              favorites={favorites}
              onFavorite={favorite}
              onAdd={add}
            />
            <CategorySection categories={data.categories} />
          </>
        )}
        <p className="hv-home-signoff">Hương Việt · Trọn vị quê nhà</p>
      </main>
      <div
        role="status"
        className={`hv-home-toast ${feedback.text ? "visible" : ""}`}
      >
        {feedback.text}
      </div>
    </div>
  );
}
