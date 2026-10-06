import { Order } from "../../types/order.types";

export const mockOrders: Order[] = [
  {
    id: "order-001",
    orderCode: "0012345",
    deliveryType: "pickup",
    deliveryTypeLabel: "Tự đến lấy",
    state: "preparing",
    stateLabel: "Đang chuẩn bị",
    items: [
      {
        id: "item-001",
        name: "Bò nướng lá lốt",
        quantity: 2,
        price: 89000,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400",
      },
      {
        id: "item-002",
        name: "Gỏi cuốn",
        quantity: 1,
        price: 45000,
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
      },
    ],
    createdAt: new Date("2026-04-15T18:30:00"),
    updatedAt: new Date("2026-04-15T18:35:00"),
    totalAmount: 223000,
    payment: {
      method: "cash",
      subtotal: 223000,
      shippingFee: 0,
      discount: 0,
      total: 223000,
      status: "pending",
    },
    canReorder: true,
    canPickup: false,
    canCancel: false,
  },
  {
    id: "order-002",
    orderCode: "0012344",
    deliveryType: "pickup",
    deliveryTypeLabel: "Tự đến lấy",
    state: "confirmed",
    stateLabel: "Đã xác nhận",
    items: [
      {
        id: "item-003",
        name: "Phở bò",
        quantity: 1,
        price: 65000,
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
      },
      {
        id: "item-004",
        name: "Cơm tấm",
        quantity: 1,
        price: 59000,
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400",
      },
    ],
    createdAt: new Date("2026-04-14T12:15:00"),
    updatedAt: new Date("2026-04-14T12:20:00"),
    totalAmount: 124000,
    payment: {
      method: "zalopay",
      subtotal: 124000,
      shippingFee: 0,
      discount: 0,
      total: 124000,
      status: "paid",
    },
    canReorder: true,
    canPickup: false,
    canCancel: true,
  },
  {
    id: "order-003",
    orderCode: "0012343",
    deliveryType: "pickup",
    deliveryTypeLabel: "Tự đến lấy",
    state: "completed",
    stateLabel: "Hoàn tất",
    items: [
      {
        id: "item-005",
        name: "Lẩu Thái",
        quantity: 1,
        price: 189000,
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&blur=10",
      },
    ],
    createdAt: new Date("2026-04-13T19:20:00"),
    updatedAt: new Date("2026-04-13T20:15:00"),
    totalAmount: 189000,
    payment: {
      method: "cash",
      subtotal: 189000,
      shippingFee: 0,
      discount: 0,
      total: 189000,
      status: "paid",
    },
    canReorder: true,
    canPickup: false,
    canCancel: false,
  },
];

export function createMockOrder(
  items: Order["items"],
  deliveryType: Order["deliveryType"],
  deliveryAddress?: Order["deliveryAddress"],
  pickupStoreId?: string,
  paymentMethod: Order["payment"]["method"] = "cash",
  note?: string
): Order {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const optionsTotal =
      item.options?.reduce((optSum, opt) => optSum + (opt.price || 0), 0) || 0;
    return sum + itemTotal + optionsTotal * item.quantity;
  }, 0);

  const shippingFee = deliveryType === "delivery" ? 25000 : 0;
  const discount = 5000;
  const total = subtotal + shippingFee - discount;

  const orderId = `order-${Date.now()}`;
  const orderCode = `ORD-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${Math.floor(Math.random() * 900) + 100}`;

  return {
    id: orderId,
    orderCode,
    deliveryType,
    deliveryTypeLabel: deliveryType === "delivery" ? "Giao hàng" : "Tự đến lấy",
    state: "pending",
    stateLabel: "Chờ xác nhận",
    items: items.map((item, idx) => ({
      ...item,
      id: `${orderId}-item-${idx}`,
    })),
    createdAt: new Date(),
    updatedAt: new Date(),
    estimatedTime: new Date(Date.now() + 45 * 60 * 1000),
    totalAmount: total,
    payment: {
      method: paymentMethod,
      subtotal,
      shippingFee,
      discount,
      total,
      status: paymentMethod === "cash" ? "pending" : "paid",
    },
    deliveryAddress:
      deliveryType === "delivery" ? deliveryAddress : undefined,
    pickupStore:
      deliveryType === "pickup"
        ? {
            id: pickupStoreId || "store-001",
            name: "Chi nhánh Quận 1",
            address: "456 Đường Nguyễn Huệ, Quận 1, TP.HCM",
          }
        : undefined,
    pickupCode:
      deliveryType === "pickup"
        ? `PK-${Math.floor(Math.random() * 9000) + 1000}`
        : undefined,
    canReorder: false,
    canPickup: false,
    canCancel: true,
    note,
  };
}
