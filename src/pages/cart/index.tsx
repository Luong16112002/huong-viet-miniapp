import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cart.store";
import { useCartDraft } from "@/stores/cart-draft.store";
import { useProducts } from "@/services/product/product.queries";
import { quoteCart, CartQuote } from "@/services/cart.api";
import { calculateCartTotal } from "@/utils/cart";
import { getDefaultVariants } from "@/utils/product";
import { Product } from "@/types/product.types";
import {
  CartHeader,
  CartItemCard,
  VoucherSection,
  DeliveryMethodSection,
  OrderSummaryCard,
  SuggestedFoods,
  CartFooterAction,
  CartEmptyState,
} from "./cart-components";
import "./cart.css";
export default function CartPage() {
  const navigate = useNavigate();
  const cart = useCartStore();
  const draft = useCartDraft();
  const {
    data: products = [],
    isLoading,
    isError,
    refetch,
  } = useProducts("all", "");
  const [code, setCode] = useState(draft.voucherCode);
  const [quote, setQuote] = useState<{ key: string; data: CartQuote } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");
  const [action, setAction] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const key = JSON.stringify([
    cart.items,
    draft.deliveryType,
    draft.voucherCode,
  ]);
  const latest = useRef(key);
  latest.current = key;
  const subtotal = calculateCartTotal(cart.items);
  const shipping = draft.deliveryType === "delivery" ? 25000 : 0;
  const validQuote = quote?.key === key ? quote.data : null;
  useEffect(() => {
    if (action) dialog.current?.showModal();
    else dialog.current?.close();
  }, [action]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!draft.voucherCode || !cart.items.length) return;
    let active = true;
    const snapshot = key;
    quoteCart(cart.items, draft.deliveryType, draft.voucherCode)
      .then((data) => {
        if (active) setQuote({ key: snapshot, data });
      })
      .catch((e) => {
        if (active) {
          setMessage(e.message);
          draft.update({ voucherCode: "" });
        }
      });
    return () => {
      active = false;
    };
  }, [key]);
  async function apply() {
    if (lock.current || !code.trim()) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    const snapshot = key;
    try {
      const data = await quoteCart(cart.items, draft.deliveryType, code.trim());
      if (latest.current !== snapshot) {
        setMessage("Giỏ hàng đã thay đổi. Vui lòng áp dụng lại mã.");
        return;
      }
      draft.update({ voucherCode: data.voucherCode });
      setQuote({
        key: JSON.stringify([cart.items, draft.deliveryType, data.voucherCode]),
        data,
      });
      setToast("Đã áp dụng mã ưu đãi");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Chưa kiểm tra được mã ưu đãi.",
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  function remove() {
    if (!action) return;
    const ids = action === "all" ? cart.items.map((i) => i.id) : [action];
    setRemoving(ids);
    setAction(null);
    timer.current = setTimeout(() => {
      ids.forEach(cart.removeItem);
      setRemoving([]);
      if (!useCartStore.getState().items.length) draft.reset();
      setToast("Đã cập nhật giỏ hàng");
    }, 180);
  }
  async function checkout() {
    if (!cart.items.length || lock.current) return;
    const phone = draft.phone
      .replace(/[\s().-]/g, "")
      .replace(/^(\+84|84)/, "0");
    if (
      draft.deliveryType === "delivery" &&
      (!draft.name.trim() ||
        !draft.address.trim() ||
        !/^0[35789]\d{8}$/.test(phone))
    ) {
      setMessage(
        "Vui lòng nhập đầy đủ họ tên, địa chỉ và số điện thoại giao hàng hợp lệ.",
      );
      return;
    }
    if (draft.deliveryType === "dinein" && !draft.tableNumber.trim()) {
      setMessage("Vui lòng nhập số bàn hoặc mã bàn.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setMessage("");
    const snapshot = key;
    try {
      const data = await quoteCart(
        cart.items,
        draft.deliveryType,
        draft.voucherCode,
      );
      if (latest.current !== snapshot) {
        setMessage("Giỏ hàng đã thay đổi. Vui lòng kiểm tra lại.");
        return;
      }
      if (data.subtotal !== subtotal) {
        setMessage(
          "Giá món đã thay đổi. Vui lòng mở thực đơn để chọn lại món.",
        );
        return;
      }
      draft.update({ phone });
      setQuote({ key, data });
      navigate("/checkout");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Chưa kiểm tra được giỏ hàng.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function add(p: Product) {
    if (p.variantGroups.some((g) => g.isRequired)) {
      navigate(`/product/${p.id}`);
      return;
    }
    cart.addToCart({
      productId: p.id,
      productName: p.name,
      productImage: p.image,
      basePrice: p.price,
      quantity: 1,
      selectedVariants: getDefaultVariants(p),
    });
    setToast(`Đã thêm ${p.name} vào giỏ`);
  }
  const suggestions = products
    .filter((p) => !cart.items.some((i) => i.productId === p.id))
    .sort(
      (a, b) =>
        Number(/chả giò|nước|chè|rau/i.test(b.name)) -
        Number(/chả giò|nước|chè|rau/i.test(a.name)),
    )
    .slice(0, 4);
  return (
    <div className="hv-cart">
      <CartHeader />
      <main className="cart-body">
        {cart.items.length ? (
          <>
            <div className="cart-items">
              {cart.items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  removing={removing.includes(item.id)}
                  change={(n) => {
                    cart.updateQuantity(item.id, n);
                    setToast("Đã cập nhật giỏ hàng");
                  }}
                  remove={() => setAction(item.id)}
                  saveNote={(note) => {
                    cart.updateCartItem(item.id, { ...item, note });
                    setToast("Đã lưu ghi chú món");
                  }}
                />
              ))}
            </div>
            <VoucherSection
              code={code}
              setCode={setCode}
              busy={busy}
              message=""
              apply={apply}
              applied={draft.voucherCode}
              remove={() => {
                draft.update({ voucherCode: "" });
                setCode("");
                setMessage("");
              }}
            />
            <DeliveryMethodSection draft={draft} update={draft.update} />
            <OrderSummaryCard
              subtotal={subtotal}
              shipping={shipping}
              discount={validQuote?.discount || 0}
              total={validQuote?.total ?? subtotal + shipping}
            />
            <details className="cart-order-note">
              <summary>
                Ghi chú cho đơn hàng <span>Tùy chọn</span>
              </summary>
              <textarea
                aria-label="Ghi chú đơn hàng"
                value={draft.note}
                onChange={(e) => draft.update({ note: e.target.value })}
                maxLength={500}
                placeholder="Nhắn thêm với nhà hàng…"
              />
            </details>
            <SuggestedFoods
              products={suggestions}
              loading={isLoading}
              error={isError}
              retry={() => void refetch()}
              add={add}
            />
          </>
        ) : (
          <CartEmptyState />
        )}
        {message && (
          <div className="cart-error" role="alert">
            {message}
            <button aria-label="Đóng thông báo" onClick={() => setMessage("")}>
              ×
            </button>
          </div>
        )}
      </main>
      <CartFooterAction
        count={cart.totalItems}
        busy={busy || removing.length > 0}
        clear={() => setAction("all")}
        checkout={checkout}
      />
      {toast && (
        <div className="cart-toast" role="status">
          ✓ {toast}
        </div>
      )}
      <dialog
        ref={dialog}
        className="cart-dialog"
        onCancel={() => setAction(null)}
        aria-labelledby="cart-confirm-title"
      >
        <h2 id="cart-confirm-title">
          {action === "all"
            ? "Xóa toàn bộ giỏ hàng?"
            : "Xóa món khỏi giỏ hàng?"}
        </h2>
        <p>
          {action === "all"
            ? "Bạn có chắc muốn xóa toàn bộ giỏ hàng?"
            : `Bạn có chắc muốn xóa ${cart.items.find((i) => i.id === action)?.productName || "món này"} khỏi giỏ hàng?`}
        </p>
        <div>
          <button onClick={() => setAction(null)}>Hủy</button>
          <button className="cart-delete-confirm" onClick={remove}>
            Xóa
          </button>
        </div>
      </dialog>
    </div>
  );
}
