import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { REGIONS } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { i18n } from "../i18n/id";

export const ProfilePage: React.FC = () => {
  const {
    currentUser,
    config,
    updateProfile,
    logout,
    setAuthModalOpen,
    resetDemoData,
    notify,
  } = useApp();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
        <i className="pi pi-user text-4xl text-teal-600" aria-hidden="true" />
        <h1 className="text-lg font-bold text-slate-900">Belum Masuk</h1>
        <p className="text-sm text-slate-600">
          Masuk dengan OTP nomor HP atau Google untuk mengelola profil dan preferensimu.
        </p>
        <Button label="Masuk / Pilih Akun Demo" onClick={() => setAuthModalOpen(true)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Profil & Pengaturan</h1>
        <Button label="Keluar" icon="pi pi-sign-out" severity="secondary" outlined size="small" onClick={logout} />
      </div>

      {/* Identity Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-lg font-bold text-white">
            {currentUser.avatarInitials}
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{currentUser.displayName}</h2>
            <p className="text-xs text-slate-500">
              Level Kepercayaan: <strong>{currentUser.trustLevel}</strong> (HP Terverifikasi) ·{" "}
              {currentUser.completedHandovers} serah terima selesai
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label htmlFor="prof-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Tampil
            </label>
            <InputText
              id="prof-name"
              value={currentUser.displayName}
              onChange={(e) => updateProfile({ displayName: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Wilayah Utama</label>
            <Dropdown
              value={currentUser.regionId}
              options={REGIONS.map((r) => ({
                label: `${r.district}, ${r.city}`,
                value: r.id,
              }))}
              onChange={(e) => updateProfile({ regionId: e.value })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Privacy & Community Modes (AUTH-04, COM-01) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Privasi & Preferensi Komunitas</h2>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Mode Sahabat Berbagi (Anonim Publik)</p>
            <p className="text-xs text-slate-500">
              Namamu tampil sebagai "{currentUser.muslimCommunityMode ? config.muslimAnonymousLabel : config.anonymousPublicLabel}" di listing publik.
            </p>
          </div>
          <InputSwitch
            checked={currentUser.anonymousMode}
            onChange={(e) => updateProfile({ anonymousMode: e.value })}
            aria-label="Aktifkan Mode Sahabat Berbagi"
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Mode Komunitas Muslim (Opsional)</p>
            <p className="text-xs text-slate-500">
              Menampilkan label anonim "{config.muslimAnonymousLabel}" jika mode anonim aktif.
            </p>
          </div>
          <InputSwitch
            checked={currentUser.muslimCommunityMode}
            onChange={(e) => updateProfile({ muslimCommunityMode: e.value })}
            aria-label="Aktifkan Mode Komunitas Muslim"
          />
        </div>
      </div>

      {/* Notification Settings (AUTH-08) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900">Pengaturan Notifikasi</h2>
        {[
          { key: "claims", label: "Klaim baru & status diterima/ditolak" },
          { key: "chat", label: "Pesan chat masuk" },
          { key: "pickupReminder", label: "Pengingat jendela ambil" },
          { key: "urgentFood", label: "Kabar Jalur Segera di wilayah saya" },
        ].map((item) => {
          const k = item.key as keyof typeof currentUser.notificationSettings;
          return (
            <div key={item.key} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{item.label}</span>
              <InputSwitch
                checked={currentUser.notificationSettings[k]}
                onChange={(e) =>
                  updateProfile({
                    notificationSettings: {
                      ...currentUser.notificationSettings,
                      [k]: e.value,
                    },
                  })
                }
              />
            </div>
          );
        })}
      </div>

      {/* Verification Framework Placeholder behind Feature Flag (AUTH-06) */}
      {config.enableVerificationUI && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Verifikasi Identitas</h2>
          <p className="text-xs text-slate-600 mt-1">{i18n.verification.mvpDisabledNote}</p>
        </div>
      )}

      {/* Helpful Links & Account Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-2">
          <Link to="/bantuan">
            <Button label="Panduan Aman" icon="pi pi-question-circle" outlined size="small" />
          </Link>
          <Link to="/aturan">
            <Button label="Barang Terlarang" icon="pi pi-ban" outlined size="small" />
          </Link>
          <Link to="/tentang">
            <Button label="Tentang & Sponsor" icon="pi pi-info-circle" outlined size="small" />
          </Link>
          <Button
            label="Reset Data Demo"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            size="small"
            onClick={resetDemoData}
          />
        </div>

        <div className="border-t border-slate-100 pt-3">
          <Button
            label="Ajukan Hapus Akun & Data"
            severity="danger"
            text
            size="small"
            onClick={() => setDeleteDialogOpen(true)}
          />
        </div>
      </div>

      <Dialog
        header="Hapus Akun & Data"
        visible={deleteDialogOpen}
        onHide={() => setDeleteDialogOpen(false)}
        className="w-[95vw] max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Data pribadimu akan dihapus atau dianonimkan sesuai kebijakan retensi dan prinsip UU PDP.
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-2">
            <Button label="Batal" outlined onClick={() => setDeleteDialogOpen(false)} />
            <Button
              label="Ajukan Penghapusan"
              severity="danger"
              onClick={() => {
                setDeleteDialogOpen(false);
                logout();
                notify("info", "Permintaan penghapusan akun dicatat");
              }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
