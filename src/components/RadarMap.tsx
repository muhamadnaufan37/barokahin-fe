import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "primereact/button";
import { formatRupiah, i18n } from "../i18n/id";
import { Listing } from "../types";

interface RadarMapProps {
  listings: Listing[];
}

export const RadarMap: React.FC<RadarMapProps> = ({ listings }) => {
  const [selected, setSelected] = useState<Listing | null>(listings[0] || null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900">
        <i className="pi pi-shield shrink-0 text-teal-700" aria-hidden="true" />
        <span>{i18n.privacy.blurredLocation}</span>
      </div>

      <div className="relative h-80 sm:h-96 w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50">
        {/* Decorative street/grid lines for Bandung & sekitarnya map mockup */}
        <svg
          className="absolute inset-0 h-full w-full opacity-40"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <path d="M 0 180 Q 250 140 600 200 T 1200 170" fill="none" stroke="#0d9488" strokeWidth="3" strokeOpacity="0.25" />
          <path d="M 280 0 Q 320 180 260 400" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeOpacity="0.2" />
        </svg>

        {/* Area labels */}
        <span className="absolute left-[14%] top-[44%] text-[11px] font-semibold text-slate-400 select-none">
          Cimahi
        </span>
        <span className="absolute left-[44%] top-[36%] text-[11px] font-semibold text-slate-400 select-none">
          Coblong / Dago
        </span>
        <span className="absolute left-[65%] top-[50%] text-[11px] font-semibold text-slate-400 select-none">
          Antapani
        </span>
        <span className="absolute left-[60%] top-[72%] text-[11px] font-semibold text-slate-400 select-none">
          Buahbatu
        </span>

        {/* Blurred radius markers */}
        {listings.map((item) => {
          const isSelected = selected?.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              style={{
                left: `${item.blurredCoords.x}%`,
                top: `${item.blurredCoords.y}%`,
              }}
              aria-label={`Area perkiraan untuk ${item.title}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                isSelected ? "z-20 scale-110" : "z-10 hover:scale-105"
              }`}
            >
              {/* Blurred privacy circle */}
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full border-2 ${
                  item.isUrgent
                    ? "border-orange-500 bg-orange-400/25"
                    : "border-teal-600 bg-teal-400/25"
                }`}
              >
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white shadow ${
                    item.priceType === "gratis" ? "bg-teal-600" : "bg-amber-500"
                  }`}
                >
                  {item.priceType === "gratis" ? "Gratis" : formatRupiah(item.priceRupiah)}
                </span>
              </span>
            </button>
          );
        })}

        {listings.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
            Tidak ada barang di peta untuk filter ini.
          </div>
        )}
      </div>

      {/* Selected preview card */}
      {selected && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={selected.images[0]}
              alt={selected.title}
              className="h-14 w-14 shrink-0 rounded-xl object-cover bg-slate-100"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${
                    selected.priceType === "gratis" ? "bg-teal-600" : "bg-amber-500"
                  }`}
                >
                  {selected.priceType === "gratis"
                    ? "GRATIS"
                    : formatRupiah(selected.priceRupiah)}
                </span>
                <span className="text-xs text-slate-500">~{selected.distanceKm} km</span>
              </div>
              <p className="truncate font-bold text-slate-800 mt-0.5">{selected.title}</p>
            </div>
          </div>
          <Link to={`/barokah/${selected.id}`} className="shrink-0">
            <Button label="Lihat Detail" icon="pi pi-arrow-right" iconPos="right" size="small" />
          </Link>
        </div>
      )}
    </div>
  );
};
