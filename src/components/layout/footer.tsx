import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  MenuIcon,
  ReserveIcon,
  OrderIcon,
  SelfIcon,
} from "@/components/common/vectors";
import { copy } from "@/constants/copy";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  {
    name: copy.nav.home,
    path: "/",
    icon: HomeIcon,
  },
  {
    name: copy.nav.menu,
    path: "/menu",
    icon: MenuIcon,
  },
  {
    name: copy.nav.reserve,
    path: "/reservation",
    icon: ReserveIcon,
  },
  {
    name: copy.nav.order,
    path: "/order",
    icon: OrderIcon,
  },
  {
    name: copy.nav.profile,
    path: "/profile",
    icon: SelfIcon,
  },
];

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const activeKey =
    NAV_ITEMS.find((item) =>
      item.path === "/" ? pathname === "/" : pathname.startsWith(item.path),
    )?.path ?? "/";

  return (
    <div className="app-nav zaui-bottom-navigation relative z-30 border-t border-[#eadfce] bg-[#fffdf8]/95 shadow-[0_-8px_24px_rgba(51,38,25,0.08)] backdrop-blur-md">
      <div className="flex items-start justify-around px-1 pb-[max(4px,env(safe-area-inset-bottom))] pt-2">
        {NAV_ITEMS.map((item) => (
          <button type="button" aria-current={activeKey === item.path ? "page" : undefined} className="nav-item flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1 rounded-xl px-1 pb-1 pt-1 transition-transform active:scale-95"
            key={item.path}
            onClick={() => navigate(item.path)}
          >
            <item.icon active={activeKey === item.path} />
            <div
              className={cn(
                "text-xxxxsmall",
                activeKey === item.path
                  ? "!text-[#18552F] font-semibold"
                  : "!text-text-disabled",
              )}
            >
              {item.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
