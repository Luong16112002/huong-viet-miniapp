import { Sheet } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { CloseIcon } from "./vectors";
import CartItemCard from "./cart-item-card";
import { CartItem } from "@/types/cart.types";
import { useCartStore } from "@/stores/cart.store";
import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";
import { calculateCartTotal } from "@/utils/cart";

interface CheckoutSheetProps {
  visible: boolean;
  onClose: () => void;
  items: CartItem[];
  onCheckout: () => void;
}

function CoinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 10h4a2 2 0 010 4h-4V10zm0 4h5M15 8v.5M15 15v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function CheckoutSheet({
  visible,
  onClose,
  items,
  onCheckout,
}: CheckoutSheetProps) {
  const navigate = useNavigate();
  const updateQuantity = useCartStore((state) => state.updateQuantity);

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
  const estimatedFee = 25000;
  const grandTotal = totalAmount + estimatedFee;

  return (
    <Sheet autoHeight visible={visible} onClose={onClose}>
      <div className="relative flex max-h-[82vh] flex-col bg-cream100 pattern-bg rounded-t-[28px] overflow-hidden">
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
              {copy.cart.title}
            </div>
            <div className="xxxsmall-m text-text-tertiary mt-0.5">
              {items.length > 0 ? `${totalQty} món · Xác nhận gọi món` : " "}&nbsp;
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => {
                onClose();
                navigate("/menu");
              }}
              className="absolute right-4 top-2 inline-flex items-center gap-1 px-3 py-2 rounded-full bg-gold-gradient-soft/60 xxxsmall-m text-gold700 active:scale-95 transition-all"
            >
              + Thêm món
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
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
                    onUpdateQuantity={updateQuantity}
                    onEdit={handleEdit}
                  />
                </div>
              ))}

              <div className="card p-4 mt-1">
                <div className="xxsmall-sb uppercase text-text-secondary tracking-[0.08em] mb-3">
                  Tóm tắt thanh toán
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="xsmall text-text-secondary">Tạm tính</div>
                    <div className="small-m text-espresso900">{formatCurrency(totalAmount)}₫</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="xsmall text-text-secondary">Phí phục vụ (ước tính)</div>
                    <div className="small-m text-espresso900">{formatCurrency(estimatedFee)}₫</div>
                  </div>
                  <div className="divider-ornament my-1" />
                  <div className="flex items-end justify-between pt-1">
                    <div className="flex items-center gap-1.5 small-m text-text-secondary">
                      <CoinIcon className="text-gold600" />
                      Thành tiền
                    </div>
                    <div className="gold-gradient-text" style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Noto Serif', serif" }}>
                      {formatCurrency(grandTotal)}₫
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-soft bg-white/95 backdrop-blur px-5 pt-4 pb-[max(14px,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between gap-3 mb-2.5 text-xxxsmall-m text-neutral500">
              <span className="inline-flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" stroke="#2f8a4f" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" stroke="#2f8a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Gọi món bảo mật · Hương Việt
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                {copy.common.close}
              </button>
              <button
                onClick={onCheckout}
                className="btn-primary flex-1"
              >
                <span className="inline-flex items-center gap-1.5">
                  {copy.cart.checkout}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
