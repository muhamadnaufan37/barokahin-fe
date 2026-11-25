import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Message } from "primereact/message";
import { ProgressBar } from "primereact/progressbar";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { ItemCard } from "../components/ItemCard";
import { TrustPaymentBanner } from "../components/TrustPaymentBanner";
import { useBuyer } from "../context/BuyerContext";
import { useStorefront } from "../context/StorefrontContext";
import { publicApi } from "../services/publicApi";
import { BuyerOrder, PublicActivity, PublicItem } from "../types";
import { getCategoryMeta } from "../utils/category";
import {
  formatDateId,
  formatRupiah,
  getOrderStatusMeta,
} from "../utils/format";

const RECEIPT_ROWS = [
  {
    id: "receipt-harga",
    label: "1. Nilai barang terkurasi",
    amount: "Rp 150.000",
    detail:
      "Harga ditetapkan admin secara wajar setelah memeriksa kondisi fisik, kelengkapan, dan fungsi barang.",
  },
  {
    id: "receipt-operasional",
    label: "2. Biaya kurasi & perawatan",
    amount: "Rp 0 (dikelola)",
    detail:
      "Pencatatan dan publikasi dilakukan transparan oleh tim pengelola tanpa potongan tersembunyi.",
  },
  {
    id: "receipt-dana",
    label: "3. Dana masuk untuk kegiatan",
    amount: "Rp 150.000",
    detail:
      "Pembelian tercatat sebagai penjualan resmi dan langsung dialokasikan ke kegiatan sosial/keagamaan.",
  },
];

