# Thiết kế di động & Empty States

## Mục lục

- [1. Thiết kế responsive Mobile-First](#1-thiết-kế-responsive-mobile-first)
  - [1.1 Breakpoints thiết kế](#11-breakpoints-thiết-kế)
  - [1.2 Max width content trên Desktop](#12-max-width-content-trên-desktop)
  - [1.3 Safe Area iOS (notch / Dynamic Island)](#13-safe-area-ios-notch--dynamic-island)
  - [1.4 Tailwind CSS config áp dụng](#14-tailwind-css-config-áp-dụng)
- [2. Empty State: Login Page](#2-empty-state-login-page)
  - [2.1 Cấu trúc layout](#21-cấu-trúc-layout)
  - [2.2 Component và trạng thái](#22-component-và-trạng-thái)
  - [2.3 Visual spec chi tiết](#23-visual-spec-chi-tiết)
- [3. Empty State: Thông báo](#3-empty-state-thông-báo)
  - [3.1 Cấu trúc layout](#31-cấu-trúc-layout-1)
  - [3.2 Visual spec chi tiết](#32-visual-spec-chi-tiết)
  - [3.3 Trạng thái có dữ liệu](#33-trạng-thái-có-dữ-liệu)
- [4. Checklist Responsive & UX](#4-checklist-responsive--ux)
  - [4.1 Layout & Grid](#41-layout--grid)
  - [4.2 Hình ảnh & Băng thông](#42-hình-ảnh--băng-thông)
  - [4.3 Text & Tính dễ đọc](#43-text--tính-dễ-đọc)
  - [4.4 Touch Target & Nút bấm](#44-touch-target--nút-bấm)
  - [4.5 Scroll & Hiệu năng](#45-scroll--hiệu-năng)

---

## 1. Thiết kế responsive Mobile-First

Ứng dụng Nhà Hàng Hương Việt là **Zalo Mini App** → chạy chủ yếu trên điện thoại di động qua Zalo. Do đó, toàn bộ thiết kế và code tuân theo triết lý **Mobile-First**: code giao diện base cho màn hình nhỏ trước, sau đó *điều chỉnh thêm* cho màn hình lớn hơn.

### 1.1 Breakpoints thiết kế

3 breakpoint chính tương ứng các dòng máy phổ biến tại Việt Nam:

| Breakpoint | Width range | Đối tượng thiết bị | Ưu tiên |
|---|---|---|---|
| **xs (base)** | 0 - 374px | iPhone SE (375×667), các máy nhỏ cũ | Kiểm tra không bị vỡ layout |
| **sm** | ≥ 375px | iPhone 13 / 14 / 15 (390px), Samsung A series (~412px) | 🟢 Thiết kế chính, mockup 375px |
| **md** | ≥ 430px | iPhone 14 Pro Max / 15 Plus (430px), máy Android lớn | Rộn thêm khoảng trắng, scale nhẹ |
| **lg** | ≥ 768px | Tablet iPad Mini, mở Zalo trên tablet / máy tính bảng | Max width container = 430px ⚠️ |
| **xl** | ≥ 1024px | Desktop, mở Zalo Web / mở Mini App trên trình duyệt PC | Max width container = 430px, căn giữa màn hình |

**Lưu ý quan trọng:** Vì đây là Zalo Mini App, ngay cả khi mở trên tablet / desktop, app vẫn giữ cảm giác "ứng dụng di động" → **container max-width 430px**, không dàn full màn hình.

### 1.2 Max width content trên Desktop

Trên các màn hình ≥ 768px (tablet landscape, desktop), layout không dàn ra full mà wrap trong container giới hạn:

```
Màn hình 1920px (Desktop)
┌─────────────────────────────────────────────────────────┐
│                    Background app                        │
│   ┌───────────────────────────────────┐                 │
│   │  Container: max-w-[430px]        │◄── 430px chính  │
│   │  mx-auto (căn giữa ngang)        │                 │
│   │  h-screen (chiều cao màn hình)   │                 │
│   │  shadow-2xl (đổ bóng nhẹ)        │                 │
│   │  bg-white (nền trắng)            │                 │
│   └───────────────────────────────────┘                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Tailwind class áp dụng:
```tsx
// src/components/layout/layout.tsx
<div className="min-h-screen w-full lg:bg-gray-100">
  <main className="w-full max-w-[430px] mx-auto bg-white min-h-screen shadow-xl lg:shadow-2xl relative">
    {children}
  </main>
</div>
```

### 1.3 Safe Area iOS (notch / Dynamic Island)

Trên iPhone có notch / Dynamic Island (iPhone 14 Pro+, 15 series), Zalo SDK tự trả padding top, nhưng chúng ta chủ động xử lý bằng CSS variable `--safe-area-inset-*`:

```scss
/* src/css/app.scss */
:root {
  --sat: env(safe-area-inset-top);     /* Notch / Dynamic Island */
  --sab: env(safe-area-inset-bottom);  /* Home indicator iPhone X+ */
  --sal: env(safe-area-inset-left);
  --sar: env(safe-area-inset-right);
}

@layer utilities {
  .pt-safe { padding-top: var(--sat); }
  .pb-safe { padding-bottom: var(--sab); }
  .px-safe { padding-left: var(--sal); padding-right: var(--sar); }
}
```

Áp dụng vào layout chính:
```tsx
// src/components/layout/layout.tsx
<main className="w-full max-w-[430px] mx-auto bg-white min-h-screen pt-safe pb-safe">
  <Header />     {/* Dùng thêm pt-safe trong header nếu header sticky top */}
  <Outlet />
  <BottomNav />  {/* Bottom nav dùng pb-safe tránh dính home indicator */}
</main>
```

### 1.4 Tailwind CSS config áp dụng

```js
// tailwind.config.js
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      screens: {
        // Mobile-first: base = 0px -> sm = 375px
        sm: "375px",
        md: "430px",
        lg: "768px",
        xl: "1024px",
      },
      colors: {
        green: {
          50:  "#e6f7ec",
          100: "#c0ebcf",
          200: "#96dfb1",
          300: "#6cd393",
          400: "#46c77a",
          500: "#22c55e",   /* Main green (Zalo) */
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
};
```

---

## 2. Empty State: Login Page

> **Màn hình người dùng chưa đăng nhập.**
> Đây là entry-point đầu tiên khi user mở Mini App nếu chưa có token.

### 2.1 Cấu trúc layout

```
┌─────────────────────────────────────────┐   ◄── Safe area top padding
│                                         │
│                                         │
│            空 白 推 荐 (spacer)          │
│            (flex: 1 phần trên)          │
│                                         │
│         ┌───────────────────────┐       │
│         │   🏮 LOGO Hương Việt   │       │  ◄── 160x160px logo
│         │   (logo.png)          │       │
│         └───────────────────────┘       │
│                                         │
│      "NHÀ HÀNG HƯƠNG VIỆT"              │  ◄── Heading (text-2xl, font-bold)
│                                         │
│       "Hương vị quê nhà, ấm lòng người" │  ◄── Slogan (text-sm, text-gray-500)
│                                         │
│                                         │
│            空 白 (flex: 0.6 phần giữa)  │
│                                         │
│  ╔═══════════════════════════════════╗  │
│  ║  💚  Đăng nhập bằng Zalo          ║  │  ◄── Nút chính (Primary CTA)
│  ║  bg-green-500 text-white         ║  │
│  ╚═══════════════════════════════════╝  │
│                                         │
│  ╔═══════════════════════════════════╗  │
│  ║  👤  Đăng nhập khách               ║  │  ◄── Nút phụ (Secondary CTA)
│  ║  bg-white + border-green-500      ║  │
│  ║  text-green-700                   ║  │
│  ╚═══════════════════════════════════╝  │
│                                         │
│           (flex: 1 spacer dưới)        │
│                                         │
│       "Điều khoản · Chính sách"         │  ◄── Footer (text-xs, text-gray-400)
│                                         │
└─────────────────────────────────────────┘   ◄── Safe area bottom padding
```

### 2.2 Component và trạng thái

```tsx
// src/pages/login/index.tsx (high-level structure)
export default function LoginPage() {
  return (
    <Layout showNav={false} className="bg-white">
      <div className="min-h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom))]
                      flex flex-col px-6 py-8">

        {/* Spacer top */}
        <div className="flex-1" />

        {/* Logo + Brand */}
        <div className="flex flex-col items-center gap-4">
          <Logo size={160} />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            NHÀ HÀNG HƯƠNG VIỆT
          </h1>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            Hương vị quê nhà, ấm lòng người
          </p>
        </div>

        {/* Spacer giữa logo và nút */}
        <div className="flex-[0.6]" />

        {/* Buttons group */}
        <div className="flex flex-col gap-3 w-full">
          {/* Nút 1: Đăng nhập Zalo - Primary */}
          <button
            onClick={handleLoginZalo}
            className="w-full h-[48px] rounded-xl bg-green-500 text-white
                       font-semibold shadow-lg shadow-green-500/20
                       flex items-center justify-center gap-2
                       active:scale-[0.98] transition-transform"
          >
            <ZaloIcon className="w-5 h-5" />
            Đăng nhập bằng Zalo
          </button>

          {/* Nút 2: Đăng nhập khách - Secondary */}
          <button
            onClick={handleLoginGuest}
            className="w-full h-[48px] rounded-xl bg-white
                       border-2 border-green-500 text-green-700
                       font-semibold flex items-center justify-center gap-2
                       active:bg-green-50 transition-colors"
          >
            <UserIcon className="w-5 h-5" />
            Đăng nhập khách
          </button>
        </div>

        {/* Spacer dưới */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center justify-center gap-2
                        text-xs text-gray-400 mt-4">
          <a href="/terms" className="hover:text-green-600">Điều khoản</a>
          <span>·</span>
          <a href="/privacy" className="hover:text-green-600">Chính sách</a>
        </div>
      </div>
    </Layout>
  );
}
```

**Loading state khi bấm đăng nhập:**
- Thêm `opacity-70 pointer-events-none` + `animate-pulse` vào nút
- Thêm icon spinner `<SpinnerIcon className="w-5 h-5 animate-spin" />` thay thế icon gốc

### 2.3 Visual spec chi tiết

| Element | Property | Giá trị |
|---|---|---|
| **Nút 1 - Đăng nhập Zalo** | Background | `bg-green-500` (#22c55e) |
| | Text | `text-white`, font-semibold, 16px |
| | Size | `w-full`, `h-[48px]`, `rounded-xl` (12px) |
| | Icon left | Icon Zalo 20×20, margin-right 8px |
| | Shadow | `shadow-lg shadow-green-500/20` |
| | Active (khi bấm) | scale 0.98, transition 100ms |
| **Nút 2 - Đăng nhập khách** | Background | `bg-white` |
| | Border | `border-2 border-green-500` (#22c55e, 2px) |
| | Text | `text-green-700` (#15803d), font-semibold, 16px |
| | Size | `w-full`, `h-[48px]`, `rounded-xl` (12px) |
| | Icon left | Icon User 20×20, margin-right 8px |
| | Active (khi bấm) | `bg-green-50` (#e6f7ec) |
| **Footer** | Font | 12px, text-gray-400, center |
| | Giữa 2 chữ | ký tự `·` (middle dot), margin 8px |
| **Logo** | Size | 160×160px (trên 375px), max: 200×200 (trên 430px) |

---

## 3. Empty State: Thông báo

> **Màn hình danh sách thông báo trống.**
> User vào tab Thông báo lần đầu / đã đọc hết thông báo cũ.

### 3.1 Cấu trúc layout

```
┌─────────────────────────────────────────┐
│  🔙  Thông báo                   [0/0] │  ◄── Header bar sticky top
│  ─────────────────────────────────────  │      (bg-green-500, text-white)
│                                         │
│                                         │
│                                         │
│                                         │
│             ╭─────────╮                 │
│            /           \                │
│           |    🔔🔔🔔   |               │  ◄── Icon Bell lớn
│           |   (chuông)  |               │      140×140px
│            \           /                │      opacity 0.4, color gray-300
│             ╰─────────╯                 │
│                                         │
│                                         │
│      "Chưa có thông báo nào"             │  ◄── Title empty (text-xl, font-bold)
│                                           │      text-gray-700, center
│                                           │
│  "Hãy quay lại sau nhé, chúng tôi sẽ     │  ◄── Subtitle (text-sm, text-gray-400)
│   thông báo cho bạn khi có cập nhật."    │      max-width 280px, center, 2 dòng
│                                           │
│                                           │
│                                           │
│         (flex-1 spacer để đẩy bottom nav)│
│                                           │
├─────────────────────────────────────────┤
│  🏠 Trang chủ  🍽️ Thực đơn  🔔 Thông báo│  ◄── Bottom Navigation
│              👤 Tôi                     │      (Tab Thông báo active, xanh)
└─────────────────────────────────────────┘
```

### 3.2 Visual spec chi tiết

**Header bar (top - sticky):**

| Element | Property | Giá trị |
|---|---|---|
| Background | `bg-green-500` (#22c55e) |
| Height | 56px + `pt-safe` (bù notch) |
| Back button | Icon Arrow Left 24×24, `text-white`, padding-left 16px |
| Title | `Thông báo`, `text-white`, font-semibold, 18px, center trong header |
| Unread badge | Top-right: `[0/0]` nhỏ, text-xs, text-white/90, padding right 16px |
| Shadow | `shadow-sm` khi scroll xuống |

**Nội dung Empty (phần giữa):**

| Element | Property | Giá trị |
|---|---|---|
| Container | `flex flex-col items-center justify-center`, padding ngang 24px, padding-top 80px |
| **Icon Bell** | 140×140px, icon Lucide Bell hoặc SVG tùy chỉnh |
| | Color | `text-gray-300` (#d1d5db) |
| | Opacity | 40% |
| | Margin bottom | 32px |
| | Hiệu ứng | Không có animation (vì là empty) |
| **Title "Chưa có thông báo nào"** | Font | 20px, font-bold, `text-gray-700` |
| | Margin bottom | 12px |
| | Text align | center |
| **Subtitle** | Font | 14px, leading-relaxed (line-height 1.625) |
| | Color | `text-gray-400` (#9ca3af) |
| | Max width | 280px (tối đa 2 dòng, không 3 dòng) |
| | Text align | center |

**Bottom Navigation (fixed - bottom):**

| Tab | Icon | Trạng thái |
|---|---|---|
| 🏠 Trang chủ | Home | Mờ xám (inactive) |
| 🍽️ Thực đơn | Utensils | Mờ xám (inactive) |
| 🔔 Thông báo | **Bell** | **Active: bg-green-50 icon, text-green-600** |
| 👤 Tôi | User | Mờ xám (inactive) |

Spec bottom nav: height 64px + `pb-safe`, 4 tab chia đều, active icon màu xanh, label text-xs.

### 3.3 Trạng thái có dữ liệu

Khi có thông báo, layout thay thế phần empty bằng `FlatList` thông báo. Header và bottom nav giữ nguyên:

```
┌─────────────────────────────────────────┐
│  🔙  Thông báo                   [2/4] │  ◄── Unread badge = 2/4 (2 chưa đọc)
├─────────────────────────────────────────┤
│  [x] Đơn hàng đã xác nhận ✅            │  ◄── Item 1 (chưa đọc: bg-green-50 nhẹ)
│      HV260415001 - 3 phút trước        │      dot xanh bên trái
│                                         │
│  [x] Đặt bàn TB00123 đã xác nhận       │  ◄── Item 2 (chưa đọc)
│      Bàn 6 lúc 19:00 - 1 ngày          │
│                                         │
│  [ ] Giảm 20% cuối tuần 🎉             │  ◄── Item 3 (đã đọc: bg-white)
│      Mã WEEKEND20 - 3 ngày             │
│                                         │
│  [ ] Chào mừng đến với Hương Việt!     │  ◄── Item 4 (đã đọc)
│      01/04/2026 - rất lâu              │
├─────────────────────────────────────────┤
│  🏠 Trang chủ  🍽️ Thực đơn  🔔 Thông báo│
│              👤 Tôi                     │
└─────────────────────────────────────────┘
```

**Pull to refresh:** Kéo từ top để reload danh sách thông báo → icon spinner màu xanh.

---

## 4. Checklist Responsive & UX

### 4.1 Layout & Grid

| # | Checklist | Mức độ ưu tiên | Kiểm tra bằng |
|---|---|---|---|
| 1 | **Layout fluid**, không dùng `width: 375px` cứng, luôn dùng `w-full` hoặc `%` / `flex` | 🔴 Bắt buộc | Chrome DevTools device mode: iPhone SE → iPhone 14 Pro Max |
| 2 | **Không có horizontal scroll** (overflow-x: hidden trên body + container) | 🔴 Bắt buộc | Kéo nhẹ ngang ở mỗi màn hình, nếu thấy biên lỗi → sửa |
| 3 | **Max width 430px** trên màn hình ≥ 768px, căn giữa màn hình | 🟡 Nên có | Mở desktop 1920px, kiểm tra app nằm giữa, không full |
| 4 | 4-direction spacing nhất quán: khoảng lề 16px (padding-x-4) cho các card list | 🟡 Nên có | Đối chiếu mọi màn, padding không lệch 12px / 16px tùm lum |
| 5 | **Keyboard friendly** trên Android: khi mở bàn phím số (đặt bàn, OTP), form không bị che bởi keyboard | 🔴 Bắt buộc | Test thật trên máy Android Xiaomi / Samsung |

### 4.2 Hình ảnh & Băng thông

| # | Checklist | Mức độ ưu tiên | Kiểm tra |
|---|---|---|---|
| 6 | **Ảnh tối ưu WebP / AVIF**, không dùng PNG > 200KB làm ảnh sản phẩm | 🔴 Bắt buộc | DevTools Network → Size từng ảnh, avg < 80KB là ok |
| 7 | **Lazy loading** ảnh sản phẩm ngoài viewport đầu tiên | 🟡 Nên có | `<img loading="lazy" />` hoặc Next.js Image equivalent |
| 8 | **Aspect ratio nhất quán** ảnh món ăn: 4:3 (card list) và 16:9 (product detail) | 🟢 Nice to have | Đối chiếu card list, không bị cao thấp khác nhau |
| 9 | **Placeholder màu** skeleton (shimmer) khi ảnh đang load, không bị layout shift (CLS < 0.1) | 🔴 Bắt buộc | 3G slow trong DevTools, xem ảnh có nhảy layout không |
| 10 | Icon dùng SVG sprite / icon-font (Lucide, Phosphor), không dùng PNG làm icon | 🟡 Nên có | Bundle size, icons phải sắc nét mọi DPI |

### 4.3 Text & Tính dễ đọc

| # | Checklist | Mức độ ưu tiên | Kiểm tra |
|---|---|---|---|
| 11 | **Minimum font-size 16px** cho text body (không xuống 14px ở nội dung quan trọng) | 🔴 Bắt buộc | Kiểm tra text mô tả, text giá, không 12px khó nhìn |
| 12 | **Text scale** test: bật "Larger Text" (iOS / Android scale 125%), app không bị chữ tràn khỏi khung | 🟡 Nên có | Cài đặt Accessibility → Larger Text → quay lại app |
| 13 | **Độ tương phản**: text màu trên nền thỏa WCAG AA (≥ 4.5:1) đối với text dưới 18px | 🔴 Bắt buộc | Tool: Color Contrast Analyzer, green-700 trên white = PASS |
| 14 | Line-height body = 1.5 - 1.65, text không bị dính dòng với nhau | 🟢 Nice to have | Đọc mô tả món ăn, dễ đọc là ok |
| 15 | **Giá tiền**: luôn format `Intl.NumberFormat('vi-VN', {currency: 'VND'})` → `"89.000 ₫"`, không hiện "89000" | 🔴 Bắt buộc | Đối chiếu mọi chỗ show giá |

### 4.4 Touch Target & Nút bấm

| # | Checklist | Mức độ ưu tiên | Kiểm tra |
|---|---|---|---|
| 16 | **Touch target tối thiểu 44×44px** (Apple HIG) cho mọi nút bấm tương tác: button, icon, checkbox, radio, nav tab | 🔴 Bắt buộc | Quy tắc ngón tay cái: wrap icon 20px trong div 44×44px |
| 17 | **Không gian giữa 2 nút liền kề ≥ 8px** (giữa 2 CTA button Login) | 🟡 Nên có | Nhìn màn Login, 2 nút cách nhau 12px là đẹp |
| 18 | Active feedback: mọi nút bấm phải có trạng thái khi tap (scale 0.98 / đổi màu bg) trong 100ms | 🔴 Bắt buộc | Bấm nhanh mọi nút, thấy phản hồi tức thì là ok |
| 19 | Sticky bottom CTA ("Thêm vào giỏ", "Đặt bàn"): fixed-bottom, z-index cao, không bị che bởi notch | 🔴 Bắt buộc | Màn chi tiết sản phẩm, Checkout, nút cuối cùng phải hiển thị đủ |
| 20 | **Prevent double tap submit**: nút submit form disable + loading trong 1.5s sau khi bấm | 🔴 Bắt buộc | Bấm nhanh 2 lần "Tạo đơn", kiểm tra không tạo 2 đơn |

### 4.5 Scroll & Hiệu năng

| # | Checklist | Mức độ ưu tiên | Kiểm tra |
|---|---|---|---|
| 21 | **Scroll mượt 60fps**: danh sách món (200+ món) dùng FlatList / Virtuoso không bị giật khi scroll | 🔴 Bắt buộc | Scroll nhanh lên-down 3 vòng trên máy cấu hình yếu (Snapdragon 680 / iPhone 8) |
| 22 | **Không block main thread**: heavy task (format giá 100 item) dùng `useMemo`, không tính toán trong render không cần thiết | 🟡 Nên có | React DevTools Profiler, render dài hơn 16ms → tối ưu |
| 23 | **Skeleton loading** cho màn hình list thay vì spinner toàn màn hình | 🔴 Bắt buộc | Turn mạng 3G Slow, mọi màn list phải hiện xương xương trước |
| 24 | **Back navigation**: Android hardware back button hoạt động đúng (không out app đột ngột) | 🔴 Bắt buộc | Dùng ZMP SDK navigation hook xử lý backpress |
| 25 | **Memory không leak**: qua 10 vòng mở / đóng màn hình chi tiết món, app không tăng RAM > 100MB so với ban đầu | 🟢 Nice to have | Android Studio / XCode Instruments memory graph |

---

## Tổng kết 4 màn Mockup liên quan

| Màn hình | File | Tóm tắt nội dung chính |
|---|---|---|
| **Màn 13 - API RESTful** | `docs/01-api-restful.md` | 8 endpoint auth, restaurants, foods, reservations, orders, chatbot, notifications + request/response mẫu |
| **Màn 14 - CSDL** | `docs/02-schema.sql` | 10 CREATE TABLE users, restaurants, categories, foods, tables, reservations, orders, order_details, notifications, promotions + khóa ngoại + indexes |
| **Màn 15 - Kiến trúc** | `docs/03-system-architecture.md` | Mermaid 8 khối Frontend → Gateway → Backend → DB + AI Service → Vector DB, Zalo OA, Observability, Backup |
| **Màn 16 - Responsive** | `docs/04-mobile-responsive.md` | Breakpoints 375/430/768, max-width 430px desktop, Safe Area iOS + 2 Empty State chi tiết (Login, Thông báo) + 25-item checklist UX |
