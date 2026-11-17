import React from "react";
import { Link } from "react-router-dom";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { useApp } from "../context/AppContext";
import { formatRupiah } from "../i18n/id";

export const ManageListingsPage: React.FC = () => {
  const {
    currentUser,
    listings,
    claims,
    acceptClaim,
    declineClaim,
    markNoShow,
    closeListing,
    duplicateListing,
    setAuthModalOpen,
  } = useApp();

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
        <i className="pi pi-lock text-3xl text-teal-600" aria-hidden="true" />
        <h1 className="text-lg font-bold text-slate-900">Masuk untuk Mengelola Listing</h1>
        <Button label="Masuk Sekarang" onClick={() => setAuthModalOpen(true)} />
      </div>
    );
  }

  const myListings = listings.filter((l) => l.giverId === currentUser.id);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Kelola Listing & Peminta</h1>
          <p className="text-sm text-slate-600">
            Terima atau tolak permintaan, konfirmasi serah terima, atau duplikasi listing.
          </p>
        </div>
        <Link to="/bagikan">
          <Button label="Posting Baru" icon="pi pi-plus" size="small" />
        </Link>
      </div>

      {myListings.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
          <p className="font-bold text-slate-800">Kamu belum memasang barang</p>
          <p className="text-sm text-slate-600">
            Punya barang layak pakai atau makanan lebih? Bagikan ke warga sekitar.
          </p>
          <Link to="/bagikan">
            <Button label="Bagikan Barokah Pertama" icon="pi pi-plus" size="small" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myListings.map((listing) => {
            const listingClaims = claims.filter((c) => c.listingId === listing.id);
            return (
              <div
                key={listing.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Tag
                        value={listing.status}
                        severity={listing.status === "active" ? "success" : "secondary"}
                      />
                      <span className="text-xs font-semibold text-slate-600">
                        {listing.priceType === "gratis"
                          ? "Gratis"
                          : formatRupiah(listing.priceRupiah)}
                      </span>
                      <span className="text-xs text-slate-500">
                        · Stok tersisa: {listing.stockAvailable}/{listing.stockTotal}
                      </span>
                    </div>
                    <Link
                      to={`/barokah/${listing.id}`}
                      className="text-base font-bold text-slate-900 hover:text-teal-700 mt-1 block"
                    >
                      {listing.title}
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      label="Duplikat"
                      icon="pi pi-copy"
                      size="small"
                      outlined
                      onClick={() => duplicateListing(listing.id)}
                    />
                    {listing.status === "active" && (
                      <Button
                        label="Tutup"
                        icon="pi pi-times"
                        size="small"
                        severity="danger"
                        outlined
                        onClick={() => closeListing(listing.id)}
                      />
                    )}
                  </div>
                </div>

                {/* Incoming Claims */}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Daftar Peminta ({listingClaims.length})
                  </h2>

                  {listingClaims.length === 0 ? (
                    <p className="text-xs text-slate-500">Belum ada permintaan masuk.</p>
                  ) : (
                    <div className="space-y-2">
                      {listingClaims.map((claim) => (
                        <div
                          key={claim.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-800">
                              {claim.receiverName} · Jumlah: {claim.quantity}{" "}
                              <span className="font-normal text-slate-500">({claim.status})</span>
                            </p>
                            <p className="text-slate-600 mt-0.5">"{claim.message}"</p>
                          </div>

                          <div className="flex flex-wrap gap-2 shrink-0">
                            <Link to={`/chat/${claim.id}`}>
                              <Button label="Chat" icon="pi pi-comments" size="small" outlined />
                            </Link>
                            {claim.status === "requested" && (
                              <>
                                <Button
                                  label="Terima"
                                  icon="pi pi-check"
                                  size="small"
                                  onClick={() => acceptClaim(claim.id)}
                                />
                                <Button
                                  label="Tolak"
                                  icon="pi pi-times"
                                  size="small"
                                  severity="danger"
                                  outlined
                                  onClick={() =>
                                    declineClaim(claim.id, "Sudah dipilih penerima lain")
                                  }
                                />
                              </>
                            )}
                            {claim.status === "accepted" && (
                              <>
                                <Link to={`/serah-terima/${claim.id}`}>
                                  <Button
                                    label="Konfirmasi Kode"
                                    icon="pi pi-check-square"
                                    size="small"
                                  />
                                </Link>
                                <Button
                                  label="No-Show"
                                  size="small"
                                  severity="warning"
                                  text
                                  onClick={() => markNoShow(claim.id)}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
