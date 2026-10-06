import {
  OrderStatusSummary,
  OrderQuickInfoGrid,
  PickupLocationCard,
  OrderSupportCard,
} from "./order-premium";
import "./order-detail.css";
import { useParams, useNavigate } from "react-router-dom";
import { useOrderById } from "@/services/order/order.queries";
import { useReorder } from "@/services/order/order.mutations";
import { useSnackbar } from "zmp-ui";
import {
  OrderDetailHeader,
  OrderStatusCard,
  OrderActionBar,
} from "./order-status";
import {
  OrderSummaryCard,
  OrderedItemsSection,
  PaymentSummaryCard,
} from "./order-cards";
export default function OrderDetailPage() {
  const { orderId } = useParams(),
    nav = useNavigate(),
    { openSnackbar } = useSnackbar();
  const query = useOrderById(orderId || "");
  const reorder = useReorder();
  const order = query.data;
  const askAI = () => {
    if (!order) return;
    nav("/ai-chat", {
      state: {
        orderContext: {
          orderId: order.id,
          status: order.state,
          type: order.deliveryType,
          items: order.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
          total: order.payment?.total ?? order.totalAmount,
        },
        orderPrompt: `Tư vấn về đơn ${order.orderCode || order.id}. Các món đã đặt: ${order.items.map((i) => i.name + " ×" + i.quantity).join(", ")}. Trạng thái ghi nhận lúc mở đơn: ${order.stateLabel}. Hình thức nhận: ${order.deliveryTypeLabel}. Tổng tiền: ${order.payment?.total ?? order.totalAmount}đ. Không tự suy đoán thời gian hoàn thành hoặc khả năng sửa đơn khi chưa có xác nhận của nhà hàng.`,
      },
    });
  };
  return (
    <div className="od-page">
      <main className="od-scroll">
        <OrderDetailHeader order={order} />
        <div className="od-content">
          {query.isLoading ? (
            <div
              className="od-skeleton"
              role="status"
              aria-label="Đang tải đơn hàng"
            >
              <div />
              <div />
              <div />
            </div>
          ) : !order ? (
            <section className="od-card od-empty">
              <span aria-hidden="true">▤</span>
              <h2>Không tìm thấy thông tin đơn hàng</h2>
              <p>
                {query.isError
                  ? "Chưa tải được đơn. Bạn có thể thử lại hoặc quay về danh sách."
                  : "Vui lòng kiểm tra lại mã đơn."}
              </p>
              <button onClick={() => query.refetch()}>Thử lại</button>
              <button onClick={() => nav("/order")}>Quay lại đơn hàng</button>
            </section>
          ) : (
            <>
              {query.isError && (
                <div className="od-refresh-error" role="status">
                  Chưa cập nhật được trạng thái mới nhất.{" "}
                  <button onClick={() => query.refetch()}>Thử lại</button>
                </div>
              )}
              <OrderStatusSummary order={order} />
              <OrderQuickInfoGrid order={order} />
              <OrderedItemsSection order={order} />
              <PickupLocationCard order={order} />
              <PaymentSummaryCard order={order} />
              <OrderSupportCard onAI={askAI} />
            </>
          )}
        </div>
      </main>
      {order && (
        <OrderActionBar
          onAI={askAI}
          cancelled={order.state === "cancelled" && order.canReorder}
          busy={reorder.isPending}
          onReorder={() => {
            if (reorder.isPending) return;
            reorder.mutate(order.id, {
              onSuccess: (newOrder) =>
                nav("/order-success", { state: { order: newOrder } }),
              onError: (e) => openSnackbar({ text: e.message, type: "error" }),
            });
          }}
        />
      )}
    </div>
  );
}
