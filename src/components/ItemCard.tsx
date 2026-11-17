import React from "react";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../services/publicApi";
import { PublicItem } from "../types";
import { formatRupiah, getConditionLabel } from "../utils/format";
import { StatusBadge } from "./StatusBadge";

interface ItemCardProps {
  item: PublicItem;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const coverSrc = resolveMediaUrl(item.cover_url);
  const isSold = item.status === "terjual";

  return (
    <Link
      to={`/barang/${item.slug}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
        isSold ? "opacity-90" : ""
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={item.judul}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isSold ? "grayscale-[30%]" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400">
            <i className="pi pi-image text-2xl" aria-hidden="true" />
            <span className="text-xs">Foto segera tersedia</span>
          </div>
        )}

        <div className="absolute left-3 top-3">
          <StatusBadge status={item.status} label={item.status_label} />
        </div>

        <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-slate-900/75 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          {getConditionLabel(item.kondisi_grade)}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-medium text-slate-500">
            <span className="truncate text-brand-700">
              {item.kategori?.nama || "Barang Barokah"}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-slate-400">
              {item.kode_barang}
            </span>
          </div>

          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-brand-700 sm:text-base">
            {item.judul}
          </h3>

          {item.kegiatan && (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-800">
              <i className="pi pi-heart text-[10px]" aria-hidden="true" />
              <span className="line-clamp-1">Dana: {item.kegiatan.judul}</span>
            </p>
          )}
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-base font-bold text-slate-900 sm:text-lg">
              {formatRupiah(item.harga_rupiah)}
            </span>
            {item.stok_tersedia > 0 && item.status === "terbit" && (
              <span className="text-[11px] text-slate-500">
                Stok: {item.stok_tersedia}
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <i className="pi pi-user text-[10px] text-brand-600" aria-hidden="true" />
            <span>Dari {item.donor_label || "Sahabat Berbagi"}</span>
          </p>
        </div>
      </div>
    </Link>
  );
};
