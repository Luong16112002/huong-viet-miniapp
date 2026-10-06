import type { Product } from "@/types/product.types";
import { FoodCard } from "./food-card";
import { MenuIcon } from "./menu-components";

export function FoodSectionHeader({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="hv-section-heading">
      <span className="hv-category-emblem">
        <MenuIcon name={icon} />
      </span>
      <div>
        <h1 id="menu-heading">{title}</h1>
        <p>{description}</p>
      </div>
      <span className="hv-menu-signature" aria-hidden="true">
        Hương vị
        <br />
        quê nhà
      </span>
    </div>
  );
}

export function FoodGrid({
  products,
  onOpen,
  onAdd,
}: {
  products: Product[];
  onOpen: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  let favorites: string[] = [];
  try {
    const stored = JSON.parse(localStorage.getItem("favorite-dishes") || "[]");
    if (Array.isArray(stored)) favorites = stored.map(String);
  } catch {
    /* Menu remains available without local storage. */
  }
  return (
    <div className="hv-food-grid">
      {products.map((product) => (
        <FoodCard
          key={product.id}
          product={product}
          favorite={favorites.includes(String(product.id))}
          onOpen={() => onOpen(product)}
          onAdd={() => onAdd(product)}
        />
      ))}
    </div>
  );
}
