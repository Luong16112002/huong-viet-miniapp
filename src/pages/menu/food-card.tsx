import type { Product } from "@/types/product.types";
import { isPopular, isNew } from "@/services/category/menu-categories";
export function FoodBadge({
  product,
  favorite,
}: {
  product: Product;
  favorite: boolean;
}) {
  const label = isPopular(product)
    ? "★ Bán chạy"
    : isNew(product)
      ? "Mới"
      : favorite
        ? "Yêu thích"
        : "";
  return label ? <span className="hv-food-badge">{label}</span> : null;
}
export function AddToCartButton({
  name,
  onAdd,
}: {
  name: string;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      className="hv-food-add"
      onClick={(event) => {
        event.stopPropagation();
        onAdd();
      }}
      aria-label={`Thêm ${name} vào giỏ`}
    >
      <span aria-hidden="true">+</span>
    </button>
  );
}
export function FoodCard({
  product,
  onOpen,
  onAdd,
  favorite = false,
}: {
  product: Product;
  onOpen: () => void;
  onAdd: () => void;
  favorite?: boolean;
}) {
  return (
    <article
      className="hv-food-card"
      data-food-id={product.id}
      data-price={product.price}
    >
      <button
        className="hv-food-open"
        onClick={onOpen}
        aria-label={`Xem món ${product.name}`}
      >
        <div className="hv-food-media">
          <img src={product.image} alt={product.name} loading="lazy" />
          <FoodBadge product={product} favorite={favorite} />
        </div>
        <div className="hv-food-copy">
          <h2>{product.name}</h2>
          <p>{product.description}</p>
        </div>
      </button>
      <div className="hv-food-bottom">
        <span>
          {product.price.toLocaleString("vi-VN")}
          <small>đ</small>
        </span>
        <AddToCartButton name={product.name} onAdd={onAdd} />
      </div>
    </article>
  );
}
