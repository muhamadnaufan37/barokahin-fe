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
      <div className="mx-auto max-w-2xl rounded-kartu-besar border border-teh bg-putih p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-kartu bg-teh text-putih">
            <i className="pi pi-check text-xl" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-xl font-bold text-tinta">
              Pengajuan donasi diterima
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              <span lang="su" className="font-semibold text-nila">
                Hatur nuhun
              </span>{" "}
              (Terima kasih) atas niat baik Anda. Pengajuan barang Anda sudah
              masuk ke antrean admin dengan detail berikut:
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-kartu border border-teh bg-teh-muda p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-teh-tua">Kode barang</p>
              <p className="font-mono text-lg font-bold text-tinta">
                {result.kode_barang}
              </p>
            </div>
            <Tag
              value={`Status: ${result.status.toUpperCase()}`}
              severity="success"
              rounded
            />
          </div>
          <p className="mt-2 text-xs text-teh-tua">
            Admin kami akan menghubungi Anda melalui kontak{" "}
            <strong className="text-tinta">{kontakDonatur}</strong> untuk
            koordinasi penerimaan & kurasi barang. Data pribadi Anda tidak akan
            ditampilkan di publik.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            label="Ajukan barang lain"
            icon="pi pi-plus"
            onClick={resetForm}
          />
          <Link
            to="/katalog"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-pil border border-garis bg-putih px-5 py-2.5 text-sm font-semibold text-tinta hover:bg-kertas"
          >
            Lihat katalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-tinta">
          Ajukan donasi barang
        </h1>
        <p className="mt-1 text-sm text-muted">
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
            <strong className="block text-sm">Privasi donatur terjaga</strong>
            Nama, kontak, dan wilayah Anda hanya digunakan admin untuk
            koordinasi dan <strong>tidak pernah ditampilkan</strong> di
            storefront publik. Kami juga tidak pernah meminta NIK/KTP.
          </div>
        }
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-kartu-besar border border-garis bg-putih p-6 sm:p-8"
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
          <h2 className="border-b border-garis pb-2 text-xs font-bold uppercase tracking-wider text-muted">
            1. Data donatur
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="nama-donatur"
                className="block text-xs font-semibold text-tinta"
              >
                Nama lengkap *
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
                className="block text-xs font-semibold text-tinta"
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
              className="block text-xs font-semibold text-tinta"
            >
              Wilayah (Bandung Raya & sekitarnya)
            </label>
            <InputText
              id="wilayah-donatur"
              value={wilayah}
              onChange={(e) => setWilayah(e.target.value)}
              placeholder="Contoh: Kec. Coblong, Kota Bandung"
              className="w-full"
            />
          </div>

          <div className="flex items-start gap-3 rounded-kartu border border-garis bg-kertas p-3.5 text-xs">
            <Checkbox
              inputId="preferensi-anonim"
              checked={preferensiAnonim}
              onChange={(e) => setPreferensiAnonim(Boolean(e.checked))}
            />
            <label
              htmlFor="preferensi-anonim"
              className="cursor-pointer text-tinta"
            >
              Tampilkan label anonim{" "}
              <strong>"{settings?.label_anonim || "Sahabat Berbagi"}"</strong>{" "}
              di storefront publik (disarankan).
            </label>
          </div>
        </div>

        {/* Section 2: Data Barang */}
        <div className="space-y-4">
          <h2 className="border-b border-garis pb-2 text-xs font-bold uppercase tracking-wider text-muted">
            2. Informasi barang
          </h2>

          <div className="space-y-1">
            <label
              htmlFor="nama-barang"
              className="block text-xs font-semibold text-tinta"
            >
              Nama / jenis barang *
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
                className="block text-xs font-semibold text-tinta"
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
                className="block text-xs font-semibold text-tinta"
              >
                Perkiraan kondisi *
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
                className="block text-xs font-semibold text-tinta"
              >
                Jumlah unit
              </label>
              <InputText
                id="jumlah-barang"
                type="number"
                min={1}
                max={100}
                value={String(jumlah)}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setJumlah(
                    Number.isNaN(val) ? 1 : Math.max(1, Math.min(100, val))
                  );
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
                className="block text-xs font-semibold text-tinta"
              >
                Cara penyerahan *
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
              className="block text-xs font-semibold text-tinta"
            >
              Catatan kondisi / kekurangan (opsional)
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
          <h2 className="border-b border-garis pb-2 text-xs font-bold uppercase tracking-wider text-muted">
            3. Persetujuan donatur *
          </h2>

          <div
            className={`space-y-1 rounded-kartu border p-3.5 text-xs ${
              fieldErrors.persetujuan_jual
                ? "border-bahaya bg-bahaya-muda"
                : "border-garis"
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
                className="cursor-pointer leading-relaxed text-tinta"
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
            className={`space-y-1 rounded-kartu border p-3.5 text-xs ${
              fieldErrors.persetujuan_media
                ? "border-bahaya bg-bahaya-muda"
                : "border-garis"
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
                className="cursor-pointer leading-relaxed text-tinta"
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

        <button
          type="submit"
          disabled={submitting}
          className="btn-cta w-full text-sm"
        >
          <i
            className={`pi ${
              submitting ? "pi-spin pi-spinner" : "pi-gift"
            } text-sm`}
            aria-hidden="true"
          />
          <span>
            {submitting ? "Mengirim pengajuan..." : "Kirim pengajuan donasi"}
          </span>
        </button>
      </form>
    </div>
  );
};
