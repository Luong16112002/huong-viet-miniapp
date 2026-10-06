import { Category } from "@/types/category.types";
import { SubCategory } from "@/types/category.types";

export const mockListOfCategory: Category[] = [
  {
    id: "all",
    name: "Tất cả",
  },
  {
    id: "main-dish",
    name: "Món chính",
  },
  {
    id: "starter",
    name: "Khai vị",
  },
  {
    id: "drink",
    name: "Đồ uống",
  },
  {
    id: "dessert",
    name: "Tráng miệng",
  },
];

export const mockListOfSubCategory: SubCategory[] = [
  { id: "lau", name: "Lẩu", categoryId: "main-dish" },
  { id: "bo-nuong", name: "Bò nướng và món nướng", categoryId: "main-dish" },
  { id: "mon-kho", name: "Món kho và rim", categoryId: "main-dish" },
  { id: "pho-bun", name: "Phở và bún", categoryId: "main-dish" },
  { id: "mon-xao", name: "Món xào", categoryId: "main-dish" },
  { id: "canh-chao", name: "Canh và cháo", categoryId: "main-dish" },
  { id: "com", name: "Cơm", categoryId: "main-dish" },
  { id: "goi-nham", name: "Gỏi và món nhắm", categoryId: "starter" },
  { id: "cha-gio", name: "Chả giò và nem", categoryId: "starter" },
  { id: "banh-mi", name: "Bánh mì", categoryId: "starter" },
  { id: "ca-phe", name: "Cà phê", categoryId: "drink" },
  { id: "tra", name: "Trà", categoryId: "drink" },
  { id: "sinh-to", name: "Sinh tố và nước ép", categoryId: "drink" },
  { id: "nuoc-ngot", name: "Nước ngọt", categoryId: "drink" },
  { id: "che", name: "Chè", categoryId: "dessert" },
  { id: "banh-trang-mieng", name: "Bánh và tráng miệng", categoryId: "dessert" },
];
