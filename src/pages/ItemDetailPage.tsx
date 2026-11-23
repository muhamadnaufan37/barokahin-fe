import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Skeleton } from "primereact/skeleton";
import { StatusBadge } from "../components/StatusBadge";
import { RegionPicker } from "../components/RegionPicker";
import { ItemCard } from "../components/ItemCard";
import { TrustPaymentBanner } from "../components/TrustPaymentBanner";
import { useBuyer } from "../context/BuyerContext";
import {
  publicApi,
  resolveMediaUrl,
} from "../services/publicApi";
import {
  PublicItem,
  PublicItemDetail,
  PublicItemMedia,
  ShippingEstimate,
} from "../types";
import {
  CONDITION_GRADE_META,
  formatDateId,
  formatRupiah,
} from "../utils/format";
import { setPageMetadata } from "../utils/seo";

export const ItemDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const {
    cart,
    addToCart,
    favorites,
    toggleFavorite,
    selectedRegion,
    setSelectedRegion,
  } = useBuyer();

  const [item, setItem] = useState<PublicItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [shipping, setShipping] = useState<ShippingEstimate | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [similarItems, setSimilarItems] = useState<PublicItem[]>([]);
  const [similarError, setSimilarError] = useState<string | null>(null);
  const inCart = !!item && cart.some((entry) => entry.uuid === item.uuid);
  const isFavorite = !!item && favorites.includes(item.uuid);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      setActiveMediaIndex(0);
      try {
        const data = await publicApi.getItemBySlug(slug);
        if (!active) return;
        setItem(data);
        setPageMetadata({
          title: `${data.judul} — Barokahiin`,
          description: data.keterangan || data.judul,
          path: `/barang/${encodeURIComponent(data.slug)}`,
          image: data.cover_url,
          type: "product",
          structuredData: {
            "@context": "https://schema.org",
            "@type": "Product",
            name: data.judul,
            description: data.keterangan || data.judul,
            image: data.cover_url ? [data.cover_url] : undefined,
            sku: data.kode_barang,
            itemCondition: "https://schema.org/UsedCondition",
            offers: {
              "@type": "Offer",
              priceCurrency: "IDR",
              price: data.harga_rupiah,
              availability:
                data.status === "terbit"
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              url: window.location.href,
            },
          },
        });
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Barang tidak ditemukan atau belum diterbitkan."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!item || !selectedRegion || item.pickup_only) {
      setShipping(null);
      setShippingError(null);
      return;
    }
    let active = true;
    setShippingLoading(true);
    setShippingError(null);
    publicApi
      .getShippingEstimate(item.slug, selectedRegion.id)
      .then((estimate) => {
        if (active) setShipping(estimate);
      })
      .catch((cause) => {
        if (active) {
          setShippingError(
            cause instanceof Error
              ? cause.message
              : "Estimasi ongkir belum tersedia."
          );
        }
      })
      .finally(() => {
        if (active) setShippingLoading(false);
      });
    return () => {
      active = false;
    };
  }, [item, selectedRegion]);

  useEffect(() => {
    if (!item?.kategori) {
      setSimilarItems([]);
      return;
    }
    let active = true;
    setSimilarError(null);
    publicApi
      .getItems({
        kategori: item.kategori.slug,
        region: selectedRegion?.id,
        per_page: 4,
      })
      .then((response) => {
        if (active) {
          setSimilarItems(
            response.items.filter((candidate) => candidate.uuid !== item.uuid)
          );
        }
      })
      .catch((cause) => {
        if (active) {
          setSimilarError(
            cause instanceof Error
              ? cause.message
              : "Barang serupa belum bisa dimuat."
          );
        }
      });
    return () => {
      active = false;
    };
  }, [item, selectedRegion]);

  const mediaList: PublicItemMedia[] = useMemo(() => {
    if (!item) return [];
    const sorted = [...(item.media || [])].sort(
      (a, b) => (a.urutan ?? 0) - (b.urutan ?? 0)
    );
    if (sorted.length > 0) return sorted;
    if (item.cover_url) {
      return [
        {
          uuid: "cover",
          tipe: "foto",
          url: item.cover_url,
          thumbnail_url: null,
          alt: item.judul,
          urutan: 0,
        },
      ];
    }
    return [];
  }, [item]);

  const activeMedia = mediaList[activeMediaIndex] || null;

  const handleShare = async () => {
    if (!item) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${item.judul} — Barokahiin`,
          text: `${item.judul} (${formatRupiah(item.harga_rupiah)}) di Barokahiin`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Ignore clipboard failure
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="12rem" height="1.25rem" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Skeleton height="24rem" borderRadius="1rem" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton height="24rem" borderRadius="1rem" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <i
          className="pi pi-exclamation-circle text-3xl text-slate-400"
          aria-hidden="true"
        />
        <h1 className="text-lg font-bold text-slate-900">
          Barang Tidak Tersedia
        </h1>
        <p className="text-sm text-slate-600">
          {error || "Barang yang Anda cari tidak ditemukan atau sudah ditarik."}
        </p>
        <Link
          to="/katalog"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <i className="pi pi-arrow-left text-xs" aria-hidden="true" />
          <span>Kembali ke Katalog</span>
        </Link>
      </div>
    );
  }

  const gradeMeta = CONDITION_GRADE_META[item.kondisi_grade];
  const canOrder = item.status === "terbit" && item.stok_tersedia > 0;
  const addItemToCart = async () => {
    setCartError(null);
    setCartNotice(null);
    try {
      await addToCart(item);
      setCartNotice("Barang ditambahkan ke keranjang.");
    } catch (cause) {
      setCartError(
        cause instanceof Error
          ? cause.message
          : "Barang belum bisa ditambahkan ke keranjang."
      );
    }
  };

  return (
    <div className="detail-page space-y-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-xs text-slate-500"
      >
        <Link to="/" className="hover:text-brand-700">
          Beranda
        </Link>
        <span>/</span>
        <Link to="/katalog" className="hover:text-brand-700">
          Katalog
        </Link>
        {item.kategori && (
          <>
            <span>/</span>
            <Link
              to={`/katalog?kategori=${encodeURIComponent(item.kategori.slug)}`}
              className="hover:text-brand-700"
            >
              {item.kategori.nama}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-medium text-slate-800">{item.kode_barang}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Media Gallery */}
        <div className="space-y-3 lg:col-span-7">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {activeMedia ? (
              activeMedia.tipe === "video" ? (
                <video
                  key={activeMedia.uuid}
                  src={resolveMediaUrl(activeMedia.url) || undefined}
                  poster={
                    resolveMediaUrl(activeMedia.thumbnail_url) || undefined
                  }
                  controls
                  preload="none"
                  className="h-full w-full bg-black object-contain"
                >
                  Peramban Anda tidak mendukung pemutar video.
                </video>
              ) : (
                <img
                  src={resolveMediaUrl(activeMedia.url) || ""}
                  alt={activeMedia.alt || item.judul}
                  className="h-full w-full object-cover"
                />
              )
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
                <i className="pi pi-image text-4xl" aria-hidden="true" />
                <span className="text-sm">Belum ada foto</span>
              </div>
            )}

            <div className="absolute left-3 top-3">
              <StatusBadge
                status={item.status}
                label={item.status_label}
                size="md"
              />
            </div>
          </div>

          {mediaList.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {mediaList.map((m, idx) => {
                const thumb =
                  m.tipe === "video"
                    ? resolveMediaUrl(m.thumbnail_url)
                    : resolveMediaUrl(m.url);
                const isActive = idx === activeMediaIndex;
                return (
                  <Button
                    key={m.uuid}
                    type="button"
                    onClick={() => setActiveMediaIndex(idx)}
                    aria-label={m.alt || `Media ${idx + 1} (${m.tipe})`}
                    className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      isActive
                        ? "border-brand-600 ring-2 ring-brand-500/30"
                        : "border-slate-200 opacity-75 hover:opacity-100"
                    }`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={m.alt || item.judul}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
                        <i
                          className={`pi ${
                            m.tipe === "video" ? "pi-video" : "pi-image"
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                    )}
                    {m.tipe === "video" && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
                        <i className="pi pi-play-circle text-lg" aria-hidden="true" />
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Description & Honest Defects */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div>
              <h2 className="text-sm font-bold text-slate-700">
                Keterangan Barang
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {item.keterangan || "-"}
              </p>
            </div>

            {item.spesifikasi && (
              <div className="border-t border-slate-100 pt-4">
                <h2 className="text-sm font-bold text-slate-700">
                  Ukuran / Spesifikasi
                </h2>
                <p className="mt-1.5 whitespace-pre-line text-sm text-slate-700">
                  {item.spesifikasi}
                </p>
              </div>
            )}

            <Message
              severity="warn"
              className="w-full justify-start"
              content={
                <div className="text-left">
                  <span className="block text-xs font-bold">
                    Catatan Kekurangan (Kurasi Jujur)
                  </span>
                  <span className="mt-0.5 block text-sm">
                    {item.kekurangan ||
                      "Tidak ada kekurangan berarti yang dicatat."}
                  </span>
                </div>
              }
            />
          </div>
        </div>

        {/* Right: Price, Metadata, Order Form */}
        <div className="space-y-5 lg:col-span-5">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs text-slate-400">
                  {item.kode_barang}
                </span>
                <h1 className="mt-0.5 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
                  {item.judul}
                </h1>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  icon={isFavorite ? "pi pi-heart-fill" : "pi pi-heart"}
                  outlined
                  severity={isFavorite ? "danger" : "secondary"}
                  aria-label={isFavorite ? "Hapus dari favorit" : "Simpan ke favorit"}
                  aria-pressed={isFavorite}
                  onClick={() => toggleFavorite(item.uuid)}
                />
                <Button
                  type="button"
                  icon={copiedLink ? "pi pi-check" : "pi pi-share-alt"}
                  outlined
                  severity={copiedLink ? "success" : "secondary"}
                  aria-label="Bagikan tautan barang"
                  onClick={handleShare}
                  className="shrink-0"
                />
              </div>
            </div>

            {copiedLink && (
              <p className="text-xs font-medium text-emerald-700">
                Tautan barang berhasil disalin!
              </p>
            )}

            <div className="flex items-baseline justify-between border-y border-slate-100 py-3">
              <div>
                <p className="text-xs text-slate-500">Harga</p>
                <p className="text-2xl font-bold text-brand-700">
                  {formatRupiah(item.harga_rupiah)}
                </p>
                {item.harga_baru_rupiah && (
                  <p className="text-xs text-slate-500">
                    Harga baru referensi {formatRupiah(item.harga_baru_rupiah)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    item.status === "terbit"
                      ? "bg-emerald-50 text-emerald-900"
                      : item.status === "dipesan"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <i className="pi pi-check-circle" aria-hidden="true" />
                  {item.status_label}
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-slate-500">Kondisi</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {gradeMeta?.label || item.kondisi_grade}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-slate-500">Donatur</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {item.donor_label || "Sahabat Berbagi"}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-slate-500">Kategori</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {item.kategori?.nama || "-"}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-slate-500">Diterbitkan</dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {formatDateId(item.diterbitkan_pada)}
                </dd>
              </div>
            </dl>

            {item.segel_kurasi && (
              <details className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
                  <span className="inline-flex items-center gap-2">
                    <i className="pi pi-verified text-brand-700" aria-hidden="true" />
                    Segel kurasi, SOP {item.segel_kurasi.sop_version}
                    <i className="pi pi-angle-down text-xs text-slate-500" aria-hidden="true" />
                  </span>
                </summary>
                <ul className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                  {item.segel_kurasi.checks.length ? (
                    item.segel_kurasi.checks.map((check) => (
                      <li
                        key={check.kode}
                        className="flex items-start gap-2 text-xs leading-relaxed text-slate-700"
                      >
                        <i
                          className={`pi ${
                            check.lulus
                              ? "pi-check-circle text-emerald-700"
                              : "pi-info-circle text-amber-700"
                          } mt-0.5`}
                          aria-hidden="true"
                        />
                        <span>
                          <strong>{check.teks}</strong>
                          {check.teks_keterbukaan && (
                            <span className="block text-slate-600">
                              {check.teks_keterbukaan}
                            </span>
                          )}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-600">
                      Rincian butir pemeriksaan belum tersedia.
                    </li>
                  )}
                </ul>
              </details>
            )}

            {item.toko && (
              <Link
                to={`/toko/${item.toko.slug}`}
                className="flex items-start gap-3 rounded-xl border border-slate-200 p-3.5 text-inherit no-underline hover:border-indigo-400"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-brand-700">
                  <i className="pi pi-shop" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Dikurasi oleh</p>
                  <p className="mt-0.5 font-semibold text-slate-900">
                    {item.toko.nama}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {item.toko.area_publik}
                    {item.toko.level
                      ? `, Koordinator level ${item.toko.level}`
                      : ""}
                  </p>
                  {item.toko.rating_count !== undefined && (
                    <p className="mt-1 text-xs text-slate-500">
                      {item.toko.rating_count > 0 && item.toko.rating_avg !== null
                        ? `${item.toko.rating_avg.toFixed(1)} dari ${item.toko.rating_count} ulasan`
                        : "Toko baru"}
                    </p>
                  )}
                </div>
              </Link>
            )}

            <div className="space-y-3 rounded-xl border border-slate-200 p-3.5">
              <h2 className="text-sm font-bold text-slate-800">
                Ambil atau kirim
              </h2>
              <RegionPicker
                label="Pilih wilayah tujuan"
                value={selectedRegion?.id || ""}
                path={selectedRegion?.path}
                onChange={(region, path) =>
                  setSelectedRegion(
                    region ? { id: region.id, nama: region.nama, path } : null
                  )
                }
              />
              {item.pickup_only ? (
                <p className="text-sm text-slate-700">
                  Barang ini hanya dapat diambil di toko koordinator.
                </p>
              ) : shippingLoading ? (
                <p className="text-sm text-slate-600" role="status">
                  Menghitung estimasi dari data wilayah…
                </p>
              ) : shippingError ? (
                <p className="text-sm text-red-700" role="alert">
                  {shippingError}
                </p>
              ) : shipping ? (
                <dl className="grid gap-1 text-sm text-slate-700">
                  <div className="flex justify-between gap-3">
                    <dt>Zona pengiriman</dt>
                    <dd>{shipping.zona}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Estimasi ongkir</dt>
                    <dd>{formatRupiah(shipping.ongkir_idr)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Biaya kemas</dt>
                    <dd>{formatRupiah(shipping.packing_fee_idr)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-slate-600">
                  Pilih wilayah untuk melihat estimasi ongkir yang tersedia.
                </p>
              )}
            </div>

            {item.kegiatan && (
              <Link
                to={`/kegiatan/${item.kegiatan.slug}`}
                className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-xs text-brand-900 transition hover:bg-brand-100"
              >
                <div>
                  <span className="block font-semibold text-brand-700">
                    Hasil penjualan mendanai kegiatan:
                  </span>
                  <span className="mt-0.5 block text-sm font-bold">
                    {item.kegiatan.judul}
                  </span>
                </div>
                <i className="pi pi-arrow-right text-brand-700" aria-hidden="true" />
              </Link>
            )}
          </div>

          {canOrder ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">
                Barang unik, jumlah satu. Stok diperiksa kembali saat checkout.
              </p>
              {cartError && <p className="form-alert error" role="alert">{cartError}</p>}
              {cartNotice && <p className="form-alert success" role="status">{cartNotice}</p>}
              <Button
                className="primary-action w-full"
                type="button"
                disabled={inCart}
                onClick={() => void addItemToCart()}
              >
                {inCart ? "Sudah di keranjang" : "Tambah ke keranjang"}
              </Button>
              {inCart && (
                <Button
                  className="secondary-action w-full"
                  type="button"
                  onClick={() => navigate("/keranjang")}
                >
                  Lihat keranjang
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-bold text-slate-900">
                {item.status === "terjual"
                  ? "Barang Ini Sudah Terjual"
                  : "Barang Sedang Dipesan"}
              </h2>
              <p className="text-xs leading-relaxed text-slate-600">
                {item.status === "terjual"
                  ? "Alhamdulillah, barang ini sudah terjual dan dananya tercatat untuk kegiatan sosial. Anda dapat melihat barang layak lainnya di katalog."
                  : "Barang ini sedang dalam proses konfirmasi/pembayaran oleh pemesan sebelumnya. Jika pesanan kedaluwarsa, barang akan tersedia kembali."}
              </p>
              <Link
                to="/katalog"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <span>Lihat Barang Lainnya</span>
              </Link>
            </div>
          )}

          <TrustPaymentBanner />
        </div>
      </div>

      {similarError && (
        <p className="form-alert error" role="alert">{similarError}</p>
      )}
      {similarItems.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Barang serupa</h2>
          <div className="home-item-grid">
            {similarItems.map((similar) => (
              <ItemCard key={similar.uuid} item={similar} />
            ))}
          </div>
        </section>
      )}

      {canOrder && (
        <div className="detail-sticky-buy">
          <span className="detail-sticky-price">
            {formatRupiah(item.harga_rupiah)}
          </span>
          <Button
            type="button"
            disabled={inCart}
            onClick={() => void addItemToCart()}
          >
            {inCart ? "Sudah di keranjang" : "Tambah ke keranjang"}
          </Button>
        </div>
      )}
    </div>
  );
};
