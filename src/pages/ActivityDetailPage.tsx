import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Message } from "primereact/message";
import { ProgressBar } from "primereact/progressbar";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { publicApi, resolveMediaUrl } from "../services/publicApi";
import { PublicActivityDetail, PublicActivityExpense } from "../types";
import { formatDateId, formatRupiah } from "../utils/format";
import { setPageMetadata } from "../utils/seo";

export const ActivityDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [activity, setActivity] = useState<PublicActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await publicApi.getActivityBySlug(slug);
        if (!active) return;
        setActivity(data);
        setPageMetadata({
          title: `${data.judul} — Transparansi Dana Barokahiin`,
          description: data.deskripsi,
          path: `/kegiatan/${encodeURIComponent(data.slug)}`,
          image: data.media.find((media) => media.tipe === "foto")?.url,
        });
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Kegiatan tidak ditemukan."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton width="16rem" height="1.5rem" />
        <Skeleton height="12rem" borderRadius="1rem" />
        <Skeleton height="16rem" borderRadius="1rem" />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-lg font-bold text-slate-900">
          Kegiatan Tidak Ditemukan
        </h1>
        {error && <Message severity="error" text={error} className="w-full" />}
        <Link
          to="/kegiatan"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Kembali ke Daftar Kegiatan
        </Link>
      </div>
    );
  }

  const pct =
    activity.target_dana > 0
      ? Math.min(
          100,
          Math.round(
            (activity.dana_terkumpul_rupiah / activity.target_dana) * 100
          )
        )
      : 0;
  const sisaDana = Math.max(
    0,
    activity.dana_terkumpul_rupiah - (activity.total_penggunaan_rupiah ?? 0)
  );

  return (
    <div className="space-y-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-slate-500"
      >
        <Link to="/" className="hover:text-brand-700">
          Beranda
        </Link>
        <span>/</span>
        <Link to="/kegiatan" className="hover:text-brand-700">
          Kegiatan & Dana
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-800">{activity.judul}</span>
      </nav>

      {/* Header & Progress */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <Tag
            value={activity.status === "aktif" ? "Kegiatan Aktif" : "Selesai"}
            severity={activity.status === "aktif" ? "success" : "secondary"}
            rounded
            className="px-3 py-1 text-xs"
          />
          {activity.periode && (
            <span className="text-xs font-medium text-slate-500">
              Periode: {activity.periode}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
          {activity.judul}
        </h1>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {activity.deskripsi}
        </p>
        {(activity.wilayah || activity.penerima_manfaat_desc) && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {activity.wilayah && (
              <span className="readiness-badge">
                Wilayah: {activity.wilayah}
              </span>
            )}
            {activity.penerima_manfaat_desc && (
              <span className="readiness-badge">
                Penerima manfaat: {activity.penerima_manfaat_desc}
              </span>
            )}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-brand-50 p-4">
            <p className="text-xs font-medium text-brand-800">Dana Terkumpul</p>
            <p className="mt-1 text-lg font-bold text-brand-900">
              {formatRupiah(activity.dana_terkumpul_rupiah)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Target Dana</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {formatRupiah(activity.target_dana)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">
              Dana Digunakan
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {activity.total_penggunaan_rupiah === null
                ? "Belum dilaporkan"
                : formatRupiah(activity.total_penggunaan_rupiah)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Saldo Tersisa</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {activity.total_penggunaan_rupiah === null
                ? "Belum dilaporkan"
                : formatRupiah(sisaDana)}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Progres Pencapaian Target</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <ProgressBar value={pct} showValue={false} className="h-3" />
        </div>
      </section>

      {/* Laporan Penggunaan Dana */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
          Laporan Penggunaan Dana
        </h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <DataTable
            value={activity.laporan_penggunaan}
            dataKey="uuid"
            emptyMessage="Belum ada rincian pengeluaran yang dipublikasikan untuk kegiatan ini."
            responsiveLayout="scroll"
            stripedRows
            size="small"
          >
            <Column
              field="tanggal"
              header="Tanggal"
              body={(row: PublicActivityExpense) => formatDateId(row.tanggal)}
            />
            <Column
              field="pos"
              header="Pos Penggunaan"
              body={(row: PublicActivityExpense) => (
                <span className="font-semibold text-slate-900">{row.pos}</span>
              )}
            />
            <Column
              field="keterangan"
              header="Keterangan"
              body={(row: PublicActivityExpense) => row.keterangan || "-"}
            />
            <Column
              field="nominal_rupiah"
              header="Nominal"
              align="right"
              body={(row: PublicActivityExpense) => (
                <span className="font-semibold text-slate-900">
                  {formatRupiah(row.nominal_rupiah)}
                </span>
              )}
            />
          </DataTable>
        </div>
      </section>

      {/* Dokumentasi Kegiatan */}
      {activity.media.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            Dokumentasi Kegiatan
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activity.media.map((m) => (
              <figure
                key={m.uuid}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="aspect-[4/3] w-full bg-slate-100">
                  {m.tipe === "video" ? (
                    <video
                      src={resolveMediaUrl(m.url) || undefined}
                      controls
                      preload="none"
                      className="h-full w-full bg-black object-contain"
                    />
                  ) : (
                    <img
                      src={resolveMediaUrl(m.url) || ""}
                      alt={m.alt || m.keterangan || activity.judul}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                {m.keterangan && (
                  <figcaption className="p-3 text-xs text-slate-600">
                    {m.keterangan}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
