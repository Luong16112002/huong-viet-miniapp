import { Link } from "react-router-dom";
import type { HomeContent } from "@/services/home/home-content";
import { MenuIcon } from "../menu/menu-components";
import { SectionHeading } from "./section-heading";
export function CategorySection({
  categories,
}: {
  categories: HomeContent["categories"];
}) {
  return (
    <section className="hv-home-categories">
      <SectionHeading
        title="Danh mục món ăn"
        description="Khám phá thực đơn phong phú của chúng tôi"
      />
      <nav aria-label="Danh mục món ăn">
        {categories
          .filter((c) => c.id !== "dessert")
          .map((c) => (
            <Link
              className={c.id === "all" ? "is-selected" : undefined}
              to={`/menu?category=${encodeURIComponent(c.id)}`}
              key={c.id}
            >
              <MenuIcon name={c.icon} />
              <span>{c.name}</span>
            </Link>
          ))}
      </nav>
    </section>
  );
}
