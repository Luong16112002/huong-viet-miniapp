import { Sheet } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { CloseIcon } from "./vectors";
import CartItemCard from "./cart-item-card";
import { CartItem } from "@/types/cart.types";
import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";
import { calculateCartTotal } from "@/utils/cart";

interface CartSheetProps {
  visible: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onConfirm: () => void;
}

function CoinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 10h4a2 2 0 010 4h-4V10zm0 4h5M15 8v.5M15 15v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function CartSheet({
  visible,
  onClose,
  items,
  onUpdateQuantity,
  onConfirm,
}: CartSheetProps) {
  const navigate = useNavigate();

  const handleEdit = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      navigate(
        `/product/${item.productId}?editCartItemId=${encodeURIComponent(itemId)}`,
      );
      onClose();
    }
  };

  const totalAmount = calculateCartTotal(items);
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Sheet autoHeight visible={visible} onClose={onClose}>
      <div className="relative flex max-h-[78vh] w-full flex-col bg-cream100 pattern-bg rounded-t-[28px] overflow-hidden">
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-neutral300/80" />
        </div>

        <div className="relative flex items-center px-5 pt-2 pb-4">
          <button
            onClick={onClose}
            className="absolute left-4 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm border border-divider02 active:scale-95 transition-all"
            aria-label="Đóng"
          >
            <CloseIcon color="#3f2d1d" size={14} strokeWidth={2.6} />
          </button>
          <div className="flex-1 text-center">
            <div className="heading_serif text-espresso900 text-[18px]">
              {copy.common.updateCart}
            </div>
            <div className="xxxsmall-m text-text-tertiary mt-0.5">
              {items.length > 0 ? `${totalQty} món trong giỏ` : " "}&nbsp;
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => navigate("/menu")}
              className="absolute right-4 top-2 inline-flex items-center gap-1 px-3 py-2 rounded-full bg-gold-gradient-soft/60 xxxsmall-m text-gold700 active:scale-95 transition-all"
            >
              + Thêm
            </button>
          )}
        </div>

        <div className="w-full flex-1 overflow-y-auto px-4 pb-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16">
              <div className="relative mb-5">
                <div className="absolute inset-0 -m-2 rounded-full animate-pulseRing" style={{ background: "radial-gradient(closest-side, rgba(201,168,106,0.28), transparent 70%)" }} />
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white border border-divider02 shadow-sm">
                  <svg
                    className="h-16 w-16 text-gold500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="heading_serif text-espresso900 mb-1.5">
                {copy.cart.empty}
              </h3>
              <p className="xsmall text-text-secondary text-center max-w-[240px] leading-relaxed">
                {copy.cart.emptyHint}
              </p>
              <button
                onClick={() => {
                  onClose();
                  navigate("/menu");
                }}
                className="btn-primary mt-6 !px-8"
              >
                Xem thực đơn
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.id} className="card p-3">
                  <CartItemCard
                    item={item}
                    variant="editable"
                    onUpdateQuantity={onUpdateQuantity}
                    onEdit={handleEdit}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-soft bg-white/95 backdrop-blur px-5 pt-4 pb-[max(14px,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-1">
              <div className="xxsmall text-text-secondary uppercase tracking-[0.08em]">
                Tạm tính
              </div>
              <div className="xxsmall text-text-secondary">
                {totalQty} món
              </div>
            </div>
            <div className="flex items-end justify-between mb-4">
              <div className="flex items-center gap-1.5 xsmall-m text-text-secondary">
                <CoinIcon className="text-gold600" />
                {copy.common.total}
              </div>
              <div className="gold-gradient-text" style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Noto Serif', serif" }}>
                {formatCurrency(totalAmount)}₫
              </div>
            </div>
            <button
              onClick={onConfirm}
              className="btn-primary w-full"
            >
              <span className="inline-flex items-center gap-1.5">
                {copy.common.confirm}
              </span>
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
