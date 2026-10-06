import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/header";

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 2L14.5 9.5H22L16 14.5L18.5 22L12 17.5L5.5 22L8 14.5L2 9.5H9.5L12 2Z" />
    </svg>
  );
}

function PinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M22 16.92V21a1 1 0 0 1-1.11 1 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 3.18 4.11 1 1 0 0 1 4.18 3h4.09a1 1 0 0 1 1 .75c.12.91.33 1.8.62 2.65a1 1 0 0 1-.23 1.05L8 9.09a16 16 0 0 0 6 6l1.64-1.64a1 1 0 0 1 1.05-.23c.85.29 1.74.5 2.65.62a1 1 0 0 1 .75 1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const RESTAURANT_IMAGES = [
  "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vietnamese%20family%20restaurant%20interior%20wooden%20tables%20green%20plants%20warm%20lighting%20cozy%20traditional%20vietnam%20decor&image_size=landscape_16_9",
  "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vietnamese%20restaurant%20exterior%20dong%20hoi%20quang%20binh%20street%20green%20garden%20evening%20warm%20atmosphere&image_size=landscape_16_9",
  "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=vietnamese%20traditional%20dining%20room%20wooden%20furniture%20bamboo%20decor%20family%20style%20restaurant%20ceramic%20bowls&image_size=landscape_16_9",
];

const INFO_ROWS = [
  {
    icon: <PinIcon className="text-[#2F8A4F]" />,
    label: "Địa chỉ",
    value: "123 Nguyễn Văn Cừ, TP. Đồng Hới, Quảng Bình",
    clickable: false,
  },
  {
    icon: <PhoneIcon className="text-[#2F8A4F]" />,
    label: "Số điện thoại",
    value: "0232 123 4567",
    clickable: true,
    href: "tel:02321234567",
  },
  {
    icon: <ClockIcon className="text-[#2F8A4F]" />,
    label: "Giờ mở cửa",
    value: "10:00 - 22:00 · Tất cả các ngày",
    clickable: false,
  },
];

export default function RestaurantPage() {
  const navigate = useNavigate();
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background">
      <Header title="Thông tin nhà hàng" back />

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-scroll pb-28">
        <div className="relative w-full flex-shrink-0">
          <div className="relative h-56 w-full overflow-hidden">
            <img
              src={RESTAURANT_IMAGES[activeImgIndex]}
              alt="Nhà hàng Hương Việt"
              className="h-full w-full object-cover transition-opacity duration-300"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#18552F]/30 via-transparent to-transparent" />
          </div>

          <div className="grid grid-cols-3 gap-1 p-3">
            {RESTAURANT_IMAGES.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImgIndex(idx)}
                className={`relative h-20 w-full overflow-hidden rounded-xl transition-all ${
                  activeImgIndex === idx ? "ring-2 ring-[#2F8A4F] ring-offset-2 ring-offset-white" : "opacity-80 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`Hình ảnh ${idx + 1}`}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="relative -mt-3 rounded-2xl border border-green100 bg-white p-5 shadow-card">
            <div className="flex items-start gap-3">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green100 to-green200 ring-2 ring-white shadow-card-sm">
                <span className="font-serif text-2xl font-bold text-[#18552F]">HV</span>
              </div>
              <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                <h1 className="heading_serif text-espresso900 leading-tight">
                  Nhà hàng Hương Việt
                </h1>
                <div className="flex items-center gap-1.5">
                  <span className="xsmall text-text-secondary">Ẩm thực Việt Nam</span>
                  <span className="h-1 w-1 rounded-full bg-text-tertiary" />
                  <span className="xsmall text-text-secondary">Nhà hàng</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber50 px-2.5 py-1 border border-amber200/70">
                    <StarIcon className="text-amber500" />
                    <span className="xxxsmall-sb text-amber700">4.8</span>
                  </div>
                  <span className="xxxsmall-m text-text-secondary">
                    1.200 đánh giá
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-green200 to-transparent" />

            <div className="mt-4 flex flex-col gap-4">
              {INFO_ROWS.map((row, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green50 ring-1 ring-green100">
                    {row.icon}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <span className="xxxsmall-sb uppercase tracking-wide text-text-tertiary">
                      {row.label}
                    </span>
                    {row.clickable && row.href ? (
                      <a
                        href={row.href}
                        className="small-sb text-[#18552F] hover:text-[#2F8A4F] transition-colors break-words"
                      >
                        {row.value}
                      </a>
                    ) : (
                      <span className="small-m text-espresso900 leading-snug break-words">
                        {row.value}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-gradient-to-br from-green50 to-white border border-green100/80 p-4">
              <h3 className="small-sb text-espresso900 mb-2 flex items-center gap-2">
                <span className="inline-block h-1 w-6 rounded-full bg-gradient-to-r from-[#2F8A4F] to-[#18552F]" />
                Giới thiệu
              </h3>
              <p className="xsmall leading-relaxed text-text-secondary">
                Nhà hàng Hương Việt tự hào mang đến tinh hoa ẩm thực Việt Nam
                truyền thống tại thành phố Đồng Hới, Quảng Bình. Với hơn 6 năm
                kinh nghiệm, đội ngũ đầu bếp tài năng cùng nguyên liệu tươi
                ngon được tuyển chọn kỹ lưỡng mỗi ngày — từ rau củ vườn nhà,
                hải sản tươi sống đến gia vị đặc sản Quảng — đảm bảo mỗi món
                ăn đều giữ trọn hương vị quê hương. Không gian nhà hàng ấm
                cúng, thân thiện, phù hợp cho cả gia đình, bạn bè và các buổi
                tiệc liên hoan, họp mặt.
              </p>
            </div>

            <button
              onClick={() => navigate("/select-location")}
              className="mt-4 inline-flex items-center gap-1.5 small-sb text-[#2F8A4F] hover:text-[#18552F] transition-colors group"
            >
              Xem vị trí trên bản đồ
              <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-green100/80 bg-white/95 backdrop-blur px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <a
            href="tel:02321234567"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#2F8A4F] bg-white py-3 small-sb text-[#18552F] active:scale-[0.98] transition-all hover:bg-green50"
          >
            <span>📞</span>
            Gọi điện
          </a>
          <button
            onClick={() => navigate("/ai-chat")}
            className="flex-[1.5] items-center justify-center gap-2 rounded-xl bg-[#2F8A4F] py-3 small-sb text-white shadow-button hover:bg-[#216C3B] active:scale-[0.98] transition-all flex"
          >
            <span>💬</span>
            Nhắn tin
          </button>
        </div>
      </div>
    </div>
  );
}
