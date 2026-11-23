import React from "react";
import { Link } from "react-router-dom";
import { Button } from "primereact/button";
import { useBuyer } from "../context/BuyerContext";
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
  const { favorites, toggleFavorite } = useBuyer();
  const isFavorite = favorites.includes(item.uuid);

  return (
    <article className={`item-card ${isSold ? "is-sold" : ""}`}>
      <Link
        to={`/barang/${item.slug}`}
        className="item-card-link"
        aria-label={`${item.judul}, ${formatRupiah(item.harga_rupiah)}, ${getConditionLabel(item.kondisi_grade)}`}
      >
        <div className="item-card-image">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={`${item.judul}, ${getConditionLabel(item.kondisi_grade)}`}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 767px) 48vw, (max-width: 1023px) 30vw, 23vw"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-indigo-900/60">
              <i className="pi pi-image text-2xl" aria-hidden="true" />
              <span className="text-xs">Foto belum tersedia</span>
            </div>
          )}

          <div className="item-card-status">
            <StatusBadge status={item.status} label={item.status_label} />
          </div>
          <span className="item-card-code">{item.kode_barang}</span>
        </div>

        <div className="item-card-body">
          <span className="item-card-category">
            {item.kategori?.nama || "Barang terkurasi"}
          </span>
          <h3 className="item-card-title">{item.judul}</h3>
          {item.kegiatan && (
            <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-900">
              <i className="pi pi-heart text-[10px]" aria-hidden="true" />
              <span className="truncate">Mendukung {item.kegiatan.judul}</span>
            </span>
          )}
          <div className="item-card-meta">
            <span className="item-card-price">{formatRupiah(item.harga_rupiah)}</span>
            <span className="item-card-grade">
              {getConditionLabel(item.kondisi_grade)}
            </span>
          </div>
        </div>
      </Link>
      <Button
        className="item-favorite-button"
        type="button"
        aria-label={isFavorite ? `Hapus ${item.judul} dari favorit` : `Simpan ${item.judul} ke favorit`}
        aria-pressed={isFavorite}
        onClick={() => toggleFavorite(item.uuid)}
      >
        <i className={isFavorite ? "pi pi-heart-fill" : "pi pi-heart"} aria-hidden="true" />
      </Button>
    </article>
  );
};
