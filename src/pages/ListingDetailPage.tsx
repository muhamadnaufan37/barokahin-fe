import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Checkbox } from "primereact/checkbox";
import { CATEGORIES, REGIONS } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { formatDateTimeID, formatRupiah, formatTimeRange, i18n } from "../i18n/id";
import { CountdownTimer } from "../components/CountdownTimer";
import { ReportDialog } from "../components/ReportDialog";

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { listings, claims, currentUser, requestClaim, setAuthModalOpen, notify } = useApp();

  const listing = listings.find((l) => l.id === id);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [ackFood, setAckFood] = useState(false);
  const [ackPaid, setAckPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!listing) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
        <h1 className="text-lg font-bold text-slate-800">Barang tidak ditemukan</h1>
        <p className="text-sm text-slate-600">
          Barang mungkin sudah dihapus atau tautan tidak valid.
        </p>
        <Link to="/">
          <Button label="Kembali ke Radar" size="small" />
        </Link>
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.id === listing.categoryId);
  const region = REGIONS.find((r) => r.id === listing.regionId);
  const isOwner = currentUser?.id === listing.giverId;
  const myClaim = currentUser
    ? claims.find(
        (c) =>
          c.listingId === listing.id &&
          c.receiverId === currentUser.id &&
          !["cancelled", "declined"].includes(c.status)
      )
    : undefined;

  const exactLocationUnlocked = isOwner || myClaim?.status === "accepted" || myClaim?.status === "completed";
  const countdownTarget =
    listing.foodAttributes?.consumeBy || listing.foodAttributes?.expiryDate || listing.pickupEnd;

  const handleOpenClaim = () => {
    if (!currentUser || currentUser.trustLevel !== "L1") {
      setAuthModalOpen(true);
      return;
    }
    setClaimModalOpen(true);
  };

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (listing.foodAttributes && !ackFood) {
      notify("warn", "Konfirmasi diperlukan", "Centang peringatan keamanan pangan terlebih dahulu.");
      return;
    }
    if (listing.priceType === "berbayar" && !ackPaid) {
      notify("warn", "Konfirmasi diperlukan", "Centang pemahaman cara bayar di tempat.");
      return;
    }

    setSubmitting(true);
    const res = requestClaim(listing.id, quantity, message);
    setSubmitting(false);

    if (!res.ok) {
      notify("error", "Tidak dapat mengklaim", res.error);
      return;
    }
    setClaimModalOpen(false);
    navigate("/klaim");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <Button
          label="Kembali"
          icon="pi pi-arrow-left"
          text
          size="small"
          onClick={() => navigate(-1)}
        />
        <Button
          label="Laporkan"
          icon="pi pi-flag"
          severity="danger"
          text
          size="small"
          onClick={() => setReportModalOpen(true)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Photo + Food Safety */}
        <div className="md:col-span-5 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>

          {listing.foodAttributes && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <i className="pi pi-exclamation-triangle text-amber-600" aria-hidden="true" />
                Keamanan Pangan
              </p>
              <p>{i18n.food.safetyWarning}</p>
            </div>
          )}
        </div>

        {/* Right: Info & Actions */}
        <div className="md:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {listing.priceType === "gratis" ? (
                <span className="rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white">
                  GRATIS
                </span>
              ) : (
                <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                  {formatRupiah(listing.priceRupiah)}
                </span>
              )}

              {listing.isUrgent && <CountdownTimer targetIso={countdownTarget} />}

              <Tag
                value={
                  listing.status === "active"
                    ? `Tersedia (${listing.stockAvailable})`
                    : listing.status === "reserved"
                    ? "Sudah Dipesan"
                    : listing.status
                }
                severity={listing.status === "active" ? "success" : "secondary"}
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-teal-700">{category?.name}</p>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {listing.title}
              </h1>
            </div>

            {/* Price & Payment clarity (PRC-01 - PRC-04) */}
            {listing.priceType === "berbayar" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950">
                <strong>Cara Bayar:</strong> {i18n.price.payOnSiteNotice}
              </div>
            ) : (
              <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-900">
                {i18n.price.antiResaleNotice}
              </div>
            )}

            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>

            {/* Food Attributes (LST-04, LST-05, COM-03) */}
            {listing.foodAttributes && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
                <h2 className="font-bold text-slate-800">Informasi Makanan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {listing.foodAttributes.madeAt && (
                    <div>
                      <span className="text-slate-500">Waktu dibuat:</span>{" "}
                      <strong className="text-slate-800">
                        {formatDateTimeID(listing.foodAttributes.madeAt, listing.timezone)}
                      </strong>
                    </div>
                  )}
                  {listing.foodAttributes.consumeBy && (
                    <div>
                      <span className="text-slate-500">Batas konsumsi:</span>{" "}
                      <strong className="text-orange-700">
                        {formatDateTimeID(listing.foodAttributes.consumeBy, listing.timezone)}
                      </strong>
                    </div>
                  )}
                  {listing.foodAttributes.expiryDate && (
                    <div>
                      <span className="text-slate-500">Tanggal kedaluwarsa:</span>{" "}
                      <strong className="text-orange-700">
                        {formatDateTimeID(listing.foodAttributes.expiryDate, listing.timezone)}
                      </strong>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Info Halal:</span>{" "}
                    <strong className="text-emerald-700">
                      {listing.foodAttributes.halalInfo === "halal_self_declared"
                        ? "Halal"
                        : listing.foodAttributes.halalInfo === "non_halal"
                        ? "Non-Halal"
                        : "Tidak disebutkan"}
                    </strong>{" "}
                    <span className="text-[11px] text-slate-500">({i18n.food.halalDisclaimer})</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Bahan / Alergen:</span>{" "}
                  <span className="text-slate-800">
                    {listing.foodAttributes.ingredientsOrAllergens || "-"}
                  </span>
                </div>
              </div>
            )}

            {/* Pickup Window & Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-3">
              <div>
                <span className="text-slate-500 block">Jendela Ambil</span>
                <strong className="text-slate-800">
                  {formatTimeRange(listing.pickupStart, listing.pickupEnd, listing.timezone)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Mode Klaim & Kondisi</span>
                <strong className="text-slate-800">
                  {listing.claimMode === "siapa_cepat" ? "Siapa cepat" : "Pemberi memilih"} ·{" "}
                  {listing.condition}
                </strong>
              </div>
            </div>

            {/* Pickup Location (blurred vs unlocked) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <i className="pi pi-map-marker text-teal-600" aria-hidden="true" />
                  Titik Ambil ({region?.district}, {region?.city})
                </span>
                <span className="text-slate-500">~{listing.distanceKm} km</span>
              </div>
              {exactLocationUnlocked ? (
                <div className="pt-1 text-slate-800 space-y-1">
                  <p className="font-semibold text-teal-800">{listing.exactAddress}</p>
                  <p className="text-slate-600">Patokan: {listing.landmark}</p>
                </div>
              ) : (
                <p className="text-slate-600">{i18n.privacy.blurredLocation}</p>
              )}
            </div>

            {/* Giver short profile (no star ratings!) */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-bold text-sm">
                  {listing.giverName.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{listing.giverName}</p>
                  <p className="text-xs text-slate-500">
                    {listing.giverTrustLevel} Terverifikasi HP · {listing.giverCompletedCount} serah
                    terima selesai
                  </p>
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="pt-2">
              {isOwner ? (
                <Link to="/kelola">
                  <Button
                    label="Kelola Listing & Peminta"
                    icon="pi pi-cog"
                    className="w-full touch-target"
                  />
                </Link>
              ) : myClaim ? (
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-teal-900">
                      Status Klaim Kamu:{" "}
                      {myClaim.status === "accepted"
                        ? "Diterima"
                        : myClaim.status === "requested"
                        ? "Menunggu Persetujuan"
                        : myClaim.status}
                    </span>
                    {myClaim.lockedPriceRupiah !== null && (
                      <span className="text-xs font-bold text-amber-800">
                        Harga terkunci: {formatRupiah(myClaim.lockedPriceRupiah)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/chat/${myClaim.id}`} className="flex-1">
                      <Button
                        label="Buka Chat"
                        icon="pi pi-comments"
                        size="small"
                        outlined
                        className="w-full touch-target"
                      />
                    </Link>
                    {myClaim.status === "accepted" && (
                      <Link to={`/serah-terima/${myClaim.id}`} className="flex-1">
                        <Button
                          label="Kode Serah Terima"
                          icon="pi pi-qrcode"
                          size="small"
                          className="w-full touch-target"
                        />
                      </Link>
                    )}
                  </div>
                </div>
              ) : listing.status === "active" && listing.stockAvailable > 0 ? (
                <Button
                  label={
                    listing.priceType === "gratis"
                      ? "Ajukan Klaim Gratis"
                      : `Ajukan Klaim (${formatRupiah(listing.priceRupiah)} · Bayar di Tempat)`
                  }
                  icon="pi pi-check-circle"
                  className="w-full touch-target"
                  onClick={handleOpenClaim}
                />
              ) : (
                <Button
                  label="Stok Sudah Habis / Ditutup"
                  disabled
                  severity="secondary"
                  className="w-full touch-target"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      <Dialog
        header="Ajukan Permintaan (Klaim)"
        visible={claimModalOpen}
        onHide={() => setClaimModalOpen(false)}
        className="w-[95vw] max-w-md"
        modal
      >
        <form onSubmit={handleSubmitClaim} className="space-y-4">
          <div>
            <label htmlFor="claim-qty" className="block text-xs font-semibold text-slate-700 mb-1">
              Jumlah Diminta (Tersedia: {listing.stockAvailable})
            </label>
            <InputNumber
              inputId="claim-qty"
              value={quantity}
              onValueChange={(e) => setQuantity(e.value || 1)}
              min={1}
              max={listing.stockAvailable}
              showButtons
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="claim-msg" className="block text-xs font-semibold text-slate-700 mb-1">
              Pesan Singkat untuk Pemberi
            </label>
            <InputTextarea
              id="claim-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full"
              placeholder="Contoh: Halo, saya di dekat lokasi dan bisa ambil sore ini."
              required
            />
          </div>

          {listing.foodAttributes && (
            <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 cursor-pointer">
              <Checkbox checked={ackFood} onChange={(e) => setAckFood(Boolean(e.checked))} />
              <span>
                Saya sudah membaca informasi makanan, alergen, dan peringatan keamanan pangan.
              </span>
            </label>
          )}

          {listing.priceType === "berbayar" && (
            <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 cursor-pointer">
              <Checkbox checked={ackPaid} onChange={(e) => setAckPaid(Boolean(e.checked))} />
              <span>
                Saya paham barang ini berbayar{" "}
                <strong>{formatRupiah(listing.priceRupiah)}</strong>, dibayar{" "}
                <strong>langsung saat serah terima</strong> setelah memeriksa barang.
              </span>
            </label>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              label="Batal"
              severity="secondary"
              outlined
              onClick={() => setClaimModalOpen(false)}
            />
            <Button
              type="submit"
              label={
                listing.claimMode === "siapa_cepat" ? "Klaim Sekarang" : "Kirim Permintaan"
              }
              loading={submitting}
              className="touch-target"
            />
          </div>
        </form>
      </Dialog>

      <ReportDialog
        visible={reportModalOpen}
        onHide={() => setReportModalOpen(false)}
        targetType="listing"
        targetId={listing.id}
        targetTitle={listing.title}
      />
    </div>
  );
};
