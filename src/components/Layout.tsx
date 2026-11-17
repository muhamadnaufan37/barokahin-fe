import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { useStorefront } from "../context/StorefrontContext";
import { buildWhatsAppLink } from "../utils/format";

const NAV_LINKS = [
  { to: "/", label: "Beranda", icon: "pi pi-home" },
  { to: "/katalog", label: "Katalog", icon: "pi pi-shopping-bag" },
  { to: "/kegiatan", label: "Kegiatan & Dana", icon: "pi pi-chart-bar" },
  { to: "/donasi-barang", label: "Donasi Barang", icon: "pi pi-gift" },
  { to: "/cara-kerja", label: "Cara Kerja", icon: "pi pi-info-circle" },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useStorefront();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const appName = import.meta.env.VITE_APP_NAME || "Barokahiin";
  const waLink = buildWhatsAppLink(
    settings?.whatsapp_resmi,
    "Assalamu'alaikum / Halo Admin Barokahiin, saya ingin bertanya tentang barang atau donasi."
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="flex min-h-[44px] items-center gap-2.5 rounded-xl pr-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <i className="pi pi-heart-fill text-lg" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-base font-bold leading-tight text-slate-900">
                {appName}
              </span>
              <span className="block text-[11px] font-medium text-brand-700">
                Barang Terkurasi · Dana Transparan
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-1 md:flex"
          >
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <i className={`${item.icon} text-xs`} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Desktop CTA + Mobile Toggle */}
          <div className="flex items-center gap-2">
            <Link
              to="/donasi-barang"
              className="hidden min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 sm:inline-flex md:hidden lg:inline-flex"
            >
              <i className="pi pi-plus-circle text-xs" aria-hidden="true" />
              <span>Titip Donasi</span>
            </Link>

            <div className="md:hidden">
              <Button
                type="button"
                icon="pi pi-bars"
                outlined
                severity="secondary"
                aria-label="Buka menu navigasi"
                onClick={() => setMobileMenuOpen(true)}
                className="h-11 w-11"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile PrimeReact Sidebar */}
      <Sidebar
        visible={mobileMenuOpen}
        position="right"
        onHide={() => setMobileMenuOpen(false)}
        header={<span className="text-base font-bold text-slate-900">{appName}</span>}
        className="w-72"
      >
        <nav aria-label="Menu seluler" className="flex flex-col gap-1.5 pt-2">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              <i className={`${item.icon} text-sm`} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </Sidebar>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-10">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        aria-label="Navigasi bawah seluler"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden"
      >
        <div className="grid grid-cols-4">
          {[
            { to: "/", label: "Beranda", icon: "pi pi-home" },
            { to: "/katalog", label: "Katalog", icon: "pi pi-shopping-bag" },
            { to: "/kegiatan", label: "Dana", icon: "pi pi-chart-bar" },
            { to: "/donasi-barang", label: "Donasi", icon: "pi pi-gift" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  isActive ? "text-brand-700" : "text-slate-500"
                }`
              }
            >
              <i className={`${item.icon} text-base`} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white pb-20 md:pb-8">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <i className="pi pi-heart-fill text-sm" aria-hidden="true" />
                </div>
                <span className="text-base font-bold text-slate-900">
                  {appName}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                {import.meta.env.VITE_APP_TAGLINE ||
                  "Barang yang kamu beli, kebaikan yang kita danai."}{" "}
                Identitas donatur dijaga privasinya secara default sebagai{" "}
                <strong>{settings?.label_anonim || "Sahabat Berbagi"}</strong>.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Informasi & Transparansi
              </h2>
              <ul className="grid grid-cols-2 gap-2 text-sm">
                <li>
                  <Link
                    to="/tentang"
                    className="inline-flex min-h-[36px] items-center text-slate-600 hover:text-brand-700"
                  >
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cara-kerja"
                    className="inline-flex min-h-[36px] items-center text-slate-600 hover:text-brand-700"
                  >
                    Cara Kerja
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="inline-flex min-h-[36px] items-center text-slate-600 hover:text-brand-700"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/kebijakan"
                    className="inline-flex min-h-[36px] items-center text-slate-600 hover:text-brand-700"
                  >
                    Kebijakan & Privasi
                  </Link>
                </li>
                <li>
                  <Link
                    to="/kontak"
                    className="inline-flex min-h-[36px] items-center text-slate-600 hover:text-brand-700"
                  >
                    Kontak Resmi
                  </Link>
                </li>
                <li>
                  <Link
                    to="/kegiatan"
                    className="inline-flex min-h-[36px] items-center text-slate-600 hover:text-brand-700"
                  >
                    Laporan Dana
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Kanal Resmi
              </h2>
              {settings ? (
                <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <p>
                    <strong>{settings.rekening_resmi_bank}</strong>:{" "}
                    <span className="font-mono font-semibold">
                      {settings.rekening_resmi_nomor}
                    </span>
                  </p>
                  <p>a.n. {settings.rekening_resmi_atas_nama}</p>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
                    >
                      <i className="pi pi-whatsapp" aria-hidden="true" />
                      <span>WhatsApp Resmi</span>
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Pengumpulan barang area Bandung & sekitarnya.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} {appName}. Semua pembayaran hanya
            melalui rekening resmi yang tercantum di situs ini.
          </div>
        </div>
      </footer>
    </div>
  );
};
