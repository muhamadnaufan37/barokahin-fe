import React from "react";
import { PublicSettings } from "../types";

interface TrustPaymentBannerProps {
  settings?: PublicSettings | null;
  compact?: boolean;
}

export const TrustPaymentBanner: React.FC<TrustPaymentBannerProps> = () => {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-slate-800">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <i className="pi pi-shield text-base" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-semibold text-amber-950">
            Pembayaran melalui instruksi checkout resmi
          </p>
          <p className="text-xs leading-relaxed text-amber-900/90">
            Pilih QRIS, virtual account, atau e-wallet setelah pesanan
            dikonfirmasi. Jangan melakukan transfer di luar instruksi
            pembayaran yang diterbitkan untuk pesananmu.
          </p>

          <div className="mt-2 rounded-xl border border-amber-200/80 bg-white px-3.5 py-2.5 text-xs text-slate-700">
            <span>
              Barang baru ditahan selama 30 menit setelah pesanan dikonfirmasi.
              Instruksi pembayaran tersedia di halaman pesanan.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
