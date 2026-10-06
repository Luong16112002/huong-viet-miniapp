import { Product } from "@/types/product.types";
export const categories = [
  {
    id: "all",
    name: "Tất cả",
    icon: "all",
    description: "Tinh hoa ẩm thực Việt, cho mỗi bữa sum vầy",
  },
  {
    id: "grill",
    name: "Món nướng",
    icon: "flame",
    description: "Thơm ngon đậm vị, chuẩn hương Việt",
  },
  {
    id: "starter",
    name: "Khai vị",
    icon: "leaf",
    description: "Nhẹ nhàng khai vị, đánh thức vị giác",
  },
  {
    id: "main-dish",
    name: "Món chính",
    icon: "bowl",
    description: "Món ngon tròn vị, ấm lòng bữa cơm Việt",
  },
  {
    id: "seafood",
    name: "Hải sản",
    icon: "fish",
    description: "Hương vị biển trong từng món ngon",
  },
  {
    id: "hotpot",
    name: "Lẩu",
    icon: "pot",
    description: "Quây quần bên nồi lẩu, ấm áp tình thân",
  },
  {
    id: "rice",
    name: "Cơm",
    icon: "bowl",
    description: "Dẻo thơm hạt gạo, đậm đà hương quê",
  },
  {
    id: "drink",
    name: "Nước uống",
    icon: "drink",
    description: "Thanh mát, tươi ngon, trọn vị bữa ăn",
  },
  {
    id: "dessert",
    name: "Tráng miệng",
    icon: "cake",
    description: "Chút ngọt ngào khép lại bữa ngon",
  },
];
export const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
export const isPopular = (p: Product) => p.features.includes("bestseller");
export const isNew = (p: Product) =>
  !!p.newMarked || p.features.includes("new");
export function matchesCategory(p: Product, id: string) {
  if (id === "all") return true;
  if (id === "grill") return p.subCategoryId === "bo-nuong";
  if (id === "rice") return p.subCategoryId === "com";
  if (id === "hotpot") return /\blau\b/.test(normalize(p.name));
  if (id === "seafood")
    return (
      p.categoryId === "main-dish" &&
      /\b(tom|muc|ca|hai san|ngheu|so diep|cua)\b/.test(normalize(p.name))
    );
  return p.categoryId === id;
}
