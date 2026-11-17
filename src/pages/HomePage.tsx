import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Message } from "primereact/message";
import { ProgressBar } from "primereact/progressbar";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { ItemCard } from "../components/ItemCard";
import { TrustPaymentBanner } from "../components/TrustPaymentBanner";
import { useStorefront } from "../context/StorefrontContext";
import { publicApi } from "../services/publicApi";
import { PublicActivity, PublicItem } from "../types";
import { formatRupiah } from "../utils/format";

export const HomePage: React.FC = () => {
  const { impact, settings } = useStorefront();
  const [items, setItems] = useState<PublicItem[]>([]);
  const [activities, setActivities] = useState<PublicActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title =
      "Barokahiin — Barang yang kamu beli, kebaikan yang kita danai";
    let active = true;

    const loadHomeData = async () => {
      setLoading(true);
      setError(null);
      const [itemsRes, activitiesRes] = await Promise.allSettled([
        publicApi.getItems({ per_page: 6, sort: "terbaru" }),
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
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-teal-500 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <i className="pi pi-verified text-xs" aria-hidden="true" />
            <span>Terkurasi Jujur · Dana Terlapor Terbuka</span>
          </span>
          <h1 className="text-2xl font-bold leading-tight sm:text-4xl">
            Barang yang kamu beli, kebaikan yang kita danai.
          </h1>
          <p className="text-sm leading-relaxed text-teal-50 sm:text-base">
            Setiap barang layak dari donatur dikurasi kondisi dan harganya oleh
            admin, dijual secara transparan, dan seluruh hasilnya disalurkan
            untuk mendanai kegiatan sosial & keagamaan.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/katalog"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow-sm transition hover:bg-teal-50"
            >
              <i className="pi pi-shopping-bag text-sm" aria-hidden="true" />
              <span>Jelajahi Katalog</span>
            </Link>
            <Link
              to="/donasi-barang"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <i className="pi pi-gift text-sm" aria-hidden="true" />
              <span>Ajukan Donasi Barang</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Ringkasan Dampak */}
      <section aria-label="Ringkasan dampak Barokahiin" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            Ringkasan Dampak
          </h2>
          <Link
            to="/kegiatan"
            className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
          >
            <span>Lihat Transparansi Dana</span>
            <i className="pi pi-arrow-right text-xs" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Dana Terkumpul</p>
            <p className="mt-1 text-lg font-bold text-brand-700 sm:text-xl">
              {impact ? formatRupiah(impact.total_dana_terkumpul_rupiah) : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Barang Terjual</p>
            <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              {impact ? impact.total_barang_terjual : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Barang Tersedia
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              {impact ? impact.total_barang_tersedia : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Kegiatan Terdanai
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              {impact ? impact.total_kegiatan_terdanai : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* Sorotan Barang */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Sorotan Barang Pilihan
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              Sudah dikurasi kondisi dan kekurangannya secara jujur.
            </p>
          </div>
          <Link
            to="/katalog"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <span>Semua Barang</span>
            <i className="pi pi-arrow-right text-xs" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} height="18rem" borderRadius="1rem" />
            ))}
          </div>
        ) : error ? (
          <Message severity="error" text={error} className="w-full justify-start" />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Belum ada barang yang diterbitkan saat ini.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Anda dapat menjadi donatur pertama dengan mengajukan donasi barang.
            </p>
            <Link
              to="/donasi-barang"
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Ajukan Donasi Barang
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item.uuid} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Kegiatan Berjalan */}
      {activities.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                Kegiatan yang Didanai
              </h2>
              <p className="text-xs text-slate-500 sm:text-sm">
                Pantau progres dana dan laporan penggunaannya secara terbuka.
              </p>
            </div>
            <Link
              to="/kegiatan"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
            >
              <span>Lihat Semua</span>
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
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-500/50 hover:shadow-md"
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
                        <span className="text-xs text-slate-500">
                          {act.periode}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {act.judul}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
                      {act.deskripsi}
                    </p>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-brand-700">
                        {formatRupiah(act.dana_terkumpul_rupiah)}
                      </span>
                      <span className="text-slate-500">
                        Target {formatRupiah(act.target_dana)}
                      </span>
                    </div>
                    <ProgressBar value={pct} showValue={false} className="h-2" />
                    <p className="text-[11px] text-slate-500">
                      Dana terpakai: {formatRupiah(act.total_penggunaan_rupiah)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Cara Kerja Singkat */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Bagaimana Barokahiin Bekerja?
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              Alur sederhana dari barang tak terpakai menjadi manfaat nyata.
            </p>
          </div>
          <Link
            to="/cara-kerja"
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            Pelajari selengkapnya →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "1",
              title: "Donatur Ajukan Barang",
              desc: "Isi form donasi tanpa perlu login. Identitas dijaga sebagai Sahabat Berbagi.",
            },
            {
              step: "2",
              title: "Admin Kurasi Jujur",
              desc: "Foto multi-sudut, video, cek fungsi, catat kekurangan, dan tetapkan harga wajar.",
            },
            {
              step: "3",
              title: "Publik Membeli",
              desc: "Kirim permintaan beli atau pesan via WhatsApp, lalu bayar ke rekening resmi.",
            },
            {
              step: "4",
              title: "Dana & Laporan Terbuka",
              desc: "Hasil penjualan mendanai kegiatan dan dilaporkan secara transparan.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                {item.step}
              </div>
              <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <TrustPaymentBanner settings={settings} />
    </div>
  );
};
