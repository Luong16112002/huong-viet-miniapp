import { useCheckout } from './use-checkout';
import { CheckoutHeader, CheckoutStepper, FulfillmentTabs, CheckoutFooter } from './checkout-layout';
import { DeliveryAddressCard, RestaurantNote, PaymentMethodSection } from './checkout-details';
import { SelectedItemsSection, VoucherSection, OrderSummary } from './checkout-order';
import './checkout.css';
export default function CheckoutPage(){const s=useCheckout();return <div className="co-page"><CheckoutHeader s={s}/><main className="co-scroll"><CheckoutStepper/><fieldset className="co-fields" disabled={s.busy}><FulfillmentTabs s={s}/><DeliveryAddressCard s={s}/><RestaurantNote s={s}/><SelectedItemsSection s={s}/><VoucherSection s={s}/><PaymentMethodSection/><OrderSummary s={s}/></fieldset><p className="co-bottom-note">Hương Việt trân trọng từng bữa ăn của bạn.</p></main><CheckoutFooter s={s}/></div>}
