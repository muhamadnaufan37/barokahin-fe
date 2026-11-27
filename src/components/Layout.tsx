import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useBuyer } from "../context/BuyerContext";
import { useStorefront } from "../context/StorefrontContext";
import { useHideOnScroll } from "../hooks/useHideOnScroll";
import { getCategoryMeta } from "../utils/category";
import { buildWhatsAppLink } from "../utils/format";
import { BottomTabs } from "./BottomTabs";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, categories } = useStorefront();
  const { cart, token, selectedRegion, recentOrderCodes } = useBuyer();
  const navigate = useNavigate();
  const regionLabel = selectedRegion?.nama || "Semua wilayah";

  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchText, setSearchText] = useState("");

  const hideMobileBar = useHideOnScroll(12) && !searchFocused && !megaOpen;

  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const belanjaBtnRef = useRef<HTMLButtonElement>(null);
  const megaMenuWrapRef = useRef<HTMLDivElement>(null);

  const appName = import.meta.env.VITE_APP_NAME || "Barokahinn";
  const waLink = buildWhatsAppLink(
    settings?.whatsapp_resmi,
    "Assalamu'alaikum / Halo Admin Barokahinn, saya ingin bertanya tentang barang atau donasi."
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        desktopSearchRef.current?.focus();
      }
      if (e.key === "Escape" && megaOpen) {
        setMegaOpen(false);
        belanjaBtnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [megaOpen]);

  useEffect(() => {
    if (!megaOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (
        megaMenuWrapRef.current &&
        !megaMenuWrapRef.current.contains(e.target as Node)
      ) {
        setMegaOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [megaOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchText.trim();
    setMegaOpen(false);
    navigate(q ? `/katalog?q=${encodeURIComponent(q)}` : "/katalog");
  };

  return (
    <div className="flex min-h-screen flex-col bg-kertas text-tinta">
      {/* Desktop Floating Pill Navbar (>= 1024px) */}
      <header className="sticky top-3 z-40 hidden px-4 lg:block">
        <div
          className={`mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 rounded-pil border border-garis bg-putih px-5 transition-shadow duration-200 ${scrolled ? "shadow-float" : ""
            }`}
        >
          {/* 1. Logo */}
          <Link
            to="/"
            className="flex min-h-[44px] shrink-0 items-center gap-2.5 rounded-pil pr-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-pil bg-nila text-putih">
              <i className="pi pi-heart-fill text-sm" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <span className="font-display block text-base font-bold text-tinta">
                {appName}
              </span>
              <span className="block text-[11px] font-medium text-muted">
                Kurasi Jawa Barat
              </span>
            </div>
          </Link>

          {/* 2 & 3. Belanja MegaMenu + Dampak */}
          <nav aria-label="Utama" className="flex items-center gap-1">
            <div ref={megaMenuWrapRef} className="relative">
              <button
                ref={belanjaBtnRef}
                type="button"
                aria-expanded={megaOpen}
                aria-controls="belanja-megamenu"
                onClick={() => setMegaOpen((prev) => !prev)}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-pil px-3.5 text-sm font-semibold transition-colors ${megaOpen
                  ? "bg-nila-muda text-nila-tua"
                  : "text-tinta hover:bg-kertas"
                  }`}
              >
                <span>Belanja</span>
                <i
                  className={`pi ${megaOpen ? "pi-chevron-up" : "pi-chevron-down"
                    } text-[11px]`}
                  aria-hidden="true"
                />
              </button>

              {megaOpen && (
                <div
                  id="belanja-megamenu"
                  className="absolute left-0 top-[calc(100%+12px)] z-50 w-[520px] rounded-pop border border-garis bg-putih p-4 shadow-float"
                >
                  <div className="mb-3 flex items-center justify-between border-b border-garis pb-2">
                    <span className="text-xs font-semibold text-muted">
                      Kategori Barang Terkurasi
                    </span>
                    <Link
                      to="/katalog"
                      onClick={() => setMegaOpen(false)}
                      className="text-xs font-semibold text-nila hover:underline"
                    >
                      Semua barang →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => {
                      const meta = getCategoryMeta(cat);
                      return (
                        <Link
                          key={cat.uuid}
                          to={`/katalog?kategori=${encodeURIComponent(cat.slug)}`}
                          data-kategori={meta.slug}
                          onClick={() => setMegaOpen(false)}
                          className="kategori-transition flex min-h-[44px] items-center gap-2.5 rounded-kartu border border-garis px-3 py-2 text-sm font-medium text-tinta hover:border-aksen hover:bg-aksen-muda"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pil bg-aksen text-aksen-teks">
                            <i className={`${meta.icon} text-xs`} aria-hidden="true" />
                          </span>
                          <span className="truncate">{cat.nama}</span>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Di lebar 1024-1279 px, Dampak tampil di baris bawah menu Belanja */}
                  <div className="mt-3 flex items-center justify-between border-t border-garis pt-3 xl:hidden">
                    <Link
                      to="/kegiatan"
                      onClick={() => setMegaOpen(false)}
                      className="inline-flex min-h-[40px] items-center gap-2 text-sm font-semibold text-teh-tua hover:underline"
                    >
                      <i className="pi pi-chart-bar text-xs" aria-hidden="true" />
                      <span>Dampak & Transparansi Dana</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <NavLink
              to="/kegiatan"
              className={({ isActive }) =>
                `hidden min-h-[44px] items-center gap-1.5 rounded-pil px-3.5 text-sm font-semibold transition-colors xl:inline-flex ${isActive
                  ? "bg-nila-muda text-nila-tua"
                  : "text-tinta hover:bg-kertas"
                }`
              }
            >
              <span>Charity</span>
            </NavLink>
          </nav>

          {/* 4. Pencarian dengan Wilayah + Ctrl K */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex min-w-0 flex-1 max-w-md items-center gap-2 rounded-pil border border-garis-kuat bg-kertas p-1 pl-1.5 focus-within:border-nila focus-within:bg-putih"
          >
            <span className="inline-flex shrink-0 items-center gap-1 rounded-pil bg-kunyit-muda px-2.5 py-1 text-xs font-semibold text-kunyit-tua">
              <i className="pi pi-map-marker text-[11px]" aria-hidden="true" />
              <span className="max-w-[120px] truncate">{regionLabel}</span>
            </span>

            <input
              ref={desktopSearchRef}
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Cari barang layak pakai"
              aria-label="Cari barang layak pakai"
              className="min-w-0 flex-1 bg-transparent px-2 text-sm text-tinta placeholder:text-muted focus:outline-none"
            />

            <kbd className="mr-2 hidden shrink-0 rounded border border-garis bg-putih px-1.5 py-0.5 text-[10px] font-semibold text-muted xl:inline-block">
              Ctrl K
            </kbd>
          </form>

          {/* 5 & 6. Pesanan + Keranjang + Akun / Masuk */}
          <div className="flex shrink-0 items-center gap-2">
            {token && recentOrderCodes.length > 0 && (
              <Link
                to="/pesanan"
                aria-label={`Pesanan saya, ${recentOrderCodes.length} pesanan`}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pil border border-kunyit bg-kunyit-muda px-3 text-xs font-semibold text-kunyit-tua transition-colors hover:bg-kunyit hover:text-tinta"
              >
                <i className="pi pi-receipt text-xs" aria-hidden="true" />
                <span className="hidden xl:inline">Pesanan</span>
                <span className="tabular-nums min-w-[18px] rounded-pil bg-kunyit px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-tinta">
                  {recentOrderCodes.length}
                </span>
              </Link>
            )}

            <Link
              to="/keranjang"
              aria-label={`Keranjang belanja, ${cart.length} barang`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-pil border border-garis bg-putih px-3.5 text-sm font-semibold text-tinta transition-colors hover:border-nila hover:bg-nila-muda hover:text-nila"
            >
              <i className="pi pi-shopping-cart text-sm" aria-hidden="true" />
              <span className="hidden xl:inline">Keranjang</span>
              {cart.length > 0 && (
                <span className="tabular-nums min-w-[20px] rounded-pil bg-bata px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-putih">
                  {cart.length}
                </span>
              )}
            </Link>

            <Link
              to={token ? "/akun" : "/masuk"}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pil bg-nila px-4 text-sm font-semibold text-putih transition-colors hover:bg-nila-tua"
            >
              <i className="pi pi-user text-xs" aria-hidden="true" />
              <span>{token ? "Akun" : "Masuk"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Smart Top Bar (< 1024px, tanpa drawer) */}
      <header
        className={`sticky top-0 z-40 border-b border-garis bg-putih px-3.5 py-2.5 transition-transform duration-200 lg:hidden ${hideMobileBar ? "-translate-y-full" : "translate-y-0"
          }`}
      >
        <div className="mx-auto max-w-[1240px] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className="flex min-h-[40px] items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-pil bg-nila text-putih">
                <i className="pi pi-heart-fill text-xs" aria-hidden="true" />
              </div>
              <span className="font-display text-base font-bold text-tinta">
                {appName}
              </span>
            </Link>

            <div className="flex items-center gap-1.5">
              {token && recentOrderCodes.length > 0 && (
                <Link
                  to="/pesanan"
                  className="inline-flex items-center gap-1 rounded-pil border border-kunyit bg-kunyit-muda px-2.5 py-1 text-xs font-semibold text-kunyit-tua"
                >
                  <i className="pi pi-receipt text-[10px]" aria-hidden="true" />
                  <span>Pesanan ({recentOrderCodes.length})</span>
                </Link>
              )}
              <span className="inline-flex items-center gap-1 rounded-pil bg-kunyit-muda px-2.5 py-1 text-xs font-semibold text-kunyit-tua">
                <i className="pi pi-map-marker text-[11px]" aria-hidden="true" />
                <span className="max-w-[130px] truncate max-[380px]:max-w-[90px]">
                  {regionLabel}
                </span>
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 rounded-kontrol border border-garis-kuat bg-kertas px-3 py-1.5 focus-within:border-nila focus-within:bg-putih"
          >
            <i className="pi pi-search text-sm text-muted" aria-hidden="true" />
            <input
              type="search"
              value={searchText}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Cari barang layak pakai..."
              aria-label="Cari barang layak pakai"
              className="min-h-[36px] min-w-0 flex-1 bg-transparent text-base text-tinta placeholder:text-muted focus:outline-none"
            />
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-3.5 py-5 sm:px-6 lg:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-garis bg-putih pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-8">
        <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-pil bg-nila text-putih">
                  <i className="pi pi-heart-fill text-xs" aria-hidden="true" />
                </div>
                <span className="font-display text-base font-bold text-tinta">
                  {appName}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted">
                {import.meta.env.VITE_APP_TAGLINE ||
                  "Barang yang kamu beli, kebaikan yang kita danai."}{" "}
                Identitas donatur dijaga privasinya sebagai{" "}
                <strong className="text-tinta">
                  {settings?.label_anonim || "Sahabat Berbagi"}
                </strong>
                .
              </p>
              <Link
                to="/donasi-barang"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-pil bg-nila-muda px-4 py-2 text-xs font-semibold text-nila-tua hover:bg-nila hover:text-putih"
              >
                <i className="pi pi-gift text-xs" aria-hidden="true" />
                <span>Ajukan Donasi Barang</span>
              </Link>
            </div>

            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Informasi & Transparansi
              </h2>
              <ul className="grid grid-cols-2 gap-2 text-sm">
                <li>
                  <Link
                    to="/tentang"
                    className="inline-flex min-h-[36px] items-center text-tinta hover:text-nila"
                  >
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cara-kerja"
                    className="inline-flex min-h-[36px] items-center text-tinta hover:text-nila"
                  >
                    Cara Kerja
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="inline-flex min-h-[36px] items-center text-tinta hover:text-nila"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/kebijakan"
                    className="inline-flex min-h-[36px] items-center text-tinta hover:text-nila"
                  >
                    Kebijakan & Privasi
                  </Link>
                </li>
                <li>
                  <Link
                    to="/kontak"
                    className="inline-flex min-h-[36px] items-center text-tinta hover:text-nila"
                  >
                    Kontak Resmi
                  </Link>
                </li>
                <li>
                  <Link
                    to="/kegiatan"
                    className="inline-flex min-h-[36px] items-center text-tinta hover:text-nila"
                  >
                    Laporan Dana
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Kanal Resmi
              </h2>
              {settings ? (
                <div className="space-y-1 rounded-kartu border border-garis bg-kertas p-3 text-xs text-tinta">
                  <p>
                    <strong>{settings.rekening_resmi_bank}</strong>:{" "}
                    <span className="tabular-nums font-mono font-semibold text-nila">
                      {settings.rekening_resmi_nomor}
                    </span>
                  </p>
                  <p>a.n. {settings.rekening_resmi_atas_nama}</p>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-pil bg-teh px-4 py-1.5 font-semibold text-putih hover:bg-teh-tua"
                    >
                      <i className="pi pi-whatsapp" aria-hidden="true" />
                      <span>WhatsApp Resmi</span>
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted">
                  Pengumpulan barang area Bandung Raya & sekitarnya.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-garis pt-4 text-center text-xs text-muted">
            <span lang="su" className="font-semibold text-nila">
              Hatur nuhun
            </span>{" "}
            (Terima kasih) · © {new Date().getFullYear()} {appName}. Semua
            pembayaran hanya melalui rekening resmi di situs ini.
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Tabs (< 1024px) */}
      <BottomTabs />
    </div>
  );
};
