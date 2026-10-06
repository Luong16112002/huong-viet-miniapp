export interface VariantOption {
  id: string;
  name: string;
  extraPrice: number;
  image?: string;
  defaultValue?: string | number | boolean;
  value?: string | number;
  maxValue?: string | number;
  step?: number;
}

export interface VariantGroup {
  id: string;
  title: string;
  description: string;
  type: "SINGLE" | "MULTIPLE" | "ADJUSTMENT" | "QUANTITY";
  isRequired: boolean;
  options: VariantOption[];
}

export interface ProductFeature {
  id: string;
  name: string;
  icon?: string;
}

export interface ProductSales {
  freeShipping?: boolean;
  discount?: number;
  specialPrice?: number;
}

export interface Product {
  imageUrl?: string;
  unit?: string;
  category?: string;
  suitableFor?: string[];
  suitableForChildren?: boolean | null;
  childNotes?: string | null;
  notSuitableFor?: string[];
  customizations?: string[];
  servingSize?: string;
  calories?: number | null;
  available?: boolean;
  pairings?: string[];
  drinkPairings?: string[];
  ingredients?: string[];
  ingredientsSource?: "menu_description" | "restaurant_verified";
  ingredientsComplete?: boolean;
  ingredientsEvidence?: string;
  spicyLevel?: string;
  allergens?: string[];
  nutrition?: Record<string, string | number | null>;
  availableOptions?: string[];
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  variantGroups: VariantGroup[];
  imageIsIllustration?: boolean;
  features: string[];

  newMarked?: boolean;
  sales?: ProductSales;

  categoryId: string;
  subCategoryId: string;
}
