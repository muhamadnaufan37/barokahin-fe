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
    <div className="rounded-kartu-besar border border-kunyit bg-kunyit-muda p-4 text-tinta">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-kartu bg-kunyit text-tinta">
          <i className="pi pi-shield text-base" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-semibold text-kunyit-tua">
            Peringatan keamanan: bayar hanya ke rekening resmi Barokahinn
          </p>
          <p className="text-xs leading-relaxed text-tinta">
            Admin tidak pernah meminta transfer ke rekening pribadi. Pastikan
            tujuan transfer sesuai data resmi di bawah ini:
          </p>

          <div className="mt-2 rounded-kartu border border-garis bg-putih px-3.5 py-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                <strong className="text-muted">Bank:</strong>{" "}
                <strong className="text-tinta">
                  {settings.rekening_resmi_bank || "-"}
                </strong>
              </span>
              <span>
                <strong className="text-muted">No. Rekening:</strong>{" "}
                <span className="tabular-nums font-mono font-semibold text-nila">
                  {settings.rekening_resmi_nomor || "-"}
                </span>
              </span>
              <span>
                <strong className="text-muted">a.n.:</strong>{" "}
                {settings.rekening_resmi_atas_nama || "-"}
              </span>
            </div>

            {!compact && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-garis pt-2 text-muted">
                <span>
                  <i className="pi pi-clock mr-1 text-[11px]" aria-hidden="true" />
                  Batas bayar setelah konfirmasi:{" "}
                  <strong className="text-tinta">
                    {settings.batas_bayar_jam} jam
                  </strong>
                </span>
                {settings.lokasi_pengambilan && (
                  <span>
                    <i
                      className="pi pi-map-marker mr-1 text-[11px]"
                      aria-hidden="true"
                    />
                    Pengambilan:{" "}
                    <strong className="text-tinta">
                      {settings.lokasi_pengambilan}
                    </strong>
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
