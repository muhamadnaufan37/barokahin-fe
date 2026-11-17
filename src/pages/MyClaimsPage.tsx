import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { SelectButton } from "primereact/selectbutton";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useApp } from "../context/AppContext";
import { formatRupiah, formatTimeRange, i18n } from "../i18n/id";

export const MyClaimsPage: React.FC = () => {
  const { currentUser, claims, listings, cancelClaim, setAuthModalOpen } = useApp();
  const [filter, setFilter] = useState<"active" | "done">("active");
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("Berhalangan hadir");

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
        <i className="pi pi-lock text-3xl text-teal-600" aria-hidden="true" />
        <h1 className="text-lg font-bold text-slate-900">Masuk untuk Melihat Klaim</h1>
        <p className="text-sm text-slate-600">
          Daftar permintaan barang dan kode serah terima tersimpan di akunmu.
        </p>
        <Button label="Masuk Sekarang" onClick={() => setAuthModalOpen(true)} />
      </div>
    );
  }

  const myClaims = claims
    .filter((c) => c.receiverId === currentUser.id)
    .filter((c) =>
      filter === "active"
        ? ["requested", "accepted"].includes(c.status)
        : !["requested", "accepted"].includes(c.status)
    );

  const statusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Tag value="Diterima · Siap Diambil" severity="success" />;
      case "requested":
        return <Tag value="Menunggu Persetujuan" severity="warning" />;
      case "completed":
        return <Tag value="Selesai" severity="info" />;
      case "declined":
        return <Tag value="Ditolak" severity="danger" />;
      case "no_show":
        return <Tag value="No-Show" severity="danger" />;
      default:
        return <Tag value="Dibatalkan" severity="secondary" />;
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Klaim Saya</h1>
          <p className="text-sm text-slate-600">
            Pantau status permintaan, harga terkunci, dan kode serah terima.
          </p>
        </div>
        <SelectButton
          value={filter}
          onChange={(e) => setFilter(e.value || "active")}
          options={[
            { label: "Aktif", value: "active" },
            { label: "Riwayat", value: "done" },
          ]}
        />
      </div>

      {myClaims.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
          <p className="font-bold text-slate-800">Belum ada klaim di tab ini</p>
          <p className="text-sm text-slate-600">
            Jelajahi Radar Barokah untuk menemukan barang atau makanan di sekitarmu.
          </p>
          <Link to="/">
            <Button label="Buka Radar Barokah" size="small" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {myClaims.map((claim) => {
            const listing = listings.find((l) => l.id === claim.listingId);
            if (!listing) return null;

            return (
              <div
                key={claim.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover bg-slate-100"
                    />
                    <div className="min-w-0">
                      <Link
                        to={`/barokah/${listing.id}`}
                        className="font-bold text-slate-900 hover:text-teal-700 truncate block"
                      >
                        {listing.title}
                      </Link>
                      <p className="text-xs text-slate-500">
                        Jumlah: {claim.quantity} ·{" "}
                        {claim.lockedPriceRupiah !== null
                          ? `${formatRupiah(claim.lockedPriceRupiah)} (${i18n.price.lockedPriceNote})`
                          : "Gratis"}
                      </p>
                    </div>
                  </div>
                  {statusBadge(claim.status)}
                </div>

                {claim.status === "accepted" && (
                  <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-teal-950 space-y-1">
                    <p>
                      <strong>Titik Ambil:</strong> {listing.exactAddress} ({listing.landmark})
                    </p>
                    <p>
                      <strong>Jendela Ambil:</strong>{" "}
                      {formatTimeRange(listing.pickupStart, listing.pickupEnd, listing.timezone)}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Link to={`/chat/${claim.id}`}>
                    <Button label="Chat" icon="pi pi-comments" size="small" outlined />
                  </Link>
                  {claim.status === "accepted" && (
                    <Link to={`/serah-terima/${claim.id}`}>
                      <Button label="Tunjukkan Kode Serah Terima" icon="pi pi-qrcode" size="small" />
                    </Link>
                  )}
                  {["requested", "accepted"].includes(claim.status) && (
                    <Button
                      label="Batalkan"
                      severity="danger"
                      text
                      size="small"
                      onClick={() => setCancelTargetId(claim.id)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        header="Batalkan Klaim"
        visible={Boolean(cancelTargetId)}
        onHide={() => setCancelTargetId(null)}
        className="w-[95vw] max-w-sm"
      >
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">Alasan Pembatalan</label>
          <InputText
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full"
          />
          <div className="flex justify-end gap-2">
            <Button label="Tutup" text onClick={() => setCancelTargetId(null)} />
            <Button
              label="Konfirmasi Batal"
              severity="danger"
              onClick={() => {
                if (cancelTargetId) cancelClaim(cancelTargetId, cancelReason);
                setCancelTargetId(null);
              }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
