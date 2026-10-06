import { useNavigate } from "react-router-dom";
import { Button } from "zmp-ui";
import Logo from "../common/logo";
import { BackIcon, BellIcon } from "../common/vectors";
import { copy, theme } from "@/constants/copy";
import { cn } from "@/utils/cn";

interface HeaderProps {
  title?: string;
  back?: boolean;
  position?: "fixed" | "sticky" | "static" | "relative";
}

export default function Header({ title, back, position }: HeaderProps) {
  const navigate = useNavigate();

  const positionClass = position || "sticky";

  if (title) {
    return (
      <div
        className={cn(
          `${positionClass} header-margin left-0 top-0 z-30 flex min-h-[58px] w-full items-center gap-2 px-4 py-2.5`,
          "border-b border-white/10 bg-[#123c29]/95 shadow-[0_8px_24px_rgba(18,60,41,0.18)] backdrop-blur-md"
        )}
        style={{ color: "#ffffff" }}
      >
        {back && (
          <Button
            className="w-fit bg-transparent p-1 active:bg-transparent shadow-none"
            type="neutral"
            size="small"
            fullWidth
            onClick={() => navigate(-1)}
          >
            <BackIcon className="text-header_title text-white" />
          </Button>
        )}
        <div className="flex-1 font-semibold text-base text-white tracking-wide">{title}</div>
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2 rounded-full hover:bg-white/10 active:bg-white/15 transition-colors"
        >
          <BellIcon className="w-6 h-6 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        `${positionClass} header-margin left-0 top-0 z-30 flex min-h-[68px] w-full items-center justify-between`,
        "border-b border-white/10 bg-[#123c29]/95 px-4 py-2.5 shadow-[0_8px_24px_rgba(18,60,41,0.18)] backdrop-blur-md"
      )}
    >
      <div className="flex flex-col gap-0.5" onClick={() => navigate("/")}>
        <div className="flex items-center gap-2">
          <Logo />
          <h1 className="font-bold display_medium leading-none text-white tracking-wide">
            {copy.brand.name}
          </h1>
        </div>
        <p className="text-[10px] text-green100/90 ml-[34px] tracking-wide">
          {copy.brand.tagline}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2 rounded-full hover:bg-white/10 active:bg-white/15 transition-colors"
        >
          <BellIcon className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => navigate("/profile")}
          className={cn(
            "w-10 h-10 rounded-full overflow-hidden ml-1",
            "border-2 border-[#89CF9D]",
            "bg-gradient-to-br from-[#62B782] via-[#2F8A4F] to-[#18552F]",
            "flex items-center justify-center",
            "transition-transform active:scale-[0.986]"
          )}
        >
          <span className="font-semibold text-white text-sm tracking-wide">N</span>
        </button>
      </div>
    </div>
  );
}
