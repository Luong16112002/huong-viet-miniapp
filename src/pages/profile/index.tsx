import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useReservationStore } from "@/stores/reservation.store";
import { useNotificationStore } from "@/stores/notification.store";
import { useOrderHistory } from "@/services/order/order.queries";
import { isOngoingOrder } from "@/utils/order-history";
import {
  AccountHeader,
  ProfileHero,
  MembershipCard,
  AccountStats,
  UtilitySection,
  SettingsSection,
  LogoutButton,
} from "./account-components";
import { readFavorites } from "./account-extras";
import "./profile.css";
export default function ProfilePage() {
  const { user, isLoggedIn, logout } = useAuthStore();
  const { reservations, refresh } = useReservationStore();
  const { data: orders = [], isLoading, isError, refetch } = useOrderHistory();
  const notifications = useNotificationStore((s) => s.notifications);
  const [favorites, setFavorites] = useState(readFavorites);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [bookingError, setBookingError] = useState(false);
  const [modal, setModal] = useState<"logout" | "points" | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  async function load() {
    setBookingLoading(true);
    setBookingError(false);
    try {
      await refresh();
    } catch {
      setBookingError(true);
    } finally {
      setBookingLoading(false);
    }
  }
  useEffect(() => {
    void load();
    const sync = () => setFavorites(readFavorites());
    window.addEventListener("storage", sync);
    window.addEventListener("favorites-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("favorites-changed", sync);
    };
  }, []);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className="pa-page">
      <AccountHeader unread={unread} />
      <ProfileHero user={user} />
      <main className="pa-content">
        <MembershipCard
          points={Math.max(0, user?.points || 0)}
          redeem={() => setModal("points")}
        />
        <AccountStats
          orders={isLoading || isError ? null : orders.length}
          bookings={bookingLoading || bookingError ? null : reservations.length}
          favorites={favorites.length}
          vouchers={null}
        />
        {(isError || bookingError) && (
          <p className="pa-status" role="alert">
            Chưa cập nhật được số đơn và lịch hẹn.{" "}
            <button
              onClick={() => {
                void refetch();
                void load();
              }}
            >
              Thử lại
            </button>
          </p>
        )}
        <UtilitySection
          ongoing={orders.filter(isOngoingOrder).length}
          unread={unread}
        />
        <SettingsSection />
        {isLoggedIn ? (
          <LogoutButton onClick={() => setModal("logout")} />
        ) : (
          <Link className="pa-login-link" to="/login">
            Đăng nhập để quản lý tài khoản
          </Link>
        )}
        <p className="pa-signoff">Hương Việt · Trọn vị quê nhà</p>
      </main>
      <dialog
        ref={dialog}
        className="pa-dialog"
        aria-labelledby="pa-dialog-title"
        onCancel={() => setModal(null)}
      >
        <h2 id="pa-dialog-title">
          {modal === "logout" ? "Đăng xuất tài khoản?" : "Đổi điểm thành viên"}
        </h2>
        <p>
          {modal === "logout"
            ? "Bạn có chắc muốn đăng xuất không?"
            : "Bạn có " +
              (user?.points || 0).toLocaleString("vi-VN") +
              " điểm. Chương trình đổi điểm hiện chưa được nhà hàng kích hoạt."}
        </p>
        <div>
          <button onClick={() => setModal(null)}>
            {modal === "logout" ? "Hủy" : "Đóng"}
          </button>
          {modal === "logout" ? (
            <button
              className="pa-danger"
              onClick={() => {
                logout();
                setModal(null);
                navigate("/login");
              }}
            >
              Đăng xuất
            </button>
          ) : (
            <Link to="/profile/vouchers">Xem mã giảm giá</Link>
          )}
        </div>
      </dialog>
    </div>
  );
}
