import { useState } from "react";
import { Link } from "react-router-dom";
import { CartItem } from "@/types/cart.types";
import { Product } from "@/types/product.types";
import { calculateCartItemPrice } from "@/utils/cart";
import { formatCurrency } from "@/utils/format";
import { CartDraft } from "@/stores/cart-draft.store";
import { CartIcon } from "./cart-icon";
export const money = (value: number) => `${formatCurrency(value)}đ`;
export function CartHeader() {
  return (
    <header className="cart-header">
      <Link to="/menu" aria-label="Quay lại thực đơn">
        <CartIcon name="back" />
      </Link>
      <div>
        <h1>Giỏ hàng</h1>
        <p>Kiểm tra món đã chọn trước khi đặt món</p>
      </div>
      <Link to="/order" aria-label="Xem đơn hàng">
        <CartIcon name="bag" />
      </Link>
    </header>
  );
}
export function CartItemQuantity({
  item,
  change,
}: {
  item: CartItem;
  change: (n: number) => void;
}) {
  return (
    <div className="cart-quantity">
      <button
        disabled={item.quantity <= 1}
        aria-label={`Giảm số lượng ${item.productName}`}
        onClick={() => change(item.quantity - 1)}
      >
        <CartIcon name="minus" />
      </button>
      <span key={item.quantity} aria-live="polite">
        {item.quantity}
      </span>
      <button
        disabled={item.quantity >= 20}
        aria-label={`Tăng số lượng ${item.productName}`}
        onClick={() => change(item.quantity + 1)}
      >
        <CartIcon name="plus" />
      </button>
    </div>
  );
}
export function CartItemCard({
  item,
  change,
  remove,
  saveNote,
  removing,
}: {
  item: CartItem;
  change: (n: number) => void;
  remove: () => void;
  saveNote: (note: string) => void;
  removing: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(item.note || "");
  return (
    <article className={`cart-item ${removing ? "is-removing" : ""}`}>
      <img src={item.productImage} alt={item.productName} />
      <div className="cart-item-content">
        <div className="cart-item-title">
          <h2>{item.productName}</h2>
          <button
            className="cart-trash"
            aria-label={`Xóa ${item.productName}`}
            onClick={remove}
          >
            <CartIcon name="trash" />
          </button>
        </div>
        <strong className="cart-item-price">
          {money(calculateCartItemPrice(item))}
        </strong>
        {item.selectedVariants.length > 0 && (
          <p className="cart-variants">
            {item.selectedVariants
              .map(
                (v) =>
                  `${v.optionName}${v.quantity && v.quantity !== 1 ? ` × ${v.quantity}` : ""}`,
              )
              .join(" · ")}
          </p>
        )}
        <div className="cart-item-bottom">
          <button
            className="cart-note-chip"
            onClick={() => setEditing(!editing)}
            aria-expanded={editing}
          >
            <CartIcon name="note" />
            <span>{item.note || "Thêm ghi chú"}</span>
          </button>
          <CartItemQuantity item={item} change={change} />
        </div>
      </div>
      {editing && (
        <div className="cart-item-note">
          <label>
            Ghi chú cho {item.productName}
            <textarea
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ít cay, không hành, thêm rau…"
            />
          </label>
          <button
            className="cart-primary"
            onClick={() => {
              saveNote(note.trim());
              setEditing(false);
            }}
          >
            Lưu ghi chú
          </button>
        </div>
      )}
    </article>
  );
}
export function VoucherSection({
  code,
  setCode,
  apply,
  busy,
  message,
  applied,
  remove,
}: {
  code: string;
  setCode: (v: string) => void;
  apply: () => void;
  busy: boolean;
  message: string;
  applied: string;
  remove: () => void;
}) {
  return (
    <section className="cart-voucher">
      <div className="cart-section-heading">
        <CartIcon name="tag" />
        <div>
          <h2>Ưu đãi</h2>
          <p>Nhập mã để nhận thêm ưu đãi hấp dẫn</p>
        </div>
      </div>
      <div className="cart-voucher-input">
        <input
          aria-label="Mã ưu đãi"
          placeholder="Nhập mã ưu đãi"
          value={code}
          maxLength={40}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
        />
        <button
          className="cart-primary"
          onClick={apply}
          disabled={busy || !code.trim()}
        >
          {busy ? "Đang kiểm tra…" : "Áp dụng"}
        </button>
      </div>
      {applied && (
        <p className="cart-voucher-applied">
          Đã áp dụng {applied}
          <button onClick={remove}>Bỏ mã ×</button>
        </p>
      )}
      {message && (
        <p role="status" className="cart-inline-message">
          {message}
        </p>
      )}
    </section>
  );
}
export function DeliveryMethodSection({
  draft,
  update,
}: {
  draft: CartDraft;
  update: (v: Partial<CartDraft>) => void;
}) {
  return (
    <section className="cart-delivery">
      <div className="cart-section-heading">
        <span className="cart-heading-icon">
          <CartIcon name="truck" />
        </span>
        <div>
          <h2>Hình thức nhận món</h2>
          <p>Chọn cách nhận món phù hợp với bạn</p>
        </div>
      </div>
      <div
        className="cart-methods"
        role="group"
        aria-label="Hình thức nhận món"
      >
        {(
          [
            {
              id: "pickup",
              label: "Tại quầy",
              description: "Nhận tại nhà hàng",
              icon: "store",
            },
            {
              id: "delivery",
              label: "Giao hàng",
              description: "Giao tận nơi",
              icon: "truck",
            },
            {
              id: "dinein",
              label: "Tại bàn",
              description: "Phục vụ tại bàn",
              icon: "table",
            },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            aria-pressed={draft.deliveryType === m.id}
            onClick={() => update({ deliveryType: m.id })}
          >
            <span>
              <CartIcon name={m.icon} />
            </span>
            <strong>{m.label}</strong>
            <small>{m.description}</small>
            {draft.deliveryType === m.id && (
              <i>
                <CartIcon name="check" />
              </i>
            )}
          </button>
        ))}
      </div>
      {draft.deliveryType === "delivery" && (
        <div className="cart-delivery-fields">
          <label>
            Người nhận
            <input
              required
              autoComplete="name"
              maxLength={80}
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Họ và tên người nhận"
            />
          </label>
          <label>
            Số điện thoại
            <input
              required
              type="tel"
              autoComplete="tel"
              maxLength={20}
              value={draft.phone}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="Số điện thoại nhận món"
            />
          </label>
          <label>
            Địa chỉ giao hàng
            <textarea
              required
              maxLength={300}
              autoComplete="street-address"
              value={draft.address}
              onChange={(e) => update({ address: e.target.value })}
              placeholder="Số nhà, đường, phường, tỉnh/thành phố"
            />
          </label>
          <p>Phí giao hàng: {money(25000)}</p>
        </div>
      )}
      {draft.deliveryType === "dinein" && (
        <label className="cart-table-field">
          Số bàn / mã bàn
          <input
            required
            maxLength={30}
            value={draft.tableNumber}
            onChange={(e) => update({ tableNumber: e.target.value })}
            placeholder="Ví dụ: Bàn 05"
          />
        </label>
      )}
    </section>
  );
}
export function OrderSummaryCard({
  subtotal,
  shipping,
  discount,
  total,
}: {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}) {
  return (
    <section className="cart-summary">
      <div className="cart-section-heading">
        <CartIcon name="note" />
        <h2>Tóm tắt đơn hàng</h2>
      </div>
      <dl>
        <div>
          <dt>Tạm tính</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        <div>
          <dt>Phí giao hàng</dt>
          <dd>{money(shipping)}</dd>
        </div>
        <div>
          <dt>Giảm giá</dt>
          <dd>{discount ? `−${money(discount)}` : money(0)}</dd>
        </div>
        <div>
          <dt>VAT</dt>
          <dd className="cart-muted">Đã bao gồm</dd>
        </div>
        <div className="cart-total">
          <dt>Tổng tiền</dt>
          <dd>{money(total)}</dd>
        </div>
      </dl>
    </section>
  );
}
export function SuggestedFoods({
  products,
  loading,
  error,
  retry,
  add,
}: {
  products: Product[];
  loading: boolean;
  error: boolean;
  retry: () => void;
  add: (p: Product) => void;
}) {
  return (
    <section className="cart-suggestions">
      <div className="cart-section-heading">
        <span className="cart-leaf">
          <CartIcon name="leaf" />
        </span>
        <div>
          <h2>Gợi ý cho bạn</h2>
          <p>Thêm món ngon, thêm trọn bữa</p>
        </div>
        <Link to="/menu">Xem thêm →</Link>
      </div>
      {loading ? (
        <div
          className="cart-skeleton"
          role="status"
          aria-label="Đang tải món gợi ý"
        />
      ) : error ? (
        <p>
          Chưa tải được món gợi ý. <button onClick={retry}>Thử lại</button>
        </p>
      ) : (
        <div className="cart-suggestion-list">
          {products.map((p) => (
            <article key={p.id}>
              <img src={p.image} alt={p.name} loading="lazy" />
              <div>
                <h3>{p.name}</h3>
                <strong>{money(p.price)}</strong>
                <button
                  aria-label={`Thêm ${p.name} vào giỏ`}
                  onClick={() => add(p)}
                >
                  <CartIcon name="plus" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
export function CartFooterAction({
  count,
  busy,
  clear,
  checkout,
}: {
  count: number;
  busy: boolean;
  clear: () => void;
  checkout: () => void;
}) {
  return (
    <footer className="cart-footer">
      <button className="cart-clear" disabled={!count || busy} onClick={clear}>
        <CartIcon name="trash" />
        Xóa tất cả
      </button>
      <button
        className="cart-primary"
        disabled={!count || busy}
        onClick={checkout}
      >
        {busy ? (
          "Đang kiểm tra…"
        ) : (
          <>
            Đặt món <span>· {count} món</span>
            <CartIcon name="arrow" />
          </>
        )}
      </button>
    </footer>
  );
}
export function CartEmptyState() {
  return (
    <section className="cart-empty">
      <span>
        <CartIcon name="bag" />
      </span>
      <h2>Giỏ hàng của bạn đang trống</h2>
      <p>Hãy khám phá thực đơn và thêm món yêu thích của bạn.</p>
      <Link to="/menu" className="cart-primary">
        Khám phá thực đơn
      </Link>
    </section>
  );
}
