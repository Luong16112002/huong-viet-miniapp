import { FavoritesPage, VouchersPage, SupportPage } from "./pages/profile/account-extras";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout";
import { getBasePath } from "./utils/zma";
import HomePage from "./pages/home";
import MenuPage from "./pages/menu";
import CategoryPage from "./pages/category";
import OrderPage from "./pages/order";
import ProfilePage from "./pages/profile";
import { PersonalInfoPage, FAQPage } from "./pages/profile/account-pages";
import ReviewsPage from "./pages/reviews";
import SearchPage from "./pages/search";
import ProductDetailPage from "./pages/product-detail";
import CheckoutPage from "./pages/checkout";
import SelectLocationPage from "./pages/select-location";
import OrderSuccessPage from "./pages/order-success";
import OrderDetailPage from "./pages/order-detail";
import CartPage from "./pages/cart";
import AdminPage from "./pages/admin";
import ReservationPage from "./pages/reservation";
import ReservationSuccessPage from "./pages/reservation-success";
import AIChatPage from "./pages/ai-chat";
import LoginPage from "./pages/login";
import NotificationsPage from "./pages/notifications";
import PromotionsPage from "./pages/promotions";
import { copy } from "@/constants/copy";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      children: [
        { path: "/", element: <HomePage />, handle: { hideHeader: true, hideCart: true, whiteBackground: true } },
        { path: "/menu", element: <MenuPage />, handle: { hideHeader: true, hideCart: true, whiteBackground: true } },
        { path: "/menu/category/:categoryId", element: <CategoryPage />, handle: { whiteBackground: true } },
        {
          path: "/order",
          element: <OrderPage />,
          handle: {
            hideHeader: true,
            whiteBackground: true,
            hideCart: true,
          },
        },
        {
          path: "/cart",
          element: <CartPage />,
          handle: {
            whiteBackground: true,
            hideFooter: true,
            hideCart: true,
            hideHeader: true,
          },
        },
        {
          path: "/admin/*",
          element: <AdminPage />,
          handle: {
            whiteBackground: true,
            hideFooter: true,
            hideHeader: true,
            hideCart: true,
          },
        },
        {
          path: "/profile",
          element: <ProfilePage />,
          handle: {
            hideHeader: true,
            title: copy.header.profile,
            back: false,
            whiteBackground: true,
            headerPosition: "sticky",
            hideCart: true,
          },
        },
        { path: "/profile/favorites", element: <FavoritesPage />, handle: { title: "Món yêu thích", back: true, whiteBackground: true, hideFooter: true, hideCart: true } },
        { path: "/profile/vouchers", element: <VouchersPage />, handle: { title: "Mã giảm giá", back: true, whiteBackground: true, hideFooter: true, hideCart: true } },
        { path: "/profile/support", element: <SupportPage />, handle: { title: "Trợ giúp & hỗ trợ", back: true, whiteBackground: true, hideFooter: true, hideCart: true } },
        { path: "/profile/info", element: <PersonalInfoPage />, handle: { title: "Thông tin cá nhân", back: true, whiteBackground: true, hideFooter: true, hideCart: true, headerPosition: "sticky" } },
        { path: "/profile/reviews", element: <ReviewsPage />, handle: { whiteBackground: true, hideHeader: true, hideCart: true } },
        { path: "/profile/faq", element: <FAQPage />, handle: { title: "Câu hỏi thường gặp", back: true, whiteBackground: true, hideFooter: true, hideCart: true, headerPosition: "sticky" } },
        { path: "/menu/search", element: <SearchPage /> },
        {
          path: "/promotions",
          element: <PromotionsPage />,
          handle: {
            hideHeader: true,
            title: "Ưu đãi",
            back: true,
            whiteBackground: true,
            hideCart: true,
          },
        },
        {
          path: "/product/:id",
          element: <ProductDetailPage />,
          handle: {
            whiteBackground: true,
            hideFooter: true,
            hideHeader: true,
          },
        },
        {
          path: "/checkout",
          element: <CheckoutPage />,
          handle: {
            hideHeader: true,
            hideCart: true,
            title: copy.header.delivery,
            back: true,
            whiteBackground: true,
            hideFooter: true,
            headerPosition: "sticky",
          },
        },
        {
          path: "/select-location",
          element: <SelectLocationPage />,
          handle: {
            back: true,
            title: copy.header.selectLocation,
            hideFooter: true,
            headerPosition: "sticky",
            whiteBackground: true,
            hideHeader: true,
          },
        },
        {
          path: "/order-success",
          element: <OrderSuccessPage />,
          handle: {
            hideHeader: true,
            hideCart: true,
            title: copy.header.confirmation,
            whiteBackground: true,
            hideFooter: true,
          },
        },
        {
          path: "/order/:orderId",
          element: <OrderDetailPage />,
          handle: {
            hideHeader: true,
            title: " ",
            back: true,
            whiteBackground: true,
            hideFooter: true,
            headerPosition: "sticky",
            hideCart: true,
          },
        },
        {
          path: "/reservation",
          element: <ReservationPage />,
          handle: {
            hideHeader: true,
            title: copy.header.reservation,
            back: true,
            whiteBackground: true,
            hideFooter: true,
            headerPosition: "sticky",
            hideCart: true,
          },
        },
        {
          path: "/reservation-success",
          element: <ReservationSuccessPage />,
          handle: {
            title: copy.header.confirmation,
            whiteBackground: true,
            hideFooter: true,
          },
        },
        {
          path: "/ai-chat",
          element: <AIChatPage />,
          handle: {
            title: copy.header.aiChat,
            back: true,
            whiteBackground: true,
            hideFooter: true,
            headerPosition: "sticky",
            hideCart: true,
          },
        },
        {
          path: "/login",
          element: <LoginPage />,
          handle: {
            title: copy.header.login,
            whiteBackground: true,
            hideFooter: true,
            hideCart: true,
          },
        },
        {
          path: "/notifications",
          element: <NotificationsPage />,
          handle: {
            title: copy.header.notifications,
            hideHeader: true,
            back: true,
            whiteBackground: true,
            headerPosition: "sticky",
            hideCart: true,
          },
        },
      ],
    },
  ],
  {
    basename: getBasePath(),
  },
);

export default router;
