import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Steps } from "primereact/steps";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { SelectButton } from "primereact/selectbutton";
import { Button } from "primereact/button";
import { CATEGORIES, REGIONS } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { formatRupiah, i18n } from "../i18n/id";
import { ClaimMode, Listing, PriceType } from "../types";

const DRAFT_KEY = "barokahiin_listing_draft_v1";

export const SharePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, selectedRegion, createListing, setAuthModalOpen, notify } = useApp();

  const [step, setStep] = useState(0);

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  };
  const draft = loadDraft();

  const [images, setImages] = useState<string[]>(draft?.images || []);
  const [title, setTitle] = useState<string>(draft?.title || "");
  const [description, setDescription] = useState<string>(draft?.description || "");
  const [categoryId, setCategoryId] = useState<string>(draft?.categoryId || "cat-6");
  const [condition, setCondition] = useState<Listing["condition"]>(
    draft?.condition || "Layak Pakai Baik"
  );
  const [stockTotal, setStockTotal] = useState<number>(draft?.stockTotal || 1);
  const [priceType, setPriceType] = useState<PriceType>(draft?.priceType || "gratis");
  const [priceRupiah, setPriceRupiah] = useState<number>(draft?.priceRupiah || 10000);
  const [claimMode, setClaimMode] = useState<ClaimMode>(draft?.claimMode || "siapa_cepat");

  // Food attributes
  const [consumeHours, setConsumeHours] = useState<number>(draft?.consumeHours || 4);
  const [expiryDays, setExpiryDays] = useState<number>(draft?.expiryDays || 2);
  const [ingredientsOrAllergens, setIngredientsOrAllergens] = useState<string>(
    draft?.ingredientsOrAllergens || ""
  );
  const [halalInfo, setHalalInfo] = useState<"halal_self_declared" | "non_halal" | "tidak_disebutkan">(
    draft?.halalInfo || "halal_self_declared"
  );

  // Location & window
  const [regionId, setRegionId] = useState<string>(draft?.regionId || selectedRegion.id);
  const [exactAddress, setExactAddress] = useState<string>(draft?.exactAddress || "");
  const [landmark, setLandmark] = useState<string>(draft?.landmark || "");
  const [pickupHoursDuration, setPickupHoursDuration] = useState<number>(
    draft?.pickupHoursDuration || 3
  );

  // Auto-save draft locally (LST-01)
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          images,
          title,
          description,
          categoryId,
          condition,
          stockTotal,
          priceType,
          priceRupiah,
          claimMode,
          consumeHours,
          expiryDays,
          ingredientsOrAllergens,
          halalInfo,
          regionId,
          exactAddress,
          landmark,
          pickupHoursDuration,
        })
      );
    } catch {
      // ignore
    }
  }, [
    images,
    title,
    description,
    categoryId,
    condition,
    stockTotal,
    priceType,
    priceRupiah,
    claimMode,
    consumeHours,
    expiryDays,
    ingredientsOrAllergens,
    halalInfo,
    regionId,
    exactAddress,
    landmark,
    pickupHoursDuration,
  ]);

  const selectedCategory = CATEGORIES.find((c) => c.id === categoryId);
  const isFood = selectedCategory?.kind !== "umum";

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= 5) {
      notify("warn", "Maksimal 5 foto");
      return;
    }

    // Client-side resize & compression via canvas (Section 12)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 800;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.75);
        setImages((prev) => [...prev, compressed]);
        notify("success", "Foto dikompresi & ditambahkan");
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const addSamplePhoto = () => {
    if (images.length >= 5) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#ccfbf1"/><text x="300" y="210" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#0f766e">Foto Contoh Barokah</text></svg>`;
    setImages((prev) => [...prev, `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`]);
  };

  const handlePublish = () => {
    if (!currentUser || currentUser.trustLevel !== "L1") {
      setAuthModalOpen(true);
      return;
    }
    if (!title.trim() || !exactAddress.trim()) {
      notify("warn", "Lengkapi data wajib", "Judul dan alamat titik ambil harus diisi.");
      return;
    }
    if (priceType === "berbayar" && (!priceRupiah || priceRupiah <= 0)) {
      notify("warn", "Harga tidak valid", "Harga berbayar harus lebih dari Rp 0.");
      return;
    }
    if (selectedCategory?.kind === "makanan_siap_saji" && pickupHoursDuration > consumeHours) {
      notify(
        "error",
        "Jendela ambil melewati batas konsumsi",
        "Untuk makanan siap saji, jendela ambil tidak boleh lebih lama dari batas konsumsi."
      );
      return;
    }

    const now = Date.now();
    const hour = 3600 * 1000;
    const day = 24 * hour;

    const finalImages =
      images.length > 0
        ? images
        : [
            `data:image/svg+xml;utf8,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#e2e8f0"/><text x="300" y="210" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#334155">${title.slice(0, 24)}</text></svg>`
            )}`,
          ];

    const created = createListing({
      title: title.trim(),
      description: description.trim() || "Barang layak pakai siap diambil.",
      categoryId,
      condition,
      stockTotal,
      stockAvailable: stockTotal,
      claimMode,
      priceType,
      priceRupiah: priceType === "berbayar" ? Math.round(priceRupiah) : null,
      regionId,
      exactAddress: exactAddress.trim(),
      landmark: landmark.trim() || "Hubungi lewat chat saat tiba",
      pickupStart: new Date(now).toISOString(),
      pickupEnd: new Date(now + pickupHoursDuration * hour).toISOString(),
      timezone: "WIB",
      foodAttributes: isFood
        ? {
            kind:
              selectedCategory?.kind === "makanan_siap_saji"
                ? "makanan_siap_saji"
                : "makanan_kemasan",
            madeAt:
              selectedCategory?.kind === "makanan_siap_saji"
                ? new Date(now - 30 * 60000).toISOString()
                : undefined,
            consumeBy:
              selectedCategory?.kind === "makanan_siap_saji"
                ? new Date(now + consumeHours * hour).toISOString()
                : undefined,
            expiryDate:
              selectedCategory?.kind === "makanan_kemasan"
                ? new Date(now + expiryDays * day).toISOString()
                : undefined,
            ingredientsOrAllergens: ingredientsOrAllergens || "-",
            halalInfo,
          }
        : undefined,
      images: finalImages,
    });

    if (created) {
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/barokah/${created.id}`);
    }
  };

  const stepItems = [
    { label: "Foto" },
    { label: "Info" },
    { label: "Harga & Makanan" },
    { label: "Klaim & Lokasi" },
    { label: "Pratinjau" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Bagikan Barokah</h1>
        <p className="text-sm text-slate-600">
          Draf tersimpan otomatis di perangkatmu agar aman jika koneksi terputus.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-6">
        <Steps model={stepItems} activeIndex={step} onSelect={(e) => setStep(e.index)} readOnly={false} />

        {/* Step 0: Photos */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800">1. Unggah 1–5 Foto Barang</h2>
            <p className="text-xs text-slate-600">
              Foto otomatis dikompresi di perangkatmu sebelum diunggah agar hemat kuota.
            </p>
            <div className="flex flex-wrap gap-3">
              {images.map((src, idx) => (
                <div key={idx} className="relative h-24 w-24 rounded-xl overflow-hidden border border-slate-200">
                  <img src={src} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Hapus foto"
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white text-xs"
                  >
                    <i className="pi pi-times" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 touch-target">
                <i className="pi pi-camera" />
                <span>Pilih Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              <Button
                type="button"
                label="Pakai Foto Contoh"
                outlined
                severity="secondary"
                size="small"
                onClick={addSamplePhoto}
              />
            </div>
          </div>
        )}

        {/* Step 1: Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800">2. Informasi Barang / Makanan</h2>
            <div>
              <label htmlFor="lst-title" className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Barang *
              </label>
              <InputText
                id="lst-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
                placeholder="Contoh: Nasi Kotak Ayam Bakar / Meja Belajar Lipat"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori *</label>
              <Dropdown
                value={categoryId}
                options={CATEGORIES.map((c) => ({ label: c.name, value: c.id }))}
                onChange={(e) => setCategoryId(e.value)}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kondisi</label>
                <Dropdown
                  value={condition}
                  options={["Baru", "Layak Pakai Baik", "Bekas Terawat", "Segar / Baru Dimasak"]}
                  onChange={(e) => setCondition(e.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="lst-stock" className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah / Porsi
                </label>
                <InputNumber
                  inputId="lst-stock"
                  value={stockTotal}
                  onValueChange={(e) => setStockTotal(e.value || 1)}
                  min={1}
                  max={50}
                  showButtons
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label htmlFor="lst-desc" className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi
              </label>
              <InputTextarea
                id="lst-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full"
                placeholder="Ceritakan kondisi barang atau makanan dengan jujur..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Price & Food */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800">3. Tipe Harga & Atribut Makanan</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Harga</label>
              <SelectButton
                value={priceType}
                onChange={(e) => setPriceType(e.value || "gratis")}
                options={[
                  { label: "Gratis", value: "gratis" },
                  { label: "Berbayar (Bayar di Tempat)", value: "berbayar" },
                ]}
              />
            </div>

            {priceType === "berbayar" && (
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <label htmlFor="lst-price" className="block text-xs font-semibold text-amber-950">
                  Harga Tetap (Rupiah)
                </label>
                <InputNumber
                  inputId="lst-price"
                  value={priceRupiah}
                  onValueChange={(e) => setPriceRupiah(e.value || 0)}
                  mode="currency"
                  currency="IDR"
                  locale="id-ID"
                  maxFractionDigits={0}
                  className="w-full"
                />
                <p className="text-[11px] text-amber-900">{i18n.price.payOnSiteNotice}</p>
              </div>
            )}

            {isFood && (
              <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
                <p className="text-xs font-bold text-orange-950">
                  Atribut Wajib Makanan ({selectedCategory?.name})
                </p>
                {selectedCategory?.kind === "makanan_siap_saji" ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Batas Konsumsi (Jam dari sekarang) — Otomatis masuk Jalur Segera
                    </label>
                    <InputNumber
                      value={consumeHours}
                      onValueChange={(e) => setConsumeHours(e.value || 2)}
                      min={1}
                      max={24}
                      showButtons
                      suffix=" jam"
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sisa Masa Kedaluwarsa (Hari dari sekarang)
                    </label>
                    <InputNumber
                      value={expiryDays}
                      onValueChange={(e) => setExpiryDays(e.value || 1)}
                      min={1}
                      max={365}
                      showButtons
                      suffix=" hari"
                      className="w-full"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bahan / Alergen
                  </label>
                  <InputText
                    value={ingredientsOrAllergens}
                    onChange={(e) => setIngredientsOrAllergens(e.target.value)}
                    className="w-full"
                    placeholder="Contoh: Kacang, susu, gluten, santan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Info Halal ({i18n.food.halalDisclaimer})
                  </label>
                  <Dropdown
                    value={halalInfo}
                    onChange={(e) => setHalalInfo(e.value)}
                    options={[
                      { label: "Halal (diisi Pemberi)", value: "halal_self_declared" },
                      { label: "Non-Halal", value: "non_halal" },
                      { label: "Tidak disebutkan", value: "tidak_disebutkan" },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Claim Mode & Location */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800">4. Mode Klaim & Titik Ambil</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mode Klaim</label>
              <SelectButton
                value={claimMode}
                onChange={(e) => setClaimMode(e.value || "siapa_cepat")}
                options={[
                  { label: "Siapa Cepat", value: "siapa_cepat" },
                  { label: "Pemberi Memilih", value: "pemberi_memilih" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Durasi Jendela Ambil (WIB)
              </label>
              <InputNumber
                value={pickupHoursDuration}
                onValueChange={(e) => setPickupHoursDuration(e.value || 2)}
                min={1}
                max={120}
                showButtons
                suffix=" jam dari sekarang"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Wilayah</label>
              <Dropdown
                value={regionId}
                options={REGIONS.map((r) => ({
                  label: `${r.district}, ${r.city}`,
                  value: r.id,
                }))}
                onChange={(e) => setRegionId(e.value)}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="lst-addr" className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Titik Ambil * (Hanya dibuka setelah klaim diterima)
              </label>
              <InputText
                id="lst-addr"
                value={exactAddress}
                onChange={(e) => setExactAddress(e.target.value)}
                className="w-full"
                placeholder="Contoh: Jl. Tubagus Ismail No. 10, Coblong"
              />
            </div>

            <div>
              <label htmlFor="lst-landmark" className="block text-xs font-semibold text-slate-700 mb-1">
                Patokan (RT/RW, ciri bangunan)
              </label>
              <InputText
                id="lst-landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full"
                placeholder="Contoh: Pagar hijau dekat pos satpam"
              />
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800">5. Pratinjau Sebelum Publikasi</h2>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{title || "(Belum ada judul)"}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${
                    priceType === "gratis" ? "bg-teal-600" : "bg-amber-500"
                  }`}
                >
                  {priceType === "gratis" ? "GRATIS" : formatRupiah(priceRupiah)}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Kategori: {selectedCategory?.name} · Stok: {stockTotal} · Mode:{" "}
                {claimMode === "siapa_cepat" ? "Siapa cepat" : "Pemberi memilih"}
              </p>
              <p className="text-xs text-slate-600">
                Titik Ambil: {exactAddress || "(Belum diisi)"} ({landmark || "-"})
              </p>
              {(selectedCategory?.kind === "makanan_siap_saji" ||
                (selectedCategory?.kind === "makanan_kemasan" && expiryDays <= 3)) && (
                <p className="text-xs font-semibold text-orange-700">
                  ⚡ Listing ini akan otomatis masuk ke Jalur Segera.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stepper Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <Button
            type="button"
            label="Sebelumnya"
            outlined
            severity="secondary"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          />
          {step < 4 ? (
            <Button
              type="button"
              label="Lanjut"
              icon="pi pi-arrow-right"
              iconPos="right"
              onClick={() => setStep((s) => Math.min(4, s + 1))}
            />
          ) : (
            <Button
              type="button"
              label="Publikasikan Barokah"
              icon="pi pi-check"
              onClick={handlePublish}
            />
          )}
        </div>
      </div>
    </div>
  );
};
