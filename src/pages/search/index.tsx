import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/common/product-card";
import { mockListOfProduct } from "@/services/product/product.mock";
import { mockProductFeature } from "@/services/product/product.mock";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cart.store";
import { getDefaultVariants } from "@/utils/product";
import { Product } from "@/types/product.types";
import { copy } from "@/constants/copy";
import { SearchIcon, CloseIcon } from "@/components/common/vectors";

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z" fill="currentColor" fillOpacity="0.9"/>
    </svg>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();
  const { addToCart, openCheckoutSheet } = useCartStore();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mdr_recent_searches");
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  }, [searchQuery, setSearchParams]);

  const suggestionChips = ["Phở bò", "Sushi", "Mì Ý", "Chay", "Cà phê"];

  const toggleChip = (chip: string) => {
    setActiveChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
    if (!activeChips.includes(chip) && !searchQuery.includes(chip)) {
      setSearchQuery(chip);
    }
  };

  const addToRecent = (term: string) => {
    if (!term.trim()) return;
    const next = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 8);
    setRecentSearches(next);
    try {
      localStorage.setItem("mdr_recent_searches", JSON.stringify(next));
    } catch {}
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("mdr_recent_searches");
    } catch {}
  };

  const subcategoryMap: Record<string, string> = {
    "vietnamese-drinks": "Đồ uống Việt",
    "vietnamese-food": "Món chính Việt",
    "vietnamese-breakfast": "Điểm tâm",
    "vietnamese-soup": "Canh - Cháo",
    "vietnamese-dessert": "Tráng miệng Việt",
    "vietnamese-snack": "Đồ ăn vặt",
    "vietnamese-vegetarian": "Món chay",
    "vietnamese-fastfood": "Đồ nhanh",
    "western-steak": "Bít tết",
    "western-pasta": "Mì Ý",
    "western-burger": "Burger",
    "western-pizza": "Pizza",
    "western-salad": "Salad",
    "western-breakfast": "Điểm tâm phương Tây",
    "western-dessert": "Tráng miệng Tây",
    "western-drinks": "Đồ uống Tây",
    "thailand-soup": "Súp Thái",
    "thailand-noodles": "Mì Thái",
    "thailand-rice": "Cơm Thái",
    "thailand-salad": "Gỏi Thái",
    "thailand-grilled": "Nướng Thái",
    "thailand-curry": "Cà ri Thái",
    "thailand-seafood": "Hải sản Thái",
    "thailand-dessert": "Tráng miệng Thái",
    "japanese-sushi": "Sushi Sashimi",
    "japanese-ramen": "Ramen",
    "japanese-rice-bowl": "Cơm bát Nhật",
    "japanese-tempura": "Tempura",
    "japanese-grilled": "Nướng Nhật",
    "japanese-noodles": "Mì Nhật",
    "japanese-dessert": "Tráng miệng Nhật",
    "japanese-drinks": "Đồ uống Nhật",
  };

  const featureMap: Record<string, string> = {};
  mockProductFeature.forEach((f) => {
    featureMap[f.id] = f.name;
  });

  const filteredProducts = useMemo(() => {
    const allQueries: string[] = [
      searchQuery.trim().toLowerCase(),
      ...activeChips.map((c) => c.toLowerCase()),
    ].filter(Boolean);

    if (allQueries.length === 0) {
      return [];
    }

    return mockListOfProduct.filter((product) => {
      return allQueries.some((query) => {
        if (!query) return false;
        const nameMatch = product.name.toLowerCase().includes(query);
        const descMatch = product.description.toLowerCase().includes(query);
        const featureMatch = product.features.some((f) =>
          (featureMap[f] || "").toLowerCase().includes(query) ||
          f.toLowerCase().includes(query)
        );
        const subCatMatch = (
          subcategoryMap[product.subCategoryId] || ""
        )
          .toLowerCase()
          .includes(query);
        return nameMatch || descMatch || featureMatch || subCatMatch;
      });
    });
  }, [searchQuery, activeChips]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      addToRecent(searchQuery.trim());
    }
  };

  const handleQuickAddToCart = (product: Product) => {
    const defaultVariants = getDefaultVariants(product);
    addToCart({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      basePrice: product.price,
      selectedVariants: defaultVariants,
      quantity: 1,
    });
    openCheckoutSheet();
  };

  const hasSearched = searchQuery.trim() || activeChips.length > 0;
  const hasResults = filteredProducts.length > 0;

  return (
    <div className="relative mx-0 mb-6 flex h-full flex-col bg-cream100">
      <div className="px-4 pt-4 pb-3 bg-cream100 sticky top-0 z-20">
        <div className="relative w-full">
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchSubmit();
            }}
            className="w-full h-12 pl-12 pr-12 rounded-2xl bg-white border border-divider02 text-normal text-espresso900 outline-none focus:border-gold500 focus:ring-4 focus:ring-gold500/10 transition-all placeholder:text-neutral600 shadow-sm"
            placeholder={copy.search.placeholder}
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral600" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-neutral100 text-neutral700 hover:bg-neutral200 transition"
            >
              <CloseIcon color="currentColor" size={12} strokeWidth={3} />
            </button>
          )}
        </div>

        <div className="mt-4">
          <div className="text-xsmall font-semibold tracking-wide text-neutral700 mb-2.5 pl-1">
            Gợi ý tìm kiếm
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
            {suggestionChips.map((chip) => (
              <button
                key={chip}
                onClick={() => toggleChip(chip)}
                className={`btn-chip shrink-0 ${activeChips.includes(chip) ? "active" : ""}`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-scroll px-4 pb-8">
        {!hasSearched && recentSearches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 pl-1">
              <div className="text-xsmall font-semibold tracking-wide text-neutral700">
                {copy.search.recent}
              </div>
              <button
                onClick={clearRecent}
                className="text-xsmall font-semibold text-terracotta600 hover:text-terracotta500"
              >
                {copy.search.clear}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term);
                    addToRecent(term);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-divider02 text-small text-espresso900 hover:border-gold500 hover:bg-gold500/5 transition"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.8"/>
                    <path d="M12 8V12L15 15" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasSearched && (
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="text-small text-neutral700">
              {copy.search.resultCount.replace("{count}", String(filteredProducts.length))}
            </div>
          </div>
        )}

        {hasSearched && hasResults && (
          <div className="product-grid grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => {
                  addToRecent(searchQuery.trim() || product.name);
                  navigate(`/product/${product.id}`);
                }}
                onAddToCart={() => handleQuickAddToCart(product)}
              />
            ))}
          </div>
        )}

        {hasSearched && !hasResults && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="pattern-bg w-36 h-36 rounded-full flex items-center justify-center mb-6 bg-white border border-divider02 shadow-sm">
              <div className="flex flex-col items-center">
                <svg width="56" height="56" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="32" cy="28" r="18" fill="none" stroke="#C9A86A" strokeWidth="2.5" strokeDasharray="4 3"/>
                  <circle cx="26" cy="26" r="2.5" fill="#C9A86A"/>
                  <circle cx="38" cy="26" r="2.5" fill="#C9A86A"/>
                  <path d="M26 34C26 34 28 38 32 38C36 38 38 34 38 34" stroke="#C9A86A" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                  <path d="M22 48L32 42L42 48" stroke="#C9A86A" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
            </div>
            <h3 className="heading_serif text-espresso900 mb-2">
              {copy.search.noResults}
            </h3>
            <p className="text-small text-neutral700 leading-relaxed mb-6 max-w-xs">
              {copy.search.noResultsHint}
            </p>
            <button
              onClick={() => navigate("/ai-chat")}
              className="btn-chip !px-5 !py-3 gap-2 font-semibold"
            >
              <SparkleIcon className="text-gold600" />
              Hỏi AI Chef
            </button>
          </div>
        )}

        {!hasSearched && recentSearches.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="pattern-bg w-28 h-28 rounded-2xl flex items-center justify-center mb-5 bg-white border border-divider02">
              <SearchIcon className="w-10 h-10 text-gold500" />
            </div>
            <h3 className="heading_serif text-espresso900 mb-2">
              Bắt đầu tìm kiếm
            </h3>
            <p className="text-small text-neutral700 leading-relaxed max-w-xs">
              Gõ tên món ăn, nguyên liệu hoặc nhấn vào các gợi ý bên trên
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
