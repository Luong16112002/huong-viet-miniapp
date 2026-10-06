import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "zmp-ui";
import { useCartDraft } from "@/stores/cart-draft.store";
import { useCartStore } from "@/stores/cart.store";
import { useCreateOrder } from "@/services/order/order.mutations";
import { quoteCart, type CartQuote } from "@/services/cart.api";
import { calculateCartItemPrice, calculateCartTotal } from "@/utils/cart";
import { copy } from "@/constants/copy";
export type DeliveryType = "dinein" | "delivery" | "pickup";
export const fulfillmentLabels = { dinein: "Ăn tại nhà hàng", delivery: "Giao hàng", pickup: "Tự đến lấy" };
export function useCheckout() {
 const navigate=useNavigate(), draft=useCartDraft(), {openSnackbar}=useSnackbar();
 const {items:cartItems,updateQuantity,clearCart}=useCartStore();
 const {mutate:createOrder,isPending}=useCreateOrder();
 const [deliveryType,setDeliveryType]=useState<DeliveryType>(draft.deliveryType);
 const [note,setNote]=useState(draft.note.slice(0,200));
 const [tableNumber,setTableNumber]=useState(draft.tableNumber);
 const [contactPhone,setContactPhone]=useState(draft.phone);
 const [selectedAddress,setSelectedAddress]=useState({name:draft.name,address:draft.address,city:""});
 const [voucherCode,setVoucherCode]=useState(draft.voucherCode);
 const [voucherError,setVoucherError]=useState("");
 const [voucherBusy,setVoucherBusy]=useState(false);
 const [isProcessing,setIsProcessing]=useState(false);
 const [serverQuote,setServerQuote]=useState<{key:string;data:CartQuote}|null>(null);
 const [quoteError,setQuoteError]=useState("");
 const [refresh,setRefresh]=useState(0);
 const paymentMethod="cash" as const;
 const quoteKey=JSON.stringify([cartItems,deliveryType,draft.voucherCode]);
 const currentQuote=serverQuote?.key===quoteKey?serverQuote.data:null;
 const subtotal=currentQuote?.subtotal??calculateCartTotal(cartItems);
 const shippingFee=currentQuote?.shippingFee??(deliveryType==='delivery'?25000:0);
 const voucherDiscount=currentQuote?.discount??0;
 const total=currentQuote?.total??subtotal+shippingFee;
 const quotePending=cartItems.length>0&&!currentQuote&&!quoteError;
 const submitLock=useRef(false), voucherLock=useRef(false);
 const latestKey=useRef(quoteKey);latestKey.current=quoteKey;
 useEffect(()=>{draft.update({deliveryType,note,phone:contactPhone,name:selectedAddress.name,address:selectedAddress.address,tableNumber});},[deliveryType,note,contactPhone,selectedAddress,tableNumber]);
 useEffect(()=>{
  let active=true;setQuoteError('');
  if(cartItems.length) quoteCart(cartItems,deliveryType,draft.voucherCode).then(data=>{if(active)setServerQuote({key:quoteKey,data});}).catch(e=>{if(active)setQuoteError(e.message);});
  return()=>{active=false;};
 },[quoteKey,refresh]);
 const applyCode=async()=>{
  if(voucherLock.current)return;
  voucherLock.current=true;setVoucherBusy(true);setVoucherError('');const key=quoteKey;
  try{const data=await quoteCart(cartItems,deliveryType,voucherCode.trim());if(latestKey.current!==key)return;draft.update({voucherCode:data.voucherCode});setVoucherCode(data.voucherCode);setRefresh(v=>v+1);}
  catch(e){setVoucherError(e instanceof Error?e.message:'Chưa kiểm tra được mã ưu đãi.');}
  finally{voucherLock.current=false;setVoucherBusy(false);}
 };
 const removeVoucher=()=>{draft.update({voucherCode:''});setVoucherCode('');setVoucherError('');};
 const handleCheckout=()=>{
  if(submitLock.current||isPending||isProcessing)return;
  const error=!cartItems.length?'Bạn chưa chọn món.':deliveryType==='delivery'&&(!selectedAddress.name.trim()||!selectedAddress.address.trim())?'Vui lòng nhập họ tên và địa chỉ giao hàng.':deliveryType==='delivery'&&!/^0[35789]\d{8}$/.test(contactPhone.trim())?'Vui lòng nhập số điện thoại nhận món hợp lệ.':deliveryType==='dinein'&&!tableNumber.trim()?'Vui lòng nhập số bàn hoặc mã bàn.':quoteError||(!currentQuote?'Đang cập nhật giá đơn hàng. Vui lòng đợi một chút.':'');
  if(error){openSnackbar({text:error,type:'warning'});return;}
  submitLock.current=true;setIsProcessing(true);
    const orderItems = cartItems.map((item) => ({
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      price: calculateCartItemPrice(item),
      image: item.productImage,
      note: item.note,
      options: item.selectedVariants.map((variant) => ({
        name: variant.groupTitle,
        value: variant.optionName,
        price: variant.extraPrice,
      })),
    }));

    const deliveryTypeMap: Record<DeliveryType, "pickup" | "delivery" | "dinein"> = {
      dinein: "dinein",
      delivery: "delivery",
      pickup: "pickup",
    };

    createOrder(
      {
        deliveryType: deliveryTypeMap[deliveryType],
        items: orderItems,
        expectedTotal: total,
        voucherCode: draft.voucherCode,
        tableId: deliveryType === "dinein" ? tableNumber.trim().toUpperCase() : undefined,
        customerName: selectedAddress.name,
        phone: contactPhone,
        tableNumber: deliveryType === "dinein" ? tableNumber.trim().toUpperCase() : undefined,
        deliveryAddress:
          deliveryType === "delivery"
            ? {
                recipientName: selectedAddress.name,
                phoneNumber: contactPhone.trim(),
                address: selectedAddress.address,
                ward: "",
                district: "",
                city: selectedAddress.city,
                note: note,
              }
            : undefined,
        pickupStoreId: deliveryType !== "delivery" ? "store-001" : undefined,
        paymentMethod: paymentMethod,
        note: note,
      },
      {
        onSuccess: (order) => {
          clearCart();
          draft.reset();
          setIsProcessing(false); submitLock.current=false;
          navigate("/order-success", { state: { order } });
        },
        onError: (error) => {
          setIsProcessing(false); submitLock.current=false;
          openSnackbar({
            text: `${copy.checkout.createOrderError}: ${error.message}`,
            type: "error",
          });
        },
      },
    );
  };

 return {navigate,draft,cartItems,updateQuantity,deliveryType,setDeliveryType,note,setNote,tableNumber,setTableNumber,contactPhone,setContactPhone,selectedAddress,setSelectedAddress,voucherCode,setVoucherCode,voucherError,voucherBusy,applyCode,removeVoucher,subtotal,shippingFee,voucherDiscount,total,quoteError,quotePending,retryQuote:()=>setRefresh(v=>v+1),paymentMethod,handleCheckout,busy:isPending||isProcessing};
}
export type CheckoutState=ReturnType<typeof useCheckout>;
