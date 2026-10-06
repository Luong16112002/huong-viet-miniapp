import { Order, CreateOrderRequest, OrderListResponse } from '../../types/order.types';
import { commerceRequest, createCommerceRecord } from '../commerce.api';
export const orderService = {
  getAllOrders: (): Promise<Order[]> => commerceRequest('orders'),
  createOrder: (request: CreateOrderRequest): Promise<Order> => createCommerceRecord('order', request),
  getOrders: async (page = 1, pageSize = 10): Promise<OrderListResponse> => {
    const orders = await orderService.getAllOrders();
    return { orders: orders.slice((page-1)*pageSize,page*pageSize), total: orders.length, page, pageSize };
  },
  getOrderById: (id: string): Promise<Order> => commerceRequest('orders/'+encodeURIComponent(id)),
  cancelOrder: (id: string): Promise<Order> => commerceRequest('orders/'+encodeURIComponent(id)+'/cancel', {}),
  confirmPickup: (id: string): Promise<Order> => commerceRequest('orders/'+encodeURIComponent(id)+'/pickup', {}),
  reorder: async (id: string): Promise<Order> => {
    const original = await orderService.getOrderById(id);
    if (!original.canReorder) throw new Error('Chưa thể đặt lại đơn này.');
    return orderService.createOrder({ deliveryType: original.deliveryType, tableNumber: original.tableNumber, items: original.items, deliveryAddress: original.deliveryAddress, paymentMethod: original.payment?.method || 'cash', note: original.note });
  },
};
