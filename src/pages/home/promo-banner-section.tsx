import { Link } from "react-router-dom";
import type { HomeContent } from "@/services/home/home-content";
export function PromoBannerSection({
  promotions,
  products,
}: {
  promotions: HomeContent["promotions"];
  products: Product[];
}) {
  if (!promotions.length) return null;
  return (
    <section className="hv-home-promotions" aria-label="Ưu đãi và combo">
      {promotions.map((p) => (
        <Link to={p.route} className={`hv-home-promo ${p.tone}`} key={p.id}>
          {products.find((food) => food.id === p.foodId)?.image && (
            <img
              src={products.find((food) => food.id === p.foodId)!.image}
              alt=""
              loading="lazy"
            />
          )}
          <div>
            <small>{p.eyebrow}</small>
            <h2>{p.title}</h2>
            <p>{p.description}</p>
            <span>{p.action} →</span>
          </div>
        </Link>
      ))}
    </section>
  );
}
