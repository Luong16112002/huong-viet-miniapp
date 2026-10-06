import { useNavigate } from "react-router-dom";
import { Order, OrderState } from "@/types/order.types";
import { DrinkIcon } from "./vectors";
import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

interface OrderItemCardProps {
  order: Order;
  onReorder?: (orderId: string) => void;
  onPickup?: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
}

const STATE_TIMELINE: { key: OrderState; label: string }[] = [
  { key: "pending", label: "Đã đặt" },
  { key: "confirmed", label: "Xác nhận" },
  { key: "preparing", label: "Chuẩn bị" },
  { key: "ready", label: "Sẵn sàng" },
  { key: "delivering", label: "Vận chuyển" },
  { key: "delivered", label: "Đã nhận" },
  { key: "completed", label: "Hoàn tất" },
];

function stateColor(state: OrderState): string {
  switch (state) {
    case "cancelled":
      return "bg-rose500/10 text-rose600 border-rose200";
    case "completed":
    case "delivered":
      return "bg-emerald500/10 text-emerald700 border-emerald200";
    case "ready":
      return "bg-amber500/12 text-amber700 border-amber300";
    case "preparing":
      return "bg-sky500/10 text-sky700 border-sky200";
    case "delivering":
      return "bg-indigo500/10 text-indigo700 border-indigo200";
    case "confirmed":
      return "bg-teal500/10 text-teal700 border-teal200";
    default:
      return "bg-neutral100 text-neutral700 border-neutral200";
  }
}

function getActiveTimelineIndex(state: OrderState): number {
  const idx = STATE_TIMELINE.findIndex((s) => s.key === state);
  if (idx !== -1) return idx;
  if (state === "cancelled") return 0;
  return 0;
}

