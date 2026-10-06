import { ReviewLeaves, ReviewLotus } from "./review-decoration";
import { Link } from "react-router-dom";
import { Review } from "@/services/reviews.api";
export function Star({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 2 3.1 6.3 7 .9-5.1 5 1.2 7L12 18l-6.2 3.2 1.2-7-5.1-5 7-.9Z" />
    </svg>
  );
}
export function StarRating({
  value,
  onChange,
  label,
  disabled = false,
}: {
  value: number;
  onChange?: (n: number) => void;
  label: string;
  disabled?: boolean;
}) {
  return onChange ? (
    <div className="rv-stars" role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          disabled={disabled}
          aria-label={`${label} · ${n} sao`}
          aria-pressed={value === n}
          onClick={() => onChange(n)}
          className={n <= value ? "filled" : ""}
        >
          <Star filled={n <= value} />
        </button>
      ))}
    </div>
  ) : (
    <span
      className="rv-static-stars"
      aria-label={`${value.toLocaleString("vi-VN")} trên 5 sao`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= Math.round(value)} />
      ))}
    </span>
  );
}
export function ReviewHeader() {
  return (
    <header className="rv-header">
      <Link to="/profile" aria-label="Quay lại tài khoản">
        ←
      </Link>
      <h1>Đánh giá của tôi</h1>
      <Link to="/profile/support" aria-label="Trợ giúp về đánh giá">
        ⋮
      </Link>
    </header>
  );
}
export function ReviewIntro() {
  return (
    <section className="rv-intro">
      <ReviewLeaves />
      <div className="rv-intro-copy">
        <span>TRẢI NGHIỆM CỦA BẠN</span>
        <h2>
          Đánh giá của tôi <ReviewLotus />
        </h2>
        <p>Lưu lại cảm nhận về những bữa ngon tại Hương Việt.</p>
      </div>
      <div className="rv-brand-note" aria-hidden="true">
        Món ngon
        <br />
        <span>Kết nối yêu thương</span>
      </div>
    </section>
  );
}
export function ReviewSummaryCard({
  reviews,
  write,
  loading,
}: {
  reviews: Review[];
  write: () => void;
  loading: boolean;
}) {
  const mean = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  return (
    <section className="rv-summary" aria-busy={loading}>
      <div>
        <strong>
          {loading
            ? "…"
            : reviews.length
              ? mean.toLocaleString("vi-VN", { maximumFractionDigits: 1 })
              : "—"}
          <small> / 5</small>
        </strong>
        <p>{reviews.length} đánh giá cá nhân</p>
      </div>
      <div className="rv-summary-stars">
        <StarRating value={mean} label="Điểm trung bình" />
        <progress
          value={mean}
          max={5}
          aria-label="Điểm trung bình trên 5 sao"
        />
      </div>
      <button className="rv-primary" onClick={write}>
        ＋ Viết đánh giá
      </button>
      <small className="rv-privacy">
        Đánh giá cá nhân, chưa được đăng công khai.
      </small>
    </section>
  );
}
export function ReviewCard({
  review,
  image,
  edit,
  remove,
}: {
  review: Review;
  image?: string;
  edit: () => void;
  remove: () => void;
}) {
  return (
    <article className="rv-history-card">
      {review.images[0] || image ? (
        <img
          className="rv-dish-photo"
          src={review.images[0] || image}
          alt={review.foodName}
        />
      ) : (
        <div className="rv-dish-placeholder" aria-hidden="true">
          <Star filled />
        </div>
      )}
      <div className="rv-card-content">
        <h3>{review.foodName}</h3>
        <StarRating value={review.rating} label="Đánh giá" />
        <p className="rv-review-text">{review.content}</p>
        {review.tags.length > 0 && (
          <div className="rv-card-tags">
            {review.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        )}
        {review.images.length > 1 && (
          <div className="rv-card-photos">
            {review.images.slice(1).map((src, i) => (
              <a
                key={i}
                href={src}
                target="_blank"
                rel="noreferrer"
                aria-label={`Xem ảnh ${i + 2}`}
              >
                <img src={src} alt={`Ảnh trải nghiệm ${i + 2}`} />
              </a>
            ))}
          </div>
        )}
        {Object.keys(review.criteria).length > 0 && (
          <details className="rv-saved-criteria">
            <summary>Điểm chi tiết</summary>
            {Object.entries(review.criteria).map(([k, v]) => (
              <span key={k}>
                {
                  {
                    food: "Món ăn",
                    service: "Phục vụ",
                    space: "Không gian",
                    price: "Giá cả",
                  }[k]
                }
                : {v}/5
              </span>
            ))}
          </details>
        )}
        <div className="rv-card-footer">
          <time dateTime={review.createdAt}>
            {new Date(review.createdAt).toLocaleDateString("vi-VN")}
          </time>
          {review.local && <small>Trên thiết bị</small>}
          <div>
            <button onClick={edit}>Chỉnh sửa</button>
            <button className="rv-delete" onClick={remove}>
              Xóa
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
export function ReviewEmptyState({ write }: { write: () => void }) {
  return (
    <div className="rv-empty">
      <Star />
      <h3>Bạn chưa có đánh giá nào</h3>
      <p>
        Hãy chia sẻ cảm nhận sau bữa ăn để giúp Hương Việt phục vụ bạn tốt hơn.
      </p>
      <button className="rv-primary" onClick={write}>
        Viết đánh giá ngay
      </button>
    </div>
  );
}
