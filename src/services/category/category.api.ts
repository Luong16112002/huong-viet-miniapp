import { mockListOfCategory, mockListOfSubCategory } from "./category.mock";

export const categoryService = {
  getCategories: async () => {
    return mockListOfCategory;
  },

  getSubCategories: async (categoryId?: string) => {
    if (!categoryId || categoryId === "all") {
      return mockListOfSubCategory;
    }
    return mockListOfSubCategory.filter(
      (sc) => sc.categoryId === categoryId,
    );
  },
};
