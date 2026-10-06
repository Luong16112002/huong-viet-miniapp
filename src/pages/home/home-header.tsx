import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useNotificationStore } from "@/stores/notification-api.store";
import { MenuIcon } from "../menu/menu-components";
import logo from "@/static/huong-viet-mark.svg";
export function HomeHeader({ name, count }: { name: string; count: number }) {
  const { notifications, load } = useNotificationStore();
  useEffect(() => { void load(); }, [load]);
  const unread = notifications.filter(n => !n.isRead).length;
  return (
    <header className="hv-home-header">
      <img src={logo} alt="Logo Hương Việt" />
      <div className="hv-home-brand">
        <strong>{name.replace(/^Nhà hàng/, "Nhà Hàng")}</strong>
        <p>Ẩm thực Việt - Tinh hoa trong từng món ăn</p>
      </div>
      <Link to="/notifications" aria-label="Thông báo">
        <MenuIcon name="bell" />
        {unread > 0 && <span className="hv-home-count" style={{background:'#E85C50',color:'white'}}>{unread > 99 ? '99+' : unread}</span>}
      </Link>
      <Link to="/cart" aria-label={`Giỏ hàng, ${count} món`}>
        <MenuIcon name="cart" />
        <span className="hv-home-count">{count > 99 ? "99+" : count}</span>
      </Link>
    </header>
  );
}
