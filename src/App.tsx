import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { Layout } from "./components/Layout";
import { RadarPage } from "./pages/RadarPage";
import { SegeraPage } from "./pages/SegeraPage";
import { ListingDetailPage } from "./pages/ListingDetailPage";
import { SharePage } from "./pages/SharePage";
import { MyClaimsPage } from "./pages/MyClaimsPage";
import { ManageListingsPage } from "./pages/ManageListingsPage";
import { ChatPage } from "./pages/ChatPage";
import { HandoverPage } from "./pages/HandoverPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AboutPage, HelpPage, RulesPage } from "./pages/InfoPages";
import { AdminPage } from "./pages/AdminPage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<RadarPage />} />
            <Route path="/segera" element={<SegeraPage />} />
            <Route path="/barokah/:id" element={<ListingDetailPage />} />
            <Route path="/bagikan" element={<SharePage />} />
            <Route path="/klaim" element={<MyClaimsPage />} />
            <Route path="/kelola" element={<ManageListingsPage />} />
            <Route path="/chat/:claimId" element={<ChatPage />} />
            <Route path="/serah-terima/:claimId" element={<HandoverPage />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="/pengaturan" element={<ProfilePage />} />
            <Route path="/bantuan" element={<HelpPage />} />
            <Route path="/aturan" element={<RulesPage />} />
            <Route path="/tentang" element={<AboutPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
