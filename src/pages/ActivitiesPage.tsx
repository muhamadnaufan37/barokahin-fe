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

export const ActivitiesPage: React.FC = () => {
  const { impact } = useStorefront();
  const [activities, setActivities] = useState<PublicActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Kegiatan & Transparansi Dana — Barokahiin";
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
        <h1 className="font-display text-2xl font-bold text-tinta">
          Kegiatan & transparansi dana
        </h1>
        <p className="mt-1 text-sm text-muted">
          Setiap penjualan barang donasi tercatat dan disalurkan untuk
          kegiatan sosial/keagamaan secara terbuka.
        </p>
      </div>

      {/* Ringkasan Dampak */}
      {impact && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-kartu border border-teh bg-teh-muda p-4">
            <p className="text-xs font-medium text-teh-tua">
              Total dana terkumpul
            </p>
            <p className="font-display tabular-nums mt-1 text-lg font-bold text-teh-tua sm:text-xl">
              {formatRupiah(impact.total_dana_kebaikan_idr)}
            </p>
          </div>
          <div className="rounded-kartu border border-garis bg-putih p-4">
            <p className="text-xs font-medium text-muted">Barang terjual</p>
            <p className="font-display tabular-nums mt-1 text-lg font-bold text-nila sm:text-xl">
              {impact.total_barang_terjual}
            </p>
          </div>
          <div className="rounded-kartu border border-garis bg-putih p-4">
            <p className="text-xs font-medium text-muted">Barang tersedia</p>
            <p className="font-display tabular-nums mt-1 text-lg font-bold text-tinta sm:text-xl">
              {impact.total_barang_tersedia}
            </p>
          </div>
          <div className="rounded-kartu border border-garis bg-putih p-4">
            <p className="text-xs font-medium text-muted">Program terdanai</p>
            <p className="font-display tabular-nums mt-1 text-lg font-bold text-tinta sm:text-xl">
              {impact.total_program_terdanai}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="13rem" borderRadius="12px" />
          ))}
        </div>
      ) : error ? (
        <Message severity="error" text={error} className="w-full justify-start" />
      ) : activities.length === 0 ? (
        <div className="rounded-kartu border border-garis bg-putih p-8 text-center">
          <p className="text-sm font-semibold text-tinta">
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
                className="flex flex-col justify-between rounded-kartu border border-garis bg-putih p-6 transition-colors hover:border-nila"
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

                    <span className="text-xs text-muted">
                      {act.periode || formatDateId(act.diterbitkan_pada)}
                    </span>
                  </div>

                  <h2 className="font-display text-lg font-bold text-tinta">
                    {act.judul}
                  </h2>
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted">
                    {act.deskripsi}
                  </p>
                </div>

                <div className="mt-5 space-y-2 border-t border-garis pt-4">
                  <div className="flex items-baseline justify-between text-xs">
                    <span>
                      Terkumpul:{" "}
                      <strong className="tabular-nums text-sm text-teh-tua">
                        {formatRupiah(act.dana_terkumpul_rupiah)}
                      </strong>
                    </span>
                    <span className="tabular-nums text-muted">
                      Target: {formatRupiah(act.target_dana)} ({pct}%)
                    </span>
                  </div>

                  <ProgressBar value={pct} showValue={false} className="h-2.5" />

                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="tabular-nums">
                      Total digunakan:{" "}
                      <strong className="text-tinta">
                        {formatRupiah(act.total_penggunaan_rupiah ?? 0)}
                      </strong>
                    </span>
                    <span className="font-semibold text-nila">
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
