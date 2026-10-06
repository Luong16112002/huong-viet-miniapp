import { HotpotOptions, HotpotCombos } from "./hotpot-options";
import type { SelectedVariant } from "@/types/cart.types";
import "./menu.css";
import { FoodGrid, FoodSectionHeader } from "./food-grid";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProducts } from "@/services/product/product.queries";
import { useCartStore } from "@/stores/cart.store";
import { getDefaultVariants } from "@/utils/product";
import { Product } from "@/types/product.types";
import {
  CategoryTabs,
  FilterBar,
  MenuHeader,
  MenuIcon,
  categories,
  normalize,
  matchesCategory,
  isPopular,
  isNew,
  Sort,
} from "./menu-components";

export default function MenuPage() {
  const navigate = useNavigate();
  const {
    data: products = [],
    isLoading,
    isError,
    refetch,
  } = useProducts("all", "");
  const { addToCart, totalItems } = useCartStore();
  const [params, setParams] = useSearchParams();
  const category = categories.some((c) => c.id === params.get("category"))
    ? params.get("category")!
    : "grill";
  const setCategory = (id: string) =>
    setParams({ category: id }, { replace: true });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("default");
  const [toast, setToast] = useState({ text: "", version: 0 });
  useEffect(() => {
    if (!toast.text) return;
    const timer = setTimeout(() => setToast((t) => ({ ...t, text: "" })), 2400);
    return () => clearTimeout(timer);
  }, [toast]);
  const current = categories.find((c) => c.id === category)!;
  const visible = useMemo(() => {
    const terms = normalize(search).split(/\s+/).filter(Boolean);
    const result = products.filter((p) => {
      const labels = categories
        .filter((c) => matchesCategory(p, c.id))
        .map((c) => c.name)
        .join(" ");
      const haystack = normalize(
        `${p.name} ${p.description} ${labels} ${(p.ingredients || []).join(" ")}`,
      );
      return (
        matchesCategory(p, category) &&
        terms.every((term) => haystack.includes(term)) &&
        (sort !== "popular" || isPopular(p)) &&
        (sort !== "new" || isNew(p))
      );
    });
    if (sort === "asc" || sort === "desc")
      result.sort((a, b) => (a.price - b.price) * (sort === "asc" ? 1 : -1));
    return result;
  }, [products, category, search, sort]);
  const [hotpot, setHotpot] = useState<{ product: Product; initial?: SelectedVariant[] } | null>(null);
  const add = (product: Product, variants?: SelectedVariant[]) => {
    if (product.subCategoryId === "lau" && !variants) { setHotpot({ product }); return; }
    addToCart({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      basePrice: product.price,
      selectedVariants: variants || getDefaultVariants(product),
      quantity: 1,
    });
    setToast((t) => ({
      text: "Đã thêm món vào giỏ",
      version: t.version + 1,
    }));
  };
  return (
    <div className={`hv-menu${category === "hotpot" ? " hv-hotpot" : ""}`}>
      <MenuHeader
        count={totalItems}
        search={search}
        onSearch={(value) => {
          setSearch(value);
          if (value && category !== "hotpot") setCategory("all");
        }}
        onCart={() => navigate("/cart")}
        onNotifications={() => navigate("/notifications")}
      />
      <main className="hv-menu-content">
        <CategoryTabs
          selected={category}
          onSelect={(value) => {
            setCategory(value);
            setSort("default");
          }}
        />
        <section aria-labelledby="menu-heading">
          <FoodSectionHeader
            icon={current.icon}
            title={search ? "Kết quả tìm kiếm" : current.name}
            description={
              search
                ? `${visible.length} món phù hợp với bạn`
                : current.description
            }
          />
          <FilterBar value={sort} onChange={setSort} />
          {isLoading ? (
            <div className="hv-food-grid" aria-label="Đang tải thực đơn">
              {Array.from({ length: 6 }, (_, i) => (
                <div className="hv-food-skeleton" key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="hv-menu-empty">
              <p>Chưa tải được thực đơn.</p>
              <button onClick={() => refetch()}>Thử lại</button>
            </div>
          ) : visible.length ? (
            <FoodGrid
              products={visible}
              onAdd={add}
              onOpen={(p) => navigate(`/product/${p.id}`)}
            />
          ) : (
            <div className="hv-menu-empty">
              <MenuIcon name="search" />
              <h2>{category === "hotpot" ? "Hiện tại chưa có món lẩu phù hợp" : "Không tìm thấy món phù hợp"}</h2>
              <p>Thử từ khóa khác hoặc xem các món trong thực đơn.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setSort("default");
                }}
              >
                Xem tất cả món
              </button>
            </div>
          )}
        </section>
        {category === "hotpot" && !search && !isLoading && !isError && visible.length > 0 && <HotpotCombos products={products} onChoose={(product, initial) => setHotpot({ product, initial })} />}
        <p className="hv-menu-ending">
          Đậm đà hương vị Việt · Trọn vẹn từng bữa ngon
        </p>
      </main>
      {hotpot && <HotpotOptions key={hotpot.product.id} product={hotpot.product} initial={hotpot.initial} onClose={() => setHotpot(null)} onAdd={variants => { add(hotpot.product, variants); setHotpot(null); }} />}
      <div
        className={`hv-menu-toast${toast.text ? "visible" : ""}`}
        role="status"
      >
        {toast.text}
      </div>
    </div>
  );
}