export const HomePage: React.FC = () => {
  const { impact, settings, categories } = useStorefront();
  const { token, recentOrderCodes } = useBuyer();
  const [items, setItems] = useState<PublicItem[]>([]);
  const [activities, setActivities] = useState<PublicActivity[]>([]);
  const [pendingOrders, setPendingOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openReceiptId, setOpenReceiptId] = useState<string | null>(
    "receipt-dana"
  );

  useEffect(() => {
    if (!token || !recentOrderCodes.length) {
      setPendingOrders([]);
      return;
    }
    let active = true;
    Promise.allSettled(
      recentOrderCodes.map((code) => publicApi.getBuyerOrder(token, code))
    ).then((results) => {
      if (!active) return;
      const activeOrders = results
        .flatMap((r) => (r.status === "fulfilled" ? [r.value] : []))
        .filter((order) => order.status === "menunggu_bayar");
      setPendingOrders(activeOrders);
    });
    return () => {
      active = false;
    };
  }, [token, recentOrderCodes]);

  useEffect(() => {
    document.title =
      "Barokahiin — Barang yang kamu beli, kebaikan yang kita danai";
    let active = true;

    const loadHomeData = async () => {
      setLoading(true);
      setError(null);
      const [itemsRes, activitiesRes] = await Promise.allSettled([
        publicApi.getItems({ per_page: 8, sort: "terbaru" }),
        publicApi.getActivities(),
      ]);

      if (!active) return;

      if (itemsRes.status === "fulfilled") {
        setItems(itemsRes.value.items);
      } else {
        setError(
          itemsRes.reason instanceof Error
            ? itemsRes.reason.message
            : "Gagal memuat sorotan barang."
        );
      }

      if (activitiesRes.status === "fulfilled") {
        setActivities(activitiesRes.value.slice(0, 3));
      }

      setLoading(false);
    };

    void loadHomeData();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero Nila + Sapaan Sunda + Pita Mega Mendung */}
      <section className="on-dark overflow-hidden rounded-kartu-besar bg-nila text-putih">
        <div className="px-6 py-8 sm:px-10 sm:py-12">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-medium">
              <span lang="su" className="font-semibold text-pucuk">
                Wilujeng sumping
              </span>{" "}
              <span className="text-nila-muda">
                (Selamat datang di Barokahiin)
              </span>
            </p>
            <h1 className="font-display text-2xl font-bold leading-tight sm:text-4xl">
              Barang yang kamu beli, kebaikan yang kita danai.
            </h1>
            <p className="text-sm leading-relaxed text-nila-muda sm:text-base">
              Setiap barang layak dari donatur dikurasi kondisi dan harganya
              secara jujur, dijual terbuka, dan seluruh hasilnya disalurkan
              untuk mendanai kegiatan sosial di Jawa Barat dan sekitarnya.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/katalog" className="btn-cta text-sm">
                <i className="pi pi-shopping-bag text-sm" aria-hidden="true" />
                <span>Jelajahi katalog</span>
              </Link>
              <Link
                to="/donasi-barang"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-pil border border-putih px-5 py-2.5 text-sm font-semibold text-putih transition hover:bg-nila-tua"
              >
                <i className="pi pi-gift text-sm" aria-hidden="true" />
                <span>Donasi barang</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Pita Mega Mendung dekoratif di sisi bawah hero */}
        <div className="pita-mendung w-full" aria-hidden="true" />
      </section>

      {/* Pesanan Menunggu Pembayaran */}
      {pendingOrders.length > 0 && (
        <section
          aria-label="Pesanan menunggu pembayaran"
          className="space-y-3 rounded-kartu-besar border border-kunyit bg-kunyit-muda p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <i className="pi pi-clock text-kunyit-tua" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-kunyit-tua sm:text-lg">
                Menunggu pembayaran ({pendingOrders.length})
              </h2>
            </div>
            <Link
              to="/pesanan"
              className="text-xs font-semibold text-nila hover:underline"
            >
              Semua pesanan →
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {pendingOrders.map((order) => {
              const statusMeta = getOrderStatusMeta(order.status);
              return (
                <div
                  key={order.uuid}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-kartu border border-garis bg-putih p-3.5"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs font-bold text-muted">
                        {order.kode}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-pil border px-2 py-0.5 text-[10px] font-semibold ${statusMeta.badgeClass}`}
                      >
                        <i
                          className={`${statusMeta.icon} text-[9px]`}
                          aria-hidden="true"
                        />
                        <span>{statusMeta.label}</span>
                      </span>
                    </div>
                  <p className="truncate text-sm font-bold text-tinta">
                    {order.items?.map((i) => i.judul).join(", ") ||
                      "Pesanan Barokahiin"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {typeof order.total_idr === "number" && (
                      <span className="tabular-nums font-bold text-nila">
                        {formatRupiah(order.total_idr)}
                      </span>
                    )}
                    {order.hold_expires_at && (
                      <span className="text-muted">
                        · Berlaku s.d. {formatDateId(order.hold_expires_at)}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/pesanan/${encodeURIComponent(order.kode)}`}
                  className="btn-cta text-xs"
                >
                  <span>Bayar sekarang</span>
                  <i className="pi pi-arrow-right text-[11px]" aria-hidden="true" />
                </Link>
              </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Rel Kategori Berwarna */}
      {categories.length > 0 && (
        <section aria-label="Jelajahi kategori" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-tinta sm:text-xl">
              Kategori pilihan
            </h2>
            <Link
              to="/katalog"
              className="text-sm font-semibold text-nila hover:underline"
            >
              Semua kategori →
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((cat) => {
              const meta = getCategoryMeta(cat);
              return (
                <Link
                  key={cat.uuid}
                  to={`/katalog?kategori=${encodeURIComponent(cat.slug)}`}
                  data-kategori={meta.slug}
                  className="kategori-transition flex w-[96px] shrink-0 flex-col items-center justify-center gap-2 rounded-kartu border border-garis bg-putih p-3 text-center hover:border-aksen hover:bg-aksen-muda"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-pil bg-aksen text-aksen-teks">
                    <i className={`${meta.icon} text-base`} aria-hidden="true" />
                  </span>
                  <span className="line-clamp-2 text-xs font-semibold leading-tight text-tinta">
                    {cat.nama}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Ringkasan Dampak */}
      <section aria-label="Ringkasan dampak Barokahiin" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-tinta sm:text-xl">
            Ringkasan dampak
          </h2>
          <Link
            to="/kegiatan"
            className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-teh-tua hover:underline"
          >
            <span>Lihat transparansi dana</span>
            <i className="pi pi-arrow-right text-xs" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-kartu border border-garis bg-putih p-4">
            <p className="text-xs font-medium text-muted">Dana terkumpul</p>
            <p className="font-display tabular-nums mt-1 text-lg font-bold text-teh sm:text-xl">
              {impact ? formatRupiah(impact.total_dana_kebaikan_idr) : "—"}
            </p>
          </div>
          <div className="rounded-kartu border border-garis bg-putih p-4">
            <p className="text-xs font-medium text-muted">Barang terjual</p>
            <p className="font-display tabular-nums mt-1 text-lg font-bold text-nila sm:text-xl">
              {impact ? impact.total_barang_terjual : "—"}
            </p>
          </div>
          <div className="rounded-kartu border border-garis bg-putih p-4">
            <p className="text-xs font-medium text-muted">Barang tersedia</p>
            <p className="font-display tabular-nums mt-1 text-lg font-bold text-tinta sm:text-xl">
              {impact ? impact.total_barang_tersedia : "—"}
            </p>
          </div>
          <div className="rounded-kartu border border-garis bg-putih p-4">
            <p className="text-xs font-medium text-muted">Program terdanai</p>
            <p className="font-display tabular-nums mt-1 text-lg font-bold text-tinta sm:text-xl">
              {impact ? impact.total_program_terdanai : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* Sorotan Barang */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-tinta sm:text-xl">
              Baru dikurasi di Bandung Raya
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              Foto apa adanya, kekurangan dicatat jelas, harga ditetapkan
              pengelola.
            </p>
          </div>
          <Link
            to="/katalog"
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-pil border border-garis bg-putih px-4 py-2 text-sm font-semibold text-nila hover:bg-nila-muda"
          >
            <span>Semua barang</span>
            <i className="pi pi-arrow-right text-xs" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} height="19rem" borderRadius="12px" />
            ))}
          </div>
        ) : error ? (
          <Message severity="error" text={error} className="w-full justify-start" />
        ) : items.length === 0 ? (
          <div className="rounded-kartu border border-garis bg-putih p-8 text-center">
            <p className="text-sm font-semibold text-tinta">
              Belum ada barang yang diterbitkan saat ini.
            </p>
            <p className="mt-1 text-xs text-muted">
              Anda dapat menjadi donatur pertama dengan mengajukan donasi barang.
            </p>
            <Link to="/donasi-barang" className="btn-cta mt-4 text-sm">
              Ajukan donasi barang
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            {items.map((item) => (
              <ItemCard key={item.uuid} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Kuitansi Kebaikan (Receipt Interaktif) */}
      <section className="grid grid-cols-1 items-center gap-6 rounded-kartu-besar border border-garis bg-putih p-5 sm:p-6 lg:grid-cols-12 lg:p-8">
        <div className="min-w-0 space-y-3 lg:col-span-6">
          <span className="inline-flex items-center gap-1.5 rounded-pil bg-teh-muda px-3 py-1 text-xs font-semibold text-teh-tua">
            <i className="pi pi-check-circle text-[11px]" aria-hidden="true" />
            <span>Transparansi setiap rupiah</span>
          </span>
          <h2 className="font-display text-xl font-bold text-tinta sm:text-2xl">
            Ke mana perginya uang pembelianmu?
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Ketuk setiap baris kuitansi di samping untuk melihat penjelasan alur
            dana dari barang donasi hingga laporan kegiatan publik.
          </p>
          <div className="pt-1">
            <Link
              to="/cara-kerja"
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-nila hover:underline"
            >
              <span>Pelajari cara kerja selengkapnya</span>
              <i className="pi pi-arrow-right text-xs" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="min-w-0 rounded-kartu border border-garis bg-kertas p-3.5 sm:p-5 lg:col-span-6">
          <div className="mb-3 flex items-center justify-between border-b border-dashed border-garis-kuat pb-2.5">
            <span className="font-mono text-xs font-semibold text-tinta">
              CONTOH KUITANSI KEBAIKAN
            </span>
            <span className="rounded-pil bg-nila-muda px-2.5 py-0.5 text-[11px] font-semibold text-nila-tua">
              Terbuka
            </span>
          </div>

          <div className="divide-y divide-garis">
            {RECEIPT_ROWS.map((row) => {
              const isOpen = openReceiptId === row.id;
              return (
                <div key={row.id} className="py-2">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={row.id}
                    onClick={() =>
                      setOpenReceiptId(isOpen ? null : row.id)
                    }
                    className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-kontrol px-2 text-left hover:bg-putih"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-tinta">
                      <i
                        className={`pi ${
                          isOpen ? "pi-chevron-down" : "pi-chevron-right"
                        } text-[11px] text-nila`}
                        aria-hidden="true"
                      />
                      <span>{row.label}</span>
                    </span>
                    <span className="tabular-nums shrink-0 font-mono text-sm font-bold text-nila">
                      {row.amount}
                    </span>
                  </button>
                  {isOpen && (
                    <p
                      id={row.id}
                      className="mt-1 rounded-kontrol bg-putih px-3 py-2 text-xs leading-relaxed text-muted"
                    >
                      {row.detail}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-dashed border-garis-kuat pt-2.5 text-xs">
            <span>
              <span lang="su" className="font-semibold text-nila">
                Hatur nuhun
              </span>{" "}
              <span className="text-muted">(Terima kasih)</span>
            </span>
            <span className="font-semibold text-teh-tua">
              Masuk laporan publik
            </span>
          </div>
        </div>
      </section>

      {/* Kegiatan Berjalan */}
      {activities.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-tinta sm:text-xl">
                Kegiatan yang didanai
              </h2>
              <p className="text-xs text-muted sm:text-sm">
                Pantau progres dana dan laporan penggunaannya secara terbuka.
              </p>
            </div>
            <Link
              to="/kegiatan"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-nila hover:underline"
            >
              <span>Lihat semua</span>
              <i className="pi pi-arrow-right text-xs" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {activities.map((act) => {
              const pct =
                act.target_dana > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (act.dana_terkumpul_rupiah / act.target_dana) * 100
                      )
                    )
                  : 0;
              return (
                <Link
                  key={act.uuid}
                  to={`/kegiatan/${act.slug}`}
                  className="flex flex-col justify-between rounded-kartu border border-garis bg-putih p-5 transition-colors hover:border-nila"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Tag
                        value={act.status === "aktif" ? "Aktif" : "Selesai"}
                        severity={act.status === "aktif" ? "success" : "secondary"}
                        rounded
                        className="px-2.5 py-0.5 text-[11px]"
                      />
                      {act.periode && (
                        <span className="text-xs text-muted">{act.periode}</span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-tinta">
                      {act.judul}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted">
                      {act.deskripsi}
                    </p>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="tabular-nums font-semibold text-teh-tua">
                        {formatRupiah(act.dana_terkumpul_rupiah)}
                      </span>
                      <span className="tabular-nums text-muted">
                        Target {formatRupiah(act.target_dana)} ({pct}%)
                      </span>
                    </div>
                    <ProgressBar value={pct} showValue={false} className="h-2" />
                    <p className="tabular-nums text-[11px] text-muted">
                      Dana terpakai:{" "}
                      {formatRupiah(act.total_penggunaan_rupiah ?? 0)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <TrustPaymentBanner settings={settings} />
    </div>
  );
};
