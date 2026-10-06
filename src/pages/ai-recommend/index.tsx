import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "zmp-ui";
import Header from "@/components/layout/header";

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z" fill="currentColor" fillOpacity="0.9" />
      <path d="M19 15L20 17.5L22.5 18.5L20 19.5L19 22L18 19.5L15.5 18.5L18 17.5L19 15Z" fill="currentColor" fillOpacity="0.9" />
    </svg>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  const selectedLabel = options.find((o) => o.value === value)?.label || value;
  return (
    <div className="relative">
      <label className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 xxxsmall-sb text-text-tertiary transition-all duration-150 bg-white px-1 z-10 peer-focus-within:-top-2 peer-focus-within:translate-y-0 peer-focus-within:xxxsmall peer-focus-within:text-[#18552F] peer-focus-within:font-semibold"
        style={
          value
            ? {
                top: "0px",
                transform: "translateY(0)",
                fontSize: "11px",
                fontWeight: 600,
                color: "#18552F",
              }
            : undefined
        }
      >
        {label}
      </label>
      <div className="relative peer">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border-[1.5px] border-neutral200 bg-white px-4 pt-4 pb-2 pr-10 small-m text-espresso900 focus:border-[#2F8A4F] focus:outline-none focus:ring-2 focus:ring-green200 transition-all"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">
          <ChevronDownIcon />
        </div>
      </div>
    </div>
  );
}

const PEOPLE_OPTIONS = [
  { value: "1", label: "1 người" },
  { value: "2", label: "2 người" },
  { value: "3", label: "3 người" },
  { value: "4", label: "4 người" },
  { value: "5", label: "5 người" },
  { value: "6", label: "6 người" },
  { value: "8", label: "8 người" },
  { value: "10", label: "10+ người" },
];

const BUDGET_OPTIONS = [
  { value: "200000", label: "200.000đ" },
  { value: "300000", label: "300.000đ" },
  { value: "400000", label: "400.000đ" },
  { value: "500000", label: "500.000đ" },
  { value: "600000", label: "600.000đ" },
  { value: "800000", label: "800.000đ" },
  { value: "1000000", label: "1.000.000đ" },
  { value: "1500000", label: "1.500.000đ+" },
];

const COURSES_OPTIONS = [
  { value: "2", label: "2 món" },
  { value: "3", label: "3 món" },
  { value: "4", label: "4 món" },
  { value: "5", label: "5 món (đầy đủ)" },
];

const DISH_TYPE_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "món_kho", label: "Món kho/rim" },
  { value: "món_nướng", label: "Món nướng" },
  { value: "món_xào", label: "Món xào" },
  { value: "canh_chua", label: "Canh, cháo" },
  { value: "goi_salad", label: "Gỏi, salad" },
  { value: "mon_chay", label: "Món chay" },
];

const SPICY_OPTIONS = [
  { value: "0", label: "Không cay" },
  { value: "1", label: "Ít cay" },
  { value: "2", label: "Cay vừa" },
  { value: "3", label: "Cay" },
  { value: "4", label: "Rất cay" },
];

interface RecommendedDish {
  id: string;
  name: string;
  image: string;
  portions: number;
  price: number;
  prepTime: number;
}

const RECOMMENDED_DISHES: RecommendedDish[] = [
  {
    id: "dish-1",
    name: "Bò nướng lá lốt",
    image:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vietnamese%20bo%20nuong%20la%20lot%20grilled%20beef%20in%20betel%20leaf%20food%20photography%20top%20view%20white%20plate&image_size=square",
    portions: 2,
    price: 178000,
    prepTime: 2,
  },
  {
    id: "dish-2",
    name: "Gỏi cuốn",
    image:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vietnamese%20goi%20cuon%20fresh%20spring%20rolls%20with%20shrimp%20peanut%20sauce%20food%20photography%20white%20plate&image_size=square",
    portions: 1,
    price: 45000,
    prepTime: 1,
  },
  {
    id: "dish-3",
    name: "Canh chua cá",
    image:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vietnamese%20canh%20chua%20ca%20sour%20fish%20soup%20pineapple%20tomato%20okra%20food%20photography%20ceramic%20bowl&image_size=square",
    portions: 1,
    price: 189000,
    prepTime: 1,
  },
];

