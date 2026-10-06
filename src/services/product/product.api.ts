import { apiFetch, apiUrl } from "@/services/apiClient";
import { mockListOfProduct } from "./product.mock";
import { mockListOfSubCategory } from "../category/category.mock";
import { menuImages } from "./menu-images";
async function liveMenu() {
  const base = ("/api/commerce").replace(/\/$/, "");
  const response = await apiFetch(base + "/menu");
  if (!response.ok) throw new Error("Menu API unavailable (" + response.status + ")");
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("Invalid menu data");
  return rows.map((row: any) => {
    const imageUrl =
      [
        row.imageUrl,
        row.image,
        row.thumbnail,
        menuImages[row.id],
        mockListOfProduct.find((p) => p.id === row.id)?.imageUrl,
        mockListOfProduct.find((p) => p.id === row.id)?.image,
      ].find((v) => typeof v === "string" && v.trim()) || "";
    return {
      ...mockListOfProduct.find((p) => p.id === row.id),
      ...row,
      imageUrl: imageUrl.startsWith("/api/") || imageUrl.startsWith("/images/") ? apiUrl(imageUrl) : imageUrl,
      image: imageUrl.startsWith("/api/") || imageUrl.startsWith("/images/") ? apiUrl(imageUrl) : imageUrl,
      features: row.features || [],
      variantGroups: row.variantGroups || [],
    };
  }) as typeof mockListOfProduct;
}

export const productService = {
  getProducts: async (categoryId: string, featureId: string) => {
    const filteredProducts = (await liveMenu()).filter(
      (product) =>
        (categoryId === "all" || product.categoryId === categoryId) &&
        (featureId ? product.features.includes(featureId) : true),
    );
    return filteredProducts;
  },

  getProductById: async (productId: string | number) => {
    const product = (await liveMenu()).find(
      (product) => product.id === Number(productId),
    );
    if (!product) {
      throw new Error(`Product with id ${productId} not found`);
    }
    return product;
  },

  getProductsBySubCategory: async (subCategoryId: string) => {
    const filteredProducts = (await liveMenu()).filter(
      (product) => product.subCategoryId === subCategoryId,
    );
    return filteredProducts;
  },

  getProductsGroupBySubCategory: async (
    categoryId: string,
    featureId: string,
  ) => {
    const filteredProducts = (await liveMenu()).filter(
      (product) =>
        (categoryId === "all" || product.categoryId === categoryId) &&
        (featureId ? product.features.includes(featureId) : true),
    );

    if (filteredProducts.length === 0) return [];

    const groupsMap: Record<
      string,
      { id: string; name: string; products: typeof filteredProducts }
    > = {};

    filteredProducts.forEach((product) => {
      const subCatId = product.subCategoryId || "all-products";
      if (!groupsMap[subCatId]) {
        const subCat = mockListOfSubCategory.find((sc) => sc.id === subCatId);
        groupsMap[subCatId] = {
          id: subCatId,
          name:
            subCat?.name ||
            (subCatId === "all-products" ? "Tất cả sản phẩm" : "Sản phẩm"),
          products: [],
        };
      }
      groupsMap[subCatId].products.push(product);
    });

    const orderIndex = mockListOfSubCategory.map((sc) => sc.id);
    return Object.values(groupsMap).sort((a, b) => {
      const ai = orderIndex.indexOf(a.id);
      const bi = orderIndex.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  },
};
