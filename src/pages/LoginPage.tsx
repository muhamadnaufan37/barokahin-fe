import React, { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { useBuyer } from "../context/BuyerContext";
import { ApiClientError, publicApi } from "../services/publicApi";
import { QrCreateResult } from "../types";

type AuthMode = "otp" | "password" | "register" | "qr";

function safeNextPath(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/akun";
}

export const LoginPage: React.FC = () => {
  const { token, completeAuth } = useBuyer();
  const location = useLocation();
  const navigate = useNavigate();
  const nextPath = safeNextPath(
    new URLSearchParams(location.search).get("next")
  );

  const [mode, setMode] = useState<AuthMode>("otp");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // OTP state
  const [otpChannel, setOtpChannel] = useState<"phone" | "email">("phone");
  const [otpTarget, setOtpTarget] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpName, setOtpName] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [requiresName, setRequiresName] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Password login state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // QR Login state
  const [qrData, setQrData] = useState<QrCreateResult | null>(null);
  const [qrStatusText, setQrStatusText] = useState<string | null>(null);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = window.setTimeout(
      () => setRemainingSeconds((value) => Math.max(0, value - 1)),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [remainingSeconds]);

  useEffect(() => {
    document.title = "Masuk / Daftar — Barokahinn";
  }, []);

  // Poll QR status while on QR mode
  useEffect(() => {
    if (mode !== "qr" || !qrData?.qr_token || token) return;
    let active = true;
    const interval = window.setInterval(async () => {
      try {
        const res = await publicApi.getQrLoginStatus(qrData.qr_token);
        if (!active) return;
        if (res.status === "approved" && res.token) {
          window.clearInterval(interval);
          await completeAuth(
            res.token,
            res.expires_in_seconds,
            res.profile_completeness,
            res.user
          );
          navigate(nextPath, { replace: true });
        } else if (res.status === "expired" || res.status === "consumed") {
          window.clearInterval(interval);
          setQrStatusText("Kode QR kedaluwarsa. Buat ulang kode QR baru.");
        }
      } catch {
        // Abaikan error polling sementara
      }
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [mode, qrData?.qr_token, token, completeAuth, navigate, nextPath]);

  if (token) {
    return <Navigate to={nextPath} replace />;
  }

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setNotice(null);
  };

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const targetPayload =
        otpChannel === "phone"
          ? { phone: otpTarget.trim() }
          : { email: otpTarget.trim() };
      const result = await publicApi.requestBuyerOtp(targetPayload);
      setOtpRequested(true);
      setRequiresName(
        result.requires_name !== undefined
          ? Boolean(result.requires_name)
          : result.account_exists === false
      );
      setRemainingSeconds(result.expires_in_seconds || 60);
      setNotice("Kode verifikasi dikirim. Masukkan kode yang kamu terima.");
    } catch (cause) {
      if (
        cause instanceof ApiClientError &&
        cause.retryAfterSeconds !== undefined
      ) {
        setRemainingSeconds(cause.retryAfterSeconds);
        setError(
          `${cause.message} Coba lagi dalam ${cause.retryAfterSeconds} detik.`
        );
      } else {
        setError(
          cause instanceof Error ? cause.message : "Kode OTP belum bisa dikirim."
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const targetPayload =
        otpChannel === "phone"
          ? { phone: otpTarget.trim() }
          : { email: otpTarget.trim() };
      const result = await publicApi.verifyBuyerOtp(
        targetPayload,
        otpCode.trim(),
        requiresName ? otpName.trim() : undefined
      );
      await completeAuth(
        result.token,
        result.expires_in_seconds,
        result.profile_completeness,
        result.user
      );
      navigate(nextPath, { replace: true });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Kode tidak dapat diverifikasi. Coba lagi."
      );
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordLogin = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await publicApi.loginBuyer({
        identifier: identifier.trim(),
        password,
      });
      await completeAuth(
        result.token,
        result.expires_in_seconds,
        result.profile_completeness,
        result.user
      );
      navigate(nextPath, { replace: true });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Email/HP atau kata sandi belum sesuai."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await publicApi.registerBuyer({
        nama_lengkap: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
      });
      await completeAuth(
        result.token,
        result.expires_in_seconds,
        result.profile_completeness,
        result.user
      );
      navigate(nextPath, { replace: true });
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.fields) {
        const detail = Object.values(cause.fields).flat().join(" ");
        setError(detail || cause.message);
      } else {
        setError(
          cause instanceof Error ? cause.message : "Pendaftaran gagal."
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCreateQr = async () => {
    setBusy(true);
    setError(null);
    setQrStatusText(null);
    try {
      const res = await publicApi.createQrLogin();
      setQrData(res);
      setQrStatusText(
        "Menunggu persetujuan dari perangkat yang sudah login…"
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal membuat kode QR."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg space-y-5 rounded-kartu-besar border border-garis bg-putih p-6 sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-nila">
          Akun pembeli
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold text-tinta">
          {mode === "register" ? "Daftar akun baru" : "Masuk ke Barokahinn"}
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-muted">
          Keranjangmu tetap tersimpan. Akun diperlukan untuk membuat pesanan.
        </p>
      </div>

      {/* Pilihan Metode Autentikasi */}
      <div
        role="tablist"
        aria-label="Metode masuk"
        className="grid grid-cols-4 gap-1.5 rounded-kartu border border-garis bg-kertas p-1"
      >
        {[
          { id: "otp", label: "OTP" },
          { id: "password", label: "Sandi" },
          { id: "register", label: "Daftar" },
          { id: "qr", label: "Scan QR" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => switchMode(tab.id as AuthMode)}
            className={`min-h-[38px] rounded-kontrol px-2 text-xs font-semibold transition-colors ${
              mode === tab.id
                ? "bg-nila text-putih"
                : "text-muted hover:text-tinta"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <Message severity="error" text={error} className="w-full justify-start" />
      )}
      {notice && (
        <Message
          severity="success"
          text={notice}
          className="w-full justify-start"
        />
      )}

      {/* A. OTP (SMS atau Email) */}
      {mode === "otp" && (
        <div className="space-y-4">
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setOtpChannel("phone");
                setOtpRequested(false);
                setOtpTarget("");
              }}
              className={`rounded-pil border px-3 py-1 font-semibold ${
                otpChannel === "phone"
                  ? "border-nila bg-nila-muda text-nila-tua"
                  : "border-garis text-muted"
              }`}
            >
              Via SMS / HP
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpChannel("email");
                setOtpRequested(false);
                setOtpTarget("");
              }}
              className={`rounded-pil border px-3 py-1 font-semibold ${
                otpChannel === "email"
                  ? "border-nila bg-nila-muda text-nila-tua"
                  : "border-garis text-muted"
              }`}
            >
              Via Email
            </button>
          </div>

          <form className="space-y-4" onSubmit={requestOtp}>
            <div className="space-y-1.5">
              <label
                htmlFor="login-otp-target"
                className="block text-xs font-semibold text-tinta"
              >
                {otpChannel === "phone" ? "Nomor HP *" : "Alamat Email *"}
              </label>
              <InputText
                id="login-otp-target"
                type={otpChannel === "email" ? "email" : "tel"}
                autoComplete={otpChannel === "email" ? "email" : "tel"}
                required
                value={otpTarget}
                onChange={(e) => setOtpTarget(e.target.value)}
                placeholder={
                  otpChannel === "phone"
                    ? "Contoh: 081234567890"
                    : "nama@email.com"
                }
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              icon={otpChannel === "phone" ? "pi pi-mobile" : "pi pi-envelope"}
              loading={busy}
              disabled={busy || remainingSeconds > 0}
              label={
                busy
                  ? "Mengirim kode…"
                  : remainingSeconds > 0
                    ? `Coba lagi dalam ${remainingSeconds} dtk`
                    : otpRequested
                      ? "Kirim ulang kode"
                      : "Kirim kode OTP"
              }
              className="w-full justify-center"
            />
          </form>

          {otpRequested && (
            <form
              className="space-y-4 border-t border-garis pt-4"
              onSubmit={verifyOtp}
            >
              {requiresName && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-name"
                    className="block text-xs font-semibold text-tinta"
                  >
                    Nama lengkap *
                  </label>
                  <InputText
                    id="login-name"
                    autoComplete="name"
                    required
                    minLength={3}
                    value={otpName}
                    onChange={(e) => setOtpName(e.target.value)}
                    placeholder="Nama sesuai identitas"
                    className="w-full"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-otp"
                  className="block text-xs font-semibold text-tinta"
                >
                  Kode OTP *
                </label>
                <InputText
                  id="login-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{4,8}"
                  maxLength={8}
                  required
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Masukkan kode OTP"
                  className="w-full"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="btn-cta w-full text-sm"
              >
                <i
                  className={`pi ${
                    busy ? "pi-spin pi-spinner" : "pi-check-circle"
                  } text-sm`}
                  aria-hidden="true"
                />
                <span>{busy ? "Memeriksa kode…" : "Verifikasi dan masuk"}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* B. Login Email / Nomor HP + Password */}
      {mode === "password" && (
        <form className="space-y-4" onSubmit={handlePasswordLogin}>
          <div className="space-y-1.5">
            <label
              htmlFor="login-identifier"
              className="block text-xs font-semibold text-tinta"
            >
              Email atau Nomor HP *
            </label>
            <InputText
              id="login-identifier"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="nama@email.com atau 081234567890"
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-tinta"
            >
              Kata sandi *
            </label>
            <InputText
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="w-full"
            />
          </div>
          <button type="submit" disabled={busy} className="btn-cta w-full text-sm">
            <i
              className={`pi ${busy ? "pi-spin pi-spinner" : "pi-sign-in"} text-sm`}
              aria-hidden="true"
            />
            <span>{busy ? "Memeriksa…" : "Masuk"}</span>
          </button>
        </form>
      )}

      {/* C. Registrasi Akun Baru */}
      {mode === "register" && (
        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="space-y-1.5">
            <label
              htmlFor="reg-name"
              className="block text-xs font-semibold text-tinta"
            >
              Nama lengkap *
            </label>
            <InputText
              id="reg-name"
              autoComplete="name"
              required
              minLength={3}
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="Nama lengkap"
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="reg-email"
              className="block text-xs font-semibold text-tinta"
            >
              Email *
            </label>
            <InputText
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="reg-phone"
              className="block text-xs font-semibold text-tinta"
            >
              Nomor HP / WhatsApp *
            </label>
            <InputText
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              required
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="reg-password"
              className="block text-xs font-semibold text-tinta"
            >
              Kata sandi *
            </label>
            <InputText
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full"
            />
          </div>
          <button type="submit" disabled={busy} className="btn-cta w-full text-sm">
            <i
              className={`pi ${busy ? "pi-spin pi-spinner" : "pi-user-plus"} text-sm`}
              aria-hidden="true"
            />
            <span>{busy ? "Mendaftarkan…" : "Daftar & masuk"}</span>
          </button>
        </form>
      )}

      {/* D. Login via QR Code */}
      {mode === "qr" && (
        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-muted">
            Jika sudah login di ponsel, buat kode QR di bawah lalu setujui dari
            menu <strong>Akun → Masuk di perangkat lain (QR)</strong>.
          </p>
          {!qrData ? (
            <Button
              type="button"
              label="Buat kode QR login"
              icon="pi pi-qrcode"
              loading={busy}
              onClick={() => void handleCreateQr()}
              className="w-full justify-center"
            />
          ) : (
            <div className="space-y-3 rounded-kartu border border-garis bg-kertas p-4 text-center">
              <p className="text-xs font-semibold text-tinta">
                Token QR Login (berlaku 3 menit)
              </p>
              <code className="block break-all rounded-kontrol border border-garis bg-putih px-3 py-2 font-mono text-xs text-nila">
                {qrData.qr_payload}
              </code>
              {qrStatusText && (
                <p className="text-xs font-medium text-teh-tua">
                  {qrStatusText}
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  label="Salin token"
                  icon="pi pi-copy"
                  outlined
                  size="small"
                  onClick={() => {
                    void navigator.clipboard.writeText(qrData.qr_payload);
                    setNotice("Payload QR berhasil disalin.");
                  }}
                />
                <Button
                  type="button"
                  label="Buat ulang"
                  icon="pi pi-refresh"
                  outlined
                  size="small"
                  onClick={() => void handleCreateQr()}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs leading-5 text-muted">
        Dengan masuk, kamu dapat melanjutkan untuk melengkapi data dan
        menyetujui syarat layanan.{" "}
        <Link className="font-semibold text-nila underline" to="/kebijakan">
          Kebijakan Privasi
        </Link>
      </p>
    </section>
  );
};
