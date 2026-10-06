import { useEffect, useRef, useState } from "react";
import { Product } from "@/types/product.types";
import { SelectedVariant } from "@/types/cart.types";
import { getDefaultVariants } from "@/utils/product";
import "./hotpot.css";

export const money = (value: number) => value.toLocaleString("vi-VN") + "đ";
export function comboVariants(product: Product, people: number) {
  const selection = getDefaultVariants(product).filter(v => v.groupId !== "size");
  const picks = { size: people === 2 ? "small" : people === 4 ? "medium" : "large", toppings: "mushroom", vegetables: "vegetables", drinks: people === 2 ? "two" : people === 4 ? "four" : "six" };
  for (const [groupId, optionId] of Object.entries(picks)) {
    const group = product.variantGroups.find(g => g.id === groupId)!;
    const option = group.options.find(o => o.id === optionId)!;
    selection.push({ groupId, groupTitle: group.title, optionId, optionName: option.name, extraPrice: option.extraPrice });
  }
  return selection;
}
export function HotpotOptions({ product, initial, onClose, onAdd }: { product: Product; initial?: SelectedVariant[]; onClose: () => void; onAdd: (variants: SelectedVariant[]) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(initial || getDefaultVariants(product));
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  const total = product.price + selected.reduce((sum, v) => sum + v.extraPrice, 0);
  return <dialog ref={dialog} className="hotpot-sheet" aria-labelledby="hotpot-options-title" onCancel={onClose} onClick={e => { if (e.target === dialog.current) onClose(); }}>
    <div className="hotpot-sheet-inner">
      <header><div><small>BỮA NGON SUM VẦY</small><h2 id="hotpot-options-title">Tùy chọn món lẩu</h2></div><button aria-label="Đóng tùy chọn" onClick={onClose}>×</button></header>
      <div className="hotpot-selection"><img src={product.image} alt={product.name} /><div><h3>{product.name}</h3><strong>{money(product.price)}</strong><p>Gồm rau và bún / mì · phần cơ bản 2 người</p></div></div>
      {product.variantGroups.map(group => <fieldset key={group.id}><legend>{group.title}</legend><p>{group.description}</p><div className="hotpot-pills">{group.options.map(option => {
        const active = selected.some(v => v.groupId === group.id && v.optionId === option.id);
        return <button key={option.id} aria-pressed={active} className={active ? "selected" : ""} onClick={() => setSelected(old => {
          const rest = old.filter(v => group.type === "SINGLE" ? v.groupId !== group.id : !(v.groupId === group.id && v.optionId === option.id));
          return active && group.type === "MULTIPLE" ? rest : [...rest, { groupId: group.id, groupTitle: group.title, optionId: option.id, optionName: option.name, extraPrice: option.extraPrice }];
        })}>{option.name}{option.extraPrice > 0 && <small> +{money(option.extraPrice)}</small>}</button>;
      })}</div></fieldset>)}
      <footer><div><small>Tổng cộng</small><strong>{money(total)}</strong></div><button onClick={() => onAdd(selected)}>Thêm vào giỏ</button></footer>
    </div>
  </dialog>;
}
export function HotpotCombos({ products, onChoose }: { products: Product[]; onChoose: (p: Product, variants: SelectedVariant[]) => void }) {
  const soups = products.filter(p => p.subCategoryId === "lau");
  if (!soups.length) return null;
  return <section className="hotpot-combos"><h2>Combo lẩu cho nhóm</h2><p>Đủ món, trọn vị cho bữa ăn sum vầy</p><div>{[2,4,6].map((people, i) => {
    const product = soups[[0,1,7][i]] || soups[0];
    const variants = comboVariants(product, people);
    return <article key={people}><img src={product.image} alt={product.name} /><div><h3>Combo {people} người</h3><b>{product.name}</b><p>Nấm thêm · rau thêm · bún tươi · {people} nước suối</p><strong>{money(product.price + variants.reduce((sum,v) => sum + v.extraPrice, 0))}</strong><button onClick={() => onChoose(product, variants)}>Chọn combo</button></div></article>;
  })}</div></section>;
}
export function HotpotDetails({ product }: { product: Product }) {
  if (product.subCategoryId !== "lau") return null;
  return <section className="hotpot-details"><h2>Thông tin món lẩu</h2><dl><dt>Thành phần</dt><dd>{product.ingredients?.join(", ")}</dd><dt>Khẩu phần</dt><dd>Phần cơ bản 2 người · có size 4 / 6 người</dd><dt>Mức cay gốc</dt><dd>{product.spicyLevel} · có thể điều chỉnh bên dưới</dd><dt>Ăn kèm</dt><dd>Rau theo mùa và bún / mì. Topping chính theo thành phần món.</dd><dt>Nước lẩu</dt><dd>{product.variantGroups.find(g => g.id === "broth")?.options.map(o => o.name).join(", ")}</dd></dl></section>;
}
