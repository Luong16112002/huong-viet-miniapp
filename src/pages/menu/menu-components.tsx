import {
  categories,
  isPopular,
  isNew,
} from "@/services/category/menu-categories";
import { Product } from "@/types/product.types";
import logo from "@/static/logo.png";
const paths: Record<string, string> = {
  all: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  flame: "M12 3c2 5 7 6 7 12a7 7 0 0 1-14 0c0-3 2-6 4-8 0 4 2 5 2 5s3-4 1-9Z",
  leaf: "M20 3C8 2 2 8 5 16c8 5 16-1 15-13Z M4 21 16 8",
  bowl: "M3 11h18a9 9 0 0 1-18 0Z M8 21h8 M8 7V4 M12 7V2 M16 7V4",
  fish: "M3 12c5-9 12-9 15 0-3 9-10 9-15 0Z M18 12l4-5v10l-4-5 M8 11v.1",
  pot: "M4 9h16v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9Z M2 12h2 M20 12h2 M3 6h18 M10 3h4",
  drink: "M6 7h12l-2 14H8L6 7Z M4 7h16 M12 7l2-5h4",
  cake: "M4 12h16v9H4z M4 16c3 3 5-3 8 0s5-3 8 0 M12 12V7 M12 7c-5-1-1-5 0-6 1 1 5 5 0 6Z",
  search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  bell: "M5 9a7 7 0 0 1 14 0v7l2 3H3l2-3V9 M10 22h4",
  cart: "M2 3h3l3 13h11l3-10H6 M9 21h.01 M18 21h.01",
  star: "m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z",
  tag: "M3 3h8l10 10-8 8L3 11V3Z M7 7h.01",
  sparkle: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z",
};
export function MenuIcon({ name }: { name: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.bowl} />
    </svg>
  );
}
export {
  categories,
  normalize,
  matchesCategory,
  isPopular,
  isNew,
} from "@/services/category/menu-categories";
export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="hv-search">
      <MenuIcon name="search" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm món ăn yêu thích…"
        aria-label="Tìm món ăn"
      />
      {value && (
        <button aria-label="Xóa tìm kiếm" onClick={() => onChange("")}>
          ×
        </button>
      )}
    </div>
  );
}
export function MenuHeader({
  count,
  search,
  onSearch,
  onCart,
  onNotifications,
}: {
  count: number;
  search: string;
  onSearch: (v: string) => void;
  onCart: () => void;
  onNotifications: () => void;
}) {
  return (
    <header className="hv-menu-header">
      <div className="hv-brand-row">
        <img className="hv-brand-logo" src={logo} alt="Hương Việt" />
        <div className="hv-brand-copy">
          <strong>Nhà hàng Hương Việt</strong>
          <p>Ẩm thực Việt – Tinh hoa trong từng món ăn</p>
        </div>
        <button
          className="hv-header-action"
          aria-label="Thông báo"
          onClick={onNotifications}
        >
          <MenuIcon name="bell" />
        </button>
        <button
          className="hv-header-action"
          aria-label={`Giỏ hàng, ${count} món`}
          onClick={onCart}
        >
          <MenuIcon name="cart" />
          <span className="hv-cart-count">{count > 99 ? "99+" : count}</span>
        </button>
      </div>
      <SearchBar value={search} onChange={onSearch} />
    </header>
  );
}
export function CategoryTabs({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="hv-categories" aria-label="Danh mục món ăn">
      {categories.map((c) => (
        <button
          key={c.id}
          aria-pressed={c.id === selected}
          onClick={() => onSelect(c.id)}
        >
          <MenuIcon name={c.icon} />
          {c.name}
        </button>
      ))}
    </nav>
  );
}
export type Sort = "default" | "popular" | "asc" | "desc" | "new";
export function FilterBar({
  value,
  onChange,
}: {
  value: Sort;
  onChange: (v: Sort) => void;
}) {
  return (
    <div className="hv-filters" aria-label="Lọc và sắp xếp">
      <button
        aria-pressed={value === "popular"}
        onClick={() => onChange(value === "popular" ? "default" : "popular")}
      >
        <MenuIcon name="star" />
        Phổ biến
      </button>
      <label className={value === "asc" || value === "desc" ? "selected" : ""}>
        <MenuIcon name="tag" />
        <select
          aria-label="Sắp xếp theo giá"
          value={value === "asc" || value === "desc" ? value : "default"}
          onChange={(e) => onChange(e.target.value as Sort)}
        >
          <option value="default">Giá ↕</option>
          <option value="asc">Giá tăng dần</option>
          <option value="desc">Giá giảm dần</option>
        </select>
      </label>
      <button
        aria-pressed={value === "new"}
        onClick={() => onChange(value === "new" ? "default" : "new")}
      >
        <MenuIcon name="sparkle" />
        Mới
      </button>
    </div>
  );
}
export { FoodCard } from "./food-card";
