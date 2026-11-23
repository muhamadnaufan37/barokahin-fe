import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Message } from "primereact/message";
import { ProgressBar } from "primereact/progressbar";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { useStorefront } from "../context/StorefrontContext";
import { publicApi } from "../services/publicApi";
import { PublicActivity } from "../types";
import { formatDateId, formatRupiah } from "../utils/format";
import { setPageMetadata } from "../utils/seo";

export const ActivitiesPage: React.FC = () => {
  const { impact } = useStorefront();
  const [activities, setActivities] = useState<PublicActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageMetadata({
      title: "Kegiatan & Transparansi Dana — Barokahiin",
      description:
        "Lihat kegiatan sosial dan keagamaan yang didanai serta laporan penggunaan dana Barokahiin.",
      path: "/kegiatan",
    });
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await publicApi.getActivities();
        if (active) setActivities(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuat daftar kegiatan."
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
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Kegiatan & Transparansi Dana
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Setiap penjualan barang donasi tercatat dan disalurkan untuk
          kegiatan sosial/keagamaan secara terbuka.
        </p>
      </div>

      {/* Ringkasan Dampak */}
      {impact && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
            <p className="text-xs font-medium text-brand-800">
              Total Dana Terkumpul
            </p>
            <p className="mt-1 text-lg font-bold text-brand-900 sm:text-xl">
              {formatRupiah(impact.total_dana_kebaikan_idr)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">Barang Terjual</p>
            <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              {impact.total_barang_terjual}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">
              Barang Tersedia
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              {impact.total_barang_tersedia}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">
              Kegiatan Terdanai
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              {impact.total_program_terdanai}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="13rem" borderRadius="1rem" />
          ))}
        </div>
      ) : error ? (
        <Message severity="error" text={error} className="w-full justify-start" />
      ) : activities.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            Belum ada kegiatan yang diterbitkan saat ini.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
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
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-500/50 hover:shadow-md"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Tag
                      value={act.status === "aktif" ? "Aktif" : "Selesai"}
                      icon={act.status === "aktif" ? "pi pi-bolt" : "pi pi-check"}
                      severity={act.status === "aktif" ? "success" : "secondary"}
                      rounded
                      className="px-2.5 py-0.5 text-xs"
                    />

                    <span className="text-xs text-slate-500">
                      {act.periode || formatDateId(act.diterbitkan_pada)}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">
                    {act.judul}
                  </h2>
                  {(act.wilayah || act.penerima_manfaat_desc) && (
                    <p className="text-xs font-medium text-slate-500">
                      {[act.wilayah, act.penerima_manfaat_desc]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                    {act.deskripsi}
                  </p>
                </div>

                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex items-baseline justify-between text-xs">
                    <span>
                      Terkumpul:{" "}
                      <strong className="text-sm text-brand-700">
                        {formatRupiah(act.dana_terkumpul_rupiah)}
                      </strong>
                    </span>
                    <span className="text-slate-500">
                      Target: {formatRupiah(act.target_dana)} ({pct}%)
                    </span>
                  </div>

                  <ProgressBar value={pct} showValue={false} className="h-2.5" />

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Total digunakan:{" "}
                      <strong className="text-slate-700">
                        {act.total_penggunaan_rupiah === null
                          ? "Belum dilaporkan"
                          : formatRupiah(act.total_penggunaan_rupiah)}
                      </strong>
                    </span>
                    <span className="font-semibold text-brand-700">
                      Lihat laporan →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
