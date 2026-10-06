import { Link } from "react-router-dom";
import type { HomeContent } from "@/services/home/home-content";
import { useState } from "react";
import type { Product } from "@/types/product.types";
import { SectionHeading } from "./section-heading";
import defaultFood from "@/static/products/dish-24.webp";
export function FoodCard({
  product: p,
  favorite,
  onFavorite,
  onAdd,
}: {
  product: Product;
  favorite: boolean;
  onFavorite: () => void;
  onAdd: () => void;
}) {
  const [added, setAdded] = useState(false);
  return (
    <article className="hv-home-food" data-food-id={p.id}>
      <div className="hv-home-food-media">
        <Link to={`/product/${p.id}`} aria-label={`Xem món ${p.name}`}>
          <img src={p.imageUrl || defaultFood} alt={p.name} loading="lazy" className="featured-food-image" onError={(event)=>{if(event.currentTarget.getAttribute("src") !== defaultFood) event.currentTarget.src = defaultFood;}} />
        </Link>
        <span className="hv-home-food-badge">
          {p.features.includes("bestseller")
            ? "★ Bán chạy"
            : p.newMarked || p.features.includes("new")
              ? "✧ Mới"
              : "Yêu thích"}
        </span>
        <button
          className="hv-home-heart"
          aria-label={`${favorite ? "Bỏ yêu thích" : "Yêu thích"} ${p.name}`}
          aria-pressed={favorite}
          onClick={onFavorite}
        >
          <svg
            viewBox="0 0 24 24"
            fill={favorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <path d="M12 21S2 15 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 7-10 13-10 13Z" />
          </svg>
        </button>
      </div>
      <div className="hv-home-food-copy">
        <Link to={`/product/${p.id}`}>
          <h3>{p.name}</h3>
        </Link>
        <p>{p.description}</p>
        <div>
          <strong>
            {p.price.toLocaleString("vi-VN")}
            <small>đ</small>
          </strong>
          <button
            className={`hv-home-add${added ? "added" : ""}`}
            aria-label={`Thêm ${p.name} vào giỏ`}
            onAnimationEnd={() => setAdded(false)}
            onClick={() => {
              onAdd();
              setAdded(true);
            }}
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}
export function FeaturedFoodSection({
  products,
  favorites,
  onFavorite,
  onAdd,
}: {
  products: Product[];
  favorites: string[];
  onFavorite: (id: number) => void;
  onAdd: (p: Product) => void;
}) {
  return (
    <section className="hv-home-featured">
      <SectionHeading
        title="Món ăn nổi bật"
        description="Những món ngon được yêu thích nhất"
        all
      />
      <div className="hv-home-foods">
        {products.map((p) => (
          <FoodCard
            key={p.id}
            product={p}
            favorite={favorites.includes(String(p.id))}
            onFavorite={() => onFavorite(p.id)}
            onAdd={() => onAdd(p)}
          />
        ))}
      </div>
      {!products.length && (
        <p className="hv-home-empty">
          Nhà hàng đang cập nhật món nổi bật. Bạn có thể xem thêm trong thực
          đơn.
        </p>
      )}
    </section>
  );
}
