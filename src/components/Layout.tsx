import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { REGIONS } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { AuthDialog } from "./AuthDialog";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentUser,
    selectedRegion,
    setSelectedRegionId,
    isOffline,
    setAuthModalOpen,
    listings,
    claims,
  } = useApp();
  const location = useLocation();

  const urgentCount = listings.filter((l) => l.isUrgent && l.status === "active").length;
  const activeClaimCount = currentUser
    ? claims.filter(
        (c) => c.receiverId === currentUser.id && ["requested", "accepted"].includes(c.status)
      ).length
    : 0;

  const regionOptions = REGIONS.map((r) => ({
    label: `${r.district}, ${r.city}`,
    value: r.id,
  }));

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-teal-50 text-teal-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-20 md:pb-0">
      {/* Offline Banner */}
      {isOffline && (
        <div
          role="status"
          className="bg-amber-600 px-4 py-2 text-center text-xs font-semibold text-white"
        >
          <i className="pi pi-wifi mr-1.5" aria-hidden="true" />
          Koneksi terputus (Mode Offline). Kamu tetap dapat melihat data yang tersimpan.
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          {/* Brand + Location */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold shadow-sm">
                <i className="pi pi-heart-fill text-sm" aria-hidden="true" />
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Barokahiin
              </span>
            </Link>

            <div className="hidden sm:block w-56">
              <Dropdown
                value={selectedRegion.id}
                options={regionOptions}
                onChange={(e) => setSelectedRegionId(e.value)}
                aria-label="Pilih Wilayah"
                className="w-full text-xs"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav aria-label="Navigasi Utama" className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              <i className="pi pi-compass text-sm" aria-hidden="true" />
              Radar
            </NavLink>
            <NavLink to="/segera" className={navLinkClass}>
              <i className="pi pi-bolt text-sm text-orange-600" aria-hidden="true" />
              Segera
              {urgentCount > 0 && <Badge value={urgentCount} severity="warning" />}
            </NavLink>
            <NavLink to="/klaim" className={navLinkClass}>
              <i className="pi pi-inbox text-sm" aria-hidden="true" />
              Klaim
              {activeClaimCount > 0 && <Badge value={activeClaimCount} severity="info" />}
            </NavLink>
            <NavLink to="/kelola" className={navLinkClass}>
              <i className="pi pi-list text-sm" aria-hidden="true" />
              Kelola
            </NavLink>
            {(currentUser?.role === "admin" || currentUser?.role === "moderator") && (
              <NavLink to="/admin" className={navLinkClass}>
                <i className="pi pi-shield text-sm text-purple-600" aria-hidden="true" />
                Admin
              </NavLink>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/bagikan" className="hidden sm:inline-flex">
              <Button
                label="Bagikan Barokah"
                icon="pi pi-plus"
                size="small"
                className="touch-target"
              />
            </Link>

            {currentUser ? (
              <Link
                to="/profil"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 touch-target"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                  {currentUser.avatarInitials}
                </span>
                <span className="hidden lg:inline max-w-[110px] truncate">
                  {currentUser.displayName}
                </span>
              </Link>
            ) : (
              <Button
                label="Masuk"
                icon="pi pi-sign-in"
                size="small"
                outlined
                className="touch-target"
                onClick={() => setAuthModalOpen(true)}
              />
            )}
          </div>
        </div>

        {/* Mobile Region Bar */}
        <div className="sm:hidden border-t border-slate-100 px-4 py-1.5 bg-slate-50 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500 shrink-0">
            <i className="pi pi-map-marker mr-1 text-teal-600" aria-hidden="true" />
            Wilayah:
          </span>
          <Dropdown
            value={selectedRegion.id}
            options={regionOptions}
            onChange={(e) => setSelectedRegionId(e.value)}
            aria-label="Pilih Wilayah"
            className="w-full text-xs"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6">{children}</main>

      {/* Desktop Footer */}
      <footer className="hidden md:block border-t border-slate-200 bg-white py-5 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6">
          <p>
            <strong>Barokahiin</strong> — Berbagi yang barokah, dekat dari rumahmu. (Pilot Bandung
            & Sekitarnya)
          </p>
          <div className="flex items-center gap-4">
            <Link to="/bantuan" className="hover:text-teal-700">
              Panduan Aman
            </Link>
            <Link to="/aturan" className="hover:text-teal-700">
              Barang Terlarang
            </Link>
            <Link to="/tentang" className="hover:text-teal-700">
              Tentang & Sponsor
            </Link>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Navigasi Bawah"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur flex items-center justify-around py-1.5 px-1"
      >
        {[
          { to: "/", icon: "pi-compass", label: "Radar" },
          { to: "/segera", icon: "pi-bolt", label: "Segera", badge: urgentCount },
          { to: "/bagikan", icon: "pi-plus-circle", label: "Bagikan", primary: true },
          { to: "/klaim", icon: "pi-inbox", label: "Klaim", badge: activeClaimCount },
          { to: "/profil", icon: "pi-user", label: "Profil" },
        ].map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex flex-col items-center justify-center rounded-xl px-3 py-1 text-[11px] font-semibold touch-target ${
                item.primary
                  ? "text-teal-700"
                  : active
                  ? "text-teal-700 bg-teal-50"
                  : "text-slate-500"
              }`}
            >
              <i
                className={`pi ${item.icon} ${item.primary ? "text-xl text-teal-600" : "text-base"}`}
                aria-hidden="true"
              />
              <span className="mt-0.5">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute right-1.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <AuthDialog />
    </div>
  );
};
