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
        document.title = `${data.judul} — Transparansi Dana Barokahinn`;
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
        <Skeleton height="12rem" borderRadius="12px" />
        <Skeleton height="16rem" borderRadius="12px" />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-kartu-besar border border-garis bg-putih p-8 text-center">
        <h1 className="font-display text-lg font-bold text-tinta">
          Kegiatan tidak ditemukan
        </h1>
        {error && <Message severity="error" text={error} className="w-full" />}
        <Link
          to="/kegiatan"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-pil bg-nila px-5 py-2.5 text-sm font-semibold text-putih"
        >
          Kembali ke daftar kegiatan
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
  const totalPenggunaan = activity.total_penggunaan_rupiah ?? 0;
  const sisaDana = Math.max(0, activity.dana_terkumpul_rupiah - totalPenggunaan);

  return (
    <div className="space-y-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-muted"
      >
        <Link to="/" className="hover:text-nila">
          Beranda
        </Link>
        <span>/</span>
        <Link to="/kegiatan" className="hover:text-nila">
          Kegiatan & Dana
        </Link>
        <span>/</span>
        <span className="font-medium text-tinta">{activity.judul}</span>
      </nav>

      {/* Header & Progress */}
      <section className="rounded-kartu-besar border border-garis bg-putih p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <Tag
            value={activity.status === "aktif" ? "Kegiatan aktif" : "Selesai"}
            severity={activity.status === "aktif" ? "success" : "secondary"}
            rounded
            className="px-3 py-1 text-xs"
          />
          {activity.periode && (
            <span className="text-xs font-medium text-muted">
              Periode: {activity.periode}
            </span>
          )}
        </div>

        <h1 className="font-display mt-3 text-2xl font-bold text-tinta sm:text-3xl">
          {activity.judul}
        </h1>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-tinta">
          {activity.deskripsi}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-kartu bg-teh-muda p-4">
            <p className="text-xs font-medium text-teh-tua">Dana terkumpul</p>
            <p className="font-display tabular-nums mt-1 text-lg font-bold text-teh-tua">
              {formatRupiah(activity.dana_terkumpul_rupiah)}
            </p>
          </div>
          <div className="rounded-kartu bg-kertas p-4">
            <p className="text-xs font-medium text-muted">Target dana</p>
            <p className="font-display tabular-nums mt-1 text-lg font-bold text-tinta">
              {formatRupiah(activity.target_dana)}
            </p>
          </div>
          <div className="rounded-kartu bg-kertas p-4">
            <p className="text-xs font-medium text-muted">Dana digunakan</p>
            <p className="font-display tabular-nums mt-1 text-lg font-bold text-nila">
              {formatRupiah(totalPenggunaan)}
            </p>
          </div>
          <div className="rounded-kartu bg-kertas p-4">
            <p className="text-xs font-medium text-muted">Saldo tersisa</p>
            <p className="font-display tabular-nums mt-1 text-lg font-bold text-tinta">
              {formatRupiah(sisaDana)}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-muted">
            <span>Progres pencapaian target</span>
            <span className="tabular-nums font-semibold text-teh-tua">
              {pct}% ({formatRupiah(activity.dana_terkumpul_rupiah)} /{" "}
              {formatRupiah(activity.target_dana)})
            </span>
          </div>
          <ProgressBar value={pct} showValue={false} className="h-3" />
        </div>
      </section>

      {/* Laporan Penggunaan Dana */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-tinta sm:text-xl">
          Laporan penggunaan dana
        </h2>
        <div
          role="region"
          tabIndex={0}
          aria-label="Laporan penggunaan dana"
          className="overflow-x-auto rounded-kartu border border-garis bg-putih"
        >
          <DataTable
            value={activity.laporan_penggunaan}
            dataKey="uuid"
            emptyMessage="Belum ada rincian pengeluaran yang dipublikasikan untuk kegiatan ini."
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
              header="Pos penggunaan"
              body={(row: PublicActivityExpense) => (
                <span className="font-semibold text-tinta">{row.pos}</span>
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
                <span className="tabular-nums font-semibold text-nila">
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
          <h2 className="font-display text-lg font-bold text-tinta sm:text-xl">
            Dokumentasi kegiatan
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activity.media.map((m) => (
              <figure
                key={m.uuid}
                className="overflow-hidden rounded-kartu border border-garis bg-putih"
              >
                <div className="aspect-[4/3] w-full bg-kertas">
                  {m.tipe === "video" ? (
                    <video
                      src={resolveMediaUrl(m.url) || undefined}
                      controls
                      preload="none"
                      className="h-full w-full bg-tinta object-contain"
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
                  <figcaption className="p-3 text-xs text-muted">
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
