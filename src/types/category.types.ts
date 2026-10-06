export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  subCategoryIds?: string[];
}
