import React, { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Skeleton } from "primereact/skeleton";
import { AdministrativeRegionPicker } from "../components/AdministrativeRegionPicker";
import { useBuyer } from "../context/BuyerContext";
import { ApiClientError, publicApi } from "../services/publicApi";
import { BuyerAddress, BuyerProfileCompleteness } from "../types";
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
  const {
    token,
    signOut,
    setAddressWarningReview,
    buyerUser,
    setBuyerUser,
    profileCompleteness,
    setProfileCompleteness,
    setSelectedRegion,
  } = useBuyer();
  const navigate = useNavigate();
  const [completeness, setCompleteness] =
    useState<BuyerProfileCompleteness | null>(profileCompleteness);
  const [addresses, setAddresses] = useState<BuyerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState(buyerUser?.nama_lengkap || "");
  const [profileRegionCodes, setProfileRegionCodes] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [email, setEmail] = useState(buyerUser?.email || "");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [address, setAddress] = useState(emptyAddress);
  const [addressRegionCodes, setAddressRegionCodes] = useState<string[]>([]);
  const [editingAddressUuid, setEditingAddressUuid] = useState<string | null>(
    null
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [qrInput, setQrInput] = useState("");
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
      const comp = profileResult.value;
      setCompleteness(comp);
      setProfileCompleteness(comp);
      if (comp.user) {
        setBuyerUser({
          id: comp.user.id,
          nama_lengkap: comp.user.nama_lengkap || undefined,
          email: comp.user.email || undefined,
          phone: comp.user.phone || undefined,
        });
        if (comp.user.nama_lengkap) {
          setName(comp.user.nama_lengkap);
        }
        if (comp.user.email) {
          setEmail(comp.user.email);
        }
        const codes = [
          comp.user.province_code,
          comp.user.regency_code,
          comp.user.district_code,
          comp.user.village_code,
        ].filter((c): c is string => Boolean(c));
        if (codes.length > 0) {
          setProfileRegionCodes(codes);
        } else if (comp.user.village_code || comp.user.wilayah_code) {
          const code = comp.user.village_code || comp.user.wilayah_code || "";
          const parts = code.split(".");
          if (parts.length === 4) {
            setProfileRegionCodes([
              parts[0],
              `${parts[0]}.${parts[1]}`,
              `${parts[0]}.${parts[1]}.${parts[2]}`,
              code,
            ]);
          }
        }
      }
      if (
        comp.user?.terms_accepted_at ||
        !comp.missing.includes("TERMS_NOT_ACCEPTED")
      ) {
        setAcceptedTerms(true);
      }
      const needsProfileInput =
        comp.missing.includes("NAME_MISSING") ||
        comp.missing.includes("REGION_MISSING") ||
        comp.missing.includes("TERMS_NOT_ACCEPTED");
      setShowProfileForm(needsProfileInput);
      setShowEmailForm(comp.missing.includes("EMAIL_UNVERIFIED"));
      if (
        (comp.missing.includes("ADDRESS_MISSING") ||
          comp.missing.includes("ADDRESS_INVALID")) &&
        addressResult.status === "fulfilled" &&
        addressResult.value.length === 0
      ) {
        setShowAddressForm(true);
      }
    }
    if (addressResult.status === "fulfilled") {
      setAddresses(addressResult.value);
      const defaultAddr =
        addressResult.value.find((a) => a.utama || a.is_default) ||
        addressResult.value[0];
      if (!name && defaultAddr?.penerima) {
        setName(defaultAddr.penerima);
      }
      if (
        profileRegionCodes.length === 0 &&
        defaultAddr?.province_code &&
        defaultAddr?.regency_code &&
        defaultAddr?.district_code &&
        defaultAddr?.village_code
      ) {
        setProfileRegionCodes([
          defaultAddr.province_code,
          defaultAddr.regency_code,
          defaultAddr.district_code,
          defaultAddr.village_code,
        ]);
      }
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
    document.title = "Akun Pembeli — Barokahinn";
    void loadAccount();
  }, [token]);

  if (!token) {
    return <Navigate to="/masuk?next=%2Fakun" replace />;
  }

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const deepestCode =
      profileRegionCodes[profileRegionCodes.length - 1] || "";
    if (name.trim().length < 3) {
      setError("Nama lengkap minimal 3 karakter.");
      return;
    }
    if (!deepestCode) {
      setError("Pilih wilayah tempat tinggal terlebih dahulu.");
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
      const updated = await publicApi.updateBuyerProfile(token, {
        nama_lengkap: name.trim(),
        ...(profileRegionCodes[3]
          ? { village_code: profileRegionCodes[3] }
          : { wilayah_code: deepestCode }),
        accept_terms: acceptedTerms,
        terms_version: "0.5",
      });
      setCompleteness(updated);
      setProfileCompleteness(updated);
      setBuyerUser({
        ...buyerUser,
        nama_lengkap: name.trim(),
      });
      setShowProfileForm(false);
      if (
        updated.missing.includes("ADDRESS_MISSING") ||
        updated.missing.includes("ADDRESS_INVALID")
      ) {
        if (addresses.length === 0) {
          setShowAddressForm(true);
        }
        setNotice(
          "Data profil tersimpan. Lanjutkan dengan menambahkan alamat pengiriman di bawah."
        );
      } else {
        setNotice("Data profil tersimpan.");
      }
      await loadAccount();
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.fields) {
        const detail = Object.values(cause.fields).flat().join(" ");
        setError(detail || cause.message);
      } else {
        setError(cause instanceof Error ? cause.message : "Profil gagal disimpan.");
      }
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
      const res = await publicApi.requestBuyerEmailVerification(
        token,
        email.trim()
      );
      if (res.profile_completeness) {
        setCompleteness(res.profile_completeness);
        setProfileCompleteness(res.profile_completeness);
      }
      setNotice("Tautan verifikasi dikirim. Buka email untuk menyelesaikan verifikasi.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Verifikasi email gagal diminta."
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditAddress = (saved: BuyerAddress) => {
    setError(null);
    setNotice(null);
    setEditingAddressUuid(saved.uuid);
    setAddress({
      penerima: saved.penerima || "",
      kontak_penerima: saved.kontak_penerima || "",
      region_id: saved.region_id ? String(saved.region_id) : "",
      kode_pos: saved.kode_pos || "",
      jalan: saved.jalan_nomor_enc || "",
      rt_rw: saved.rt_rw || "",
      patokan: saved.patokan || "",
      jenis_tempat: saved.jenis_tempat || "rumah",
    });
    const codes = [
      saved.province_code,
      saved.regency_code,
      saved.district_code,
      saved.village_code,
    ].filter((c): c is string => Boolean(c));
    setAddressRegionCodes(codes);
    setShowAddressForm(true);
  };

  const cancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressUuid(null);
    setAddress(emptyAddress);
    setAddressRegionCodes([]);
  };

  const saveAddress = async (event: FormEvent) => {
    event.preventDefault();
    const [provinceCode, regencyCode, districtCode, villageCode] =
      addressRegionCodes;
    if (!provinceCode || !regencyCode || !districtCode || !villageCode) {
      setError("Pilih wilayah alamat sampai tingkat kelurahan/desa.");
      return;
    }
    if (!editingAddressUuid && addresses.length >= 5) {
      setError("Buku alamat maksimal berisi lima alamat.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload = {
        ...address,
        province_code: provinceCode,
        regency_code: regencyCode,
        district_code: districtCode,
        village_code: villageCode,
        is_default: editingAddressUuid
          ? addresses.find((a) => a.uuid === editingAddressUuid)?.utama ??
          false
          : addresses.length === 0,
      };
      const saved = editingAddressUuid
        ? await publicApi.updateBuyerAddress(
          token,
          editingAddressUuid,
          payload
        )
        : await publicApi.createBuyerAddress(token, payload);

      setAddresses((current) =>
        editingAddressUuid
          ? current.map((a) => (a.uuid === editingAddressUuid ? saved : a))
          : [...current, saved]
      );
      if (saved.profile_completeness) {
        setCompleteness(saved.profile_completeness);
        setProfileCompleteness(saved.profile_completeness);
      }
      if (
        (saved.utama || saved.is_default || addresses.length === 0) &&
        saved.region_nama &&
        (saved.village_code || saved.region_id)
      ) {
        setSelectedRegion({
          id: String(saved.village_code || saved.region_id),
          nama: saved.region_nama,
        });
      }
      setShowAddressForm(false);
      setEditingAddressUuid(null);
      setAddress(emptyAddress);
      setAddressRegionCodes([]);
      const warnings = saved.warnings || [];
      setAddressWarningCodes(warnings);
      setAddressWarnings(getAddressWarningMessages(warnings));
      setAddressWarningsConfirmed(warnings.length === 0);
      setAddressWarningsUuid(saved.uuid);
      setAddressWarningReview(saved.uuid, warnings, warnings.length === 0);
      setNotice(
        editingAddressUuid ? "Alamat diperbarui." : "Alamat tersimpan."
      );
      await loadAccount();
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.fields) {
        const detail = Object.values(cause.fields).flat().join(" ");
        setError(detail || cause.message);
      } else {
        setError(
          cause instanceof Error ? cause.message : "Alamat gagal disimpan."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const setDefaultAddress = async (uuid: string) => {
    if (!token) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await publicApi.updateBuyerAddress(token, uuid, {
        is_default: true,
      });
      setAddresses((current) =>
        current.map((a) =>
          a.uuid === uuid
            ? { ...updated, utama: true, is_default: true }
            : { ...a, utama: false, is_default: false }
        )
      );
      if (updated.profile_completeness) {
        setCompleteness(updated.profile_completeness);
        setProfileCompleteness(updated.profile_completeness);
      }
      setNotice("Alamat utama diperbarui.");
      await loadAccount();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Alamat utama gagal diperbarui."
      );
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

  const missingSet = new Set(completeness?.missing || []);
  const emailVerified = !!completeness && !missingSet.has("EMAIL_UNVERIFIED");
  const phoneVerified = !!completeness && !missingSet.has("PHONE_UNVERIFIED");
  const profileBasicsComplete =
    !!completeness &&
    !missingSet.has("NAME_MISSING") &&
    !missingSet.has("REGION_MISSING") &&
    !missingSet.has("TERMS_NOT_ACCEPTED");
  const addressComplete =
    !!completeness &&
    !missingSet.has("ADDRESS_MISSING") &&
    !missingSet.has("ADDRESS_INVALID");
  const displayName =
    buyerUser?.nama_lengkap || name || buyerUser?.phone || "Pembeli Barokahinn";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  const checklistItems = [
    {
      key: "phone",
      label: "Nomor HP",
      done: phoneVerified,
      detail: buyerUser?.phone || (phoneVerified ? "Terverifikasi" : "Perlu verifikasi OTP"),
    },
    {
      key: "email",
      label: "Email",
      done: emailVerified,
      detail: emailVerified
        ? `${buyerUser?.email || email || "Email"} (Terverifikasi)`
        : "Belum diverifikasi",
    },
    {
      key: "profile",
      label: "Nama & wilayah",
      done: profileBasicsComplete,
      detail: profileBasicsComplete ? "Lengkap" : "Perlu dilengkapi",
    },
    {
      key: "address",
      label: "Alamat pengiriman",
      done: addressComplete,
      detail: addressComplete
        ? `${addresses.length} alamat tersimpan`
        : addresses.length > 0 && missingSet.has("ADDRESS_INVALID")
          ? "Alamat belum valid — klik Edit untuk melengkapi (patokan min. 5 karakter & kode pos 5 digit)"
          : addresses.length > 0 && missingSet.has("ADDRESS_MISSING")
            ? "Klik 'Jadikan utama' pada salah satu alamat tersimpan"
            : "Tambahkan alamat untuk pengiriman",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header Kartu Akun */}
      <header className="form-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-nila font-display text-lg font-bold text-putih">
            {initials || "B"}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-tinta sm:text-2xl">
                {displayName}
              </h1>
              {completeness && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-pil border px-2.5 py-0.5 text-xs font-semibold ${completeness.ready
                    ? "border-teh bg-teh-muda text-teh-tua"
                    : "border-kunyit bg-kunyit-muda text-kunyit-tua"
                    }`}
                >
                  <i
                    className={`pi ${completeness.ready
                      ? "pi-check-circle"
                      : "pi-exclamation-circle"
                      } text-[11px]`}
                    aria-hidden="true"
                  />
                  <span>
                    {completeness.ready ? "Siap Beli" : "Perlu dilengkapi"}
                  </span>
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {[buyerUser?.email || email, buyerUser?.phone]
                .filter(Boolean)
                .join(" · ") || "Akun Pembeli Barokahinn"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="secondary-action" to="/pesanan">
            <i className="pi pi-shopping-bag text-xs" aria-hidden="true" />
            <span>Pesanan saya</span>
          </Link>
          <Link className="secondary-action" to="/favorit">
            <i className="pi pi-heart text-xs" aria-hidden="true" />
            <span>Favorit</span>
          </Link>
          <Button
            type="button"
            label="Keluar"
            icon="pi pi-sign-out"
            outlined
            size="small"
            onClick={signOut}
          />
        </div>
      </header>

      {error && (
        <Message severity="error" text={error} className="w-full justify-start" />
      )}
      {notice && (
        <Message severity="success" text={notice} className="w-full justify-start" />
      )}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <Skeleton height="16rem" borderRadius="12px" />
            <Skeleton height="9rem" borderRadius="12px" />
          </div>
          <div className="lg:col-span-7">
            <Skeleton height="22rem" borderRadius="12px" />
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-12">
          {/* Kolom Kiri: Status Kelengkapan, Verifikasi Email, Profil, QR */}
          <div className="space-y-5 lg:col-span-5">
            <section className="form-card space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-tinta">
                    Status kelengkapan akun
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {completeness?.ready
                      ? "Semua syarat checkout kirim & ambil sudah terpenuhi."
                      : "Lengkapi bagian yang bertanda kuning sebelum checkout."}
                  </p>
                </div>
              </div>

              <ul className="space-y-2">
                {checklistItems.map((item) => (
                  <li
                    key={item.key}
                    className={`flex items-center justify-between gap-3 rounded-kontrol border px-3 py-2 text-xs ${item.done
                      ? "border-teh-muda bg-teh-muda/50 text-teh-tua"
                      : "border-kunyit bg-kunyit-muda/70 text-kunyit-tua"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <i
                        className={`pi ${item.done
                          ? "pi-check-circle text-teh"
                          : "pi-exclamation-circle text-kunyit-tua"
                          } text-sm`}
                        aria-hidden="true"
                      />
                      <span className="font-semibold">{item.label}</span>
                    </div>
                    <span className="text-right font-medium">{item.detail}</span>
                  </li>
                ))}
              </ul>

              {/* Verifikasi Email */}
              <div className="border-t border-garis pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-tinta">
                      Verifikasi Email
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-pil px-2 py-0.5 text-[11px] font-semibold ${emailVerified
                        ? "bg-teh-muda text-teh-tua"
                        : "bg-kunyit-muda text-kunyit-tua"
                        }`}
                    >
                      <i
                        className={`pi ${emailVerified ? "pi-verified" : "pi-clock"
                          } text-[10px]`}
                        aria-hidden="true"
                      />
                      <span>
                        {emailVerified ? "Sudah terverifikasi" : "Belum terverifikasi"}
                      </span>
                    </span>
                  </div>
                  {emailVerified && !showEmailForm && (
                    <Button
                      type="button"
                      label="Ganti email"
                      outlined
                      size="small"
                      onClick={() => setShowEmailForm(true)}
                    />
                  )}
                </div>

                {emailVerified && !showEmailForm ? (
                  <p className="mt-1.5 text-xs text-muted">
                    Emailmu sudah terverifikasi permanen dan tidak perlu verifikasi
                    ulang saat login kembali.
                  </p>
                ) : (
                  <form className="mt-3 space-y-2.5" onSubmit={requestEmailVerification}>
                    <label className="form-field">
                      <span>Alamat email</span>
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
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="submit"
                        label="Kirim tautan verifikasi"
                        icon="pi pi-envelope"
                        size="small"
                        disabled={saving}
                      />
                      {emailVerified && (
                        <Button
                          type="button"
                          label="Batal"
                          outlined
                          size="small"
                          onClick={() => setShowEmailForm(false)}
                        />
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* Profil (Nama, Wilayah, S&K) */}
              <div className="border-t border-garis pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-tinta">
                    Data profil &amp; persetujuan
                  </span>
                  {profileBasicsComplete && !showProfileForm && (
                    <Button
                      type="button"
                      label="Edit profil"
                      icon="pi pi-pencil"
                      outlined
                      size="small"
                      onClick={() => setShowProfileForm(true)}
                    />
                  )}
                </div>

                {profileBasicsComplete && !showProfileForm ? (
                  <p className="mt-1.5 text-xs text-muted">
                    Nama lengkap, wilayah, dan Syarat Layanan sudah tersimpan.
                  </p>
                ) : (
                  <form className="mt-3 grid gap-3" onSubmit={saveProfile}>
                    <label className="form-field">
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
                    <AdministrativeRegionPicker
                      value={profileRegionCodes}
                      label="Wilayah tempat tinggal"
                      onChange={(codes) => setProfileRegionCodes(codes)}
                    />
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        inputId="buyer-terms"
                        checked={acceptedTerms}
                        onChange={(event) => setAcceptedTerms(!!event.checked)}
                        required
                      />
                      <label
                        htmlFor="buyer-terms"
                        className="cursor-pointer text-xs leading-relaxed text-tinta"
                      >
                        Saya menyetujui{" "}
                        <Link
                          className="font-semibold text-nila underline"
                          to="/kebijakan"
                        >
                          Syarat Layanan dan Kebijakan Privasi
                        </Link>
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="submit"
                        label={saving ? "Menyimpan…" : "Simpan profil"}
                        icon="pi pi-check"
                        loading={saving}
                        disabled={saving}
                        size="small"
                      />
                      {profileBasicsComplete && (
                        <Button
                          type="button"
                          label="Batal"
                          outlined
                          size="small"
                          onClick={() => setShowProfileForm(false)}
                        />
                      )}
                    </div>
                  </form>
                )}
              </div>
            </section>

            {/* Setujui Login QR Perangkat Lain */}
            <section className="form-card space-y-3">
              <div>
                <h2 className="text-base font-bold text-tinta">
                  Masuk di perangkat lain (QR)
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Tempel token atau payload QR (<code>barokahiin://qr-login/...</code>)
                  dari layar desktop untuk menyetujui login.
                </p>
              </div>
              <form
                className="flex flex-col gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!qrInput.trim()) return;
                  setSaving(true);
                  setError(null);
                  setNotice(null);
                  try {
                    await publicApi.approveQrLogin(token, qrInput.trim());
                    setQrInput("");
                    setNotice("Login perangkat lain berhasil disetujui.");
                  } catch (cause) {
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : "Gagal menyetujui QR login."
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <InputText
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="barokahiin://qr-login/..."
                  className="w-full"
                />
                <Button
                  type="submit"
                  label="Setujui login"
                  icon="pi pi-qrcode"
                  outlined
                  size="small"
                  disabled={saving || !qrInput.trim()}
                />
              </form>
            </section>
          </div>

          {/* Kolom Kanan: Buku Alamat */}
          <section className="form-card lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-tinta">Buku alamat</h2>
                <p className="mt-0.5 text-xs text-muted">
                  {addresses.length} dari 5 alamat tersimpan.
                </p>
              </div>
              <Button
                type="button"
                label="Tambah alamat"
                icon="pi pi-plus"
                size="small"
                disabled={addresses.length >= 5 || showAddressForm}
                onClick={() => {
                  setEditingAddressUuid(null);
                  setAddress(emptyAddress);
                  setAddressRegionCodes([]);
                  setShowAddressForm(true);
                }}
              />
            </div>

            {addresses.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {addresses.map((saved) => {
                  const isDefault = Boolean(saved.utama || saved.is_default);
                  return (
                    <li
                      className={`rounded-kartu border p-4 ${isDefault
                        ? "border-teh bg-teh-muda/35"
                        : "border-garis bg-putih"
                        }`}
                      key={saved.uuid}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-tinta">
                              {saved.penerima}
                            </p>
                            {isDefault && (
                              <span className="rounded-pil bg-teh-muda px-2 py-0.5 text-[11px] font-semibold text-teh-tua">
                                Utama
                              </span>
                            )}
                            {saved.jenis_tempat && (
                              <span className="rounded-pil bg-kertas px-2 py-0.5 text-[11px] font-medium capitalize text-muted">
                                {saved.jenis_tempat}
                              </span>
                            )}
                          </div>
                          {saved.kontak_penerima && (
                            <p className="text-xs text-muted">
                              {saved.kontak_penerima}
                            </p>
                          )}
                          <p className="text-xs leading-relaxed text-tinta">
                            {saved.jalan_nomor_enc}
                            {saved.rt_rw ? `, ${saved.rt_rw}` : ""}
                            {saved.region_nama ? `, ${saved.region_nama}` : ""}
                            {saved.kode_pos ? ` ${saved.kode_pos}` : ""}
                          </p>
                          {saved.patokan && (
                            <p className="text-xs text-muted">
                              Patokan: {saved.patokan}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                          {!isDefault && (
                            <Button
                              type="button"
                              label="Jadikan utama"
                              icon="pi pi-star"
                              outlined
                              size="small"
                              disabled={saving}
                              onClick={() => void setDefaultAddress(saved.uuid)}
                            />
                          )}
                          <Button
                            type="button"
                            label="Edit"
                            icon="pi pi-pencil"
                            outlined
                            size="small"
                            disabled={saving}
                            onClick={() => startEditAddress(saved)}
                          />
                          <Button
                            type="button"
                            label="Hapus"
                            icon="pi pi-trash"
                            severity="danger"
                            text
                            size="small"
                            disabled={saving}
                            onClick={() => void deleteAddress(saved.uuid)}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg bg-kertas p-4 text-sm text-muted">
                Belum ada alamat tersimpan.
              </p>
            )}

            {addressWarnings.length > 0 && (
              <div className="mt-4 space-y-3 rounded-kartu border border-kunyit bg-kunyit-muda p-4 text-sm text-kunyit-tua">
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
              <form
                className="mt-5 grid gap-4 border-t border-garis pt-5 sm:grid-cols-2"
                onSubmit={saveAddress}
              >
                <p className="text-sm font-bold text-tinta sm:col-span-2">
                  {editingAddressUuid ? "Edit alamat" : "Tambah alamat baru"}
                </p>
                <label className="form-field">
                  <span>Nama penerima</span>
                  <InputText
                    className="form-input"
                    required
                    value={address.penerima}
                    onChange={(event) =>
                      setAddress({ ...address, penerima: event.target.value })
                    }
                  />
                </label>
                <label className="form-field">
                  <span>Nomor HP penerima</span>
                  <InputText
                    className="form-input"
                    required
                    inputMode="tel"
                    value={address.kontak_penerima}
                    onChange={(event) =>
                      setAddress({
                        ...address,
                        kontak_penerima: event.target.value,
                      })
                    }
                  />
                </label>
                <div className="sm:col-span-2">
                  <AdministrativeRegionPicker
                    value={addressRegionCodes}
                    label="Wilayah alamat (pilih sampai kelurahan/desa)"
                    onChange={(codes) => setAddressRegionCodes(codes)}
                  />
                  {addressRegionCodes.length > 0 &&
                    addressRegionCodes.length < 4 && (
                      <p className="mt-1.5 text-xs font-medium text-kunyit-tua">
                        Lanjutkan memilih wilayah sampai tingkat kelurahan/desa.
                      </p>
                    )}
                </div>
                <label className="form-field">
                  <span>Kode pos</span>
                  <InputText
                    className="form-input"
                    required
                    inputMode="numeric"
                    value={address.kode_pos}
                    onChange={(event) =>
                      setAddress({ ...address, kode_pos: event.target.value })
                    }
                  />
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
                  <InputText
                    className="form-input"
                    required
                    minLength={8}
                    value={address.jalan}
                    onChange={(event) =>
                      setAddress({ ...address, jalan: event.target.value })
                    }
                  />
                </label>
                <label className="form-field">
                  <span>RT/RW</span>
                  <InputText
                    className="form-input"
                    required
                    value={address.rt_rw}
                    onChange={(event) =>
                      setAddress({ ...address, rt_rw: event.target.value })
                    }
                  />
                </label>
                <label className="form-field">
                  <span>Patokan</span>
                  <InputText
                    className="form-input"
                    required
                    value={address.patokan}
                    onChange={(event) =>
                      setAddress({ ...address, patokan: event.target.value })
                    }
                  />
                </label>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <Button
                    type="submit"
                    label={
                      saving
                        ? "Menyimpan…"
                        : editingAddressUuid
                          ? "Simpan perubahan"
                          : "Simpan alamat"
                    }
                    icon="pi pi-check"
                    loading={saving}
                    disabled={saving}
                    size="small"
                  />
                  <Button
                    type="button"
                    label="Batal"
                    outlined
                    size="small"
                    onClick={cancelAddressForm}
                  />
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-garis pt-4">
        <Button
          type="button"
          label="Hapus akun"
          icon="pi pi-trash"
          severity="danger"
          text
          size="small"
          disabled={saving}
          onClick={() => void deleteAccount()}
        />
      </div>
    </div>
  );
};
