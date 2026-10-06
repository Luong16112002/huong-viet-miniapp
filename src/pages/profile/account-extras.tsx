import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProducts } from "@/services/product/product.queries";
import { useCartStore } from "@/stores/cart.store";
import { getDefaultVariants } from "@/utils/product";
import { formatCurrency } from "@/utils/format";
import { useHome } from "@/services/home/home.queries";
import "./profile.css";
export function readFavorites(): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem("favorite-dishes") || "[]");
    return Array.isArray(ids) ? [...new Set(ids.map(String))] : [];
  } catch {
    return [];
  }
}
export function FavoritesPage() {
  const [ids, setIds] = useState(readFavorites);
  const [message, setMessage] = useState("");
  const {
    data: products = [],
    isLoading,
    isError,
    refetch,
  } = useProducts("all", "");
  const add = useCartStore((s) => s.addToCart);
  const navigate = useNavigate();
  const visible = products.filter((p) => ids.includes(String(p.id)));
  return (
    <main className="pa-extra">
      <p className="pa-eyebrow">KHẨU VỊ CỦA BẠN</p>
      <h1>Món yêu thích</h1>
      <p>Những món ngon bạn muốn thưởng thức lần nữa.</p>
      {message && (
        <p role="status" className="pa-status">
          {message}
        </p>
      )}
      {isLoading ? (
        <div className="pa-loading" role="status">
          Đang tải món yêu thích…
        </div>
      ) : isError ? (
        <button onClick={() => void refetch()}>
          Chưa tải được món. Thử lại
        </button>
      ) : visible.length ? (
        <div className="pa-favorites">
          {visible.map((p) => (
            <article key={p.id}>
              <Link to={`/product/${p.id}`}>
                <img src={p.image} alt={p.name} />
              </Link>
              <div>
                <Link to={`/product/${p.id}`}>
                  <h2>{p.name}</h2>
                </Link>
                <strong>{formatCurrency(p.price)}đ</strong>
                <div>
                  <button
                    aria-label={`Bỏ yêu thích ${p.name}`}
                    onClick={() => {
                      try {
                        const next = readFavorites().filter(
                          (id) => id !== String(p.id),
                        );
                        localStorage.setItem(
                          "favorite-dishes",
                          JSON.stringify(next),
                        );
                        setIds(next);
                        window.dispatchEvent(new Event("favorites-changed"));
                        setMessage("Đã bỏ món khỏi danh sách yêu thích.");
                      } catch {
                        setMessage("Chưa lưu được thay đổi. Vui lòng thử lại.");
                      }
                    }}
                  >
                    Bỏ yêu thích
                  </button>
                  <button
                    className="pa-add"
                    aria-label={`Thêm ${p.name} vào giỏ`}
                    onClick={() => {
                      if (p.variantGroups.some((g) => g.isRequired)) {
                        navigate(`/product/${p.id}`);
                        return;
                      }
                      add({
                        productId: p.id,
                        productName: p.name,
                        productImage: p.image,
                        basePrice: p.price,
                        quantity: 1,
                        selectedVariants: getDefaultVariants(p),
                      });
                      setMessage(`Đã thêm ${p.name} vào giỏ hàng.`);
                    }}
                  >
                    ＋
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="pa-empty">
          <span>♡</span>
          <h2>Bạn chưa lưu món yêu thích</h2>
          <p>Chạm vào trái tim trên món ăn để lưu tại đây.</p>
          <Link to="/menu">Khám phá thực đơn</Link>
        </div>
      )}
    </main>
  );
}
export function VouchersPage() {
  const [tab, setTab] = useState("Còn hạn");
  return (
    <main className="pa-extra">
      <p className="pa-eyebrow">ƯU ĐÃI DÀNH CHO BẠN</p>
      <h1>Mã giảm giá của tôi</h1>
      <div className="pa-tabs" role="group" aria-label="Trạng thái mã giảm giá">
        {["Còn hạn", "Đã dùng", "Hết hạn"].map((t) => (
          <button key={t} aria-pressed={t === tab} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="pa-empty">
        <span>♧</span>
        <h2>
          {tab === "Còn hạn"
            ? "Chưa có mã giảm giá khả dụng"
            : tab === "Đã dùng"
              ? "Chưa có lịch sử sử dụng"
              : "Chưa có mã hết hạn"}
        </h2>
        <p>
          Ví ưu đãi cá nhân chưa được nhà hàng kích hoạt. Các mã được kiểm tra
          khi bạn nhập tại giỏ hàng.
        </p>
        <Link to="/cart">Đến giỏ hàng</Link>
      </div>
    </main>
  );
}
export function SupportPage() {
  const { data, isLoading, isError, refetch } = useHome();
  return (
    <main className="pa-extra">
      <p className="pa-eyebrow">HƯƠNG VIỆT LUÔN LẮNG NGHE</p>
      <h1>Trợ giúp & hỗ trợ</h1>
      <p>Chúng mình sẵn sàng hỗ trợ bữa ăn và lịch hẹn của bạn.</p>
      <div className="pa-support">
        <Link to="/profile/faq">
          Câu hỏi thường gặp <span>→</span>
        </Link>
        <Link to="/ai-chat">
          Hỏi trợ lý ẩm thực AI <span>→</span>
        </Link>
        {data ? (
          <>
            <a href={`tel:${data.restaurant.phone.replace(/\s/g, "")}`}>
              Gọi nhà hàng <span>{data.restaurant.phone}</span>
            </a>
            <p>{data.restaurant.address}</p>
            <p>Giờ mở cửa: {data.restaurant.openHours}</p>
          </>
        ) : isLoading ? (
          <p role="status">Đang tải thông tin liên hệ…</p>
        ) : isError ? (
          <button onClick={() => void refetch()}>
            Tải lại thông tin liên hệ
          </button>
        ) : null}
      </div>
    </main>
  );
}
