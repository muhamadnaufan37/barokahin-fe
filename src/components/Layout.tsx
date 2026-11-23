import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import Lenis from "lenis";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Sidebar } from "primereact/sidebar";
import { motion } from "motion/react";
import { CategoryPopover } from "./CategoryPopover";
import { CommandPalette } from "./CommandPalette";
import { useBuyer } from "../context/BuyerContext";
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
  const { categories, settings } = useStorefront();
  const { cart, token } = useBuyer();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const appName = import.meta.env.VITE_APP_NAME || "Barokahiin";
  const waLink = buildWhatsAppLink(
    settings?.whatsapp_resmi,
    "Assalamu'alaikum / Halo Admin Barokahiin, saya ingin bertanya tentang barang atau donasi."
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const lenis = new Lenis({ duration: 0.85, smoothWheel: true });
    let frame = 0;
    const animate = (time: number) => {
      lenis.raf(time);
      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    const stopForReducedMotion = (event: MediaQueryListEvent) => {
      if (event.matches) {
        window.cancelAnimationFrame(frame);
        lenis.destroy();
      }
    };
    mediaQuery.addEventListener("change", stopForReducedMotion);

    return () => {
      window.cancelAnimationFrame(frame);
      mediaQuery.removeEventListener("change", stopForReducedMotion);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setCommandOpen((isOpen) => !isOpen);
      }
      if (event.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setCommandOpen(false);
  }, [location.pathname]);

  const openCatalogSearch = (query = "") => {
    setCommandOpen(false);
    const search = query.trim();
    navigate(search ? `/katalog?q=${encodeURIComponent(search)}` : "/katalog");
  };

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <header className="site-header">
        <div className="site-nav">
          <Link
            to="/"
            className="brand-lockup"
            aria-label={`${appName}, beranda`}
          >
            <div className="brand-mark">
              <i className="pi pi-heart-fill" aria-hidden="true" />
            </div>
            <div>
              <span className="brand-name">{appName}</span>
              <span className="brand-caption">Lapak barang baik</span>
            </div>
          </Link>

          <form
            className="nav-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              openCatalogSearch(String(formData.get("q") || ""));
            }}
          >
            <i className="pi pi-search" aria-hidden="true" />
            <label className="sr-only" htmlFor="quick-search">
              Cari barang
            </label>
            <InputText
              id="quick-search"
              name="q"
              placeholder="Cari barang..."
            />
            <Button type="button" className="shortcut-key" onClick={() => setCommandOpen(true)}>
              Ctrl K
            </Button>
          </form>

          <nav aria-label="Navigasi utama" className="desktop-nav">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `nav-pill-link ${isActive ? "is-active" : ""}`
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
            <CategoryPopover categories={categories} />
          </nav>

          <div className="nav-actions">
            <Link
              to="/keranjang"
              className="nav-cart"
              aria-label={`Keranjang, ${cart.length} barang`}
            >
              <i className="pi pi-shopping-cart" aria-hidden="true" />
              <span>Keranjang</span>
              {cart.length > 0 && <span className="nav-cart-count">{cart.length}</span>}
            </Link>
            <Link
              to={token ? "/akun" : "/masuk"}
              className="nav-account"
              aria-label={token ? "Akun pembeli" : "Masuk ke akun pembeli"}
            >
              <i className="pi pi-user" aria-hidden="true" />
              <span>{token ? "Akun" : "Masuk"}</span>
            </Link>
            <Button
              type="button"
              className="icon-action search-action"
              aria-label="Buka pencarian cepat"
              onClick={() => setCommandOpen(true)}
            >
              <i className="pi pi-search" aria-hidden="true" />
            </Button>
            <Link
              to="/donasi-barang"
              className="nav-donate"
            >
              <span>Titip Donasi</span>
            </Link>

            <Button
              type="button"
              icon="pi pi-bars"
              text
              aria-label="Buka menu navigasi"
              onClick={() => setMobileMenuOpen(true)}
              className="mobile-menu-trigger"
            />
          </div>
        </div>
      </header>

      <Sidebar
        visible={mobileMenuOpen}
        position="right"
        onHide={() => setMobileMenuOpen(false)}
        ariaCloseLabel="Tutup menu"
        blockScroll
        header={<span className="brand-name">{appName}</span>}
        className="mobile-drawer"
      >
        <p className="drawer-intro">
          Temukan barang layak pakai dan ikuti jejak kebaikannya.
        </p>
        <nav aria-label="Menu seluler" className="mobile-drawer-links">
          <NavLink
            to="/keranjang"
            onClick={() => setMobileMenuOpen(false)}
            className="mobile-drawer-link"
          >
            <i className="pi pi-shopping-cart text-sm" aria-hidden="true" />
            <span>Keranjang</span>
            {cart.length > 0 && <kbd>{cart.length}</kbd>}
          </NavLink>
          <NavLink
            to={token ? "/akun" : "/masuk"}
            onClick={() => setMobileMenuOpen(false)}
            className="mobile-drawer-link"
          >
            <i className="pi pi-user text-sm" aria-hidden="true" />
            <span>{token ? "Akun pembeli" : "Masuk"}</span>
          </NavLink>
          <NavLink
            to="/favorit"
            onClick={() => setMobileMenuOpen(false)}
            className="mobile-drawer-link"
          >
            <i className="pi pi-heart text-sm" aria-hidden="true" />
            <span>Barang favorit</span>
          </NavLink>
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `mobile-drawer-link ${isActive ? "is-active" : ""}`
              }
            >
              <i className={`${item.icon} text-sm`} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <Button
            type="button"
            className="mobile-drawer-link"
            onClick={() => {
              setMobileMenuOpen(false);
              setCommandOpen(true);
            }}
          >
            <i className="pi pi-search" aria-hidden="true" />
            <span>Pencarian cepat</span>
            <kbd>Ctrl K</kbd>
          </Button>
        </nav>
        <Link
          to="/donasi-barang"
          onClick={() => setMobileMenuOpen(false)}
          className="drawer-donate"
        >
          <i className="pi pi-gift" aria-hidden="true" />
          <span>Ajukan donasi barang</span>
        </Link>
      </Sidebar>

      <main className="page-main">
        {children}
      </main>

      <nav aria-label="Navigasi bawah seluler" className="mobile-tab-bar">
        <div className="mobile-tab-inner">
          {[
            { to: "/", label: "Beranda", icon: "pi pi-home" },
            { to: "/katalog", label: "Katalog", icon: "pi pi-shopping-bag" },
            { to: "/keranjang", label: "Keranjang", icon: "pi pi-shopping-cart" },
            { to: token ? "/akun" : "/masuk", label: "Akun", icon: "pi pi-user" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className="mobile-tab-link"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="active-mobile-tab"
                      className="mobile-tab-indicator"
                      transition={{ type: "spring", stiffness: 440, damping: 34 }}
                    />
                  )}
                  <i className={`${item.icon} text-base`} aria-hidden="true" />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <CommandPalette
        open={commandOpen}
        categories={categories}
        onClose={() => setCommandOpen(false)}
      />

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
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
              <h2 className="mb-3 text-xs font-semibold text-slate-500">
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
              <h2 className="text-xs font-semibold text-slate-500">
                Kanal Resmi
              </h2>
              {settings ? (
                <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <p>
                    Pembayaran hanya dilakukan melalui instruksi checkout resmi
                    menggunakan QRIS, virtual account, atau e-wallet.
                  </p>
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
            © {new Date().getFullYear()} {appName}. Pembayaran diproses melalui
            instruksi checkout resmi.
          </div>
        </div>
      </footer>
    </div>
  );
};
