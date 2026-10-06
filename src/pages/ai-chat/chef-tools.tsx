import { useVoiceInput } from "@/hooks/use-voice-input";
﻿import { useEffect, useRef, useState } from "react";
import { Sheet } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { mockListOfProduct as menu } from "@/services/product/product.mock";
import { ChefContext } from "@/services/ai/gemini.api";
import { formatCurrency } from "@/utils/format";
import { getDefaultVariants } from "@/utils/product";
import { useCartStore } from "@/stores/cart.store";
import {
  restaurantToday,
  reservationTimes,
  reservationAreas,
  canReserveTime,
} from "@/utils/reservation";
const options = [
  "Không ăn hải sản",
  "Dị ứng đậu phộng",
  "Không ăn cay",
  "Ăn chay",
  "Ít dầu mỡ",
];
export function ChefPreferences({
  context,
  onChange,
  onSend,
  disabled,
}: {
  context: ChefContext;
  onChange: (c: ChefContext) => void;
  onSend: (s: string) => void;
  disabled: boolean;
}) {
  const [error, setError] = useState("");
  return (
    <details className="chef-settings">
      <summary>
        Khẩu vị & ngân sách <span>Điều chỉnh</span>
      </summary>
      <div className="chef-settings-body">
        <label>
          Số người
          <select
            value={Number(context.people) >= 8 ? 8 : context.people || ""}
            onChange={(e) =>
              onChange({ ...context, people: Number(e.target.value) || null })
            }
          >
            <option value="">Chưa chọn</option>
            {[1, 2, 4, 6, 8].map((n) => (
              <option key={n} value={n}>
                {n === 8 ? "8+" : n} người
              </option>
            ))}
          </select>
        </label>
        {Number(context.people) >= 8 && (
          <label>
            Số khách cụ thể
            <input
              type="number"
              min="8"
              max="20"
              value={context.people || 8}
              onChange={(e) =>
                onChange({ ...context, people: Number(e.target.value) })
              }
            />
          </label>
        )}
        <label>
          Ngân sách tối đa (đ)
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max="100000000"
            placeholder="Ví dụ 1000000"
            value={context.budget || ""}
            onChange={(e) =>
              onChange({ ...context, budget: Number(e.target.value) || null })
            }
          />
        </label>
        <label>
          Khẩu vị
          <select
            value={context.taste || ""}
            onChange={(e) => onChange({ ...context, taste: e.target.value })}
          >
            <option value="">Tất cả</option>
            {[
              "Cay",
              "Không cay",
              "Thanh đạm",
              "Nhiều thịt",
              "Hải sản",
              "Món Việt",
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Sở thích & dị ứng</legend>
          {options.map((p) => (
            <label className="chef-check" key={p}>
              <input
                type="checkbox"
                checked={context.preferences?.includes(p) || false}
                onChange={(e) =>
                  onChange({
                    ...context,
                    preferences: e.target.checked
                      ? [...(context.preferences || []), p]
                      : (context.preferences || []).filter((x) => x !== p),
                  })
                }
              />
              {p}
            </label>
          ))}
        </fieldset>
        <label>
          Món yêu thích
          <select
            multiple
            value={(context.favorites || []).map(String)}
            onChange={(e) =>
              onChange({
                ...context,
                favorites: Array.from(e.target.selectedOptions, (o) =>
                  Number(o.value),
                ),
              })
            }
          >
            {menu.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <p>Lưu trong phiên này. Thông tin dị ứng cần nhà hàng xác nhận.</p>
        {error && <p role="alert">{error}</p>}
        <button
          disabled={disabled}
          onClick={() => {
            if (
              (context.people &&
                (!Number.isInteger(context.people) ||
                  context.people < 1 ||
                  context.people > 20)) ||
              (context.budget &&
                (context.budget < 1 || context.budget > 100000000))
            ) {
              setError("Kiểm tra số người (1–20) và ngân sách.");
              return;
            }
            setError("");
            onSend(
              `Gợi ý món${context.people ? " cho " + context.people + " người" : ""}${context.budget ? ", ngân sách tối đa " + context.budget + " đồng" : ""}${context.taste ? ", khẩu vị " + context.taste : ""}`,
            );
          }}
        >
          Tìm món phù hợp
        </button>
      </div>
    </details>
  );
}
export function ChefFoodSheet({
  id,
  onClose,
  onPair,
  onFavorite,
  favorite,
}: {
  id: number | null;
  onClose: () => void;
  onPair: (name: string) => void;
  onFavorite: (id: number) => void;
  favorite: boolean;
}) {
  const p = menu.find((p) => p.id === id);
  const add = useCartStore((s) => s.addToCart);
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  useEffect(() => setAdded(false), [id]);
  return (
    <Sheet visible={!!p} onClose={onClose} autoHeight>
      <div className="chef-detail">
        {p && (
          <>
            <button
              className="chef-detail-close"
              onClick={onClose}
              aria-label="Đóng chi tiết món"
            >
              ×
            </button>
            <img src={p.image} alt={p.name} />
            <h2>{p.name}</h2>
            <strong>{formatCurrency(p.price)}</strong>
            <p>{p.description}</p>
            <dl>
              <dt>Thành phần</dt>
              <dd>
                {p.ingredients?.length ? p.ingredients.join(", ") : p.description}. Gia vị và thành phần nước sốt chưa được xác nhận đầy đủ.
              </dd>
              <dt>Mức độ cay</dt>
              <dd>
                {p.features.includes("spicy")
                  ? "Có nhãn món cay"
                  : "Mức độ cay chưa được xác nhận"}
              </dd>
              <dt>Dị ứng</dt>
              <dd>
                Chưa có danh sách dị ứng đầy đủ. Vui lòng xác nhận nguyên liệu
                và nhiễm chéo với nhà hàng.
              </dd>
            </dl>
            <div className="chef-detail-actions">
              <button
                onClick={() => {
                  add({
                    productId: p.id,
                    productName: p.name,
                    productImage: p.image,
                    basePrice: p.price,
                    selectedVariants: getDefaultVariants(p),
                    quantity: 1,
                  });
                  setAdded(true);
                }}
              >
                + Thêm vào giỏ
              </button>
              <button onClick={() => onFavorite(p.id)} aria-pressed={favorite}>
                {favorite ? "♥ Đã yêu thích" : "♡ Yêu thích"}
              </button>
              <button
                onClick={() => {
                  onPair(p.name);
                  onClose();
                }}
              >
                Gợi ý món kèm
              </button>
              <button
                onClick={() => {
                  navigate("/product/" + p.id);
                  onClose();
                }}
              >
                Tùy chọn & ghi chú món
              </button>
            </div>
            {added && <p role="status">Đã thêm 1 phần vào giỏ.</p>}
          </>
        )}
      </div>
    </Sheet>
  );
}
export function ChefBooking({ people }: { people?: number | null }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(restaurantToday());
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(people || 2);
  const [area, setArea] = useState("indoor");
  const [status, setStatus] = useState("");
  const [valid, setValid] = useState(false);
  const reset = () => {
    setValid(false);
    setStatus("");
  };
  return (
    <form
      className="chef-booking"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          !canReserveTime(date, time) ||
          !Number.isInteger(guests) ||
          guests < 1 ||
          guests > 20
        ) {
          setStatus(
            "Chọn giờ đến cách hiện tại ít nhất 30 phút, trong 30 ngày tới, cho 1–20 khách.",
          );
          setValid(false);
          return;
        }
        setValid(true);
        setStatus(
          "Chưa có dữ liệu bàn trống trực tuyến. Bạn có thể gửi yêu cầu để nhà hàng xác nhận.",
        );
      }}
    >
      <h3>Đặt bàn</h3>
      <label>
        Ngày
        <input
          required
          type="date"
          value={date}
          min={restaurantToday()}
          onChange={(e) => {
            setDate(e.target.value);
            reset();
          }}
        />
      </label>
      <label>
        Giờ
        <select
          required
          value={time}
          onChange={(e) => {
            setTime(e.target.value);
            reset();
          }}
        >
          <option value="">Chọn giờ</option>
          {reservationTimes.map((t) => (
            <option key={t} disabled={!canReserveTime(date, t)}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label>
        Số người
        <input
          type="number"
          required
          min="1"
          max="20"
          value={guests}
          onChange={(e) => {
            setGuests(Number(e.target.value));
            reset();
          }}
        />
      </label>
      <label>
        Khu vực
        <select
          value={area}
          onChange={(e) => {
            setArea(e.target.value);
            reset();
          }}
        >
          {reservationAreas.map((a) => (
            <option value={a.id} key={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <button>Kiểm tra bàn trống</button>
      {status && <p role="status">{status}</p>}
      {valid && (
        <button
          type="button"
          onClick={() =>
            navigate("/reservation", {
              state: { chefBooking: { date, time, guests, area } },
            })
          }
        >
          Tiếp tục gửi yêu cầu
        </button>
      )}
    </form>
  );
}
export function ChefVoice({
  onSend,
  disabled,
}: {
  onSend: (s: string) => void;
  disabled: boolean;
}) {
  const voice=useVoiceInput(onSend);
  const listening=voice.isListening;
  const status=voice.error || (voice.isProcessing?'✨ Đang chuyển giọng nói thành văn bản...':voice.isRequestingPermission?'Đang yêu cầu quyền micro…':listening?'🔴 Đang nghe... Nhấn micro để dừng.':'🎙 Nhấn để nói');
  return (<>
      <button type="button" className="chef-mic" disabled={disabled||voice.isProcessing||voice.isRequestingPermission} aria-label={listening?'Dừng ghi âm':'Nhấn để nói'} title={status} aria-pressed={listening} onClick={()=>listening?voice.stopListening():void voice.startListening()}>
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10v2a7 7 0 0014 0v-2M12 19v3M8 22h8" />
        </svg>
      </button>
      {(voice.error || voice.isProcessing || voice.isRequestingPermission || listening) && (
        <span className="chef-voice-note" role="status">{status}</span>
      )}
    </>
  );
}

