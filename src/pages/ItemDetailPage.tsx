import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { Skeleton } from "primereact/skeleton";
import { StatusBadge } from "../components/StatusBadge";
import { TrustPaymentBanner } from "../components/TrustPaymentBanner";
import { useBuyer } from "../context/BuyerContext";
import { useStorefront } from "../context/StorefrontContext";
import {
  ApiClientError,
  publicApi,
  resolveMediaUrl,
} from "../services/publicApi";
import {
  PublicItemDetail,
  PublicItemMedia,
  PurchaseRequestResult,
  ShippingEstimate,
} from "../types";
import { getCategoryMeta } from "../utils/category";
import {
  CONDITION_GRADE_META,
  buildWhatsAppLink,
  formatDateId,
  formatRupiah,
} from "../utils/format";

type PurchaseFieldErrors = Partial<
  Record<"nama_pembeli" | "kontak_pembeli" | "jumlah" | "catatan", string>
>;

export const ItemDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { settings } = useStorefront();
  const { token, cart, favorites, selectedRegion, addToCart, toggleFavorite } =
    useBuyer();
  const [buyingNow, setBuyingNow] = useState(false);

  const [item, setItem] = useState<PublicItemDetail | null>(null);
  const [shipping, setShipping] = useState<ShippingEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addingCart, setAddingCart] = useState(false);

  const [namaPembeli, setNamaPembeli] = useState("");
  const [kontakPembeli, setKontakPembeli] = useState("");
  const [jumlah, setJumlah] = useState<number>(1);
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<PurchaseFieldErrors>({});
  const [purchaseResult, setPurchaseResult] =
    useState<PurchaseRequestResult | null>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      setActiveMediaIndex(0);
      setPurchaseResult(null);
      setFieldErrors({});
      setFormError(null);
      setShipping(null);
      try {
        const data = await publicApi.getItemBySlug(slug);
        if (!active) return;
        setItem(data);
        document.title = `${data.judul} — Barokahiin`;

        if (!data.pickup_only && selectedRegion?.id) {
          publicApi
            .getShippingEstimate(data.slug, selectedRegion.id)
            .then((est) => {
              if (active) setShipping(est);
            })
            .catch(() => {
              // Estimasi ongkir opsional
            });
        }
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
  }, [slug, selectedRegion?.id]);

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

  const handleAddToCart = async () => {
    if (!item || addingCart) return;
    setAddingCart(true);
    try {
      await addToCart(item);
    } finally {
      setAddingCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!item || buyingNow) return;
    if (!token) {
      navigate(`/masuk?next=${encodeURIComponent(`/barang/${item.slug}`)}`);
      return;
    }
    setBuyingNow(true);
    try {
      if (!cart.some((c) => c.uuid === item.uuid)) {
        await addToCart(item);
      }
      navigate("/checkout");
    } finally {
      setBuyingNow(false);
    }
  };

  const validateForm = (): boolean => {
    const nextErrors: PurchaseFieldErrors = {};
    if (!namaPembeli.trim()) {
      nextErrors.nama_pembeli = "Nama lengkap wajib diisi.";
    } else if (namaPembeli.trim().length < 2) {
      nextErrors.nama_pembeli = "Nama minimal 2 karakter.";
    }

    const cleanedPhone = kontakPembeli.replace(/[\s-]/g, "");
    if (!cleanedPhone) {
      nextErrors.kontak_pembeli = "Nomor WhatsApp / HP wajib diisi.";
    } else if (!/^(\+?62|0)8\d{7,12}$/.test(cleanedPhone)) {
      nextErrors.kontak_pembeli =
        "Masukkan nomor HP/WhatsApp Indonesia yang valid (contoh: 081234567890).";
    }

    if (item && (jumlah < 1 || jumlah > Math.min(50, item.stok_tersedia))) {
      nextErrors.jumlah = `Jumlah harus antara 1 sampai ${Math.min(
        50,
        item.stok_tersedia
      )}.`;
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setFormError(null);

    if (!validateForm()) {
      setFormError("Periksa kembali isian yang masih belum sesuai.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await publicApi.createPurchaseRequest({
        item_slug: item.slug,
        nama_pembeli: namaPembeli.trim(),
        kontak_pembeli: kontakPembeli.trim(),
        jumlah,
        catatan: catatan.trim() || undefined,
      });
      setPurchaseResult(result);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.fields) {
          const mapped: PurchaseFieldErrors = {};
          Object.entries(err.fields).forEach(([k, v]) => {
            const msg = Array.isArray(v) ? v[0] : v;
            if (
              ["nama_pembeli", "kontak_pembeli", "jumlah", "catatan"].includes(
                k
              )
            ) {
              mapped[k as keyof PurchaseFieldErrors] = msg;
            }
          });
          setFieldErrors(mapped);
        }
        setFormError(err.message);
      } else {
        setFormError("Gagal mengirim permintaan beli. Silakan coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="12rem" height="1.25rem" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Skeleton height="24rem" borderRadius="12px" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton height="24rem" borderRadius="12px" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-kartu-besar border border-garis bg-putih p-8 text-center">
        <i
          className="pi pi-exclamation-circle text-3xl text-muted"
          aria-hidden="true"
        />
        <h1 className="font-display text-lg font-bold text-tinta">
          Barang tidak tersedia
        </h1>
        <p className="text-sm text-muted">
          {error || "Barang yang Anda cari tidak ditemukan atau sudah ditarik."}
        </p>
        <Link
          to="/katalog"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-pil bg-nila px-5 py-2.5 text-sm font-semibold text-putih hover:bg-nila-tua"
        >
          <i className="pi pi-arrow-left text-xs" aria-hidden="true" />
          <span>Kembali ke katalog</span>
        </Link>
      </div>
    );
  }

  const catMeta = getCategoryMeta(item.kategori);
  const gradeMeta = CONDITION_GRADE_META[item.kondisi_grade];
  const canOrder = item.status === "terbit" && item.stok_tersedia > 0;
  const maxOrderQty = Math.min(50, Math.max(1, item.stok_tersedia));
  const isFav = favorites.includes(item.uuid);
  const inCart = cart.some((c) => c.uuid === item.uuid);
  const hasPriceDrop =
    typeof item.harga_baru_rupiah === "number" &&
    item.harga_baru_rupiah > item.harga_rupiah;

  const waConfirmLink = buildWhatsAppLink(
    settings?.whatsapp_resmi,
    `Assalamu'alaikum / Halo Admin Barokahiin, saya ${
      namaPembeli || "(Nama)"
    } sudah mengirim permintaan beli untuk barang ${item.kode_barang} - ${
      item.judul
    } (${jumlah} pcs, total ${formatRupiah(
      item.harga_rupiah * jumlah
    )}). Mohon konfirmasi ketersediaan & instruksi pembayaran.`
  );
  const waAskLink = buildWhatsAppLink(
    settings?.whatsapp_resmi,
    `Halo Admin Barokahiin, saya ingin bertanya tentang barang ${item.kode_barang} (${item.judul}).`
  );

  return (
    <div
      data-kategori={catMeta.slug}
      className={`kategori-transition space-y-6 lg:space-y-8 ${
        canOrder ? "pb-20 lg:pb-0" : ""
      }`}
    >
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-xs text-muted"
      >
        <Link to="/" className="hover:text-nila">
          Beranda
        </Link>
        <span>/</span>
        <Link to="/katalog" className="hover:text-nila">
          Katalog
        </Link>
        {item.kategori && (
          <>
            <span>/</span>
            <Link
              to={`/katalog?kategori=${encodeURIComponent(item.kategori.slug)}`}
              className="font-medium text-aksen-tua hover:underline"
            >
              {item.kategori.nama}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-medium text-tinta">{item.kode_barang}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* 1. Media Gallery (Top on mobile, Left-top on desktop) */}
        <div className="min-w-0 space-y-3 lg:col-span-7">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-kartu border border-garis bg-putih">
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
                  className="h-full w-full bg-tinta object-contain"
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
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted">
                <i className="pi pi-image text-4xl" aria-hidden="true" />
                <span className="text-sm">Belum ada foto</span>
              </div>
            )}

            <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
              <StatusBadge
                status={item.status}
                label={item.status_label}
                size="md"
              />
              {hasPriceDrop && (
                <span className="inline-flex items-center gap-1 rounded-pil bg-bata px-2.5 py-0.5 text-xs font-bold text-putih">
                  <i className="pi pi-arrow-down text-[10px]" aria-hidden="true" />
                  <span>Harga turun</span>
                </span>
              )}
            </div>

            {item.kategori && (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-pil bg-aksen px-3 py-1 text-xs font-semibold text-aksen-teks">
                <i className={`${catMeta.icon} text-xs`} aria-hidden="true" />
                <span>{item.kategori.nama}</span>
              </span>
            )}
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
                  <button
                    key={m.uuid}
                    type="button"
                    onClick={() => setActiveMediaIndex(idx)}
                    aria-label={m.alt || `Media ${idx + 1} (${m.tipe})`}
                    className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-kontrol border-2 transition ${
                      isActive
                        ? "border-nila"
                        : "border-garis opacity-75 hover:opacity-100"
                    }`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={m.alt || item.judul}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-kertas text-muted">
                        <i
                          className={`pi ${
                            m.tipe === "video" ? "pi-video" : "pi-image"
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                    )}
                    {m.tipe === "video" && (
                      <span className="absolute inset-0 flex items-center justify-center bg-tinta/40 text-putih">
                        <i className="pi pi-play-circle text-lg" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Price, Store, Shipping, Cart & Order Form (Second on mobile, Right sticky on desktop) */}
        <div className="min-w-0 space-y-5 lg:col-span-5 lg:row-span-2">
          <div className="space-y-4 rounded-kartu border border-garis bg-putih p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="font-mono text-xs text-muted">
                  {item.kode_barang}
                </span>
                <h1 className="font-display mt-0.5 text-xl font-bold leading-snug text-tinta sm:text-2xl">
                  {item.judul}
                </h1>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  type="button"
                  icon={isFav ? "pi pi-heart-fill" : "pi pi-heart"}
                  outlined={!isFav}
                  aria-pressed={isFav}
                  aria-label={isFav ? "Hapus dari favorit" : "Simpan ke favorit"}
                  onClick={() => toggleFavorite(item.uuid)}
                />
                <Button
                  type="button"
                  icon={copiedLink ? "pi pi-check" : "pi pi-share-alt"}
                  outlined
                  aria-label="Bagikan tautan barang"
                  onClick={handleShare}
                />
              </div>
            </div>

            {copiedLink && (
              <p className="text-xs font-medium text-teh-tua">
                Tautan barang berhasil disalin!
              </p>
            )}

            <div className="flex items-baseline justify-between border-y border-garis py-3">
              <div>
                <p className="text-xs text-muted">Harga</p>
                <div className="flex items-baseline gap-2">
                  <p className="font-display tabular-nums text-2xl font-bold text-nila">
                    {formatRupiah(item.harga_rupiah)}
                  </p>
                  {hasPriceDrop && (
                    <span className="tabular-nums text-xs text-muted line-through">
                      {formatRupiah(item.harga_baru_rupiah)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Stok tersedia</p>
                <p className="tabular-nums text-base font-semibold text-tinta">
                  {item.stok_tersedia}
                </p>
              </div>
            </div>

            {/* Estimasi ongkir atau ambil di tempat */}
            <div className="rounded-kontrol border border-garis bg-kertas p-3 text-xs">
              {item.pickup_only ? (
                <p className="flex items-center gap-2 font-medium text-tinta">
                  <i className="pi pi-map-marker text-bata" aria-hidden="true" />
                  <span>
                    Khusus ambil di tempat (alamat lengkap tampil setelah
                    pembayaran).
                  </span>
                </p>
              ) : shipping ? (
                <div className="space-y-1">
                  <p className="font-semibold text-tinta">
                    Estimasi pengiriman ({shipping.zona})
                  </p>
                  <div className="flex justify-between text-muted">
                    <span>Ongkir</span>
                    <span className="tabular-nums font-semibold text-tinta">
                      {formatRupiah(shipping.ongkir_idr)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Biaya kemas</span>
                    <span className="tabular-nums font-semibold text-tinta">
                      {formatRupiah(shipping.packing_fee_idr)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted">
                  Tersedia untuk diantar atau diambil di lokasi koordinator.
                </p>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-kontrol bg-kertas p-3">
                <dt className="text-muted">Kondisi</dt>
                <dd className="mt-1 font-semibold text-tinta">
                  {gradeMeta?.label || item.kondisi_grade}
                </dd>
              </div>
              <div className="rounded-kontrol bg-kertas p-3">
                <dt className="text-muted">Donatur</dt>
                <dd className="mt-1 font-semibold text-tinta">
                  {item.donor_label || "Sahabat Berbagi"}
                </dd>
              </div>
              <div className="rounded-kontrol bg-kertas p-3">
                <dt className="text-muted">Kategori</dt>
                <dd className="mt-1 font-semibold text-aksen-tua">
                  {item.kategori?.nama || "-"}
                </dd>
              </div>
              <div className="rounded-kontrol bg-kertas p-3">
                <dt className="text-muted">Diterbitkan</dt>
                <dd className="mt-1 font-semibold text-tinta">
                  {formatDateId(item.diterbitkan_pada)}
                </dd>
              </div>
            </dl>

            {/* Kartu Toko Ringkas */}
            {item.toko && (
              <Link
                to={`/toko/${item.toko.slug}`}
                className="flex items-center justify-between gap-3 rounded-kartu border border-garis bg-kertas p-3.5 text-xs transition hover:border-nila hover:bg-putih"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-kartu border border-garis bg-nila-muda text-nila">
                    <i className="pi pi-shop text-base" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-bold text-tinta">
                      {item.toko.nama}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-muted">
                      <span>{item.toko.area_publik}</span>
                      {item.toko.level && (
                        <span className="rounded-pil bg-nila-muda px-2 py-0.5 text-[10px] font-semibold text-nila-tua">
                          Level {item.toko.level}
                        </span>
                      )}
                      <span className="rounded-pil bg-teh-muda px-2 py-0.5 text-[10px] font-semibold text-teh-tua">
                        {item.toko.rating_avg
                          ? `★ ${item.toko.rating_avg.toFixed(1)}`
                          : "Toko baru"}
                      </span>
                    </span>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-nila">
                  <span>Lihat toko</span>
                  <i className="pi pi-chevron-right text-[11px]" aria-hidden="true" />
                </span>
              </Link>
            )}

            {item.kegiatan && (
              <Link
                to={`/kegiatan/${item.kegiatan.slug}`}
                className="flex items-center justify-between rounded-kartu border border-teh bg-teh-muda p-3.5 text-xs text-teh-tua transition hover:bg-putih"
              >
                <div>
                  <span className="block font-semibold">
                    Hasil penjualan mendanai kegiatan:
                  </span>
                  <span className="mt-0.5 block text-sm font-bold text-tinta">
                    {item.kegiatan.judul}
                  </span>
                </div>
                <i className="pi pi-arrow-right text-teh-tua" aria-hidden="true" />
              </Link>
            )}

            {/* CTA Utama: Beli langsung & Simpan ke Keranjang */}
            {canOrder && (
              <div className="space-y-2.5 pt-1">
                {token ? (
                  <>
                    <button
                      type="button"
                      disabled={buyingNow}
                      onClick={handleBuyNow}
                      className="btn-cta w-full text-sm"
                    >
                      <i
                        className={`pi ${
                          buyingNow ? "pi-spin pi-spinner" : "pi-bolt"
                        } text-sm`}
                        aria-hidden="true"
                      />
                      <span>
                        {buyingNow ? "Menyiapkan checkout…" : "Beli langsung"}
                      </span>
                    </button>

                    {inCart ? (
                      <Link
                        to="/keranjang"
                        className="secondary-action w-full text-sm"
                      >
                        <i className="pi pi-check text-xs" aria-hidden="true" />
                        <span>Sudah di keranjang · Buka keranjang</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={addingCart}
                        onClick={handleAddToCart}
                        className="secondary-action w-full text-sm"
                      >
                        <i
                          className={`pi ${
                            addingCart
                              ? "pi-spin pi-spinner"
                              : "pi-shopping-cart"
                          } text-xs`}
                          aria-hidden="true"
                        />
                        <span>Simpan ke keranjang</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={addingCart}
                      onClick={handleAddToCart}
                      className="btn-cta w-full text-sm"
                    >
                      <i
                        className={`pi ${
                          addingCart
                            ? "pi-spin pi-spinner"
                            : inCart
                              ? "pi-check"
                              : "pi-shopping-cart"
                        } text-sm`}
                        aria-hidden="true"
                      />
                      <span>
                        {inCart ? "Sudah di keranjang" : "Simpan ke keranjang"}
                      </span>
                    </button>

                    <div className="flex flex-wrap gap-2">
                      {inCart && (
                        <Link
                          to="/keranjang"
                          className="secondary-action flex-1 text-sm"
                        >
                          Buka keranjang
                        </Link>
                      )}
                      <Link
                        to={`/masuk?next=${encodeURIComponent(
                          `/barang/${item.slug}`
                        )}`}
                        className="secondary-action flex-1 text-sm"
                      >
                        Masuk & beli langsung
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Purchase Request Section (alternatif tanpa login) */}
          {purchaseResult ? (
            <div className="space-y-4 rounded-kartu border border-teh bg-teh-muda p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-kartu bg-teh text-putih">
                  <i className="pi pi-check text-lg" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-tinta">
                    Permintaan beli diterima
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-teh-tua">
                    <span lang="su" className="font-semibold">
                      Hatur nuhun
                    </span>{" "}
                    (Terima kasih), <strong>{namaPembeli}</strong>. Permintaan
                    Anda berstatus{" "}
                    <span className="font-semibold uppercase">
                      {purchaseResult.status}
                    </span>{" "}
                    (jumlah: {purchaseResult.jumlah}). Admin akan segera
                    menghubungi Anda untuk konfirmasi.
                  </p>
                </div>
              </div>

              {waConfirmLink && (
                <a
                  href={waConfirmLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-pil bg-teh px-4 py-2.5 text-sm font-semibold text-putih hover:bg-teh-tua"
                >
                  <i className="pi pi-whatsapp" aria-hidden="true" />
                  <span>Konfirmasi via WhatsApp resmi</span>
                </a>
              )}

              <TrustPaymentBanner settings={settings} />
            </div>
          ) : canOrder ? (
            <details className="rounded-kartu border border-garis bg-putih p-5">
              <summary className="cursor-pointer list-none text-sm font-bold text-nila">
                Atau kirim permintaan beli langsung (tanpa akun) ▾
              </summary>
              <form
                onSubmit={handlePurchaseSubmit}
                noValidate
                className="mt-4 space-y-4 border-t border-garis pt-4"
              >
                <p className="text-xs text-muted">
                  Admin akan mengonfirmasi ketersediaan dan batas waktu transfer.
                </p>

                {formError && (
                  <Message
                    severity="error"
                    text={formError}
                    className="w-full justify-start"
                  />
                )}

                <div className="space-y-1">
                  <label
                    htmlFor="nama-pembeli"
                    className="block text-xs font-semibold text-tinta"
                  >
                    Nama lengkap *
                  </label>
                  <InputText
                    id="nama-pembeli"
                    value={namaPembeli}
                    onChange={(e) => {
                      setNamaPembeli(e.target.value);
                      if (fieldErrors.nama_pembeli) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          nama_pembeli: undefined,
                        }));
                      }
                    }}
                    placeholder="Contoh: Ahmad Fauzi"
                    invalid={!!fieldErrors.nama_pembeli}
                    className="w-full"
                  />
                  {fieldErrors.nama_pembeli && (
                    <small className="p-error block">
                      {fieldErrors.nama_pembeli}
                    </small>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="kontak-pembeli"
                    className="block text-xs font-semibold text-tinta"
                  >
                    Nomor WhatsApp / HP *
                  </label>
                  <InputText
                    id="kontak-pembeli"
                    type="tel"
                    value={kontakPembeli}
                    onChange={(e) => {
                      setKontakPembeli(e.target.value);
                      if (fieldErrors.kontak_pembeli) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          kontak_pembeli: undefined,
                        }));
                      }
                    }}
                    placeholder="Contoh: 081234567890"
                    invalid={!!fieldErrors.kontak_pembeli}
                    className="w-full"
                  />
                  {fieldErrors.kontak_pembeli && (
                    <small className="p-error block">
                      {fieldErrors.kontak_pembeli}
                    </small>
                  )}
                </div>

                {item.stok_tersedia > 1 && (
                  <div className="space-y-1">
                    <label
                      htmlFor="jumlah-beli"
                      className="block text-xs font-semibold text-tinta"
                    >
                      Jumlah (maks. {maxOrderQty})
                    </label>
                    <InputText
                      id="jumlah-beli"
                      type="number"
                      min={1}
                      max={maxOrderQty}
                      value={String(jumlah)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setJumlah(
                          Number.isNaN(val)
                            ? 1
                            : Math.max(1, Math.min(maxOrderQty, val))
                        );
                      }}
                      invalid={!!fieldErrors.jumlah}
                      className="w-full"
                    />
                    {fieldErrors.jumlah && (
                      <small className="p-error block">
                        {fieldErrors.jumlah}
                      </small>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label
                    htmlFor="catatan-pembeli"
                    className="block text-xs font-semibold text-tinta"
                  >
                    Catatan (opsional)
                  </label>
                  <InputTextarea
                    id="catatan-pembeli"
                    rows={2}
                    autoResize
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Contoh: Rencana ambil di tempat hari Sabtu"
                    className="w-full"
                  />
                </div>

                <Button
                  type="submit"
                  label={
                    submitting
                      ? "Mengirim permintaan..."
                      : "Ajukan permintaan beli"
                  }
                  icon="pi pi-send"
                  loading={submitting}
                  className="w-full justify-center"
                />

                {waAskLink && (
                  <a
                    href={waAskLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-pil border border-teh bg-putih px-4 py-2.5 text-sm font-semibold text-teh-tua hover:bg-teh-muda"
                  >
                    <i className="pi pi-whatsapp" aria-hidden="true" />
                    <span>Tanya admin via WhatsApp</span>
                  </a>
                )}
              </form>
            </details>
          ) : (
            <div className="space-y-3 rounded-kartu border border-garis bg-putih p-5">
              <h2 className="text-base font-bold text-tinta">
                {item.status === "terjual"
                  ? "Barang ini sudah terjual"
                  : "Barang sedang ditahan"}
              </h2>
              <p className="text-xs leading-relaxed text-muted">
                {item.status === "terjual"
                  ? "Alhamdulillah, barang ini sudah terjual dan dananya tercatat untuk kegiatan sosial. Anda dapat melihat barang layak lainnya di katalog."
                  : "Barang ini sedang dalam proses konfirmasi/pembayaran oleh pemesan sebelumnya. Jika pesanan kedaluwarsa, barang akan tersedia kembali."}
              </p>
              <Link
                to="/katalog"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-pil bg-nila px-4 py-2.5 text-sm font-semibold text-putih hover:bg-nila-tua"
              >
                <span>Lihat barang lainnya</span>
              </Link>
            </div>
          )}

          <TrustPaymentBanner settings={settings} compact />
        </div>

        {/* 3. Description, Segel Kurasi & Honest Defects (Third on mobile, Left-bottom on desktop) */}
        <div className="min-w-0 space-y-4 rounded-kartu border border-garis bg-putih p-4 sm:p-5 lg:col-span-7">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
              Keterangan barang
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-tinta">
              {item.keterangan || "-"}
            </p>
          </div>

          {item.spesifikasi && (
            <div className="border-t border-garis pt-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
                Ukuran / spesifikasi
              </h2>
              <p className="mt-1.5 whitespace-pre-line text-sm text-tinta">
                {item.spesifikasi}
              </p>
            </div>
          )}

          {/* Panel Catatan Kurasi (Kunyit muda + teks Kunyit tua) */}
          <div className="rounded-kartu border border-kunyit bg-kunyit-muda p-4">
            <div className="flex items-start gap-2.5">
              <i
                className="pi pi-info-circle mt-0.5 text-kunyit-tua"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-kunyit-tua">
                  Catatan kurasi (kekurangan)
                </h2>
                <p className="mt-1 text-sm text-tinta">
                  {item.kekurangan ||
                    "Tidak ada kekurangan berarti yang dicatat."}
                </p>
              </div>
            </div>
          </div>

          {/* Segel Kurasi */}
          <details className="rounded-kartu border border-garis bg-kertas p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-tinta">
              <span className="flex items-center gap-2">
                <i className="pi pi-verified text-teh" aria-hidden="true" />
                <span>Segel Kurasi Barokahiin</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="rounded-pil bg-teh-muda px-2.5 py-0.5 text-[11px] font-semibold text-teh-tua">
                  Lulus
                </span>
                {item.kekurangan && (
                  <span className="rounded-pil bg-kunyit-muda px-2.5 py-0.5 text-[11px] font-semibold text-kunyit-tua">
                    Catatan
                  </span>
                )}
              </span>
            </summary>
            <div className="mt-3 space-y-2 border-t border-garis pt-3 text-xs text-muted">
              {item.segel_kurasi?.checks?.length ? (
                <ul className="space-y-1.5">
                  {item.segel_kurasi.checks.map((chk) => (
                    <li key={chk.kode} className="flex items-start gap-2">
                      <i
                        className={`pi mt-0.5 ${
                          chk.lulus
                            ? "pi-check-circle text-teh"
                            : "pi-exclamation-triangle text-kunyit-tua"
                        }`}
                        aria-hidden="true"
                      />
                      <span>
                        <strong className="text-tinta">{chk.teks}</strong>
                        {chk.teks_keterbukaan && ` — ${chk.teks_keterbukaan}`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <p>
                    • Kondisi dinilai sebagai{" "}
                    <strong className="text-tinta">
                      {gradeMeta?.label || item.kondisi_grade}
                    </strong>
                    .
                  </p>
                  <p>
                    • Foto dan video diperiksa admin dan metadata lokasi (EXIF)
                    telah dibersihkan.
                  </p>
                </>
              )}
            </div>
          </details>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar (tepat di atas BottomTabs) */}
      {canOrder && (
        <div className="fixed bottom-[calc(65px+env(safe-area-inset-bottom))] left-0 right-0 z-30 flex items-center justify-between gap-2.5 border-t border-garis bg-putih px-3.5 py-2.5 shadow-bar lg:hidden">
          <div className="min-w-0">
            <span className="block text-[11px] text-muted">Harga</span>
            <span className="font-display tabular-nums block truncate text-base font-bold text-nila sm:text-lg">
              {formatRupiah(item.harga_rupiah)}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {token && !inCart && (
              <button
                type="button"
                disabled={addingCart}
                onClick={handleAddToCart}
                aria-label="Simpan ke keranjang"
                className="flex h-11 w-11 items-center justify-center rounded-pil border border-garis-kuat bg-putih text-nila hover:bg-nila-muda"
              >
                <i
                  className={`pi ${
                    addingCart ? "pi-spin pi-spinner" : "pi-shopping-cart"
                  } text-base`}
                  aria-hidden="true"
                />
              </button>
            )}
            <button
              type="button"
              disabled={token ? buyingNow : addingCart}
              onClick={token ? handleBuyNow : handleAddToCart}
              className="btn-cta px-4 text-xs sm:px-5 sm:text-sm"
            >
              <i
                className={`pi ${
                  (token ? buyingNow : addingCart)
                    ? "pi-spin pi-spinner"
                    : token
                      ? "pi-bolt"
                      : inCart
                        ? "pi-check"
                        : "pi-shopping-cart"
                } text-sm`}
                aria-hidden="true"
              />
              <span>
                {token
                  ? buyingNow
                    ? "Menyiapkan…"
                    : "Beli langsung"
                  : inCart
                    ? "Sudah di keranjang"
                    : "Tambah ke keranjang"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
