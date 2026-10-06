import { Link } from "react-router-dom";
import { useState } from "react";
import { User } from "@/types/auth.types";
import {
  BellIcon,
  CrownIcon,
  OrderIcon,
  CalendarIcon,
  HeartIcon,
  VoucherIcon,
  SettingsIcon,
  SupportIcon,
  SparklesIcon,
  LogoutIcon,
  ChevronRightIcon,
} from "./account-icons";
export function AccountHeader({ unread }: { unread: number }) {
  return (
    <header className="pa-header">
      <h1>Tài khoản</h1>
      <Link
        to="/notifications"
        aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ""}`}
      >
        <BellIcon />
        {unread > 0 && <i />}
      </Link>
    </header>
  );
}
export function ProfileHero({ user }: { user: User | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <section className="pa-hero">
      <div className="pa-avatar">
        {user?.avatar && !failed ? (
          <img
            src={user.avatar}
            alt={`Ảnh đại diện ${user.name}`}
            onError={() => setFailed(true)}
          />
        ) : (
          <span>{user?.name?.trim().charAt(0).toUpperCase() || "K"}</span>
        )}
        {user && (
          <i>
            <CrownIcon />
          </i>
        )}
      </div>
      <div className="pa-identity">
        <h2>{user?.name || "Chào bạn!"}</h2>
        <p>{user?.phone || "Chào mừng đến với Hương Việt"}</p>
        {user ? (
          <div className="pa-chips">
            <span>
              <CrownIcon />
              Thành viên
            </span>
            <span>★ {(user.points || 0).toLocaleString("vi-VN")} điểm</span>
          </div>
        ) : (
          <Link className="pa-login" to="/login">
            Đăng nhập / Đăng ký →
          </Link>
        )}
      </div>
    </section>
  );
}
export function MembershipCard({
  points,
  redeem,
}: {
  points: number;
  redeem: () => void;
}) {
  const remaining = Math.max(0, 5000 - points);
  return (
    <section className="pa-membership">
      <div className="pa-membership-heading">
        <h2>
          <CrownIcon />
          Hạng thành viên
        </h2>
        <span>{points.toLocaleString("vi-VN")} / 5.000 điểm</span>
      </div>
      <progress
        value={Math.min(points, 5000)}
        max={5000}
        aria-label="Tiến trình hạng thành viên"
      />
      <div className="pa-membership-bottom">
        <p>
          {remaining ? "Còn để lên hạng:" : "Đã đạt mốc:"}{" "}
          <strong>
            {remaining ? remaining.toLocaleString("vi-VN") : "5.000"} điểm
          </strong>
        </p>
        <button onClick={redeem}>
          <VoucherIcon />
          Đổi điểm
          <ChevronRightIcon />
        </button>
      </div>
    </section>
  );
}
export function AccountStats({
  orders,
  bookings,
  favorites,
  vouchers,
}: {
  orders: number | null;
  bookings: number | null;
  favorites: number;
  vouchers: number | null;
}) {
  return (
    <div className="pa-stats">
      {[
        {
          label: "Đơn hàng",
          count: orders,
          icon: <OrderIcon />,
          tone: "gold",
          path: "/order",
        },
        {
          label: "Đặt bàn",
          count: bookings,
          icon: <CalendarIcon />,
          tone: "green",
          path: "/order?tab=reservation",
        },
        {
          label: "Yêu thích",
          count: favorites,
          icon: <HeartIcon />,
          tone: "pink",
          path: "/profile/favorites",
        },
        {
          label: "Ưu đãi",
          count: vouchers,
          icon: <VoucherIcon />,
          tone: "orange",
          path: "/profile/vouchers",
        },
      ].map((s) => (
        <Link key={s.label} to={s.path}>
          <span className={`pa-icon ${s.tone}`}>{s.icon}</span>
          <strong>{s.count === null ? "—" : s.count}</strong>
          <small>{s.label}</small>
        </Link>
      ))}
    </div>
  );
}
type Item = {
  title: string;
  path: string;
  icon: React.ReactNode;
  tone?: string;
  badge?: number;
  alert?: boolean;
};
export function UtilityItem({ item }: { item: Item }) {
  return (
    <Link className="pa-menu-item" to={item.path}>
      <span className={`pa-icon ${item.tone || "green"}`}>{item.icon}</span>
      <span>{item.title}</span>
      {!!item.badge && (
        <b className={item.alert ? "pa-badge alert" : "pa-badge"}>
          {item.badge}
        </b>
      )}
      <ChevronRightIcon />
    </Link>
  );
}
function Section({
  title,
  description,
  icon,
  items,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: Item[];
}) {
  return (
    <section className="pa-section">
      <div className="pa-section-heading">
        {icon}
        <h2>{title}</h2>
        <i />
        <p>{description}</p>
      </div>
      <div className="pa-menu">
        {items.map((item) => (
          <UtilityItem key={item.path} item={item} />
        ))}
      </div>
    </section>
  );
}
export function UtilitySection({
  ongoing,
  unread,
}: {
  ongoing: number;
  unread: number;
}) {
  return (
    <Section
      title="Tiện ích"
      description="Trọn vẹn hơn mỗi ngày"
      icon={<CrownIcon />}
      items={[
        {
          title: "Đơn hàng của tôi",
          path: "/order",
          icon: <OrderIcon />,
          tone: "gold",
          badge: ongoing,
          alert: true,
        },
        {
          title: "Lịch đặt bàn của tôi",
          path: "/order?tab=reservation",
          icon: <CalendarIcon />,
        },
        {
          title: "Món yêu thích",
          path: "/profile/favorites",
          icon: <HeartIcon />,
          tone: "pink",
        },
        {
          title: "Mã giảm giá của tôi",
          path: "/profile/vouchers",
          icon: <VoucherIcon />,
          tone: "orange",
        },
        {
          title: "Thông báo",
          path: "/notifications",
          icon: <BellIcon />,
          badge: unread,
        },
      ]}
    />
  );
}
export function SettingsSection() {
  return (
    <Section
      title="Cài đặt"
      description="Thông tin và hỗ trợ"
      icon={<SettingsIcon />}
      items={[
        {
          title: "Thông tin cá nhân",
          path: "/profile/info",
          icon: <SettingsIcon />,
        },
        {
          title: "Đánh giá của tôi",
          path: "/profile/reviews",
          icon: <SparklesIcon />,
          tone: "gold",
        },
        {
          title: "Câu hỏi thường gặp",
          path: "/profile/faq",
          icon: <SupportIcon />,
        },
        {
          title: "Trợ giúp & hỗ trợ",
          path: "/profile/support",
          icon: <SupportIcon />,
        },
      ]}
    />
  );
}
export function LogoutButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="pa-logout" onClick={onClick}>
      <LogoutIcon />
      Đăng xuất
    </button>
  );
}
