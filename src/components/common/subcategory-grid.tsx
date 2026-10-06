import { SubCategory } from "@/types/category.types";
import { cn } from "@/utils/cn";

const SUBCATEGORY_EMOJI: Record<string, string> = {
  "bo-nuong": "🍖",
  "mon-kho": "🍲",
  "pho-bun": "🍜",
  "mon-xao": "🥢",
  "canh-chao": "🥣",
  com: "🍚",
  "goi-nham": "🥗",
  "cha-gio": "🥟",
  "banh-mi": "🥖",
  "ca-phe": "☕",
  tra: "🍵",
  "sinh-to": "🥤",
  "nuoc-ngot": "🧃",
  che: "🍧",
  "banh-trang-mieng": "🍰",
};

interface SubCategoryGridProps {
  subcategories: SubCategory[];
  onSubCategoryClick?: (subcategory: SubCategory) => void;
}

export default function SubCategoryGrid({
  subcategories,
  onSubCategoryClick,
}: SubCategoryGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-lg border-2 border-components-sub_cate-border/20 bg-white px-3 py-4">
      {subcategories.map((subcategory) => (
        <button
          type="button"
          title={subcategory.name}
          key={subcategory.id}
          className={cn(
            "flex min-w-0 cursor-pointer flex-col items-center justify-center gap-2 border-0 bg-transparent transition-opacity active:opacity-50",
          )}
          onClick={() => onSubCategoryClick?.(subcategory)}
        >
          {subcategory.image ? (
            <img
              draggable={false}
              className="size-10 rounded-xl object-cover"
              src={subcategory.image}
              alt={subcategory.name}
              onError={(event) => {
                event.currentTarget.style.display = "none";
                event.currentTarget.nextElementSibling?.removeAttribute("hidden");
              }}
            />
          ) : null}
          <span
            hidden={Boolean(subcategory.image)}
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-green50 to-cream100 text-[25px] shadow-inner ring-1 ring-primary200/50"
          >
            {SUBCATEGORY_EMOJI[subcategory.id] || "🍽️"}
          </span>
          <div className="w-full whitespace-normal text-center text-[12px] leading-snug">
            {subcategory.name}
          </div>
        </button>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-lg border-2 border-components-sub_cate-border/20 bg-white px-3 py-4">
      {Array.from({ length: 8 }).map((subcategory, index) => (
        <div
          key={index}
          className={cn(
            "flex flex-col items-center justify-center gap-2 transition-opacity active:opacity-50",
          )}
        >
          <div className="size-10 animate-pulse bg-background"></div>
          <div className="invisible w-full truncate text-center text-[12px]">
            loading
          </div>
        </div>
      ))}
    </div>
  );
}

SubCategoryGrid.Skeleton = Skeleton;
