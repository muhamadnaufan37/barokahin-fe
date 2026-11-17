import React from "react";
import { PublicSettings } from "../types";

interface TrustPaymentBannerProps {
  settings: PublicSettings | null;
  compact?: boolean;
}

export const TrustPaymentBanner: React.FC<TrustPaymentBannerProps> = ({
  settings,
  compact = false,
}) => {
  if (!settings) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-slate-800">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <i className="pi pi-shield text-base" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-semibold text-amber-950">
            Peringatan Keamanan: Bayar hanya ke rekening resmi Barokahiin
          </p>
          <p className="text-xs leading-relaxed text-amber-900/90">
            Admin tidak pernah meminta transfer ke rekening pribadi. Pastikan
            tujuan transfer sesuai data resmi di bawah ini:
          </p>

          <div className="mt-2 rounded-xl border border-amber-200/80 bg-white px-3.5 py-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                <strong className="text-slate-700">Bank:</strong>{" "}
                {settings.rekening_resmi_bank || "-"}
              </span>
              <span>
                <strong className="text-slate-700">No. Rekening:</strong>{" "}
                <span className="font-mono font-semibold text-slate-900">
                  {settings.rekening_resmi_nomor || "-"}
                </span>
              </span>
              <span>
                <strong className="text-slate-700">a.n.:</strong>{" "}
                {settings.rekening_resmi_atas_nama || "-"}
              </span>
            </div>

            {!compact && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-2 text-slate-600">
                <span>
                  <i className="pi pi-clock mr-1 text-[11px]" aria-hidden="true" />
                  Batas bayar setelah konfirmasi:{" "}
                  <strong>{settings.batas_bayar_jam} jam</strong>
                </span>
                {settings.lokasi_pengambilan && (
                  <span>
                    <i
                      className="pi pi-map-marker mr-1 text-[11px]"
                      aria-hidden="true"
                    />
                    Pengambilan: <strong>{settings.lokasi_pengambilan}</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
