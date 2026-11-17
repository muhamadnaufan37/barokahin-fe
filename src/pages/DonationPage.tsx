import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import { useStorefront } from "../context/StorefrontContext";
import { ApiClientError, publicApi } from "../services/publicApi";
import { DonationRequestResult, ItemConditionGrade } from "../types";
import { CONDITION_GRADE_META } from "../utils/format";

type DonationFieldErrors = Partial<
  Record<
    | "nama_donatur"
    | "kontak_donatur"
    | "nama_barang"
    | "jumlah"
    | "persetujuan_jual"
    | "persetujuan_media",
    string
  >
>;

const CARA_TERIMA_OPTIONS = [
  { label: "Diantar ke titik kumpul", value: "diantar" },
  { label: "Dijemput petugas (Bandung)", value: "dijemput" },
];

export const DonationPage: React.FC = () => {
  const { categories, settings } = useStorefront();

  const [namaDonatur, setNamaDonatur] = useState("");
  const [kontakDonatur, setKontakDonatur] = useState("");
  const [wilayah, setWilayah] = useState("");
  const [preferensiAnonim, setPreferensiAnonim] = useState(true);
  const [namaBarang, setNamaBarang] = useState("");
  const [kategoriUuid, setKategoriUuid] = useState("");
  const [kondisiGrade, setKondisiGrade] =
    useState<ItemConditionGrade>("baik");
  const [jumlah, setJumlah] = useState<number>(1);
  const [caraTerima, setCaraTerima] = useState<"diantar" | "dijemput">(
    "diantar"
  );
  const [catatan, setCatatan] = useState("");
  const [persetujuanJual, setPersetujuanJual] = useState(false);
  const [persetujuanMedia, setPersetujuanMedia] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<DonationFieldErrors>({});
  const [result, setResult] = useState<DonationRequestResult | null>(null);

  useEffect(() => {
    document.title = "Ajukan Donasi Barang — Barokahiin";
  }, []);

  const categoryOptions = useMemo(
    () => categories.map((cat) => ({ label: cat.nama, value: cat.uuid })),
    [categories]
  );

  const conditionOptions = useMemo(
    () =>
      Object.entries(CONDITION_GRADE_META).map(([key, meta]) => ({
        label: meta.label,
        value: key,
      })),
    []
  );

  const validateForm = (): boolean => {
    const nextErrors: DonationFieldErrors = {};

    if (!namaDonatur.trim()) {
      nextErrors.nama_donatur = "Nama donatur wajib diisi.";
    }
    const cleanedPhone = kontakDonatur.replace(/[\s-]/g, "");
    if (!cleanedPhone) {
      nextErrors.kontak_donatur = "Nomor WhatsApp / HP wajib diisi.";
    } else if (!/^(\+?62|0)8\d{7,12}$/.test(cleanedPhone)) {
      nextErrors.kontak_donatur =
        "Masukkan nomor HP/WhatsApp Indonesia yang valid (contoh: 081234567890).";
    }
    if (!namaBarang.trim()) {
      nextErrors.nama_barang = "Nama / jenis barang wajib diisi.";
    }
    if (jumlah < 1 || jumlah > 100) {
      nextErrors.jumlah = "Jumlah unit harus antara 1 sampai 100.";
    }
    if (!persetujuanJual) {
      nextErrors.persetujuan_jual =
        "Anda harus menyetujui izin penjualan barang.";
    }
    if (!persetujuanMedia) {
      nextErrors.persetujuan_media =
        "Anda harus menyetujui izin publikasi foto/video barang.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      setError("Mohon lengkapi seluruh kolom wajib dan persetujuan di bawah.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await publicApi.createDonationRequest({
        nama_donatur: namaDonatur.trim(),
        kontak_donatur: kontakDonatur.trim(),
        wilayah: wilayah.trim() || undefined,
        preferensi_anonim: preferensiAnonim,
        nama_barang: namaBarang.trim(),
        kategori_uuid: kategoriUuid || undefined,
        kondisi_grade: kondisiGrade,
        jumlah,
        cara_terima: caraTerima,
        catatan: catatan.trim() || undefined,
        persetujuan_jual: persetujuanJual,
        persetujuan_media: persetujuanMedia,
      });
      setResult(res);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.fields) {
          const mapped: DonationFieldErrors = {};
          Object.entries(err.fields).forEach(([k, v]) => {
            const msg = Array.isArray(v) ? v[0] : v;
            if (
              [
                "nama_donatur",
                "kontak_donatur",
                "nama_barang",
                "jumlah",
                "persetujuan_jual",
                "persetujuan_media",
              ].includes(k)
            ) {
              mapped[k as keyof DonationFieldErrors] = msg;
            }
          });
          setFieldErrors(mapped);
        }
        setError(err.message);
      } else {
        setError("Gagal mengirim pengajuan donasi. Silakan coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNamaBarang("");
    setKategoriUuid("");
    setKondisiGrade("baik");
    setJumlah(1);
    setCatatan("");
    setPersetujuanJual(false);
    setPersetujuanMedia(false);
    setFieldErrors({});
    setResult(null);
    setError(null);
  };

  if (result) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <i className="pi pi-check text-xl" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">
              Pengajuan Donasi Diterima
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              Jazakumullahu khairan / terima kasih atas niat baik Anda. Pengajuan
              barang Anda sudah masuk ke antrean admin dengan detail berikut:
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-emerald-800">Kode Barang</p>
              <p className="font-mono text-lg font-bold text-emerald-950">
                {result.kode_barang}
              </p>
            </div>
            <Tag
              value={`Status: ${result.status.toUpperCase()}`}
              severity="success"
              rounded
            />
          </div>
          <p className="mt-2 text-xs text-emerald-900">
            Admin kami akan menghubungi Anda melalui kontak{" "}
            <strong>{kontakDonatur}</strong> untuk koordinasi penerimaan &
            kurasi barang. Data pribadi Anda tidak akan ditampilkan di publik.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            label="Ajukan Barang Lain"
            icon="pi pi-plus"
            onClick={resetForm}
            className="min-h-[44px]"
          />
          <Link
            to="/katalog"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Lihat Katalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Ajukan Donasi Barang
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Serahkan barang layak pakai Anda untuk dikurasi dan dijual oleh admin
          Barokahiin. Seluruh hasil penjualan digunakan untuk mendanai kegiatan.
        </p>
      </div>

      {/* Privacy Notice */}
      <Message
        severity="info"
        className="w-full justify-start"
        content={
          <div className="text-left text-xs leading-relaxed">
            <strong className="block text-sm">Privasi Donatur Terjaga</strong>
            Nama, kontak, dan wilayah Anda hanya digunakan admin untuk
            koordinasi dan <strong>tidak pernah ditampilkan</strong> di
            storefront publik. Kami juga tidak pernah meminta NIK/KTP.
          </div>
        }
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        {error && (
          <Message
            severity="error"
            text={error}
            className="w-full justify-start"
          />
        )}

        {/* Section 1: Data Donatur */}
        <div className="space-y-4">
          <h2 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
            1. Data Donatur
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="nama-donatur"
                className="block text-xs font-semibold text-slate-700"
              >
                Nama Lengkap *
              </label>
              <InputText
                id="nama-donatur"
                value={namaDonatur}
                onChange={(e) => {
                  setNamaDonatur(e.target.value);
                  if (fieldErrors.nama_donatur) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      nama_donatur: undefined,
                    }));
                  }
                }}
                placeholder="Nama Anda"
                invalid={!!fieldErrors.nama_donatur}
                className="w-full"
              />
              {fieldErrors.nama_donatur && (
                <small className="p-error block">
                  {fieldErrors.nama_donatur}
                </small>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="kontak-donatur"
                className="block text-xs font-semibold text-slate-700"
              >
                Nomor WhatsApp / HP *
              </label>
              <InputText
                id="kontak-donatur"
                type="tel"
                value={kontakDonatur}
                onChange={(e) => {
                  setKontakDonatur(e.target.value);
                  if (fieldErrors.kontak_donatur) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      kontak_donatur: undefined,
                    }));
                  }
                }}
                placeholder="081234567890"
                invalid={!!fieldErrors.kontak_donatur}
                className="w-full"
              />
              {fieldErrors.kontak_donatur && (
                <small className="p-error block">
                  {fieldErrors.kontak_donatur}
                </small>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="wilayah-donatur"
              className="block text-xs font-semibold text-slate-700"
            >
              Wilayah (Bandung & Sekitarnya)
            </label>
            <InputText
              id="wilayah-donatur"
              value={wilayah}
              onChange={(e) => setWilayah(e.target.value)}
              placeholder="Contoh: Kec. Coblong, Kota Bandung"
              className="w-full"
            />
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
            <Checkbox
              inputId="preferensi-anonim"
              checked={preferensiAnonim}
              onChange={(e) => setPreferensiAnonim(Boolean(e.checked))}
            />
            <label
              htmlFor="preferensi-anonim"
              className="cursor-pointer text-slate-700"
            >
              Tampilkan label anonim{" "}
              <strong>"{settings?.label_anonim || "Sahabat Berbagi"}"</strong>{" "}
              di storefront publik (disarankan).
            </label>
          </div>
        </div>

        {/* Section 2: Data Barang */}
        <div className="space-y-4">
          <h2 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
            2. Informasi Barang
          </h2>

          <div className="space-y-1">
            <label
              htmlFor="nama-barang"
              className="block text-xs font-semibold text-slate-700"
            >
              Nama / Jenis Barang *
            </label>
            <InputText
              id="nama-barang"
              value={namaBarang}
              onChange={(e) => {
                setNamaBarang(e.target.value);
                if (fieldErrors.nama_barang) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    nama_barang: undefined,
                  }));
                }
              }}
              placeholder="Contoh: Jaket Outdoor Size L, Rice Cooker 1.8L"
              invalid={!!fieldErrors.nama_barang}
              className="w-full"
            />
            {fieldErrors.nama_barang && (
              <small className="p-error block">
                {fieldErrors.nama_barang}
              </small>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="kategori-barang"
                className="block text-xs font-semibold text-slate-700"
              >
                Kategori
              </label>
              <Dropdown
                inputId="kategori-barang"
                value={kategoriUuid || null}
                options={categoryOptions}
                placeholder="Pilih kategori (opsional)"
                showClear
                filter={categoryOptions.length > 3}
                filterPlaceholder="Cari kategori..."
                onChange={(e) => setKategoriUuid(String(e.value ?? ""))}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="kondisi-barang"
                className="block text-xs font-semibold text-slate-700"
              >
                Perkiraan Kondisi *
              </label>
              <Dropdown
                inputId="kondisi-barang"
                value={kondisiGrade}
                options={conditionOptions}
                placeholder="Pilih kondisi barang"
                filter={conditionOptions.length > 3}
                filterPlaceholder="Cari kondisi..."
                onChange={(e) =>
                  setKondisiGrade(e.value as ItemConditionGrade)
                }
                className="w-full"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="jumlah-barang"
                className="block text-xs font-semibold text-slate-700"
              >
                Jumlah Unit
              </label>
              <InputText
                id="jumlah-barang"
                type="number"
                min={1}
                max={100}
                value={String(jumlah)}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setJumlah(Number.isNaN(val) ? 1 : Math.max(1, Math.min(100, val)));
                  if (fieldErrors.jumlah) {
                    setFieldErrors((prev) => ({ ...prev, jumlah: undefined }));
                  }
                }}
                invalid={!!fieldErrors.jumlah}
                className="w-full"
              />
              {fieldErrors.jumlah && (
                <small className="p-error block">{fieldErrors.jumlah}</small>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="cara-terima"
                className="block text-xs font-semibold text-slate-700"
              >
                Cara Penyerahan *
              </label>
              <Dropdown
                inputId="cara-terima"
                value={caraTerima}
                options={CARA_TERIMA_OPTIONS}
                placeholder="Pilih cara penyerahan"
                filter={CARA_TERIMA_OPTIONS.length > 3}
                filterPlaceholder="Cari cara penyerahan..."
                onChange={(e) =>
                  setCaraTerima(e.value as "diantar" | "dijemput")
                }
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="catatan-barang"
              className="block text-xs font-semibold text-slate-700"
            >
              Catatan Kondisi / Kekurangan (opsional)
            </label>
            <InputTextarea
              id="catatan-barang"
              rows={3}
              autoResize
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Ceritakan singkat kondisi barang, kelengkapan, atau waktu terbaik untuk dihubungi."
              className="w-full"
            />
          </div>
        </div>

        {/* Section 3: Persetujuan */}
        <div className="space-y-3">
          <h2 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
            3. Persetujuan Donatur *
          </h2>

          <div
            className={`space-y-1 rounded-xl border p-3.5 text-xs ${
              fieldErrors.persetujuan_jual
                ? "border-rose-400 bg-rose-50/40"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                inputId="persetujuan-jual"
                checked={persetujuanJual}
                invalid={!!fieldErrors.persetujuan_jual}
                onChange={(e) => {
                  setPersetujuanJual(Boolean(e.checked));
                  if (fieldErrors.persetujuan_jual) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      persetujuan_jual: undefined,
                    }));
                  }
                }}
              />
              <label
                htmlFor="persetujuan-jual"
                className="cursor-pointer leading-relaxed text-slate-700"
              >
                Saya menyatakan barang ini layak pakai dan{" "}
                <strong>
                  menyetujui barang ini dikurasi serta dijual oleh pengelola
                  Barokahiin
                </strong>{" "}
                untuk pendanaan kegiatan sosial/keagamaan.
              </label>
            </div>
            {fieldErrors.persetujuan_jual && (
              <small className="p-error block pl-7">
                {fieldErrors.persetujuan_jual}
              </small>
            )}
          </div>

          <div
            className={`space-y-1 rounded-xl border p-3.5 text-xs ${
              fieldErrors.persetujuan_media
                ? "border-rose-400 bg-rose-50/40"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                inputId="persetujuan-media"
                checked={persetujuanMedia}
                invalid={!!fieldErrors.persetujuan_media}
                onChange={(e) => {
                  setPersetujuanMedia(Boolean(e.checked));
                  if (fieldErrors.persetujuan_media) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      persetujuan_media: undefined,
                    }));
                  }
                }}
              />
              <label
                htmlFor="persetujuan-media"
                className="cursor-pointer leading-relaxed text-slate-700"
              >
                Saya{" "}
                <strong>
                  menyetujui foto dan video barang ditampilkan di storefront
                  publik
                </strong>{" "}
                Barokahiin (tanpa menampilkan identitas pribadi saya).
              </label>
            </div>
            {fieldErrors.persetujuan_media && (
              <small className="p-error block pl-7">
                {fieldErrors.persetujuan_media}
              </small>
            )}
          </div>
        </div>

        <Button
          type="submit"
          label={submitting ? "Mengirim Pengajuan..." : "Kirim Pengajuan Donasi"}
          icon="pi pi-gift"
          loading={submitting}
          className="w-full justify-center"
        />
      </form>
    </div>
  );
};
