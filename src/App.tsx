import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { StorefrontProvider } from "./context/StorefrontContext";
import { ActivitiesPage } from "./pages/ActivitiesPage";
import { ActivityDetailPage } from "./pages/ActivityDetailPage";
import { CatalogPage } from "./pages/CatalogPage";
import { DonationPage } from "./pages/DonationPage";
import { HomePage } from "./pages/HomePage";
import { ItemDetailPage } from "./pages/ItemDetailPage";
import { StaticPage } from "./pages/StaticPage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <StorefrontProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/katalog" element={<CatalogPage />} />
            <Route path="/barang/:slug" element={<ItemDetailPage />} />
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
        </Layout>
      </StorefrontProvider>
    </BrowserRouter>
  );
};

export default App;
