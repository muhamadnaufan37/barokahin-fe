import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Barokahinn — Storefront Barang Donasi Terkurasi",
        short_name: "Barokahinn",
        description:
          "Barang yang kamu beli, kebaikan yang kita danai. Katalog barang donasi terkurasi dengan transparansi dana.",
        theme_color: "#0d9488",
        background_color: "#f8fafc",
        display: "standalone",
        lang: "id",
        start_url: "/",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/index.html",
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
});
