import { ingredientCatalog } from "./ingredients";
import { hotpotProducts } from "./hotpot-menu";
import dish21 from "@/static/products/dish-21.webp";
import dish22 from "@/static/products/dish-22.webp";
import dish23 from "@/static/products/dish-23.webp";
import dish24 from "@/static/products/dish-24.webp";
import dish25 from "@/static/products/dish-25.webp";
import dish26 from "@/static/products/dish-26.webp";
import dish27 from "@/static/products/dish-27.webp";
import dish28 from "@/static/products/dish-28.webp";
import dish29 from "@/static/products/dish-29.webp";
import dish30 from "@/static/products/dish-30.webp";
import dish31 from "@/static/products/dish-31.webp";
import dish32 from "@/static/products/dish-32.webp";
import { Product, ProductFeature } from "@/types/product.types";
import { expandedMenu } from "./expanded-menu.mock";
import { menuImages } from "./menu-images";

export const mockProductFeature: ProductFeature[] = [
  {
    id: "ice",
    name: "Đá",
  },
  {
    id: "hot",
    name: "Nóng",
  },
  {
    id: "spicy",
    name: "Cay",
  },
  {
    id: "vegetarian",
    name: "Chay",
  },
  {
    id: "bestseller",
    name: "Bán chạy",
  },
  {
    id: "new",
    name: "Mới",
  },
];

