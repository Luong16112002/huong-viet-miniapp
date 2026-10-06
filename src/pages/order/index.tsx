import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOrderHistory } from "@/services/order/order.queries";
import {
  useCancelOrder,
  useConfirmPickup,
  useReorder,
} from "@/services/order/order.mutations";
import { useReservationStore } from "@/stores/reservation.store";
import { commerceRequest } from "@/services/commerce.api";
import { Reservation } from "@/types/reservation.types";
import {
  filterHistory,
  HistoryEntry,
  HistoryTab,
  historyTabs,
  isOngoingOrder,
  isUpcomingReservation,
} from "@/utils/order-history";
import {
  OrderHeader,
  OrderHero,
  OrderStatsCards,
  OrderStatusTabs,
  OrderSearchBar,
  OrderEmptyState,
} from "./order-controls";
import { HistoryAction, OrderHistorySection } from "./history-cards";
import { BookingDetails } from "./booking-details";
import "./history-redesign.css";

export default function OrderPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab") as HistoryTab;
  const tab = historyTabs.includes(requested) ? requested : "all";
  const upcomingOnly = tab === "reservation" && params.get("upcoming") === "1";
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [limit, setLimit] = useState(10);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(true);
  const [bookingError, setBookingError] = useState("");
  const [action, setAction] = useState<HistoryAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [detail, setDetail] = useState<Reservation | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const lock = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const {
    data: orders = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useOrderHistory();
  const { reservations, refresh, cancelReservation } = useReservationStore();
  const cancel = useCancelOrder();
  const pickup = useConfirmPickup();
  const reorder = useReorder();
  async function loadBookings() {
    setBookingLoading(true);
    setBookingError("");
    try {
      await refresh();
    } catch (e) {
      setBookingError(
        e instanceof Error ? e.message : "Chưa tải được lịch đặt bàn.",
      );
    } finally {
      setBookingLoading(false);
    }
  }
  useEffect(() => {
    void loadBookings();
    const timer = setInterval(() => { setNow(Date.now()); if (!document.hidden) void refresh().catch(() => {}); }, 10000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => setLimit(10), [tab, query, sort, upcomingOnly]);
  useEffect(() => {
    if (action) dialog.current?.showModal();
    else dialog.current?.close();
  }, [action]);
  const entries: HistoryEntry[] = [
    ...orders.map((value) => ({ kind: "order" as const, value })),
    ...reservations.map((value) => ({ kind: "reservation" as const, value })),
  ];
  const filtered = filterHistory(entries, tab, query, upcomingOnly, sort, now);
  const upcoming = reservations.filter((value) =>
    isUpcomingReservation(value, now),
  ).length;
  const ongoing = orders.filter(isOngoingOrder).length + upcoming;
  const completed = entries.filter((e) =>
    ["completed", "delivered"].includes(
      e.kind === "order" ? e.value.state : e.value.status,
    ),
  ).length;
  const loading = isLoading || bookingLoading;
  function select(value: HistoryTab, upcoming = false) {
    setParams(upcoming ? { tab: value, upcoming: "1" } : { tab: value });
  }
  function ask(value: HistoryAction) {
    setActionError("");
    setAction(value);
  }
  async function showDetails(value: Reservation) {
    setDetailLoading(true);
    setMessage("");
    try {
      setDetail(
        await commerceRequest<Reservation>(
          `reservations/${encodeURIComponent(value.id)}`,
        ),
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Chưa tải được chi tiết.");
    } finally {
      setDetailLoading(false);
    }
  }
  async function confirm() {
    if (!action || lock.current) return;
    lock.current = true;
    setBusy(true);
    setActionError("");
    try {
      if (action.kind === "cancel-order") await cancel.mutateAsync(action.id);
      else if (action.kind === "pickup") await pickup.mutateAsync(action.id);
      else if (action.kind === "reorder") {
        const order = await reorder.mutateAsync(action.id);
        setAction(null);
        navigate(`/order/${encodeURIComponent(order.id)}`);
        return;
      } else await cancelReservation(action.id);
      setMessage(
        action.kind === "pickup"
          ? "Đã xác nhận bạn đã nhận món."
          : "Đã hủy yêu cầu và cập nhật lịch sử.",
      );
      setAction(null);
    } catch (e) {
      setActionError(
        e instanceof Error
          ? e.message
          : "Chưa cập nhật được. Vui lòng thử lại.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="oh-page">
      <OrderHeader />
      <OrderHero />
      <main className="oh-container">
        <OrderStatsCards
          upcoming={upcoming}
          ongoing={ongoing}
          completed={completed}
          loading={loading}
          select={select}
        />
        <section aria-label="Tìm và lọc lịch sử">
          <OrderStatusTabs tab={tab} select={select} />
          <OrderSearchBar
            query={query}
            setQuery={setQuery}
            sort={sort}
            setSort={setSort}
            loading={isFetching || bookingLoading}
            refresh={() => {
              setNow(Date.now());
              void refetch();
              void loadBookings();
            }}
          />
          {upcomingOnly && (
            <button
              className="oh-filter-note"
              onClick={() => select("reservation")}
            >
              Lịch đặt bàn sắp tới · Bỏ bộ lọc ×
            </button>
          )}
        </section>
        {(isError || bookingError) && (
          <div className="oh-error" role="alert">
            {isError ? "Chưa tải được đơn hàng. " : ""}
            {bookingError}
            <button
              onClick={() => {
                void refetch();
                void loadBookings();
              }}
            >
              Thử lại
            </button>
          </div>
        )}
        {message && (
          <div className="oh-message" role="status">
            {message}
            <button aria-label="Đóng thông báo" onClick={() => setMessage("")}>
              ×
            </button>
          </div>
        )}
        <div className="oh-list-title">
          <h2>Lịch sử của bạn</h2>
          <span role="status">
            {loading ? "Đang tải…" : `${filtered.length} kết quả`}
          </span>
        </div>
        {loading && !entries.length ? (
          <div
            className="oh-skeletons"
            role="status"
            aria-label="Đang tải lịch sử"
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="oh-skeleton">
                <i />
                <div />
                <div />
              </div>
            ))}
          </div>
        ) : (
          <OrderHistorySection
            entries={filtered.slice(0, limit)}
            ask={ask}
            details={showDetails}
            now={now}
          />
        )}
        {detailLoading && (
          <p role="status" className="oh-message">
            Đang tải chi tiết đặt bàn…
          </p>
        )}
        {!loading && !filtered.length && !isError && !bookingError && (
          <OrderEmptyState
            booking={tab === "reservation"}
            search={!!query || !["all", "reservation"].includes(tab)}
            reset={() => {
              setQuery("");
              select("all");
            }}
          />
        )}
        {filtered.length > limit && (
          <button className="oh-load-more" onClick={() => setLimit(limit + 10)}>
            Xem thêm {Math.min(10, filtered.length - limit)} kết quả
          </button>
        )}
      </main>
      <BookingDetails booking={detail ? reservations.find(r => r.id === detail.id) || detail : null} close={() => setDetail(null)} />
      <dialog
        ref={dialog}
        className="oh-dialog"
        aria-labelledby="oh-confirm-title"
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setAction(null);
        }}
      >
        <h2 id="oh-confirm-title">
          {action?.kind === "reorder"
            ? "Đặt lại đơn hàng?"
            : action?.kind === "pickup"
              ? "Bạn đã nhận đủ món?"
              : "Xác nhận hủy yêu cầu?"}
        </h2>
        <p>
          {action?.kind === "reorder"
            ? "Một đơn mới sẽ được gửi đến nhà hàng. Giá và tình trạng món được kiểm tra lại khi đặt."
            : action?.kind === "pickup"
              ? "Đơn hàng sẽ được chuyển sang hoàn tất."
              : "Yêu cầu sẽ được chuyển sang mục Đã hủy."}
        </p>
        <strong>#{action?.code}</strong>
        {actionError && (
          <p role="alert" className="oh-error">
            {actionError}
          </p>
        )}
        <div className="oh-actions">
          <button disabled={busy} onClick={() => setAction(null)}>
            Quay lại
          </button>
          <button className="oh-primary" disabled={busy} onClick={confirm}>
            {busy
              ? "Đang xử lý…"
              : action?.kind === "reorder"
                ? "Xác nhận đặt lại"
                : action?.kind === "pickup"
                  ? "Đã nhận đủ món"
                  : "Xác nhận hủy"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
