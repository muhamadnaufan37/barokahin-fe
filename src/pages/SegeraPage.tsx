import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "primereact/button";
import { useApp } from "../context/AppContext";
import { i18n } from "../i18n/id";
import { ListingCard } from "../components/ListingCard";

export const SegeraPage: React.FC = () => {
  const { listings } = useApp();

  const urgentListings = useMemo(() => {
    return listings
      .filter((l) => l.isUrgent && l.status === "active")
      .sort((a, b) => {
        const aEnd = new Date(
          a.foodAttributes?.consumeBy || a.foodAttributes?.expiryDate || a.pickupEnd
        ).getTime();
        const bEnd = new Date(
          b.foodAttributes?.consumeBy || b.foodAttributes?.expiryDate || b.pickupEnd
        ).getTime();
        if (aEnd !== bEnd) return aEnd - bEnd;
        return a.distanceKm - b.distanceKm;
      });
  }, [listings]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
            <i className="pi pi-bolt" aria-hidden="true" />
            Jalur Segera (Makanan Cepat Kedaluwarsa)
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            Ambil Sebelum Batas Konsumsi
          </h1>
          <p className="text-sm text-slate-600">
            Diurutkan berdasarkan sisa waktu terpendek lalu jarak terdekat.
          </p>
        </div>
        <Link to="/bagikan">
          <Button label="Bagikan Makanan Lebih" icon="pi pi-plus" severity="warning" size="small" />
        </Link>
      </div>

      {/* Food Safety Banner (URG-06) */}
      <div
        role="note"
        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm text-amber-950"
      >
        <i className="pi pi-exclamation-triangle text-amber-600 text-lg shrink-0 mt-0.5" aria-hidden="true" />
        <p>{i18n.food.safetyWarning}</p>
      </div>

      {urgentListings.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2">
          <p className="font-bold text-slate-800">Belum ada makanan di Jalur Segera saat ini</p>
          <p className="text-sm text-slate-600">
            Cek kembali nanti atau lihat barang lain di Radar Barokah.
          </p>
          <Link to="/" className="inline-block pt-2">
            <Button label="Kembali ke Radar" outlined size="small" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {urgentListings.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      )}
    </div>
  );
};
