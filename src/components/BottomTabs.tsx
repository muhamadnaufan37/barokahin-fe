import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useBuyer } from "../context/BuyerContext";

export const BottomTabs: React.FC = () => {
  const { pathname } = useLocation();
  const { cart, token, recentOrderCodes } = useBuyer();
  const cartCount = cart.length;
  const orderCount = token ? recentOrderCodes.length : 0;
  const accountPath = token ? "/akun" : "/masuk";

  const tabs = [
    { to: "/", label: "Beranda", icon: "pi pi-home" },
    { to: "/katalog", label: "Jelajah", icon: "pi pi-compass" },
    { to: "/keranjang", label: "Keranjang", icon: "pi pi-shopping-cart" },
    { to: accountPath, label: "Akun", icon: "pi pi-user" },
  ];

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => {
      if (t.to === "/") return pathname === "/";
      if (t.to === "/katalog") {
        return pathname.startsWith("/katalog") || pathname.startsWith("/barang") || pathname.startsWith("/toko");
      }
      if (t.to === accountPath) {
        return (
          pathname.startsWith("/akun") ||
          pathname.startsWith("/masuk") ||
          pathname.startsWith("/pesanan") ||
          pathname.startsWith("/favorit")
        );
      }
      return pathname.startsWith(t.to);
    })
  );

  return (
    <nav
      aria-label="Navigasi bawah"
      className="bottom-tabs"
      style={{ ["--i" as string]: activeIndex }}
    >
      <span className="bottom-tabs__pill" aria-hidden="true" />
      {tabs.map((t, idx) => {
        const isCurrent = idx === activeIndex;
        return (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === "/"}
            aria-current={isCurrent ? "page" : undefined}
            className={`bottom-tabs__item ${isCurrent ? "active" : ""}`}
          >
            <i className={t.icon} aria-hidden="true" />
            <span>{t.label}</span>
            {t.to === "/keranjang" && cartCount > 0 && (
              <b
                className="absolute right-[22%] top-0.5 min-w-[18px] rounded-pil bg-bata px-1.5 py-0.5 text-center text-[11px] leading-4 text-putih"
                aria-label={`${cartCount} barang di keranjang`}
              >
                {cartCount}
              </b>
            )}
            {t.to === accountPath && orderCount > 0 && (
              <b
                className="absolute right-[22%] top-0.5 min-w-[18px] rounded-pil bg-kunyit px-1.5 py-0.5 text-center text-[11px] leading-4 text-tinta"
                aria-label={`${orderCount} pesanan`}
              >
                {orderCount}
              </b>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
