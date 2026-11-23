import React, { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { useBuyer } from "../context/BuyerContext";
import { ApiClientError, publicApi } from "../services/publicApi";

function safeNextPath(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/akun";
}

export const LoginPage: React.FC = () => {
  const { token, verifyOtp } = useBuyer();
  const location = useLocation();
  const navigate = useNavigate();
  const nextPath = safeNextPath(
    new URLSearchParams(location.search).get("next")
  );
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = window.setTimeout(
      () => setRemainingSeconds((value) => Math.max(0, value - 1)),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [remainingSeconds]);

  useEffect(() => {
    document.title = "Masuk dengan OTP — Barokahiin";
  }, []);

  if (token) {
    return <Navigate to={nextPath} replace />;
  }

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await publicApi.requestBuyerOtp(phone.trim());
      setOtpRequested(true);
      setRemainingSeconds(result.expires_in_seconds || 60);
      setNotice("Kode verifikasi dikirim. Masukkan kode yang kamu terima.");
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.retryAfterSeconds !== undefined) {
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

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await verifyOtp(phone.trim(), code.trim(), name.trim());
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

  return (
    <section className="mx-auto max-w-lg space-y-5 rounded-kartu-besar border border-garis bg-putih p-6 sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-nila">
          Akses Menu untuk Belanja
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold text-tinta">
          Masuk dengan nomor HP
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-muted">
          Keranjangmu tetap tersimpan. Akun diperlukan untuk membuat pesanan.
        </p>
      </div>

      {error && (
        <Message severity="error" text={error} className="w-full justify-start" />
      )}
      {notice && (
        <Message severity="success" text={notice} className="w-full justify-start" />
      )}

      <form className="space-y-4" onSubmit={requestCode}>
        <div className="space-y-1.5">
          <label
            htmlFor="login-phone"
            className="block text-xs font-semibold text-tinta"
          >
            Nomor HP *
          </label>
          <InputText
            id="login-phone"
            autoComplete="tel"
            inputMode="tel"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Contoh: 081234567890"
            className="w-full"
          />
        </div>
        <Button
          type="submit"
          icon="pi pi-mobile"
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
          onSubmit={verifyCode}
        >
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
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama sesuai identitas"
              className="w-full"
            />
          </div>
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
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, ""))
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
              className={`pi ${busy ? "pi-spin pi-spinner" : "pi-check-circle"} text-sm`}
              aria-hidden="true"
            />
            <span>{busy ? "Memeriksa kode…" : "Verifikasi dan masuk"}</span>
          </button>
        </form>
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
