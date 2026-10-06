import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MenuIcon } from "../menu/menu-components";
import type { HomeContent } from "@/services/home/home-content";
function ActionIcon({ name }: { name: string }) {
  if (name === "pin")
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M12 22S4 15 4 9a8 8 0 0 1 16 0c0 6-8 13-8 13Z" />
        <circle cx="12" cy="9" r="3" />
      </svg>
    );
  if (name === "cutlery")
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      >
        <path d="M3 2v7a3 3 0 0 0 6 0V2M6 2v20M19 2v20M19 2c-7 4-7 11 0 11" />
      </svg>
    );
  return <MenuIcon name={name} />;
}
export function QuickActionGrid({
  restaurant,
}: {
  restaurant?: HomeContent["restaurant"];
}) {
  const navigate = useNavigate();
  const dialog = useRef<HTMLDialogElement>(null);
  const actions = [
    {
      name: "Đặt bàn",
      description: "Giữ chỗ dễ dàng",
      icon: "cutlery",
      route: "/reservation",
    },
    {
      name: "Đặt món",
      description: "Giao tận nơi",
      icon: "cart",
      route: "/menu?category=all",
    },
    {
      name: "AI Chef",
      description: "Tư vấn món ngon",
      icon: "sparkle",
      route: "/ai-chat",
    },
    {
      name: "Ưu đãi",
      description: "Nhiều khuyến mãi",
      icon: "tag",
      route: "/promotions",
    },
    {
      name: "Tìm nhà hàng",
      description: "Chỉ đường nhanh",
      icon: "pin",
      route: "",
    },
  ];
  return (
    <>
      <nav className="hv-quick-actions" aria-label="Chức năng nhanh">
        {actions.map((a) => (
          <button
            key={a.name}
            onClick={() =>
              a.route ? navigate(a.route) : dialog.current?.showModal()
            }
          >
            <span className="hv-action-icon">
              <ActionIcon name={a.icon} />
              {a.name === "AI Chef" && <em>Mới</em>}
            </span>
            <strong>{a.name}</strong>
            <small>{a.description}</small>
          </button>
        ))}
      </nav>
      <dialog
        className="hv-location-dialog"
        ref={dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        <div>
          <button
            className="hv-location-close"
            aria-label="Đóng vị trí nhà hàng"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
          <span className="hv-location-icon">
            <ActionIcon name="pin" />
          </span>
          <h2>{restaurant?.name || "Nhà hàng Hương Việt"}</h2>
          {restaurant ? (
            <>
              <p>{restaurant.address}</p>
              <p>{restaurant.openHours}</p>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}`}
              >
                Mở bản đồ · Chỉ đường ↗
              </a>
            </>
          ) : (
            <p>
              Chưa tải được vị trí nhà hàng. Vui lòng thử lại khi có kết nối.
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
