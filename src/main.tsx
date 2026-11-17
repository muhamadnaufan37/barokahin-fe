import React from "react";
import ReactDOM from "react-dom/client";
import { PrimeReactProvider, addLocale } from "primereact/api";
import "./index.css";
import App from "./App";

addLocale("id", {
  firstDayOfWeek: 1,
  dayNames: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
  dayNamesShort: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
  dayNamesMin: ["Mg", "Sn", "Sl", "Rb", "Km", "Jm", "Sb"],
  monthNames: [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ],
  monthNamesShort: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ],
  today: "Hari Ini",
  clear: "Bersihkan",
  emptyMessage: "Data tidak tersedia",
  emptyFilterMessage: "Tidak ditemukan hasil",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PrimeReactProvider value={{ ripple: true, locale: "id" }}>
      <App />
    </PrimeReactProvider>
  </React.StrictMode>
);
