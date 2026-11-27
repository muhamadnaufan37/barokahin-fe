import React, { useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Button } from "primereact/button";
import { Skeleton } from "primereact/skeleton";
import { useBuyer } from "../context/BuyerContext";
import { ApiClientError, publicApi } from "../services/publicApi";
import { BuyerOrder, BuyerOrderPickup, ImpactReceipt } from "../types";
import {
  formatDateId,
  formatRupiah,
  getOrderStatusMeta,
} from "../utils/format";
import { pollOrderUntilPaid } from "../utils/midtrans";

function extractOrderCode(
  routeCode: string | undefined,
  searchParams: URLSearchParams
): string {
  if (routeCode) return routeCode;
  const kode = searchParams.get("kode");
  if (kode) return kode;
  const orderId = searchParams.get("order_id") || "";
  // Midtrans gateway_ref sering berformat ORD-YYYYMMDD-XXXXXX-SUFFIX
  const match = orderId.match(/^(ORD-\d{8}-[A-Z0-9]+)/i);
  return match ? match[1] : orderId;
}

export const PaymentSuccessPage: React.FC = () => {
  const { code: routeCode } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { token } = useBuyer();

  const orderCode = useMemo(
    () => extractOrderCode(routeCode, searchParams),
    [routeCode, searchParams]
  );

  const initialOrder =
    (location.state as { order?: BuyerOrder } | null)?.order || null;

  const [order, setOrder] = useState<BuyerOrder | null>(initialOrder);
  const [receipt, setReceipt] = useState<ImpactReceipt | null>(null);
  const [pickupInfo, setPickupInfo] = useState<BuyerOrderPickup | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadSuccessData = async () => {
    if (!token || !orderCode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let current = await publicApi.getBuyerOrder(token, orderCode);
      setOrder(current);

      if (current.status.toLowerCase() === "menunggu_bayar") {
        setVerifying(true);
        const pollRes = await pollOrderUntilPaid(token, orderCode, 8);
        setVerifying(false);
        if (pollRes.order) {
          current = pollRes.order;
          setOrder(current);
        }
      }

      const paidStatuses = [
        "dibayar",
        "disiapkan",
        "dikirim",
        "siap_diambil",
        "siap_ambil",
        "diterima",
        "selesai",
      ];
      if (paidStatuses.includes(current.status.toLowerCase())) {
        const [receiptRes, pickupRes] = await Promise.allSettled([
          publicApi.getBuyerImpactReceipt(token, orderCode),
          current.serah === "ambil"
            ? publicApi.getBuyerOrderPickup(token, orderCode)
            : Promise.resolve(null),
        ]);
        if (receiptRes.status === "fulfilled") {
          setReceipt(receiptRes.value);
        }
        if (pickupRes.status === "fulfilled" && pickupRes.value) {
          setPickupInfo(pickupRes.value);
        }
      }
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 401) {
        setError("Sesi login berakhir. Silakan masuk kembali.");
      } else {
        setError(
          cause instanceof Error
            ? cause.message
            : "Data pembayaran belum bisa dimuat."
        );
      }
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  useEffect(() => {
    document.title = orderCode
      ? `Pembayaran Berhasil ${orderCode} — Barokahinn`
      : "Pembayaran Berhasil — Barokahinn";
    void loadSuccessData();
  }, [token, orderCode]);

  if (!token) {
    const nextUrl = `${location.pathname}${location.search}`;
    return (
      <Navigate to={`/masuk?next=${encodeURIComponent(nextUrl)}`} replace />
    );
  }

  if (!orderCode) {
    return (
      <section className="mx-auto max-w-2xl space-y-4">
        <div className="form-card space-y-3 text-center">
          <h1 className="text-xl font-bold text-tinta">
            Kode pesanan tidak ditemukan
          </h1>
          <p className="text-sm text-muted">
            Buka daftar pesanan untuk melihat status pembayaran terbarumu.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link className="btn-cta text-xs" to="/pesanan">
              Lihat pesanan saya
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const isPaid =
    !!order &&
    [
      "dibayar",
      "disiapkan",
      "dikirim",
      "siap_diambil",
      "siap_ambil",
      "diterima",
      "selesai",
    ].includes(order.status.toLowerCase());
  const statusMeta = getOrderStatusMeta(order?.status);
  const payment = order?.payments?.[0];
  const pickupCode = pickupInfo?.pickup_code || order?.pickup_code;

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      {error && (
        <p className="form-alert error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton height="12rem" borderRadius="12px" />
          <Skeleton height="10rem" borderRadius="12px" />
        </div>
      ) : (
        <>
          {/* Hero Konfirmasi Pembayaran */}
          <div
            className={`form-card space-y-4 text-center ${
              isPaid ? "border-teh bg-putih" : "border-kunyit bg-putih"
            }`}
          >
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                isPaid
                  ? "bg-teh-muda text-teh-tua"
                  : "bg-kunyit-muda text-kunyit-tua"
              }`}
            >
              <i
                className={`pi ${
                  verifying
                    ? "pi-spin pi-spinner"
                    : isPaid
                      ? "pi-check-circle"
                      : "pi-clock"
                } text-3xl`}
                aria-hidden="true"
              />
            </div>

            <div className="space-y-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-pil border px-3 py-0.5 text-xs font-semibold ${statusMeta.badgeClass}`}
              >
                <i className={`${statusMeta.icon} text-[11px]`} aria-hidden="true" />
                <span>{statusMeta.label}</span>
              </span>
              <h1 className="pt-1 font-display text-2xl font-bold text-tinta">
                {verifying
                  ? "Memverifikasi Pembayaran…"
                  : isPaid
                    ? "Pembayaran Berhasil!"
                    : "Menunggu Konfirmasi Pembayaran"}
              </h1>
              <p className="text-sm text-muted">
                {isPaid
                  ? "Terima kasih! Dana pesananmu telah terverifikasi dan pesanan sedang diteruskan ke toko koordinator."
                  : "Pembayaran sedang disinkronkan dengan Midtrans. Jika baru saja membayar, tunggu sebentar atau klik periksa ulang."}
              </p>
            </div>

            <div className="mx-auto grid max-w-lg gap-2 rounded-kartu border border-garis bg-kertas p-4 text-left text-xs sm:grid-cols-2">
              <div>
                <span className="text-muted">Kode pesanan</span>
                <p className="font-mono text-sm font-bold text-tinta">
                  {order?.kode || orderCode}
                </p>
              </div>
              {typeof order?.total_idr === "number" && (
                <div>
                  <span className="text-muted">Total dibayar</span>
                  <p className="tabular-nums text-sm font-bold text-teh-tua">
                    {formatRupiah(order.total_idr)}
                  </p>
                </div>
              )}
              {payment?.metode && (
                <div>
                  <span className="text-muted">Metode pembayaran</span>
                  <p className="font-semibold uppercase text-tinta">
                    {payment.metode}
                    {payment.gateway ? ` (${payment.gateway})` : ""}
                  </p>
                </div>
              )}
              {payment?.gateway_ref && (
                <div>
                  <span className="text-muted">Referensi transaksi</span>
                  <p className="truncate font-mono font-semibold text-tinta">
                    {payment.gateway_ref}
                  </p>
                </div>
              )}
              {order?.dibayar_pada && (
                <div className="sm:col-span-2">
                  <span className="text-muted">Waktu konfirmasi: </span>
                  <strong className="text-tinta">
                    {new Date(order.dibayar_pada).toLocaleString("id-ID")}
                  </strong>
                </div>
              )}
            </div>

            {!isPaid && (
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  label="Cek Status Pembayaran"
                  icon="pi pi-refresh"
                  outlined
                  size="small"
                  onClick={() => void loadSuccessData()}
                />
              </div>
            )}
          </div>

          {/* Info Pengambilan (jika serah = ambil) */}
          {order?.serah === "ambil" && (pickupInfo || pickupCode) && (
            <div className="form-card space-y-3 border-teh bg-teh-muda">
              <h2 className="font-display text-base font-bold text-teh-tua">
                Informasi Titik Ambil
              </h2>
              {pickupCode && (
                <div className="rounded-kartu border border-telang bg-putih p-3">
                  <p className="text-xs font-semibold text-muted">
                    Kode ambil (tunjukkan ke Koordinator saat serah terima)
                  </p>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-2xl font-bold tracking-widest text-telang-tua">
                      {pickupCode}
                    </span>
                    <Button
                      type="button"
                      label={copiedCode ? "Tersalin" : "Salin kode"}
                      icon={copiedCode ? "pi pi-check" : "pi pi-copy"}
                      outlined
                      size="small"
                      onClick={() => {
                        void navigator.clipboard?.writeText(pickupCode);
                        setCopiedCode(true);
                      }}
                    />
                  </div>
                </div>
              )}
              {pickupInfo?.alamat_lengkap && (
                <p className="text-sm font-medium text-tinta">
                  {pickupInfo.alamat_lengkap}
                </p>
              )}
              {pickupInfo?.jam_operasional && (
                <p className="text-xs text-muted">
                  Jam ambil: {pickupInfo.jam_operasional}
                </p>
              )}
            </div>
          )}

          {/* Ringkasan Produk */}
          {order?.items && order.items.length > 0 && (
            <div className="form-card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-tinta">
                  Barang dalam pesanan
                </h2>
                {order.store?.nama && (
                  <span className="text-xs font-medium text-muted">
                    {order.store.nama}
                  </span>
                )}
              </div>
              <ul className="divide-y divide-garis/70">
                {order.items.map((item, idx) => (
                  <li
                    key={`${order.uuid}-paid-item-${idx}`}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {item.cover_url ? (
                        <img
                          src={item.cover_url}
                          alt={item.judul}
                          className="h-12 w-12 shrink-0 rounded-kontrol border border-garis object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-kontrol border border-garis bg-kertas text-muted">
                          <i className="pi pi-box text-sm" aria-hidden="true" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-tinta">
                          {item.judul}
                        </p>
                        {item.jalur_snapshot && (
                          <span
                            className={`mt-0.5 inline-block rounded-pil px-2 py-0.5 text-[10px] font-semibold ${
                              item.jalur_snapshot === "charity"
                                ? "bg-teh-muda text-teh-tua"
                                : "bg-nila-muda text-nila"
                            }`}
                          >
                            {item.jalur_snapshot === "charity"
                              ? "Program Charity"
                              : "Reguler"}
                          </span>
                        )}
                      </div>
                    </div>
                    <strong className="shrink-0 tabular-nums text-sm text-tinta">
                      {formatRupiah(item.price_idr)}
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Kuitansi Kebaikan */}
          {receipt?.ringkasan_kebaikan && (
            <div className="form-card space-y-4">
              <h2 className="text-lg font-bold text-tinta">
                Kuitansi Kebaikan
              </h2>
              {receipt.ringkasan_kebaikan.catatan_transparansi && (
                <p className="rounded-kartu bg-teh-muda px-3.5 py-2.5 text-sm font-medium text-teh-tua">
                  {receipt.ringkasan_kebaikan.catatan_transparansi}
                </p>
              )}
              {typeof receipt.ringkasan_kebaikan.total_dana_kebaikan_idr ===
                "number" && (
                <div className="flex items-center justify-between rounded-kartu border border-teh bg-putih px-3.5 py-2.5 text-sm">
                  <span className="font-medium text-muted">
                    Total dana kebaikan tersalurkan
                  </span>
                  <strong className="tabular-nums text-base font-bold text-teh-tua">
                    {formatRupiah(
                      receipt.ringkasan_kebaikan.total_dana_kebaikan_idr
                    )}
                  </strong>
                </div>
              )}
              {!!receipt.ringkasan_kebaikan.alokasi_dana?.length && (
                <ul className="space-y-2">
                  {receipt.ringkasan_kebaikan.alokasi_dana.map((pos, idx) => (
                    <li
                      key={pos.kode || `${pos.label}-${idx}`}
                      className="space-y-1 rounded-kartu border border-garis bg-kertas p-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-tinta">
                          {pos.label}
                        </span>
                        <span className="tabular-nums font-bold text-nila">
                          {formatRupiah(pos.nominal_idr)}
                          {typeof pos.persentase === "number"
                            ? ` (${pos.persentase}%)`
                            : ""}
                        </span>
                      </div>
                      {typeof pos.persentase === "number" && (
                        <div className="h-2 w-full overflow-hidden rounded-pil bg-garis">
                          <div
                            className="h-full rounded-pil bg-teh"
                            style={{
                              width: `${Math.min(100, Math.max(0, pos.persentase))}%`,
                            }}
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {!!receipt.ringkasan_kebaikan.program_tujuan?.length && (
                <ul className="space-y-1.5 text-sm">
                  {receipt.ringkasan_kebaikan.program_tujuan.map(
                    (prog, idx) => (
                      <li
                        key={prog.slug || `${prog.judul}-${idx}`}
                        className="flex items-center justify-between gap-3 rounded-kontrol border border-garis bg-putih px-3 py-2"
                      >
                        {prog.slug ? (
                          <Link
                            to={`/kegiatan/${encodeURIComponent(prog.slug)}`}
                            className="font-semibold text-nila hover:underline"
                          >
                            {prog.judul}
                          </Link>
                        ) : (
                          <span className="font-semibold text-tinta">
                            {prog.judul}
                          </span>
                        )}
                        <strong className="tabular-nums text-teh-tua">
                          {formatRupiah(prog.nominal_idr)}
                        </strong>
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Tombol Navigasi */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Link
                className="secondary-action text-xs"
                to={`/pesanan/${encodeURIComponent(order?.kode || orderCode)}`}
              >
                Lihat detail pesanan
              </Link>
              <Link className="secondary-action text-xs" to="/pesanan">
                Semua pesanan
              </Link>
            </div>
            <Link className="btn-cta text-xs" to="/katalog">
              <span>Belanja lagi</span>
              <i className="pi pi-arrow-right text-[11px]" aria-hidden="true" />
            </Link>
          </div>
        </>
      )}
    </section>
  );
};
