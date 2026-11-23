import React, { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { RegionPicker } from "../components/RegionPicker";
import { useBuyer } from "../context/BuyerContext";
import { ApiClientError, publicApi } from "../services/publicApi";
import { BuyerAddress, BuyerProfileCompleteness, PublicRegion } from "../types";
import { getAddressWarningMessages } from "../utils/format";

const MISSING_LABELS: Record<string, string> = {
  PHONE_UNVERIFIED: "Verifikasi nomor HP",
  EMAIL_UNVERIFIED: "Verifikasi email",
  NAME_MISSING: "Nama lengkap",
  TERMS_NOT_ACCEPTED: "Persetujuan syarat layanan dan privasi",
  REGION_MISSING: "Wilayah",
  ADDRESS_MISSING: "Alamat pengiriman",
  ADDRESS_INVALID: "Alamat pengiriman yang valid",
};

const emptyAddress = {
  penerima: "",
  kontak_penerima: "",
  region_id: "",
  kode_pos: "",
  jalan: "",
  rt_rw: "",
  patokan: "",
  jenis_tempat: "rumah",
};

export const BuyerAccountPage: React.FC = () => {
  const { token, signOut, setAddressWarningReview } = useBuyer();
  const navigate = useNavigate();
  const [completeness, setCompleteness] =
    useState<BuyerProfileCompleteness | null>(null);
  const [addresses, setAddresses] = useState<BuyerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState(emptyAddress);
  const [addressRegion, setAddressRegion] = useState<PublicRegion | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressWarnings, setAddressWarnings] = useState<string[]>([]);
  const [addressWarningCodes, setAddressWarningCodes] = useState<string[]>([]);
  const [addressWarningsConfirmed, setAddressWarningsConfirmed] =
    useState(false);
  const [addressWarningsUuid, setAddressWarningsUuid] = useState("");

  const loadAccount = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const [profileResult, addressResult] = await Promise.allSettled([
      publicApi.getBuyerProfileCompleteness(token, "kirim"),
      publicApi.getBuyerAddresses(token),
    ]);
    if (profileResult.status === "fulfilled") {
      setCompleteness(profileResult.value);
    }
    if (addressResult.status === "fulfilled") {
      setAddresses(addressResult.value);
    }
    if (
      profileResult.status === "rejected" ||
      addressResult.status === "rejected"
    ) {
      const failure =
        profileResult.status === "rejected"
          ? profileResult.reason
          : addressResult.status === "rejected"
            ? addressResult.reason
            : null;
      if (
        failure instanceof ApiClientError &&
        (failure.status === 401 || failure.code === "OTP_INVALID")
      ) {
        signOut();
        navigate(`/masuk?next=${encodeURIComponent("/akun")}`, {
          replace: true,
        });
        return;
      }
      setError(
        failure instanceof Error
          ? failure.message
          : "Data akun belum bisa dimuat."
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Akun Pembeli — Barokahiin";
    void loadAccount();
  }, [token]);

  if (!token) {
    return <Navigate to="/masuk?next=%2Fakun" replace />;
  }

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!regionId) {
      setError("Pilih wilayah terlebih dahulu.");
      return;
    }
    if (!acceptedTerms) {
      setError("Setujui Syarat Layanan dan Kebijakan Privasi terlebih dahulu.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await publicApi.updateBuyerProfile(token, {
        nama_lengkap: name.trim(),
        region_id: regionId,
        accept_terms: acceptedTerms,
        terms_version: "0.5",
      });
      setNotice("Data profil tersimpan.");
      await loadAccount();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profil gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const requestEmailVerification = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await publicApi.requestBuyerEmailVerification(token, email.trim());
      setNotice("Tautan verifikasi dikirim. Buka email untuk menyelesaikan verifikasi.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Verifikasi email gagal diminta."
      );
    } finally {
      setSaving(false);
    }
  };

  const createAddress = async (event: FormEvent) => {
    event.preventDefault();
    if (!addressRegion) {
      setError("Pilih wilayah alamat sampai tingkat kelurahan/desa.");
      return;
    }
    if (addresses.length >= 5) {
      setError("Buku alamat maksimal berisi lima alamat.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const created = await publicApi.createBuyerAddress(token, {
        ...address,
        region_id: addressRegion.id,
      });
      setAddresses((current) => [...current, created]);
      setShowAddressForm(false);
      setAddress(emptyAddress);
      setAddressRegion(null);
      const warnings = created.warnings || [];
      setAddressWarningCodes(warnings);
      setAddressWarnings(getAddressWarningMessages(warnings));
      setAddressWarningsConfirmed(warnings.length === 0);
      setAddressWarningsUuid(created.uuid);
      setAddressWarningReview(created.uuid, warnings, warnings.length === 0);
      setNotice("Alamat tersimpan.");
      await loadAccount();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Alamat gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (uuid: string) => {
    if (!window.confirm("Hapus alamat ini dari buku alamat?")) return;
    setSaving(true);
    setError(null);
    try {
      await publicApi.deleteBuyerAddress(token, uuid);
      await loadAccount();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Alamat gagal dihapus.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (
      !window.confirm(
        "Hapus data pribadi akun ini? Catatan transaksi tetap disimpan sesuai ketentuan."
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await publicApi.deleteBuyerAccount(token);
      signOut();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Permintaan gagal.");
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-700">Akun pembeli</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Profil dan alamat
        </h1>
      </header>

      {error && <p className="form-alert error" role="alert">{error}</p>}
      {notice && <p className="form-alert success" role="status">{notice}</p>}

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5" role="status">
          Memuat data akun…
        </p>
      ) : (
        <>
          <section className="form-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Kelengkapan profil
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {completeness?.ready
                    ? "Profil Siap Beli."
                    : "Lengkapi data yang masih diperlukan sebelum membuat pesanan."}
                </p>
              </div>
              <span className={`readiness-badge ${completeness?.ready ? "ready" : ""}`}>
                {completeness?.ready ? "Siap Beli" : "Belum lengkap"}
              </span>
            </div>
            {!!completeness?.missing.length && (
              <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-slate-700">
                {completeness.missing.map((code) => (
                  <li key={code}>{MISSING_LABELS[code] || code}</li>
                ))}
              </ul>
            )}
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveProfile}>
              <label className="form-field sm:col-span-2">
                <span>Nama lengkap</span>
                <InputText
                  className="form-input"
                  autoComplete="name"
                  required
                  minLength={3}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <div className="sm:col-span-2">
                <RegionPicker
                  value={regionId}
                  label="Wilayah tempat tinggal"
                  onChange={(region) => setRegionId(region?.id || "")}
                />
              </div>
              <div className="flex items-start gap-2 sm:col-span-2">
                <Checkbox
                  inputId="buyer-terms"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(!!event.checked)}
                  required
                />
                <label htmlFor="buyer-terms">
                  Saya menyetujui{" "}
                  <Link className="underline" to="/kebijakan">
                    Syarat Layanan dan Kebijakan Privasi
                  </Link>
                </label>
              </div>
              <Button className="primary-action sm:col-span-2" type="submit" disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan profil"}
              </Button>
            </form>

            <form
              className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-[1fr_auto]"
              onSubmit={requestEmailVerification}
            >
              <label className="form-field">
                <span>Email untuk verifikasi</span>
                <InputText
                  className="form-input"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@email.com"
                />
              </label>
              <Button className="secondary-action self-end" type="submit" disabled={saving}>
                Kirim tautan verifikasi
              </Button>
            </form>
          </section>

          <section className="form-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Buku alamat</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {addresses.length} dari 5 alamat tersimpan.
                </p>
              </div>
              <Button
                className="secondary-action"
                type="button"
                disabled={addresses.length >= 5 || showAddressForm}
                onClick={() => setShowAddressForm(true)}
              >
                Tambah alamat
              </Button>
            </div>

            {addresses.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-100">
                {addresses.map((saved) => (
                  <li className="flex flex-wrap justify-between gap-3 py-4" key={saved.uuid}>
                    <div className="text-sm">
                      <p className="font-semibold text-slate-900">
                        {saved.penerima} {saved.utama && <span>(Utama)</span>}
                      </p>
                      <p className="mt-1 text-slate-600">
                        {saved.jalan}, {saved.region_nama || "Wilayah tersimpan"}
                      </p>
                    </div>
                    <Button
                      className="text-sm font-semibold text-red-700 underline"
                      type="button"
                      disabled={saving}
                      onClick={() => void deleteAddress(saved.uuid)}
                    >
                      Hapus
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                Belum ada alamat tersimpan.
              </p>
            )}

            {addressWarnings.length > 0 && (
              <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-semibold">
                  Periksa kembali alamat yang baru disimpan
                </p>
                <ul className="list-inside list-disc space-y-1">
                  {addressWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
                <div className="flex items-start gap-2">
                  <Checkbox
                    inputId="address-warnings-confirmed"
                    checked={addressWarningsConfirmed}
                    onChange={(event) => {
                      const confirmed = !!event.checked;
                      setAddressWarningsConfirmed(confirmed);
                      setAddressWarningReview(
                        addressWarningsUuid,
                        addressWarningCodes,
                        confirmed
                      );
                    }}
                  />
                  <label htmlFor="address-warnings-confirmed">
                    Saya sudah memeriksa catatan alamat tersebut.
                  </label>
                </div>
              </div>
            )}

            {showAddressForm && (
              <form className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2" onSubmit={createAddress}>
                <label className="form-field">
                  <span>Nama penerima</span>
                  <InputText className="form-input" required value={address.penerima} onChange={(event) => setAddress({ ...address, penerima: event.target.value })} />
                </label>
                <label className="form-field">
                  <span>Nomor HP penerima</span>
                  <InputText className="form-input" required inputMode="tel" value={address.kontak_penerima} onChange={(event) => setAddress({ ...address, kontak_penerima: event.target.value })} />
                </label>
                <div className="sm:col-span-2">
                  <RegionPicker
                    value={addressRegion?.id || ""}
                    label="Wilayah alamat"
                    onChange={(region) => {
                      setAddressRegion(region);
                      if (region?.kode_pos) {
                        setAddress((current) => ({
                          ...current,
                          kode_pos: region.kode_pos || current.kode_pos,
                        }));
                      }
                    }}
                  />
                </div>
                <label className="form-field">
                  <span>Kode pos</span>
                  <InputText className="form-input" required inputMode="numeric" value={address.kode_pos} onChange={(event) => setAddress({ ...address, kode_pos: event.target.value })} />
                </label>
                <label className="form-field">
                  <span>Jenis tempat</span>
                  <Dropdown
                    className="form-input"
                    value={address.jenis_tempat}
                    options={[
                      { label: "Rumah", value: "rumah" },
                      { label: "Apartemen", value: "apartemen" },
                      { label: "Kantor", value: "kantor" },
                      { label: "Lainnya", value: "lainnya" },
                    ]}
                    onChange={(event) =>
                      setAddress({ ...address, jenis_tempat: event.value })
                    }
                  />
                </label>
                <label className="form-field sm:col-span-2">
                  <span>Jalan dan nomor</span>
                  <InputText className="form-input" required minLength={8} value={address.jalan} onChange={(event) => setAddress({ ...address, jalan: event.target.value })} />
                </label>
                <label className="form-field">
                  <span>RT/RW</span>
                  <InputText className="form-input" required value={address.rt_rw} onChange={(event) => setAddress({ ...address, rt_rw: event.target.value })} />
                </label>
                <label className="form-field">
                  <span>Patokan</span>
                  <InputText className="form-input" required value={address.patokan} onChange={(event) => setAddress({ ...address, patokan: event.target.value })} />
                </label>
                <div className="flex gap-2 sm:col-span-2">
                  <Button className="primary-action" type="submit" disabled={saving}>
                    {saving ? "Menyimpan…" : "Simpan alamat"}
                  </Button>
                  <Button className="secondary-action" type="button" onClick={() => setShowAddressForm(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            )}
          </section>
        </>
      )}

      <div className="flex flex-wrap gap-3">
        <Link className="secondary-action" to="/pesanan">
          Pesanan saya
        </Link>
        <Link className="secondary-action" to="/favorit">
          Barang favorit
        </Link>
        <Button className="secondary-action" type="button" onClick={signOut}>
          Keluar
        </Button>
        <Button className="text-sm font-semibold text-red-700 underline" type="button" disabled={saving} onClick={() => void deleteAccount()}>
          Hapus akun
        </Button>
      </div>
    </div>
  );
};
