import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { TabView, TabPanel } from "primereact/tabview";
import { Divider } from "primereact/divider";
import { useApp } from "../context/AppContext";

export const AuthDialog: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, loginWithDemoRole, loginWithPhoneOrGoogle } =
    useApp();

  const [phone, setPhone] = useState("081234567890");
  const [name, setName] = useState("Warga Bandung");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("123456");

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length < 4) return;
    loginWithPhoneOrGoogle(name, phone);
    setOtpSent(false);
  };

  return (
    <Dialog
      header="Masuk ke Barokahiin"
      visible={authModalOpen}
      onHide={() => setAuthModalOpen(false)}
      className="w-[95vw] max-w-md"
      modal
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-600">
          Nomor HP kamu terlindungi dan <strong>tidak pernah ditampilkan</strong> ke pengguna lain.
        </p>

        <TabView>
          <TabPanel header="OTP Nomor HP">
            {!otpSent ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Tampil (boleh nama panggilan)
                  </label>
                  <InputText
                    id="auth-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full"
                    placeholder="Contoh: Teh Rina"
                  />
                </div>
                <div>
                  <label htmlFor="auth-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor HP / WhatsApp
                  </label>
                  <InputText
                    id="auth-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <Button
                  label="Kirim Kode OTP"
                  icon="pi pi-send"
                  className="w-full touch-target"
                  onClick={() => setOtpSent(true)}
                />
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2">
                <p className="text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg p-2.5">
                  Demo OTP dikirim ke <strong>{phone}</strong>. Gunakan kode <strong>123456</strong>.
                </p>
                <div>
                  <label htmlFor="auth-otp" className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode OTP (6 digit)
                  </label>
                  <InputText
                    id="auth-otp"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full text-center tracking-widest font-bold"
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    label="Ubah No"
                    severity="secondary"
                    outlined
                    onClick={() => setOtpSent(false)}
                  />
                  <Button type="submit" label="Verifikasi & Masuk" className="flex-1 touch-target" />
                </div>
              </form>
            )}
          </TabPanel>

          <TabPanel header="Google">
            <div className="space-y-3 pt-2 text-center">
              <p className="text-xs text-slate-600">
                Masuk cepat tanpa kata sandi. Akun dengan email/HP sama tidak akan terduplikasi.
              </p>
              <Button
                label="Lanjutkan dengan Google (Demo)"
                icon="pi pi-google"
                outlined
                className="w-full touch-target"
                onClick={() => loginWithPhoneOrGoogle("Pengguna Google", "warga@example.id")}
              />
            </div>
          </TabPanel>
        </TabView>

        <Divider align="center">
          <span className="text-[11px] uppercase text-slate-400 font-semibold">
            Akses Cepat Demo Peran
          </span>
        </Divider>

        <div className="grid grid-cols-3 gap-2">
          <Button
            label="Tamu (L0)"
            size="small"
            severity="secondary"
            outlined
            onClick={() => loginWithDemoRole("guest")}
          />
          <Button
            label="Pengguna (L1)"
            size="small"
            severity="success"
            outlined
            onClick={() => loginWithDemoRole("user")}
          />
          <Button
            label="Admin/Mod"
            size="small"
            severity="help"
            outlined
            onClick={() => loginWithDemoRole("admin")}
          />
        </div>
      </div>
    </Dialog>
  );
};
