import "./category.css";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ProductGrid from "@/components/common/product-grid";
import { useSubCategories } from "@/services/category/category.queries";
import { productService } from "@/services/product/product.api";

export default function CategoryPage() {
  const { categoryId = "" } = useParams();
  const categories = useSubCategories("all");
  const category = categories.data?.find((item) => item.id === categoryId);
  const products = useQuery({
    queryKey: ["category-page-products", categoryId],
    queryFn: () => productService.getProductsBySubCategory(categoryId),
    enabled: Boolean(category),
  });

  return (
    <section key={categoryId} className="category-page relative mx-auto min-h-full w-full max-w-[760px] bg-cream50 px-4 pb-28 pt-5">
      <Link to="/menu" className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary700">
        <span aria-hidden="true">←</span> Tất cả món ăn
      </Link>
      <header className="mb-5 rounded-2xl border border-primary200/40 bg-white p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary600">Thực đơn Hương Việt</p>
        <h1 className="font-serif text-2xl font-bold text-espresso900">
          {category?.name || (categories.isPending ? "Đang tải danh mục…" : "Danh mục món ăn")}
        </h1>
        {category && <p className="mt-2 text-sm text-text-secondary">{products.data ? `${products.data.length} món · Chọn món bạn yêu thích` : "Đang tải món ăn…"}</p>}
      </header>

      {categories.isError || products.isError ? (
        <div role="alert" className="rounded-2xl bg-white p-5">
          <p>Chưa tải được danh sách món ăn.</p>
          <button type="button" className="btn-primary mt-3 px-4 py-3" onClick={() => { void categories.refetch(); void products.refetch(); }}>Thử lại</button>
        </div>
      ) : categories.isPending || (category && products.isPending) ? (
        <div role="status" aria-label="Đang tải món ăn" className="product-grid">
          {[1, 2, 3, 4].map((id) => <div key={id} className="h-60 animate-pulse rounded-2xl bg-neutral100" />)}
        </div>
      ) : !category ? (
        <p className="rounded-2xl bg-white p-5">Danh mục này không tồn tại. Hãy quay lại thực đơn để chọn nhóm món khác.</p>
      ) : products.data?.length ? (
        <ProductGrid products={products.data} />
      ) : (
        <p className="rounded-2xl bg-white p-5">Nhóm này chưa có món. Bạn hãy khám phá các nhóm bên dưới nhé.</p>
      )}

      {categories.data && <nav aria-label="Các nhóm món khác" className="mt-8">
        <h2 className="mb-3 text-base font-bold text-espresso900">Khám phá nhóm món khác</h2>
        <div className="flex flex-wrap gap-2">
          {categories.data.filter((item) => item.id !== categoryId).map((item) => (
            <Link key={item.id} to={`/menu/category/${item.id}`} className="rounded-xl border border-primary200/50 bg-white px-3 py-3 text-sm font-medium text-primary700">{item.name}</Link>
          ))}
        </div>
      </nav>}
    </section>
  );
}
