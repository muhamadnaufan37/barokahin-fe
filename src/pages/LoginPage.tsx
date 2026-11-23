import React, { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
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
    return (
      <section className="mx-auto max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Kamu sudah masuk</h1>
        <p className="text-sm text-slate-600">
          Lanjutkan mengelola akun atau kembali ke keranjang.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="primary-action" to={nextPath}>
            Lanjutkan
          </Link>
          <Link className="secondary-action" to="/akun">
            Buka akun
          </Link>
        </div>
      </section>
    );
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
    <section className="mx-auto max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div>
        <p className="text-sm font-semibold text-indigo-700">Akun pembeli</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Masuk dengan nomor HP
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Keranjangmu tetap tersimpan. Akun diperlukan untuk membuat pesanan.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">
          {notice}
        </p>
      )}

      <form className="space-y-4" onSubmit={requestCode}>
        <label className="form-field">
          <span>Nomor HP</span>
          <InputText
            className="form-input"
            autoComplete="tel"
            inputMode="tel"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Contoh: 081234567890"
          />
        </label>
        <Button className="primary-action w-full" type="submit" disabled={busy || remainingSeconds > 0}>
          {busy
            ? "Mengirim kode…"
            : remainingSeconds > 0
              ? `Coba lagi dalam ${remainingSeconds} dtk`
              : otpRequested
                ? "Kirim ulang kode"
                : "Kirim kode OTP"}
        </Button>
      </form>

      {otpRequested && (
        <form className="space-y-4 border-t border-slate-100 pt-4" onSubmit={verifyCode}>
          <label className="form-field">
            <span>Nama lengkap</span>
            <InputText
              className="form-input"
              autoComplete="name"
              required
              minLength={3}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama sesuai identitas"
            />
          </label>
          <label className="form-field">
            <span>Kode OTP</span>
            <InputText
              className="form-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{4,8}"
              maxLength={8}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder="Masukkan kode"
            />
          </label>
          <Button className="primary-action w-full" type="submit" disabled={busy}>
            {busy ? "Memeriksa kode…" : "Verifikasi dan masuk"}
          </Button>
        </form>
      )}

      <p className="text-xs leading-5 text-slate-500">
        Dengan masuk, kamu dapat melanjutkan untuk melengkapi data dan
        menyetujui syarat layanan.{" "}
        <Link className="underline" to="/kebijakan">
          Kebijakan Privasi
        </Link>
      </p>
    </section>
  );
};
