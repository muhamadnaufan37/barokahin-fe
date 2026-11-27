import React, { Suspense, lazy } from "react";
import { MotionConfig } from "motion/react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { BuyerProvider } from "./context/BuyerContext";
import { StorefrontProvider } from "./context/StorefrontContext";

const ActivitiesPage = lazy(() =>
  import("./pages/ActivitiesPage").then((module) => ({
    default: module.ActivitiesPage,
  }))
);
const ActivityDetailPage = lazy(() =>
  import("./pages/ActivityDetailPage").then((module) => ({
    default: module.ActivityDetailPage,
  }))
);
const CatalogPage = lazy(() =>
  import("./pages/CatalogPage").then((module) => ({
    default: module.CatalogPage,
  }))
);
const DonationPage = lazy(() =>
  import("./pages/DonationPage").then((module) => ({
    default: module.DonationPage,
  }))
);
const HomePage = lazy(() =>
  import("./pages/HomePage").then((module) => ({ default: module.HomePage }))
);
const ItemDetailPage = lazy(() =>
  import("./pages/ItemDetailPage").then((module) => ({
    default: module.ItemDetailPage,
  }))
);
const StaticPage = lazy(() =>
  import("./pages/StaticPage").then((module) => ({
    default: module.StaticPage,
  }))
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  }))
);
const BuyerAccountPage = lazy(() =>
  import("./pages/BuyerAccountPage").then((module) => ({
    default: module.BuyerAccountPage,
  }))
);
const CartPage = lazy(() =>
  import("./pages/BuyerCommercePages").then((module) => ({
    default: module.CartPage,
  }))
);
const CheckoutPage = lazy(() =>
  import("./pages/BuyerCommercePages").then((module) => ({
    default: module.CheckoutPage,
  }))
);
const OrdersPage = lazy(() =>
  import("./pages/BuyerCommercePages").then((module) => ({
    default: module.OrdersPage,
  }))
);
const OrderPage = lazy(() =>
  import("./pages/BuyerCommercePages").then((module) => ({
    default: module.OrderPage,
  }))
);
const PaymentSuccessPage = lazy(() =>
  import("./pages/PaymentSuccessPage").then((module) => ({
    default: module.PaymentSuccessPage,
  }))
);
const StoresPage = lazy(() =>
  import("./pages/PublicStorePages").then((module) => ({
    default: module.StoresPage,
  }))
);
const StoreDetailPage = lazy(() =>
  import("./pages/PublicStorePages").then((module) => ({
    default: module.StoreDetailPage,
  }))
);
const FavoritesPage = lazy(() =>
  import("./pages/FavoritesPage").then((module) => ({
    default: module.FavoritesPage,
  }))
);

export const App: React.FC = () => {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <StorefrontProvider>
          <BuyerProvider>
            <Layout>
              <Suspense
                fallback={
                  <div className="route-loading" role="status">
                    Memuat halaman…
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/katalog" element={<CatalogPage />} />
                  <Route path="/barang/:slug" element={<ItemDetailPage />} />
                  <Route path="/toko" element={<StoresPage />} />
                  <Route path="/toko/:slug" element={<StoreDetailPage />} />
                  <Route path="/favorit" element={<FavoritesPage />} />
                  <Route path="/keranjang" element={<CartPage />} />
                  <Route path="/masuk" element={<LoginPage />} />
                  <Route path="/akun" element={<BuyerAccountPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/pesanan" element={<OrdersPage />} />
                  <Route path="/pesanan/:code" element={<OrderPage />} />
                  <Route
                    path="/pesanan/:code/berhasil"
                    element={<PaymentSuccessPage />}
                  />
                  <Route
                    path="/pembayaran/berhasil"
                    element={<PaymentSuccessPage />}
                  />
                  <Route path="/kegiatan" element={<ActivitiesPage />} />
                  <Route path="/kegiatan/:slug" element={<ActivityDetailPage />} />
                  <Route path="/dampak" element={<Navigate to="/kegiatan" replace />} />
                  <Route path="/donasi-barang" element={<DonationPage />} />
                  <Route path="/tentang" element={<StaticPage pageKey="tentang" />} />
                  <Route
                    path="/cara-kerja"
                    element={<StaticPage pageKey="cara-kerja" />}
                  />
                  <Route path="/faq" element={<StaticPage pageKey="faq" />} />
                  <Route
                    path="/kebijakan"
                    element={<StaticPage pageKey="kebijakan" />}
                  />
                  <Route path="/kontak" element={<StaticPage pageKey="kontak" />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Layout>
          </BuyerProvider>
        </StorefrontProvider>
      </BrowserRouter>
    </MotionConfig>
  );
};

export default App;
