import type { ReactNode } from "react";
import type { Product } from "@/types/product.types";
import { formatCurrency } from "@/utils/format";

export function FoodInfoSection({ product, children }: { product: Product; children: ReactNode }) {
  return <section className="dish-intro"><div className="dish-eyebrow">HƯƠNG VIỆT · BỮA ĂN CỦA BẠN</div><h1>{product.name}</h1><div className="dish-price">{formatCurrency(product.sales?.specialPrice ?? product.price)}<small>đ / phần</small>{product.sales?.specialPrice != null && product.sales.specialPrice < product.price && <del>{formatCurrency(product.price)}đ</del>}</div><p className="dish-description">{product.description}</p>{children}</section>;
}
const preferences = ["Ít hành", "Không hành", "Thêm rau", "Ít dầu", "Ít cay", "Không cay"];
export function TastePreferenceSection({ note, onChange }: { note: string; onChange: (value: string) => void }) {
  const selected = note.split("; ");
  function toggle(value: string) {
    const opposite: Record<string,string> = { "Ít hành": "Không hành", "Không hành": "Ít hành", "Ít cay": "Không cay", "Không cay": "Ít cay" };
    const next = selected.filter(v => v && v !== value && v !== opposite[value]);
    if (!selected.includes(value)) next.push(value);
    onChange(next.join("; "));
  }
  return <div className="dish-preferences"><p className="dish-muted">Điều chỉnh món theo khẩu vị riêng. Gửi lời nhắn để bếp xem xét thực hiện.</p><div className="dish-taste-chips">{preferences.map(p => <button key={p} type="button" aria-pressed={selected.includes(p)} onClick={() => toggle(p)}>{selected.includes(p) && <span aria-hidden="true">✓ </span>}{p}</button>)}</div></div>;
}
export function FoodNoteSection({ note, onChange }: { note: string; onChange: (value: string) => void }) {
  return <section className="dish-note-card"><label htmlFor="dish-note">GHI CHÚ CHO MÓN HÔM NAY</label><textarea id="dish-note" value={note} onChange={e => onChange(e.target.value.slice(0,200))} maxLength={200} placeholder="Thêm ghi chú cho món này..." rows={3} aria-describedby="dish-note-count" /><small id="dish-note-count">{note.length}/200</small></section>;
}
export function QuantitySelector({ quantity, onChange }: { quantity: number; onChange: (value: number) => void }) {
  return <div className="dish-quantity"><button type="button" aria-label="Giảm số lượng" disabled={quantity <= 1} onClick={() => onChange(quantity-1)}>−</button><output aria-label="Số lượng">{quantity}</output><button type="button" aria-label="Tăng số lượng" disabled={quantity >= 20} onClick={() => onChange(quantity+1)}>+</button></div>;
}
export function AddToCartBar({ total, quantity, onQuantity, onAdd, edit, count, onCart, feedback }: { total: number; quantity: number; onQuantity: (value: number) => void; onAdd: () => void; edit: boolean; count: number; onCart: () => void; feedback: string }) {
  return <div className="dish-order-bar">{count > 0 && <button className="dish-view-cart" onClick={onCart}>Giỏ hàng · {count} món <span>Xem giỏ →</span></button>}<div className="dish-order-inner"><div className="dish-total"><small>TỔNG CỘNG</small><strong>{formatCurrency(total)}<small>đ</small></strong></div><QuantitySelector quantity={quantity} onChange={onQuantity} /><button data-dish-add onClick={onAdd}>{edit ? "Cập nhật giỏ" : "Thêm vào giỏ"}</button></div>{feedback && <div className="dish-feedback" role="status">{feedback}</div>}</div>;
}
