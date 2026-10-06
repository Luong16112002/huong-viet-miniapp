import { Product } from "@/types/product.types";
import { Button, Text } from "zmp-ui";
import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";
import { HeartIcon, MinusIcon, PlusIcon } from "./vectors";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onAddToCart?: () => void;
  compact?: boolean;
}

export default function ProductCard({
  product,
  onClick,
  onAddToCart,
  compact = false,
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(0);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity((q) => q + 1);
    onAddToCart?.();
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity((q) => q + 1);
    onAddToCart?.();
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity((q) => Math.max(0, q - 1));
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite((f) => !f);
  };

  const hasDiscount = product.sales?.discount && product.sales.discount > 0;
  const isBestseller = (product as any).isBestseller ?? (product.sales?.freeShipping && product.newMarked);
  const foodTags = (product.features || []).slice(0, 2);
  const rating = (product as any).rating ?? 4.8;

  return (
    <div
      className={`product-tile group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#eee8df] bg-white ${compact ? "p-2" : "p-2.5"} shadow-[0_6px_18px_rgba(45,35,25,0.07)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-cardLift`}
    >
      <div
        className="product-tile-media relative overflow-hidden rounded-lg ring-1 ring-inset ring-gold400/20"
        onClick={onClick}
      >
        <div className="absolute inset-0 z-0 rounded-[10px] border border-white/60" />

        {!compact && (isBestseller || product.sales?.freeShipping) && (
          <div className="absolute left-2 top-2 z-20 flex items-center gap-1 rounded-full bg-gradient-to-r from-terracotta500 via-terracotta600 to-white/95 px-2.5 py-1 shadow-md backdrop-blur-sm">
            <span className="text-[10px] font-black uppercase tracking-wide text-white drop-shadow-sm">
              🔥 {copy.product.bestseller}
            </span>
          </div>
        )}

        {!compact && product.newMarked && (
          <div className="absolute right-2 top-2 z-20">
            <div className="relative inline-flex">
              <div className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-yellow400/40 to-gold500/30 blur-[1px]" />
              <div className="relative z-10 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow100 to-white px-2.5 py-1 shadow-sm ring-1 ring-gold400/30">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-espresso900">
                  ✨ {copy.common.new}
                </span>
              </div>
            </div>
          </div>
        )}

        {!compact && hasDiscount && (
          <div className="absolute bottom-2 left-2 z-20">
            <div className="relative rounded-xl rounded-bl-md bg-gradient-to-br from-red500 via-red600 to-red700 px-2 py-1 shadow-lg ring-1 ring-red400/40">
              <span className="text-xs font-black text-white drop-shadow-sm">
                -{product.sales!.discount}%
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleToggleFavorite}
          className={`${compact ? "hidden" : ""} absolute right-2 top-10 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-white hover:shadow-md active:scale-90`}
          aria-label="Yêu thích"
        >
          <HeartIcon
            size={16}
            className={
              isFavorite
                ? "fill-rose500 text-rose500 transition-all"
                : "text-espresso700/70 transition-all"
            }
          />
        </button>

        <img
          key={product.image}
          loading="lazy"
          decoding="async"
          draggable={false}
          src={product.image}
          alt={product.name}
          className="relative z-0 h-full w-full bg-cream200 object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/10 via-transparent to-white/5" />
        {product.imageIsIllustration && (
          <span className="absolute bottom-1 right-1 z-20 rounded bg-white/95 px-1.5 py-1 text-[9px] text-espresso800">Ảnh minh họa</span>
        )}
      </div>

      <div className={`${compact ? "mt-1.5 gap-1" : "mt-2.5 gap-1.5"} flex flex-col`}>
        <div className={compact ? "hidden" : "flex items-center gap-1"}>
          <span className="text-yellow500">⭐</span>
          <span className="text-xxxsmall-m text-yellow700">{rating.toFixed(1)}</span>
        </div>

        <Text
          className={`line-clamp-2 text-small-sb text-espresso900 leading-snug ${compact ? "min-h-[32px]" : "min-h-[36px]"}`}
        >
          {product.name}
        </Text>

        {!compact && product.description && (
          <Text className="line-clamp-1 truncate text-xxxsmall text-neutral600">
            {product.description}
          </Text>
        )}

        {!compact && foodTags.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1">
            {foodTags.map((tag, idx) => (
              <span
                key={idx}
                className="rounded-full bg-cream100 px-2 py-0.5 text-[10px] font-semibold text-espresso800 ring-1 ring-gold400/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className={`${compact ? "mt-1" : "mt-1.5"} product-price-row flex items-end justify-between gap-2`}>
          <div className="flex items-baseline gap-0.5">
            <span className={compact ? "product-price text-xlarge-sb font-extrabold leading-none text-primary700" : "product-price bg-gradient-to-r from-yellow500 via-gold500 to-gold700 bg-clip-text text-xlarge-sb font-extrabold leading-none text-transparent"}>
              {formatCurrency(product.sales?.specialPrice ?? product.price)}
            </span>
            <span className="mb-0.5 text-xxsmall-m font-bold text-gold700">
              ₫
            </span>
          </div>

          {quantity === 0 ? (
            <Button
              onClick={handleAdd}
              className={compact ? "product-add !m-0 !flex !h-9 !w-9 !min-w-0 flex-shrink-0 items-center justify-center rounded-full !bg-primary700 !p-0 text-white shadow-button-lg transition-all duration-200 hover:bg-primary800 active:scale-90" : "product-add !m-0 !flex !h-9 !w-9 !min-w-0 flex-shrink-0 items-center justify-center rounded-full !bg-gradient-to-br !from-yellow400 !via-gold500 !to-gold600 !p-0 shadow-button-lg transition-all duration-200 hover:shadow-buttonHover active:scale-90"}
              aria-label={copy.common.addToCart}
            >
              <PlusIcon size={18} className="text-white" />
            </Button>
          ) : (
            <div className="flex h-9 flex-shrink-0 items-center rounded-xl bg-cream100 ring-1 ring-gold400/40 shadow-sm">
              <button
                type="button"
                onClick={handleDecrease}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-espresso800 transition-all active:scale-90"
                aria-label="Giảm"
              >
                <MinusIcon size={16} />
              </button>
              <span className="flex min-w-[24px] items-center justify-center text-small-sb text-espresso900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrease}
                className="product-step-up flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-yellow400 via-gold500 to-gold600 text-white shadow-sm transition-all active:scale-90"
                aria-label="Tăng"
              >
                <PlusIcon size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
