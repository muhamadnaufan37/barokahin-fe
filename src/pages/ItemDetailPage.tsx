import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { Skeleton } from "primereact/skeleton";
import { StatusBadge } from "../components/StatusBadge";
import { TrustPaymentBanner } from "../components/TrustPaymentBanner";
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
} from "../types";
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
  const { settings } = useStorefront();

  const [item, setItem] = useState<PublicItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Purchase request form state
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
      try {
        const data = await publicApi.getItemBySlug(slug);
        if (!active) return;
        setItem(data);
        document.title = `${data.judul} — Barokahiin`;
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
            if (k in mapped || ["nama_pembeli", "kontak_pembeli", "jumlah", "catatan"].includes(k)) {
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
  const maxOrderQty = Math.min(50, Math.max(1, item.stok_tersedia));
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
    <div className="space-y-8">
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
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
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
                  <button
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
                  </button>
                );
              })}
            </div>
          )}

          {/* Description & Honest Defects */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Keterangan Barang
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {item.keterangan || "-"}
              </p>
            </div>

            {item.spesifikasi && (
              <div className="border-t border-slate-100 pt-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
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
                  <span className="block text-xs font-bold uppercase tracking-wider">
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
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Stok Tersedia</p>
                <p className="text-base font-semibold text-slate-800">
                  {item.stok_tersedia}
                </p>
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

          {/* Purchase Request Section */}
          {purchaseResult ? (
            <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <i className="pi pi-check text-lg" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-emerald-950">
                    Permintaan Beli Diterima
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-900">
                    Terima kasih, <strong>{namaPembeli}</strong>. Permintaan
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
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <i className="pi pi-whatsapp" aria-hidden="true" />
                  <span>Konfirmasi via WhatsApp Resmi</span>
                </a>
              )}

              <TrustPaymentBanner settings={settings} />
            </div>
          ) : canOrder ? (
            <form
              onSubmit={handlePurchaseSubmit}
              noValidate
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Kirim Permintaan Beli
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Tidak perlu akun. Admin akan mengonfirmasi ketersediaan dan
                  batas waktu transfer.
                </p>
              </div>

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
                  className="block text-xs font-semibold text-slate-700"
                >
                  Nama Lengkap *
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
                  className="block text-xs font-semibold text-slate-700"
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
                    className="block text-xs font-semibold text-slate-700"
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
                    <small className="p-error block">{fieldErrors.jumlah}</small>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label
                  htmlFor="catatan-pembeli"
                  className="block text-xs font-semibold text-slate-700"
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
                label={submitting ? "Mengirim Permintaan..." : "Ajukan Permintaan Beli"}
                icon="pi pi-send"
                loading={submitting}
                className="w-full justify-center"
              />

              {waAskLink && (
                <a
                  href={waAskLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  <i className="pi pi-whatsapp" aria-hidden="true" />
                  <span>Tanya Admin via WhatsApp</span>
                </a>
              )}
            </form>
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

          <TrustPaymentBanner settings={settings} compact />
        </div>
      </div>
    </div>
  );
};
