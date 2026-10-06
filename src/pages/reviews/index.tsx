import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { useReviewStore } from "@/stores/review.store";
import { useProducts } from "@/services/product/product.queries";
import { Review, ReviewDraft, reviewService } from "@/services/reviews.api";
import {
  ReviewHeader,
  ReviewIntro,
  ReviewSummaryCard,
  ReviewCard,
  ReviewEmptyState,
} from "./review-components";
import { ReviewForm } from "./review-form";
import "./reviews.css";
const empty = (): ReviewDraft => ({
  rating: 0,
  content: "",
  foodId: null,
  tags: [],
  images: [],
  criteria: {},
});
export default function ReviewsPage() {
  const user = useAuthStore((s) => s.user);
  const cache = useQueryClient();
  const local = useReviewStore();
  const { data: products = [] } = useProducts("all", "");
  const queryKey = ["personal-reviews", user?.id];
  const {
    data: remote = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: reviewService.list,
    enabled: !!user,
    retry: 1,
  });
  const legacy: Review[] = local.reviews
    .filter((r) => r.userId === user?.id)
    .map((r) => ({
      ...r,
      foodId: null,
      foodName: "Trải nghiệm tại Hương Việt",
      images: [],
      tags: [],
      criteria: {},
      local: true,
    }));
  const reviews = [...remote, ...legacy].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState<Review | null>(null);
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [deleting, setDeleting] = useState<Review | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const lock = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef<{ fingerprint: string; key: string } | null>(null);
  useEffect(() => {
    if (deleting) dialog.current?.showModal();
    else dialog.current?.close();
  }, [deleting]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  function focus() {
    setTimeout(() => {
      document
        .querySelector("#review-form")
        ?.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        });
    }, 50);
  }
  function write(review?: Review) {
    if (busy) return;
    setEditing(review || null);
    setDraft(
      review
        ? {
            rating: review.rating,
            content: review.content,
            foodId: review.foodId,
            tags: [...review.tags],
            images: [...review.images],
            criteria: { ...review.criteria },
          }
        : empty(),
    );
    setError("");
    setOpen(true);
    focus();
  }
  async function save() {
    if (!user || lock.current) return;
    if (
      !draft.rating ||
      draft.content.trim().length < 10 ||
      draft.content.trim().length > 1000
    ) {
      setError("Chọn số sao và nhập từ 10 đến 1.000 ký tự.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const fingerprint = JSON.stringify(draft);
      if (pending.current?.fingerprint !== fingerprint)
        pending.current = { fingerprint, key: crypto.randomUUID() };
      const saved = await reviewService.save(
        draft,
        editing && !editing.local ? editing.id : undefined,
        pending.current.key,
      );
      cache.setQueryData<Review[]>(queryKey, (old) => [
        saved,
        ...(old || []).filter((r) => r.id !== saved.id),
      ]);
      if (editing?.local) local.deleteReview(user.id, editing.id);
      pending.current = null;
      setEditing(null);
      setDraft(empty());
      setOpen(false);
      setToast("Đánh giá của bạn đã được lưu");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Chưa lưu được đánh giá. Nội dung vẫn được giữ.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting || !user || lock.current) return;
    lock.current = true;
    setBusy(true);
    setDeleteError("");
    try {
      if (deleting.local) local.deleteReview(user.id, deleting.id);
      else {
        await reviewService.remove(deleting.id);
        cache.setQueryData<Review[]>(queryKey, (old) =>
          (old || []).filter((r) => r.id !== deleting.id),
        );
      }
      if (editing?.id === deleting.id) {
        setEditing(null);
        setDraft(empty());
        setOpen(false);
      }
      setDeleting(null);
      setToast("Đã xóa đánh giá");
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "Chưa xóa được đánh giá.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="rv-page">
      <ReviewHeader />
      <ReviewIntro />
      <main className="rv-main">
        {!user ? (
          <div className="rv-empty">
            <h2>Chia sẻ trải nghiệm của bạn</h2>
            <p>Đăng nhập để viết và quản lý đánh giá.</p>
            <Link className="rv-primary" to="/login">
              Đăng nhập
            </Link>
          </div>
        ) : (
          <>
            <ReviewSummaryCard
              reviews={reviews}
              loading={isLoading}
              write={() => {
                if (open && !editing) focus();
                else write();
              }}
            />
            {open && (
              <ReviewForm
                draft={draft}
                change={setDraft}
                editing={!!editing}
                busy={busy}
                error={error}
                products={products}
                save={save}
                cancel={() => {
                  setOpen(false);
                  setEditing(null);
                  setDraft(empty());
                  setError("");
                }}
              />
            )}
            <section className="rv-history">
              <div className="rv-history-heading">
                <h2>
                  <span aria-hidden="true">❧</span> Lịch sử đánh giá
                </h2>
                <span>{reviews.length} đánh giá</span>
              </div>
              {isError && (
                <div className="rv-api-error" role="alert">
                  Chưa tải được lịch sử từ nhà hàng.{" "}
                  <button onClick={() => void refetch()}>Thử lại</button>
                </div>
              )}
              {isLoading ? (
                <div
                  className="rv-skeletons"
                  role="status"
                  aria-label="Đang tải lịch sử đánh giá"
                >
                  <div />
                  <div />
                </div>
              ) : reviews.length ? (
                <div className="rv-history-list">
                  {reviews.map((r) => (
                    <ReviewCard
                      key={`${r.local ? "local" : "api"}-${r.id}`}
                      review={r}
                      image={products.find((p) => p.id === r.foodId)?.image}
                      edit={() => write(r)}
                      remove={() => {
                        if (!busy) {
                          setDeleteError("");
                          setDeleting(r);
                        }
                      }}
                    />
                  ))}
                </div>
              ) : !isError ? (
                <ReviewEmptyState write={() => write()} />
              ) : null}
            </section>
          </>
        )}
      </main>
      <dialog
        ref={dialog}
        className="rv-dialog"
        aria-labelledby="review-delete-title"
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setDeleting(null);
        }}
      >
        <h2 id="review-delete-title">Xóa đánh giá?</h2>
        <p>Bạn có chắc muốn xóa đánh giá này không?</p>
        {deleteError && (
          <p className="rv-error" role="alert">
            {deleteError}
          </p>
        )}
        <div>
          <button disabled={busy} onClick={() => setDeleting(null)}>
            Hủy
          </button>
          <button
            className="rv-delete-confirm"
            disabled={busy}
            onClick={remove}
          >
            {busy ? "Đang xóa…" : "Xóa"}
          </button>
        </div>
      </dialog>
      {toast && (
        <div className="rv-toast" role="status">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
