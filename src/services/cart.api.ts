import { commerceRequest } from "./commerce.api";
import { CartItem } from "@/types/cart.types";
import { OrderDeliveryType } from "@/types/order.types";
export interface CartQuote {
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  voucherCode: string;
}
export function quoteCart(
  items: CartItem[],
  deliveryType: OrderDeliveryType,
  voucherCode: string,
) {
  return commerceRequest<CartQuote>("cart/quote", {
    deliveryType,
    voucherCode,
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      options: item.selectedVariants.map((v) => ({
        name: v.groupTitle,
        value: v.optionName,
        price: v.extraPrice,
      })),
    })),
  });
}
