import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { useApp } from "../context/AppContext";

interface ReportDialogProps {
  visible: boolean;
  onHide: () => void;
  targetType: "listing" | "claim" | "chat";
  targetId: string;
  targetTitle: string;
}

const REPORT_REASONS = [
  "Meminta pembayaran/DP di muka sebelum serah terima",
  "Harga tidak sesuai dengan yang tertera",
  "Barang tidak sesuai deskripsi / tidak layak",
  "Barang terlarang (obat keras, alkohol, senjata, dll.)",
  "Menjual kembali barang gratis",
  "Pelecehan atau pesan tidak pantas",
  "Dugaan penipuan / akun palsu",
];

export const ReportDialog: React.FC<ReportDialogProps> = ({
  visible,
  onHide,
  targetType,
  targetId,
  targetTitle,
}) => {
  const { submitReport } = useApp();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport(targetType, targetId, targetTitle, reason, details);
    setDetails("");
    onHide();
  };

  return (
    <Dialog
      header="Laporkan Masalah"
      visible={visible}
      onHide={onHide}
      className="w-[95vw] max-w-md"
      modal
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-600">
          Identitas pelapor dirahasiakan dari pihak terlapor. Laporan akan ditinjau oleh tim
          moderasi.
        </p>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Laporan</label>
          <Dropdown
            value={reason}
            options={REPORT_REASONS}
            onChange={(e) => setReason(e.value)}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="report-details" className="block text-xs font-semibold text-slate-700 mb-1">
            Penjelasan Singkat
          </label>
          <InputTextarea
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className="w-full"
            placeholder="Ceritakan kronologi singkat agar moderator mudah memeriksa..."
            required
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" label="Batal" severity="secondary" outlined onClick={onHide} />
          <Button type="submit" label="Kirim Laporan" severity="danger" icon="pi pi-flag" />
        </div>
      </form>
    </Dialog>
  );
};
