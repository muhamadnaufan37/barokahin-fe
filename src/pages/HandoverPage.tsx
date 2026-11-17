import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { useApp } from "../context/AppContext";
import { formatRupiah, i18n } from "../i18n/id";

const THANK_YOU_PRESETS = [
  "Terima kasih banyak, barangnya sangat bermanfaat!",
  "Alhamdulillah, serah terima lancar. Semoga berkah selalu.",
  "Makanannya masih hangat dan enak, terima kasih sudah berbagi.",
];

export const HandoverPage: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const { currentUser, claims, listings, confirmHandover, notify } = useApp();

  const claim = claims.find((c) => c.id === claimId);
  const listing = claim ? listings.find((l) => l.id === claim.listingId) : undefined;

  const [codeInput, setCodeInput] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [selectedThankYou, setSelectedThankYou] = useState(THANK_YOU_PRESETS[0]);

  if (!claim || !listing) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
        <p className="font-bold text-slate-800">Data serah terima tidak ditemukan</p>
        <Button label="Kembali" size="small" onClick={() => navigate(-1)} />
      </div>
    );
  }

  const isGiver = currentUser?.id === listing.giverId;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const res = confirmHandover(claim.id, codeInput, paymentConfirmed, selectedThankYou);
    if (!res.ok) {
      notify("error", "Gagal konfirmasi", res.error);
    }
  };

  if (claim.status === "completed") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-teal-200 bg-white p-6 text-center shadow-sm space-y-4">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-700">
          <i className="pi pi-check text-2xl" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-bold text-slate-900">Serah Terima Selesai!</h1>
        <p className="text-sm text-slate-600">
          Barang <strong>{listing.title}</strong> telah berpindah tangan dengan tertib.
        </p>
        {claim.thankYouNote && (
          <div className="rounded-xl bg-teal-50 p-3 text-xs text-teal-900 italic">
            "{claim.thankYouNote}"
          </div>
        )}
        <div className="flex justify-center gap-2 pt-2">
          <Link to="/">
            <Button label="Kembali ke Radar" size="small" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Button
        label="Kembali"
        icon="pi pi-arrow-left"
        text
        size="small"
        onClick={() => navigate(-1)}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Serah Terima Berkode
          </span>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">{listing.title}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Jumlah: {claim.quantity} ·{" "}
            {claim.lockedPriceRupiah !== null
              ? `Total Bayar di Tempat: ${formatRupiah(claim.lockedPriceRupiah * claim.quantity)}`
              : "Gratis"}
          </p>
        </div>

        {listing.priceType === "berbayar" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            <strong>Pengingat:</strong> {i18n.price.payOnSiteNotice}
          </div>
        )}

        {!isGiver ? (
          /* Receiver view: show 6-digit code & QR */
          <div className="space-y-4 text-center border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-700">
              Tunjukkan kode 6 digit ini kepada <strong>Pemberi</strong> setelah kamu memeriksa
              barang:
            </p>
            <div className="mx-auto w-fit rounded-2xl border-2 border-dashed border-teal-500 bg-teal-50 px-8 py-4">
              <p className="text-3xl font-extrabold tracking-[0.35em] text-teal-800">
                {claim.handoverCode}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Jika kamera/jaringan bermasalah, Pemberi cukup mengetik 6 digit di atas secara manual.
            </p>
          </div>
        ) : (
          /* Giver view: input 6-digit code + payment confirmation */
          <form onSubmit={handleConfirm} className="space-y-4 border-t border-slate-100 pt-4">
            <div>
              <label htmlFor="handover-code" className="block text-xs font-semibold text-slate-700 mb-1">
                Masukkan Kode 6 Digit dari Penerima
              </label>
              <InputText
                id="handover-code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                maxLength={6}
                placeholder="Contoh: 482915"
                className="w-full text-center text-lg font-bold tracking-widest"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                (Demo hint: kode untuk klaim ini adalah <strong>{claim.handoverCode}</strong>)
              </p>
            </div>

            {listing.priceType === "berbayar" && (
              <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 cursor-pointer">
                <Checkbox
                  checked={paymentConfirmed}
                  onChange={(e) => setPaymentConfirmed(Boolean(e.checked))}
                />
                <span>
                  Saya mengonfirmasi <strong>pembayaran langsung sudah diterima</strong> sebesar{" "}
                  {formatRupiah((claim.lockedPriceRupiah || 0) * claim.quantity)}.
                </span>
              </label>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Ucapan (Opsional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {THANK_YOU_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSelectedThankYou(preset)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] text-left transition ${
                      selectedThankYou === preset
                        ? "border-teal-600 bg-teal-50 text-teal-800 font-semibold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              label="Konfirmasi Serah Terima Selesai"
              icon="pi pi-check-circle"
              className="w-full touch-target"
            />
          </form>
        )}
      </div>
    </div>
  );
};