function formatDateTime(ts: string | Date | undefined): string {
  if (!ts) return "--";
  const d = typeof ts === "string" ? new Date(ts) : ts;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(
    d.getMonth() + 1,
  )}/${d.getFullYear()}`;
}

export function OrderItemCard({
  order,
  onReorder,
  onPickup,
  onCancel,
}: OrderItemCardProps) {
  const navigate = useNavigate();
  const totalQuantity = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const activeIdx = getActiveTimelineIndex(order.state);
  const isCancelled = order.state === "cancelled";
  const miniTimeline = STATE_TIMELINE.slice(0, 4);

  return (
    <div
      onClick={() => navigate(`/order/${order.id}`)}
      className="relative w-full cursor-pointer overflow-hidden rounded-3xl bg-white p-5 shadow-card transition-all duration-300 hover:shadow-cardLift active:scale-[0.995]"
    >
      {order.state === "preparing" || order.state === "delivering" ? (
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-gold400 via-gold500 to-terracotta500" />
      ) : null}

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gold-gradient text-white shadow-[0_2px_10px_rgba(201,168,106,0.35)]">
            <DrinkIcon />
          </div>
          <div className="min-w-0">
            <div className="small-sb truncate text-espresso900">
              {copy.order.title}
              {order.orderCode && (
                <span className="font-normal text-text-tertiary">
                  {" "}
                  · {order.orderCode}
                </span>
              )}
            </div>
            <div className="xxxsmall mt-0.5 text-text-tertiary">
              {formatDateTime(order.createdAt)}
            </div>
          </div>
        </div>
        <span
          className={cn(
            "xxxsmall-sb shrink-0 rounded-full border px-3 py-1 tracking-wide",
            stateColor(order.state),
          )}
        >
          {order.stateLabel}
        </span>
      </div>

      <div className="mb-4 rounded-2xl border border-cream200/60 bg-cream50/70 p-3.5">
        <div className="flex items-center gap-3">
          <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-2xl bg-cream100 shadow-sm">
            <img
              src={order.items[0]?.imageUrl || order.items[0]?.image}
              alt={copy.order.title}
              className="h-full w-full object-cover"
              draggable={false}
            />
            {totalQuantity > 1 && (
              <div className="xxxsmall-sb absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-espresso800 text-white shadow-md">
                +{totalQuantity - 1}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "xxxsmall rounded-full px-2 py-0.5 !text-white",
                  order.deliveryType === "delivery"
                    ? "bg-indigo500"
                    : "bg-espresso700",
                )}
              >
                {order.deliveryTypeLabel}
              </span>
              <div className="xxxsmall-m text-neutral600">
                {totalQuantity} {copy.common.items}
              </div>
            </div>
            <div className="space-y-0.5">
              {order.items.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="xsmall min-w-0 flex-1 truncate text-text-primary">
                    {item.name}
                  </div>
                  <div className="xxxsmall shrink-0 text-text-disabled">
                    ×{item.quantity}
                  </div>
                </div>
              ))}
              {totalQuantity > 2 && (
                <div className="xxxsmall xsmall-m text-gold600">
                  +{totalQuantity - 2} món khác…
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isCancelled ? (
        <div className="mb-4">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="xxxsmall-sb uppercase tracking-[0.08em] text-neutral500">
              Tiến trình
            </div>
            {order.estimatedTime && (
              <div className="inline-flex items-center gap-1 rounded-full border border-amber200/70 bg-amber50 px-2.5 py-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="#d97706"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 7v5l3 2"
                    stroke="#d97706"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="xxxsmall-m text-amber700">
                  ETA {formatDateTime(order.estimatedTime)}
                </span>
              </div>
            )}
          </div>
          <div className="relative flex items-center justify-between px-1">
            {miniTimeline.map((step, idx) => {
              const done = idx <= activeIdx;
              const current = idx === activeIdx;
              return (
                <div
                  key={step.key}
                  className="relative z-10 flex flex-1 flex-col items-center"
                >
                  <div
                    className={cn(
                      "relative flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                      done
                        ? "border-transparent bg-gold-gradient text-white shadow-[0_0_0_4px_rgba(201,168,106,0.15)]"
                        : "border-neutral200 bg-white text-neutral400",
                      current && "animate-pulseRing",
                    )}
                  >
                    {done ? (
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M5 12l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-neutral300" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "xxxsmall-m mt-1.5 whitespace-nowrap text-center",
                      done ? "text-espresso800" : "text-neutral400",
                    )}
                  >
                    {step.label}
                  </div>
                  {idx < miniTimeline.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-1/2 top-3 h-[2px] w-full -translate-y-1/2",
                        idx < activeIdx
                          ? "bg-gradient-to-r from-gold400 to-gold500"
                          : "bg-neutral200",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border-rose200/60 mb-4 flex items-start gap-2.5 rounded-2xl border bg-rose50/60 px-4 py-3">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="mt-0.5 shrink-0 text-rose500"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M15 9l-6 6M9 9l6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <div className="xxxsmall-m text-rose700">
            Đơn hàng đã được hủy. Quý khách có thể đặt lại các món yêu thích bên
            dưới.
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-dashed border-cream300/70 pt-3">
        <div className="flex flex-col">
          <span className="xxxsmall uppercase tracking-[0.08em] text-neutral500">
            {copy.common.total}
          </span>
          <div className="flex items-baseline gap-0.5">
            <span
              className="bg-gold-gradient bg-clip-text text-xlarge-sb text-transparent"
              style={{ WebkitTextFillColor: "transparent" }}
            >
              {formatCurrency(order.totalAmount)}
            </span>
            <span className="xxxsmall-sb text-gold600">₫</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order.canReorder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReorder?.(order.id);
              }}
              className="bg-gold-gradient-soft/60 xxxsmall-sb inline-flex items-center gap-1.5 rounded-full border border-gold400/50 px-3.5 py-2 text-gold700 transition-all hover:bg-gold-gradient-soft active:scale-95"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 12a9 9 0 0115.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 01-15.5 6.3L3 16M3 21v-5h5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {copy.order.reorder}
            </button>
          )}
          {order.canCancel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel?.(order.id);
              }}
              className="border-rose300 xxxsmall-sb inline-flex items-center gap-1.5 rounded-full border bg-rose50 px-3.5 py-2 text-rose600 transition-all active:scale-95"
            >
              Hủy
            </button>
          )}
          {order.canPickup && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPickup?.(order.id);
              }}
              className="xxxsmall-sb inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 text-espresso900 shadow-button transition-all active:scale-95"
            >
              {copy.common.pickupCode}
            </button>
          )}
          {!order.canReorder && !order.canPickup && !order.canCancel && (
            <button className="xxxsmall-m inline-flex items-center gap-1 rounded-full border border-neutral200 bg-white px-3.5 py-2 text-neutral600 transition-all active:scale-95">
              Theo dõi
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
