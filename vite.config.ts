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
        name: "Barokahiin — Berbagi Dekat Rumah",
        short_name: "Barokahiin",
        description:
          "Berbagi yang barokah, dekat dari rumahmu. Temukan dan bagikan barang layak pakai serta makanan berlebih di sekitar Bandung.",
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
