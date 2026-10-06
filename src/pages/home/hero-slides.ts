import restaurantImage from "@/static/home-hero-hometown.webp";
import familyImage from "@/static/home-hero-family.webp";
import chefImage from "@/static/home-hero-ai-chef.webp";

export const heroSlides = [
  {
    id: 1,
    subtitle: "Hương vị quê nhà",
    title: "Ngon như bữa cơm nhà",
    description: "Mỗi món ăn là một câu chuyện Việt",
    buttonText: "Khám phá thực đơn",
    action: "menu",
    image: restaurantImage,
    imageAlt: "Ảnh minh họa bữa cơm quê nhà với thịt nướng, cơm trắng và ấm trà dưới ánh đèn lồng",
  },
  {
    id: 2,
    subtitle: "Ấm lòng sum vầy",
    title: "Bữa ngon, thêm gắn kết",
    description: "Dành cho những bữa cơm đủ đầy",
    buttonText: "Đặt bàn hôm nay",
    action: "booking",
    image: familyImage,
    imageAlt: "Ảnh minh họa bữa cơm Việt sum vầy với cá kho, canh rau và cơm trắng",
  },
  {
    id: 3,
    subtitle: "Đầu bếp của riêng bạn",
    title: "Chọn món ngon, đúng gu",
    description: "Để AI Chef đồng hành cùng bữa ăn yêu thích",
    buttonText: "Hỏi AI Chef",
    action: "ai-chef",
    image: chefImage,
    imageAlt: "Ảnh minh họa đầu bếp chuẩn bị gà nướng sả trong không gian nhà hàng Việt",
  },
] as const;

export const heroRoutes = {
  menu: "/menu?category=all",
  booking: "/reservation",
  "ai-chef": "/ai-chat",
} as const;