const originalProducts: Product[] = [
  {
    id: 21,
    categoryId: "main-dish",
    subCategoryId: "pho-bun",
    name: "Phở gà",
    unit: "phần",
    spicyLevel: "Không cay",
    allergens: ["Có thể chứa gluten tùy loại bánh phở/nước dùng"],
    suitableFor: ["người không ăn cay", "trẻ em nếu không dị ứng thành phần"],
    notSuitableFor: [],
    customizations: ["ít hành", "không hành", "thêm rau"],
    servingSize: "1 người",
    calories: null,
    available: true,
    pairings: ["quẩy", "rau thêm", "nước chanh"],
    price: 59000,
    description: "Phở gà xé với nước dùng thanh ngọt, hành lá và rau thơm.",
    image: dish21,
    variantGroups: [],
    features: [],
    newMarked: true,
  },
  {
    id: 22,
    categoryId: "main-dish",
    subCategoryId: "mon-xao",
    name: "Bò xào nấm",
    price: 85000,
    description: "Thịt bò mềm xào nấm tươi, hành tây và rau củ.",
    image: dish22,
    variantGroups: [],
    features: [],
    newMarked: true,
  },
  {
    id: 23,
    categoryId: "main-dish",
    subCategoryId: "canh-chao",
    name: "Cháo gà nấm hương",
    price: 55000,
    description: "Cháo gà nóng hổi với nấm hương, hành lá và tiêu.",
    image: dish23,
    variantGroups: [],
    features: [],
    newMarked: true,
  },
  {
    id: 24,
    categoryId: "main-dish",
    subCategoryId: "com",
    name: "Cơm chiên hải sản",
    price: 69000,
    description: "Cơm chiên tơi hạt với tôm, mực, trứng và rau củ.",
    image: dish24,
    variantGroups: [],
    features: [],
    newMarked: true,
  },
  {
    id: 25,
    categoryId: "starter",
    subCategoryId: "cha-gio",
    name: "Nem nướng",
    price: 65000,
    description: "Nem nướng thơm lừng, ăn cùng rau sống và nước chấm.",
    image: dish25,
    variantGroups: [],
    features: [],
    newMarked: true,
  },
  {
    id: 26,
    categoryId: "starter",
    subCategoryId: "banh-mi",
    name: "Bánh mì gà nướng",
    price: 39000,
    description: "Bánh mì giòn với gà nướng, dưa leo và đồ chua.",
    image: dish26,
    variantGroups: [],
    features: [],
    newMarked: true,
  },
  {
    id: 27,
    categoryId: "drink",
    subCategoryId: "ca-phe",
    name: "Bạc xỉu",
    price: 35000,
    description: "Cà phê sữa dịu nhẹ, thơm béo, dùng cùng đá viên.",
    image: dish27,
    variantGroups: [],
    features: [],
    newMarked: true,
  },
  {
    id: 28,
    categoryId: "drink",
    subCategoryId: "tra",
    name: "Trà đào cam sả",
    price: 39000,
    description: "Trà đào thanh mát với cam tươi và hương sả.",
    image: dish28,
    variantGroups: [],
    features: [],
    newMarked: true,
  },
  {
    id: 29,
    categoryId: "drink",
    subCategoryId: "sinh-to",
    name: "Nước ép cam",
    price: 35000,
    description: "Cam tươi ép nguyên chất, vị chua ngọt tự nhiên.",
    image: dish29,
    variantGroups: [],
    features: [],
    newMarked: true,
  },
  {
    id: 30,
    categoryId: "drink",
    subCategoryId: "nuoc-ngot",
    name: "Soda chanh",
    price: 29000,
    description: "Soda mát lạnh với chanh tươi và lá bạc hà.",
    image: dish30,
    variantGroups: [],
    features: [],
    newMarked: true,
  },
  {
    id: 31,
    categoryId: "dessert",
    subCategoryId: "che",
    name: "Chè hạt sen",
    price: 29000,
    description: "Hạt sen mềm bùi nấu đường phèn, vị ngọt thanh.",
    image: dish31,
    variantGroups: [],
    features: [],
    newMarked: true,
  },
  {
    id: 32,
    categoryId: "dessert",
    subCategoryId: "banh-trang-mieng",
    name: "Sữa chua nếp cẩm",
    price: 29000,
    description: "Sữa chua mát lạnh kết hợp nếp cẩm dẻo thơm.",
    image: dish32,
    variantGroups: [],
    features: [],
    newMarked: true,
  },
  {
    id: 1,
    categoryId: "main-dish",
    subCategoryId: "bo-nuong",
    description:
      "Thịt bò tươi ngon, cuốn lá lốt, nướng trên than hoa, kèm rượu đắng và nước mắm chấm đặc biệt.",
    image: menuImages[1],
    name: "Bò nướng lá lốt",
    price: 89000,
    variantGroups: [],
    features: ["bestseller"],
  },
  {
    id: 2,
    categoryId: "starter",
    subCategoryId: "goi-nham",
    description:
      "Gỏi cuốn tươi mát với tôm thịt, rau sống và bún tươi, chấm nước mắm chua ngọt.",
    image: menuImages[2],
    name: "Gỏi cuốn",
    price: 45000,
    variantGroups: [],
    features: ["new"],
    newMarked: true,
  },
  {
    id: 3,
    categoryId: "main-dish",
    subCategoryId: "mon-kho",
    description:
      "Cá kho tộ đậm đà hương vị, thơm lừng tiêu và ớt, ăn kèm cơm trắng nóng hổi.",
    image: menuImages[3],
    name: "Cá kho tộ",
    price: 79000,
    variantGroups: [],
    features: [],
  },
  {
    id: 4,
    categoryId: "main-dish",
    subCategoryId: "pho-bun",
    description:
      "Phở bò truyền thống với nước dùng xương ống đậm đà, thịt bò tái và rau thơm.",
    image: menuImages[4],
    name: "Phở bò",
    price: 65000,
    variantGroups: [],
    features: ["bestseller"],
  },
  {
    id: 5,
    categoryId: "main-dish",
    subCategoryId: "canh-chao",
    description:
      "Canh chua cá lóc miền Nam chua ngọt vừa ăn, kèm đậu bắp, cà chua và rau thơm.",
    image: menuImages[5],
    name: "Canh chua cá",
    price: 65000,
    variantGroups: [],
    features: [],
  },
  {
    id: 6,
    categoryId: "main-dish",
    subCategoryId: "pho-bun",
    description:
      "Bún chả Hà Nội truyền thống với chả nướng thơm lừng, nước mắm chua ngọt và rau sống.",
    image: menuImages[6],
    name: "Bún chả",
    price: 65000,
    variantGroups: [],
    features: ["bestseller"],
  },
  {
    id: 7,
    categoryId: "starter",
    subCategoryId: "cha-gio",
    description:
      "Chả giò (nem rán) giòn rụm, nhân thịt và rau củ, chấm nước mắm chua ngọt.",
    image: menuImages[7],
    name: "Chả giò",
    price: 55000,
    variantGroups: [],
    features: [],
  },
  {
    id: 8,
    categoryId: "drink",
    subCategoryId: "ca-phe",
    description:
      "Cà phê sữa đá thơm béo, đậm đà hương vị cà phê Robusta Việt Nam.",
    image: menuImages[8],
    name: "Cà phê sữa đá",
    price: 30000,
    variantGroups: [],
    features: [],
  },
  {
    id: 9,
    categoryId: "drink",
    subCategoryId: "sinh-to",
    description:
      "Sinh tố bơ tươi ngon, thơm béo từ bơ sáp, xay nhuyễn với sữa đặc và đá.",
    image: menuImages[9],
    name: "Sinh tố bơ",
    price: 35000,
    variantGroups: [],
    features: [],
  },
  {
    id: 10,
    categoryId: "starter",
    subCategoryId: "banh-mi",
    description:
      "Bánh mì thịt nguội kẹp pa tê, chả lụa, dưa leo, cà chua, rau mùi và đồ chua.",
    image: menuImages[10],
    name: "Bánh mì thịt",
    price: 35000,
    variantGroups: [],
    features: [],
  },
  {
    id: 11,
    categoryId: "main-dish",
    subCategoryId: "pho-bun",
    description:
      "Bún bò Huế đặc sản miền Trung, nước dùng đậm đà, thịt bò, giò heo và chả cua.",
    image: menuImages[11],
    name: "Bún bò Huế",
    price: 75000,
    variantGroups: [],
    features: ["bestseller", "spicy"],
  },
  {
    id: 12,
    categoryId: "drink",
    subCategoryId: "tra",
    description: "Trà đá thơm mát, giải nhiệt ngày hè, uống kèm đá viên lạnh.",
    image: menuImages[12],
    name: "Trà đá",
    price: 15000,
    variantGroups: [],
    features: [],
  },
  {
    id: 13,
    categoryId: "main-dish",
    subCategoryId: "bo-nuong",
    description:
      "Thịt bò Mỹ nướng than hoa, mềm thơm, chấm muối tiêu và rượu đắng Quảng Bình.",
    image: menuImages[13],
    name: "Bò nướng than",
    price: 125000,
    variantGroups: [],
    features: ["bestseller"],
  },
  {
    id: 14,
    categoryId: "main-dish",
    subCategoryId: "mon-kho",
    description:
      "Thịt kho tàu đậm đà với thịt ba chỉ mềm và trứng vịt, ăn kèm cơm trắng.",
    image: menuImages[14],
    name: "Thịt kho tàu",
    price: 65000,
    variantGroups: [],
    features: [],
  },
  {
    id: 15,
    categoryId: "main-dish",
    subCategoryId: "com",
    description:
      "Cơm tấm Sài Gòn với sườn nướng, bì, chả trứng, dưa leo và nước mắm chua ngọt.",
    image: menuImages[15],
    name: "Cơm tấm sườn nướng",
    price: 59000,
    variantGroups: [],
    features: [],
  },
  {
    id: 16,
    categoryId: "main-dish",
    subCategoryId: "mon-xao",
    description:
      "Rau muống xào tỏi giòn ngọt, thơm tỏi phi vàng, món rau dân dã Việt Nam.",
    image: menuImages[16],
    name: "Rau muống xào tỏi",
    price: 45000,
    variantGroups: [],
    features: ["vegetarian"],
  },
  {
    id: 17,
    categoryId: "dessert",
    subCategoryId: "che",
    description:
      "Chè ba màu đậu đỏ, đậu xanh, sương sáo thơm béo, kèm dừa nướng và nước cốt dừa.",
    image: menuImages[17],
    name: "Chè ba màu",
    price: 25000,
    variantGroups: [],
    features: [],
  },
  {
    id: 18,
    categoryId: "dessert",
    subCategoryId: "banh-trang-mieng",
    description:
      "Bánh flan caramel mềm mịn, thơm mùi vani và trứng, dùng kèm caramel đắng nhẹ.",
    image: menuImages[18],
    name: "Bánh flan caramel",
    price: 20000,
    variantGroups: [],
    features: [],
  },
  {
    id: 19,
    categoryId: "drink",
    subCategoryId: "nuoc-ngot",
    description:
      "Nước mía đường thốt nốt, ép từ mía tươi, thêm đá viên lạnh giải nhiệt.",
    image: menuImages[19],
    name: "Nước mía đường",
    price: 20000,
    variantGroups: [],
    features: [],
  },
  {
    id: 20,
    categoryId: "starter",
    subCategoryId: "goi-nham",
    description:
      "Gỏi gà bắp cải trộn nước mắm chua ngọt, thêm ớt và hành phi thơm lừng.",
    image: menuImages[20],
    name: "Gỏi gà",
    price: 55000,
    variantGroups: [],
    features: ["new"],
  },
];

export const mockListOfProduct: Product[] = [
  ...originalProducts.map((product) => ({
    ...product,
    image: menuImages[product.id] || product.image,
  })),
  // Demo entry for the new menu category; replace with restaurant-verified data before publishing.
  ...hotpotProducts,
  ...expandedMenu.map((entry): Product => {
    const representative = originalProducts.find(
      (product) => product.subCategoryId === entry.subCategoryId,
    );
    if (!representative) {
      throw new Error(`Unknown sample menu group: ${entry.subCategoryId}`);
    }
    return {
      ...entry,
      categoryId: representative.categoryId,
      image: menuImages[entry.id],
      variantGroups: [],
      features: [],
    };
  }),
].map((product) => ({
  ...product,
  imageUrl: product.imageUrl || product.image,
  ingredients: ingredientCatalog[product.id] || product.ingredients || [],
  ingredientsSource: "menu_description" as const,
  ingredientsComplete: false,
  ingredientsEvidence: product.description,
}));