const ESTIMATED_TOTAL = 412000;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export default function AiRecommendPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();

  const [people, setPeople] = useState("4");
  const [budget, setBudget] = useState("600000");
  const [courses, setCourses] = useState("3");
  const [dishType, setDishType] = useState("all");
  const [spicy, setSpicy] = useState("0");
  const [specialRequest, setSpecialRequest] = useState("Không hành, không tỏi");
  const [showRecommendation, setShowRecommendation] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowRecommendation(true);
      openSnackbar({ text: "AI đã đề xuất thực đơn cho bạn!", type: "success" });
    }, 1200);
  };

  const handleAddAllToCart = () => {
    openSnackbar({
      text: `Đã thêm ${RECOMMENDED_DISHES.length} món vào giỏ hàng`,
      type: "success",
    });
    setTimeout(() => navigate("/cart"), 400);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background">
      <Header title="Đề xuất món ăn" back />

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-scroll pb-32">
        <div className="px-4 pt-4 flex flex-col gap-4">
          <div className="rounded-2xl border border-green100/80 bg-white p-5 shadow-card-sm">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2F8A4F] to-[#18552F] text-white shadow-glow">
                <SparkleIcon />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="small-sb text-espresso900">Tùy chỉnh yêu cầu</h2>
                <p className="xxxsmall text-text-tertiary">
                  AI sẽ tư vấn thực đơn phù hợp nhất cho bạn
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <SelectField
                label="Số người"
                value={people}
                options={PEOPLE_OPTIONS}
                onChange={setPeople}
              />

              <SelectField
                label="Ngân sách"
                value={budget}
                options={BUDGET_OPTIONS}
                onChange={setBudget}
              />

              <SelectField
                label="Số món"
                value={courses}
                options={COURSES_OPTIONS}
                onChange={setCourses}
              />

              <SelectField
                label="Loại món"
                value={dishType}
                options={DISH_TYPE_OPTIONS}
                onChange={setDishType}
              />

              <SelectField
                label="Mức độ cay"
                value={spicy}
                options={SPICY_OPTIONS}
                onChange={setSpicy}
              />

              <div className="relative">
                <label
                  className="pointer-events-none absolute left-4 top-4 xxxsmall-sb text-[#18552F] transition-all duration-150 bg-white px-1 z-10 font-semibold"
                  style={{
                    top: "0px",
                    transform: "translateY(0)",
                    fontSize: "11px",
                  }}
                >
                  Yêu cầu đặc biệt
                </label>
                <textarea
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  rows={3}
                  placeholder="Không hành, không tỏi…"
                  className="w-full resize-none rounded-xl border-[1.5px] border-neutral200 bg-white px-4 pt-4 pb-2 pr-4 small-m text-espresso900 placeholder:text-text-tertiary focus:border-[#2F8A4F] focus:outline-none focus:ring-2 focus:ring-green200 transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F8A4F] py-3.5 small-sb text-white shadow-button hover:bg-[#216C3B] active:scale-[0.98] transition-all disabled:opacity-60"
              style={{ boxShadow: "0 4px 14px rgba(47, 138, 79, 0.42), 0 2px 6px rgba(47, 138, 79, 0.25)" }}
            >
              {isGenerating ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  AI đang tư vấn…
                </>
              ) : (
                <>
                  <SparkleIcon />
                  Đề xuất món ăn
                </>
              )}
            </button>
          </div>

          {showRecommendation && (
            <div className="rounded-2xl border border-green100/80 bg-white p-5 shadow-card-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber100 to-orange100 text-orange600 ring-1 ring-orange200/60">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.3 5.8 22l2.4-8.1L2 9.4h7.6L12 2Z" fill="currentColor" fillOpacity="0.85" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="small-sb text-espresso900">Thực đơn đề xuất</h3>
                    <p className="xxxsmall text-text-tertiary">
                      {RECOMMENDED_DISHES.length} món · Dành cho {people} người
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-green100 px-2.5 py-1 xxxsmall-sb text-[#18552F] border border-green200">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2F8A4F] animate-pulse" />
                  AI suggest
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {RECOMMENDED_DISHES.map((dish) => (
                  <div
                    key={dish.id}
                    onClick={() => navigate(`/product/${dish.id}`)}
                    className="flex items-center gap-3 rounded-xl border border-green100/70 bg-gradient-to-br from-white to-green50/50 p-2.5 hover:shadow-card-sm active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl ring-2 ring-white shadow-sm">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between gap-2 min-w-0">
                      <div className="flex flex-col gap-0.5">
                        <span className="small-sb text-espresso900 truncate">
                          {dish.name}
                        </span>
                        <div className="inline-flex items-center gap-1.5 mt-0.5">
                          <UsersIcon className="text-[#2F8A4F]" />
                          <span className="xxxsmall-m text-text-secondary">
                            {dish.portions} phần
                          </span>
                          <span className="h-1 w-1 rounded-full bg-text-tertiary mx-0.5" />
                          <ClockIcon className="text-text-tertiary" />
                          <span className="xxxsmall-m text-text-secondary">
                            {dish.prepTime} phút
                          </span>
                        </div>
                      </div>
                      <span
                        className="text-[#18552F]"
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          fontFamily: "'Noto Serif', serif",
                        }}
                      >
                        {formatCurrency(dish.price)}₫
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-gradient-to-r from-green50 via-white to-green50 border border-green200/70 p-4 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="xxxsmall-sb uppercase tracking-wide text-text-tertiary">
                    Tổng tiền dự kiến
                  </span>
                  <span className="xxxsmall text-text-tertiary">(chưa bao gồm VAT)</span>
                </div>
                <span
                  className="text-[#18552F]"
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    fontFamily: "'Noto Serif', 'Times New Roman', serif",
                  }}
                >
                  {formatCurrency(ESTIMATED_TOTAL)}₫
                </span>
              </div>

              <button
                onClick={handleAddAllToCart}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F8A4F] py-3.5 small-sb text-white shadow-button hover:bg-[#216C3B] active:scale-[0.98] transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                  <circle cx="17" cy="20" r="1.5" fill="currentColor" />
                </svg>
                Thêm tất cả vào giỏ hàng
              </button>
            </div>
          )}
        </div>

        <div className="px-4 pb-8 pt-4">
          <div className="rounded-xl border border-green200/50 bg-green50/70 px-4 py-3 flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#2F8A4F] flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="xxxsmall leading-relaxed text-[#18552F]/90">
              Đề xuất từ AI chỉ mang tính tham khảo. Thực đơn, giá cả và thời gian chế biến
              thực tế có thể thay đổi tùy tình trạng nhà hàng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
