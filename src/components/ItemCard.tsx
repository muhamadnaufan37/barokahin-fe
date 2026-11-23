import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useBuyer } from "../context/BuyerContext";
import { resolveMediaUrl } from "../services/publicApi";
import { PublicItem } from "../types";
import { getCategoryMeta } from "../utils/category";
import { formatRupiah, getConditionLabel } from "../utils/format";
import { StatusBadge } from "./StatusBadge";

interface ItemCardProps {
  item: PublicItem;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const { cart, favorites, addToCart, toggleFavorite } = useBuyer();
  const [adding, setAdding] = useState(false);

  const coverSrc = resolveMediaUrl(item.cover_url);
  const isSold = item.status === "terjual";
  const isAvailable = item.status === "terbit" && item.stok_tersedia > 0;
  const catMeta = getCategoryMeta(item.kategori);
  const isFav = favorites.includes(item.uuid);
  const inCart = cart.some((c) => c.uuid === item.uuid);
  const hasPriceDrop =
    typeof item.harga_baru_rupiah === "number" &&
    item.harga_baru_rupiah > item.harga_rupiah;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(item.uuid);
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable || adding) return;
    setAdding(true);
    try {
      await addToCart(item);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="item-card-wrap relative flex flex-col overflow-hidden rounded-kartu border border-garis bg-putih transition-colors duration-200 hover:border-nila"
      data-kategori={catMeta.slug}
    >
      {/* Photo + Positioned Badges & Quick Actions */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-kertas">
        <Link to={`/barang/${item.slug}`} className="block h-full w-full">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={item.judul}
              loading="lazy"
              className={`h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03] ${
                isSold ? "grayscale-[30%]" : ""
              }`}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted">
              <i className="pi pi-image text-2xl" aria-hidden="true" />
              <span className="text-xs">Foto segera tersedia</span>
            </div>
          )}
        </Link>

        {/* Top-left: Status lencana + Pita Harga turun */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          <StatusBadge status={item.status} label={item.status_label} />
          {hasPriceDrop && (
            <span className="inline-flex items-center gap-1 rounded-pil bg-bata px-2.5 py-0.5 text-[10px] font-bold text-putih">
              <i className="pi pi-arrow-down text-[9px]" aria-hidden="true" />
              <span>Harga turun</span>
            </span>
          )}
        </div>

        {/* Top-right: Tombol Favorit */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-pressed={isFav}
          aria-label={
            isFav
              ? `Hapus ${item.judul} dari favorit`
              : `Simpan ${item.judul} ke favorit`
          }
          className={`absolute right-2.5 top-2.5 flex h-10 w-10 items-center justify-center rounded-pil border transition-colors ${
            isFav
              ? "border-mawar bg-mawar-muda text-mawar-tua"
              : "border-garis bg-putih/90 text-tinta hover:bg-putih"
          }`}
        >
          <i
            className={`pi ${isFav ? "pi-heart-fill" : "pi-heart"} text-sm`}
            aria-hidden="true"
          />
        </button>

        {/* Bottom-left: Chip kategori berwarna dinamis + ikon pembeda */}
        {item.kategori && (
          <span
            className={`pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-pil bg-aksen px-2 py-0.5 text-[10px] font-semibold text-aksen-teks sm:bottom-2.5 sm:left-2.5 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[11px] ${
              isAvailable ? "max-w-[calc(100%-64px)]" : "max-w-[calc(100%-20px)]"
            }`}
          >
            <i className={`${catMeta.icon} shrink-0 text-[10px]`} aria-hidden="true" />
            <span className="truncate">{item.kategori.nama}</span>
          </span>
        )}

        {/* Bottom-right: Tombol tambah cepat ke keranjang */}
        {isAvailable && (
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={adding}
            aria-label={`Tambah ${item.judul} ke keranjang`}
            title={inCart ? "Sudah di keranjang" : "Tambah ke keranjang"}
            className={`absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-pil border transition-colors sm:bottom-2.5 sm:right-2.5 sm:h-11 sm:w-11 ${
              inCart
                ? "border-teh bg-teh text-putih"
                : "border-kunyit bg-kunyit text-tinta hover:bg-[#E5A312]"
            }`}
          >
            <i
              className={`pi ${
                adding
                  ? "pi-spin pi-spinner"
                  : inCart
                    ? "pi-check"
                    : "pi-plus"
              } text-sm font-bold`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Card Body */}
      <Link
        to={`/barang/${item.slug}`}
        className="flex flex-1 flex-col justify-between p-2.5 sm:p-4"
      >
        <div className="min-w-0">
          <div className="item-card__meta mb-1.5 flex items-center justify-between gap-2 text-[11px] font-medium text-muted">
            <span className="truncate text-aksen-tua">
              {getConditionLabel(item.kondisi_grade)}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded bg-kertas px-1.5 py-0.5 font-mono text-[10px] text-muted">
              <i className="pi pi-verified text-[10px] text-teh" aria-hidden="true" />
              <span>{item.kode_barang}</span>
            </span>
          </div>

          <h3 className="item-card__title line-clamp-2 text-sm font-semibold leading-snug text-tinta hover:text-nila sm:text-base">
            {item.judul}
          </h3>

          {item.toko && (
            <p className="mt-1 truncate text-[11px] text-muted">
              <i className="pi pi-shop mr-1 text-[10px]" aria-hidden="true" />
              {item.toko.nama} · {item.toko.area_publik}
            </p>
          )}

          {item.kegiatan && (
            <p className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-kontrol bg-teh-muda px-2 py-0.5 text-[11px] font-medium text-teh-tua">
              <i className="pi pi-heart text-[10px]" aria-hidden="true" />
              <span className="truncate">Dana: {item.kegiatan.judul}</span>
            </p>
          )}
        </div>

        <div className="mt-3 border-t border-garis pt-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="font-display tabular-nums text-base font-bold text-nila sm:text-lg">
                {formatRupiah(item.harga_rupiah)}
              </span>
              {hasPriceDrop && (
                <span className="tabular-nums ml-1.5 text-[11px] text-muted line-through">
                  {formatRupiah(item.harga_baru_rupiah)}
                </span>
              )}
            </div>
            {item.stok_tersedia > 0 && item.status === "terbit" && (
              <span className="text-[11px] text-muted">
                Stok: {item.stok_tersedia}
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
            <i className="pi pi-user text-[10px] text-nila" aria-hidden="true" />
            <span className="truncate">
              Dari {item.donor_label || "Sahabat Berbagi"}
            </span>
          </p>
        </div>
      </Link>
    </div>
  );
};
