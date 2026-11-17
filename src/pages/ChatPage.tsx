import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useApp } from "../context/AppContext";
import { formatDateTimeID, formatRupiah, i18n } from "../i18n/id";
import { ReportDialog } from "../components/ReportDialog";

const RISK_PATTERN = /(08\d{5,}|\+62\d{5,}|https?:\/\/|wa\.me|transfer|rekening|dp\s|\bbca\b|\bbri\b|\bmandiri\b)/i;

export const ChatPage: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const { currentUser, claims, listings, messages, sendMessage } = useApp();

  const [text, setText] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  const claim = claims.find((c) => c.id === claimId);
  const listing = claim ? listings.find((l) => l.id === claim.listingId) : undefined;

  const claimMessages = useMemo(
    () => messages.filter((m) => m.claimId === claimId),
    [messages, claimId]
  );

  const hasRiskWarning = RISK_PATTERN.test(text);

  if (!claim || !listing) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
        <p className="font-bold text-slate-800">Percakapan tidak ditemukan</p>
        <Button label="Kembali" size="small" onClick={() => navigate(-1)} />
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(claim.id, text);
    setText("");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <Button
          label="Kembali"
          icon="pi pi-arrow-left"
          text
          size="small"
          onClick={() => navigate(-1)}
        />
        <div className="flex items-center gap-2">
          {claim.status === "accepted" && (
            <Link to={`/serah-terima/${claim.id}`}>
              <Button label="Serah Terima" icon="pi pi-qrcode" size="small" />
            </Link>
          )}
          <Button
            label="Laporkan"
            icon="pi pi-flag"
            severity="danger"
            text
            size="small"
            onClick={() => setReportOpen(true)}
          />
        </div>
      </div>

      {/* Listing context header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/barokah/${listing.id}`}
            className="font-bold text-slate-900 hover:text-teal-700 truncate block"
          >
            {listing.title}
          </Link>
          <p className="text-xs text-slate-500">
            Status: <strong>{claim.status}</strong> ·{" "}
            {claim.lockedPriceRupiah !== null
              ? `Harga terkunci: ${formatRupiah(claim.lockedPriceRupiah)}`
              : "Gratis"}
          </p>
        </div>
      </div>

      {/* Privacy & Safety Notice (CHT-02) */}
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-teal-900 flex items-start gap-2">
        <i className="pi pi-shield text-teal-700 mt-0.5 shrink-0" aria-hidden="true" />
        <p>{i18n.privacy.chatSafety}</p>
      </div>

      {/* Messages area */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col h-[420px]">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {claimMessages.length === 0 ? (
            <p className="text-center text-xs text-slate-400 pt-10">
              Mulai percakapan untuk menyepakati waktu ambil di dalam jendela yang tersedia.
            </p>
          ) : (
            claimMessages.map((msg) => {
              const isMe = currentUser?.id === msg.senderId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <span className="text-[11px] text-slate-400 mb-0.5">{msg.senderLabel}</span>
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-sm ${
                      isMe
                        ? "bg-teal-600 text-white rounded-br-sm"
                        : "bg-slate-100 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {formatDateTimeID(msg.createdAt, listing.timezone)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Non-blocking risk warning (CHT-02) */}
        {hasRiskWarning && (
          <div
            role="alert"
            className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-950"
          >
            <strong>Peringatan Keamanan:</strong> Terdeteksi nomor HP, tautan, atau kata terkait
            transfer. Barokahiin menyarankan tetap berkomunikasi di sini dan{" "}
            <strong>tidak membayar di muka</strong> sebelum memeriksa barang saat serah terima.
          </div>
        )}

        <form onSubmit={handleSend} className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
          <InputText
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis pesan untuk mengatur waktu ambil..."
            className="flex-1"
            aria-label="Isi pesan"
          />
          <Button type="submit" icon="pi pi-send" aria-label="Kirim pesan" />
        </form>
      </div>

      <ReportDialog
        visible={reportOpen}
        onHide={() => setReportOpen(false)}
        targetType="chat"
        targetId={claim.id}
        targetTitle={`Chat klaim: ${listing.title}`}
      />
    </div>
  );
};
