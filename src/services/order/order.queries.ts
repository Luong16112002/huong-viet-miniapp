import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Order, OrderListResponse } from "../../types/order.types";
import { orderService } from "./order.api";
import { GET_ORDER_BY_ID_KEY, GET_ORDER_LIST_KEY } from "../../constants/api";
export function useOrderHistory() {
  return useQuery<Order[]>({ queryKey: [GET_ORDER_LIST_KEY, "history"], refetchInterval: 10000, queryFn: () => orderService.getAllOrders() });
}

export function useOrders(page: number = 1, pageSize: number = 10) {
  return useQuery<OrderListResponse>({
    queryKey: [GET_ORDER_LIST_KEY, page, pageSize],
    queryFn: () => orderService.getOrders(page, pageSize),
    refetchInterval: 10000,
    placeholderData: keepPreviousData,
  });
}

export function useOrderById(orderId: string, enabled: boolean = true) {
  return useQuery<Order>({
    queryKey: [GET_ORDER_BY_ID_KEY, orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: enabled && !!orderId,
    refetchInterval: 10000,
  });
}
