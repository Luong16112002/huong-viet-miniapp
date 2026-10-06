import HOTPOT_IMAGES from "@/data/hotpot-images.json";
import type { Product, VariantGroup } from "@/types/product.types";

const group = (
  id: string,
  title: string,
  choices: [string, string, number][],
  multiple = false,
): VariantGroup => ({
  id,
  title,
  description: multiple ? "Có thể chọn nhiều" : "Chọn một tùy chọn",
  type: multiple ? "MULTIPLE" : "SINGLE",
  isRequired: !multiple,
  options: choices.map(([id, name, extraPrice], i) => ({
    id,
    name,
    extraPrice,
    defaultValue: !multiple && i === 0,
  })),
});
export const hotpotGroups = (price: number, broth: string): VariantGroup[] => [
  group("size", "Size / số người", [
    ["small", "Nhỏ · 2 người", 0],
    ["medium", "Vừa · 4 người", Math.round((price * 0.6) / 1000) * 1000],
    ["large", "Lớn · 6 người", Math.round((price * 1.2) / 1000) * 1000],
  ]),
  group("spice", "Mức cay", [
    ["none", "Không cay", 0],
    ["light", "Cay nhẹ", 0],
    ["medium", "Cay vừa", 0],
    ["hot", "Cay nhiều", 0],
  ]),
  group("broth", "Nước lẩu", [["original", broth, 0]]),
  group(
    "toppings",
    "Thêm topping",
    [
      ["beef", "Bò", 59000],
      ["shrimp", "Tôm", 69000],
      ["mushroom", "Nấm", 29000],
    ],
    true,
  ),
  group(
    "vegetables",
    "Rau thêm",
    [["vegetables", "Rau theo mùa", 19000]],
    true,
  ),
  group("noodles", "Bún / mì đi kèm", [
    ["vermicelli", "Bún tươi", 0],
    ["noodles", "Mì", 0],
  ]),
  group(
    "drinks",
    "Nước uống thêm",
    [
      ["two", "2 chai nước suối", 20000],
      ["four", "4 chai nước suối", 40000],
      ["six", "6 chai nước suối", 60000],
    ],
    true,
  ),
];
const samples: [string, number, string, string[], string, string][] = [
  [
    "Lẩu nấm rau củ",
    199000,
    "Nước dùng thanh ngọt, nấm tươi và rau củ đầy sắc màu.",
    ["Nấm", "Đậu phụ", "Bắp", "Cà rốt", "Rau cải"],
    "Nước dùng rau củ",
    "Không cay",
  ],
  [
    "Lẩu Thái hải sản",
    329000,
    "Nước lẩu Thái chua cay, tôm mực ngọt thịt, thơm sả.",
    ["Tôm", "Mực", "Vẹm", "Cà chua", "Sả", "Rau cải"],
    "Nước lẩu Thái",
    "Cay vừa",
  ],
  [
    "Lẩu bò nhúng giấm",
    299000,
    "Bò thái mỏng nhúng nước giấm dịu, ăn cùng rau tươi.",
    ["Thịt bò", "Giấm", "Hành tây", "Rau cải"],
    "Nước giấm thanh",
    "Không cay",
  ],
  [
    "Lẩu gà lá é",
    269000,
    "Gà mềm, nước dùng trong ngọt, thơm hương lá é.",
    ["Thịt gà", "Lá é", "Nấm", "Rau cải"],
    "Nước dùng gà lá é",
    "Cay nhẹ",
  ],
  [
    "Lẩu cá chua cay",
    289000,
    "Cá tươi trong nước lẩu chua cay, cà chua và rau xanh.",
    ["Cá", "Cà chua", "Ớt", "Rau cải"],
    "Nước lẩu chua cay",
    "Cay vừa",
  ],
  [
    "Lẩu riêu cua bắp bò",
    319000,
    "Riêu cua thơm béo, bắp bò mềm, đậu phụ và rau tươi.",
    ["Cua", "Bắp bò", "Đậu phụ", "Cà chua", "Rau cải"],
    "Nước riêu cua",
    "Không cay",
  ],
  [
    "Lẩu kim chi",
    279000,
    "Kim chi chua cay đậm đà, thịt heo và đậu phụ mềm.",
    ["Kim chi", "Thịt heo", "Đậu phụ", "Nấm"],
    "Nước lẩu kim chi",
    "Cay vừa",
  ],
  [
    "Lẩu hải sản đặc biệt",
    399000,
    "Tôm, cua, mực và vẹm trong nước dùng ngọt đậm vị biển.",
    ["Tôm", "Cua", "Mực", "Vẹm", "Rau cải"],
    "Nước dùng hải sản",
    "Không cay",
  ],
];
export const hotpotProducts: Product[] = samples.map(
  ([name, price, description, ingredients, broth, spicyLevel], i) => ({
    id: 121 + i,
    name,
    price,
    description,
    ingredients,
    spicyLevel,
    imageUrl: HOTPOT_IMAGES[name as keyof typeof HOTPOT_IMAGES],
    image: HOTPOT_IMAGES[name as keyof typeof HOTPOT_IMAGES],
    imageIsIllustration: true,
    categoryId: "main-dish",
    subCategoryId: "lau",
    features: i % 2 ? ["bestseller"] : ["new"],
    newMarked: i % 2 === 0,
    variantGroups: hotpotGroups(price, broth),
    availableOptions: [
      "Phần cơ bản dành cho 2 người; có size 4 và 6 người",
      "Bao gồm rau và một phần bún hoặc mì",
      `Nước lẩu: ${broth}`,
    ],
  }),
);
