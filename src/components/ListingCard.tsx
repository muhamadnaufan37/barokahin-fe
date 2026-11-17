import React from "react";
import { Link } from "react-router-dom";
import { Tag } from "primereact/tag";
import { CATEGORIES, REGIONS } from "../data/mockData";
import { formatRupiah } from "../i18n/id";
import { Listing } from "../types";
import { CountdownTimer } from "./CountdownTimer";

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const category = CATEGORIES.find((c) => c.id === listing.categoryId);
  const region = REGIONS.find((r) => r.id === listing.regionId);
  const countdownTarget =
    listing.foodAttributes?.consumeBy || listing.foodAttributes?.expiryDate || listing.pickupEnd;

  return (
    <Link
      to={`/barokah/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={listing.images[0]}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />

        {/* Top badges: Price type + Jalur Segera */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {listing.priceType === "gratis" ? (
            <span className="inline-flex items-center rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
              GRATIS
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
              {formatRupiah(listing.priceRupiah)}
            </span>
          )}

          {listing.isUrgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              <i className="pi pi-bolt text-[11px]" aria-hidden="true" />
              Segera
            </span>
          )}
        </div>

        {/* Status overlay if not active */}
        {listing.status !== "active" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
            <Tag
              value={listing.status === "reserved" ? "Sudah Dipesan" : "Selesai / Ditutup"}
              severity="secondary"
              className="text-xs font-semibold"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
          <span className="truncate font-medium text-teal-700">{category?.name}</span>
          <span className="shrink-0 inline-flex items-center gap-1">
            <i className="pi pi-map-marker text-[11px]" aria-hidden="true" />
            ~{listing.distanceKm} km
          </span>
        </div>

        <h3 className="line-clamp-2 text-base font-bold text-slate-800 group-hover:text-teal-700">
          {listing.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {listing.isUrgent && <CountdownTimer targetIso={countdownTarget} compact />}
          {listing.priceType === "berbayar" && (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200">
              Bayar di tempat
            </span>
          )}
          {listing.foodAttributes?.halalInfo === "halal_self_declared" && (
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200">
              Info Halal (Pemberi)
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
          <span className="truncate">
            {listing.giverAnonymous ? listing.giverName : listing.giverName} ·{" "}
            {region?.district || "Bandung"}
          </span>
          <span className="shrink-0 font-semibold text-slate-700">
            Stok: {listing.stockAvailable}
          </span>
        </div>
      </div>
    </Link>
  );
};
