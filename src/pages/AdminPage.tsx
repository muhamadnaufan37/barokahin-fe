import React from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { TabView, TabPanel } from "primereact/tabview";
import { useApp } from "../context/AppContext";

export const AdminPage: React.FC = () => {
  const {
    currentUser,
    listings,
    claims,
    reports,
    sponsors,
    config,
    resolveReport,
    updateConfig,
    setAuthModalOpen,
  } = useApp();

  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "moderator")) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
        <i className="pi pi-shield text-3xl text-purple-600" aria-hidden="true" />
        <h1 className="text-lg font-bold text-slate-900">Akses Khusus Moderator / Admin</h1>
        <p className="text-sm text-slate-600">
          Gunakan tombol di bawah untuk beralih ke akun demo Admin/Moderator.
        </p>
        <Button label="Pilih Akun Demo" onClick={() => setAuthModalOpen(true)} />
      </div>
    );
  }

  const completedClaims = claims.filter((c) => c.status === "completed").length;
  const activeListings = listings.filter((l) => l.status === "active").length;
  const urgentCount = listings.filter((l) => l.isUrgent && l.status === "active").length;
  const openReports = reports.filter((r) => r.status === "open").length;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Panel Admin & Moderasi</h1>
        <p className="text-sm text-slate-600">
          Metrik inti, antrean laporan, konfigurasi batas, dan slot sponsor.
        </p>
      </div>

      {/* Metrics Dashboard (Section 16) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">North Star: Serah Terima Selesai</p>
          <p className="text-2xl font-extrabold text-teal-700 mt-1">{completedClaims + 42}</p>
          <p className="text-[11px] text-slate-400">Minggu ini (Pilot Bandung)</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Listing Aktif</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{activeListings}</p>
          <p className="text-[11px] text-slate-400">Gratis & Berbayar</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Jalur Segera Aktif</p>
          <p className="text-2xl font-extrabold text-orange-600 mt-1">{urgentCount}</p>
          <p className="text-[11px] text-slate-400">Siap saji & kemasan ≤ {config.urgentPackagedThresholdDays}h</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Laporan Terbuka</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{openReports}</p>
          <p className="text-[11px] text-slate-400">Butuh tinjauan moderator</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <TabView>
          <TabPanel header={`Antrean Moderasi (${openReports})`}>
            <div className="space-y-3 pt-2">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Tag
                        value={rep.status === "open" ? "Terbuka" : "Selesai"}
                        severity={rep.status === "open" ? "danger" : "success"}
                      />
                      <span className="text-xs font-semibold uppercase text-slate-500">
                        {rep.targetType}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900">{rep.targetTitle}</p>
                    <p className="text-xs text-rose-700 font-semibold">Alasan: {rep.reason}</p>
                    <p className="text-xs text-slate-600">{rep.details}</p>
                    {rep.actionTaken && (
                      <p className="text-xs text-teal-700 font-semibold">
                        Tindakan: {rep.actionTaken}
                      </p>
                    )}
                  </div>

                  {rep.status === "open" && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button
                        label="Beri Peringatan"
                        size="small"
                        outlined
                        onClick={() => resolveReport(rep.id, "Peringatan dikirim ke pengguna")}
                      />
                      <Button
                        label="Hapus Konten"
                        size="small"
                        severity="danger"
                        onClick={() =>
                          resolveReport(rep.id, "Konten dihapus moderator", true)
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabPanel>

          <TabPanel header="Konfigurasi Sistem">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batas Klaim Aktif Barang Gratis
                </label>
                <InputNumber
                  value={config.maxActiveFreeClaims}
                  onValueChange={(e) => updateConfig({ maxActiveFreeClaims: e.value || 3 })}
                  min={1}
                  max={10}
                  showButtons
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batas Klaim Aktif Barang Berbayar
                </label>
                <InputNumber
                  value={config.maxActivePaidClaims}
                  onValueChange={(e) => updateConfig({ maxActivePaidClaims: e.value || 5 })}
                  min={1}
                  max={20}
                  showButtons
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ambang Jalur Segera Makanan Kemasan (Hari)
                </label>
                <InputNumber
                  value={config.urgentPackagedThresholdDays}
                  onValueChange={(e) =>
                    updateConfig({ urgentPackagedThresholdDays: e.value || 3 })
                  }
                  min={1}
                  max={14}
                  showButtons
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Label Anonim Publik Default
                </label>
                <InputText
                  value={config.anonymousPublicLabel}
                  onChange={(e) => updateConfig({ anonymousPublicLabel: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Feature Flag: Antarmuka Verifikasi Identitas (AUTH-06)
                  </p>
                  <p className="text-xs text-slate-500">
                    Default MVP mati; hanya mengaktifkan placeholder di profil.
                  </p>
                </div>
                <InputSwitch
                  checked={config.enableVerificationUI}
                  onChange={(e) => updateConfig({ enableVerificationUI: e.value })}
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Slot Sponsor">
            <div className="space-y-3 pt-2">
              {sponsors.map((sp) => (
                <div
                  key={sp.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm"
                >
                  <div>
                    <p className="font-bold text-slate-900">{sp.sponsorName}</p>
                    <p className="text-xs text-slate-600">{sp.headline}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Penempatan: {sp.placement} · Tayang agregat: {sp.impressions} · Klik:{" "}
                      {sp.clicks} (tanpa data pribadi)
                    </p>
                  </div>
                  <Tag value={sp.active ? "Aktif" : "Nonaktif"} severity="success" />
                </div>
              ))}
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
};
