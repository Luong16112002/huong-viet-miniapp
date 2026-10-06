import { ReviewLeaves } from "./review-decoration";
import { FormEvent, useRef, useState } from "react";
import { ReviewDraft, reviewTags } from "@/services/reviews.api";
import { Product } from "@/types/product.types";
import { StarRating } from "./review-components";
import { ReviewImageUploader } from "./review-images";
const labels = [
  "Chọn từ 1 đến 5 sao",
  "Rất chưa hài lòng",
  "Chưa hài lòng",
  "Bình thường",
  "Hài lòng",
  "Rất hài lòng",
];
export function ReviewTagChips({
  tags,
  change,
  disabled,
}: {
  tags: string[];
  change: (tags: string[]) => void;
  disabled: boolean;
}) {
  return (
    <section className="rv-tag-section">
      <h3>
        Chọn chủ đề <small>(có thể chọn nhiều)</small>
      </h3>
      <div className="rv-tags">
        {reviewTags.map((tag) => (
          <button
            key={tag}
            type="button"
            disabled={disabled}
            aria-pressed={tags.includes(tag)}
            onClick={() =>
              change(
                tags.includes(tag)
                  ? tags.filter((t) => t !== tag)
                  : [...tags, tag],
              )
            }
          >
            <span aria-hidden="true">{tags.includes(tag) ? "✓" : "○"}</span>
            {tag}
          </button>
        ))}
      </div>
    </section>
  );
}
export function ReviewForm({
  draft,
  change,
  save,
  cancel,
  busy,
  editing,
  error,
  products,
}: {
  draft: ReviewDraft;
  change: (draft: ReviewDraft) => void;
  save: () => void;
  cancel: () => void;
  busy: boolean;
  editing: boolean;
  error: string;
  products: Product[];
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [uploading, setUploading] = useState(false);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!uploading) save();
  }
  return (
    <form ref={ref} className="rv-form" id="review-form" onSubmit={submit}>
      <ReviewLeaves className="rv-form-leaves" />
      <fieldset disabled={busy || uploading}>
        <h2>{editing ? "Chỉnh sửa đánh giá" : "Bữa ăn của bạn thế nào?"}</h2>
        <p className="rv-form-hint">Chọn mức độ hài lòng</p>
        <StarRating
          value={draft.rating}
          label="Mức độ hài lòng"
          onChange={(rating) => change({ ...draft, rating })}
        />
        <p className="rv-rating-label" role="status">
          {labels[draft.rating]}
        </p>
        <label className="rv-field">
          Đánh giá về
          <select
            value={draft.foodId ?? ""}
            onChange={(e) =>
              change({
                ...draft,
                foodId: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value="">Trải nghiệm tại Hương Việt</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="rv-field" htmlFor="review-content">
          Chia sẻ cảm nhận
          <textarea
            id="review-content"
            value={draft.content}
            maxLength={1000}
            minLength={10}
            onChange={(e) => change({ ...draft, content: e.target.value })}
            placeholder="Món ăn, không gian hoặc cách phục vụ khiến bạn nhớ nhất…"
            aria-describedby="review-content-help"
            aria-invalid={
              draft.content.length > 0 && draft.content.trim().length < 10
            }
          />
        </label>
        <div id="review-content-help" className="rv-character-count">
          <span
            className={
              draft.content.length > 0 && draft.content.trim().length < 10
                ? "rv-error"
                : ""
            }
          >
            Tối thiểu 10 ký tự
          </span>
          <span>{draft.content.length}/1000 ký tự</span>
        </div>
        <ReviewTagChips
          tags={draft.tags}
          change={(tags) => change({ ...draft, tags })}
          disabled={busy}
        />
        <ReviewImageUploader
          onProcessing={setUploading}
          images={draft.images}
          onChange={(images) => change({ ...draft, images })}
          disabled={busy}
        />
        <details className="rv-criteria">
          <summary>
            Đánh giá chi tiết <span>Tùy chọn</span>
          </summary>
          {(
            [
              ["food", "Món ăn"],
              ["service", "Phục vụ"],
              ["space", "Không gian"],
              ["price", "Giá cả"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <span>{label}</span>
              <StarRating
                label={label}
                value={draft.criteria[key] || 0}
                onChange={(n) =>
                  change({
                    ...draft,
                    criteria: { ...draft.criteria, [key]: n },
                  })
                }
              />
            </div>
          ))}
        </details>
        {error && (
          <p className="rv-error" role="alert">
            {error}
          </p>
        )}
        <div className="rv-form-actions">
          <button type="button" onClick={cancel}>
            Hủy
          </button>
          <button
            className="rv-primary"
            type="submit"
            disabled={!draft.rating || draft.content.trim().length < 10 || busy}
          >
            {busy ? "Đang lưu…" : "Lưu đánh giá"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
