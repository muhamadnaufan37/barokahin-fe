import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "primereact/button";
import { Chip } from "primereact/chip";
import { Dropdown } from "primereact/dropdown";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Skeleton } from "primereact/skeleton";
import { AdministrativeRegionPicker } from "../components/AdministrativeRegionPicker";
import { ItemCard } from "../components/ItemCard";
import { useBuyer } from "../context/BuyerContext";
import { useStorefront } from "../context/StorefrontContext";
import { publicApi } from "../services/publicApi";
import {
  ItemConditionGrade,
  ItemPublicStatus,
  ItemSortOption,
  PaginationMeta,
  PublicItem,
} from "../types";
import { formatRupiah, getConditionLabel } from "../utils/format";
import { setPageMetadata } from "../utils/seo";

const CONDITION_OPTIONS = [
  { label: "Sangat Baik", value: "sangat_baik" },
  { label: "Baik", value: "baik" },
  { label: "Cukup", value: "cukup" },
];

const STATUS_OPTIONS = [
  { label: "Tersedia", value: "terbit" },
  { label: "Dipesan", value: "dipesan" },
  { label: "Sudah Terjual", value: "terjual" },
];

const SORT_OPTIONS = [
  { label: "Peringkat", value: "peringkat" },
  { label: "Terbaru", value: "terbaru" },
  { label: "Harga Termurah", value: "termurah" },
  { label: "Harga Termahal", value: "termahal" },
];

const REGION_CODE_PARAMS = [
  "province_code",
  "regency_code",
  "district_code",
  "village_code",
] as const;

export const CatalogPage: React.FC = () => {
  const { categories } = useStorefront();
  const { selectedRegion, setSelectedRegion } = useBuyer();
  const [searchParams, setSearchParams] = useSearchParams();

  const administrativeRegionCodes = REGION_CODE_PARAMS.map(
    (key) => searchParams.get(key) || ""
  );
  const hasAdministrativeRegion = administrativeRegionCodes.some(Boolean);
  const [administrativeRegionLabel, setAdministrativeRegionLabel] =
    useState("");
  const kategori = searchParams.get("kategori") || "";
  const region =
    searchParams.get("region") ||
    (!hasAdministrativeRegion ? selectedRegion?.id : "") ||
    "";
  const serah = (searchParams.get("serah") || "") as "ambil" | "kirim" | "";
  const charity = searchParams.get("charity") || "";
  const status = (searchParams.get("status") || "") as ItemPublicStatus | "";
  const kondisi = (searchParams.get("kondisi") || "") as
    | ItemConditionGrade
    | "";
  const minHarga = searchParams.get("min_harga") || "";
  const maxHarga = searchParams.get("max_harga") || "";
  const q = searchParams.get("q") || "";
  const sort = (searchParams.get("sort") || "peringkat") as ItemSortOption;

  const [searchInput, setSearchInput] = useState(q);
  const [minInput, setMinInput] = useState<number | null>(
    minHarga ? Number(minHarga) : null
  );
  const [maxInput, setMaxInput] = useState<number | null>(
    maxHarga ? Number(maxHarga) : null
  );
  const [priceError, setPriceError] = useState<string | null>(null);
  const [items, setItems] = useState<PublicItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  useEffect(() => {
    setPageMetadata({
      title: "Katalog Barang — Barokahiin",
      description:
        "Jelajahi barang layak pakai yang telah dikurasi dan dukung kegiatan kebaikan Barokahiin.",
      path: "/katalog",
    });
  }, []);

  useEffect(() => {
    setSearchInput(q);
    setMinInput(minHarga ? Number(minHarga) : null);
    setMaxInput(maxHarga ? Number(maxHarga) : null);
  }, [q, minHarga, maxHarga]);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ label: c.nama, value: c.slug })),
    [categories]
  );

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== "page") {
      next.delete("page");
    }
    setSearchParams(next);
  };

  const updateAdministrativeRegion = useCallback(
    (codes: string[], names: string[]) => {
      const next = new URLSearchParams(searchParams);
      next.delete("region");
      REGION_CODE_PARAMS.forEach((key, index) => {
        const code = codes[index];
        if (code) next.set(key, code);
        else next.delete(key);
      });
      next.delete("page");
      if (next.toString() !== searchParams.toString()) setSearchParams(next);
      setAdministrativeRegionLabel(names[names.length - 1] || "");
    },
    [searchParams, setSearchParams]
  );

  const clearAllFilters = () => {
    setSearchInput("");
    setMinInput(null);
    setMaxInput(null);
    setPriceError(null);
    setSelectedRegion(null);
    setSearchParams(new URLSearchParams());
    if (window.matchMedia("(max-width: 767px)").matches) {
      closeMobileFilters();
    } else {
      setMobileFiltersOpen(false);
    }
  };

  const closeMobileFilters = () => {
    setMobileFiltersOpen(false);
    window.requestAnimationFrame(() =>
      document.getElementById("catalog-filter-trigger")?.focus()
    );
  };

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = document.getElementById("catalog-filter-panel");
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileFilters();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 767) closeMobileFilters();
    };
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [mobileFiltersOpen]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await publicApi.getItems({
          kategori: kategori || undefined,
          status: status || undefined,
          kondisi: kondisi || undefined,
          region: region || undefined,
          province_code: searchParams.get("province_code") || undefined,
          regency_code: searchParams.get("regency_code") || undefined,
          district_code: searchParams.get("district_code") || undefined,
          village_code: searchParams.get("village_code") || undefined,
          daerah_id: searchParams.get("daerah_id") || undefined,
          desa_id: searchParams.get("desa_id") || undefined,
          kelompok_id: searchParams.get("kelompok_id") || undefined,
          serah: serah || undefined,
          charity: charity ? charity === "true" : undefined,
          min_harga: minHarga ? Number(minHarga) : undefined,
          max_harga: maxHarga ? Number(maxHarga) : undefined,
          q: q || undefined,
          sort,
          per_page: 100,
        });
        if (!active) return;
        setItems(res.items);
        setPagination(res.pagination);
        setVisibleCount(12);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Gagal memuat katalog barang."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [
    kategori,
    status,
    kondisi,
    region,
    serah,
    charity,
    minHarga,
    maxHarga,
    q,
    sort,
    searchParams,
  ]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    if (q) chips.push({ key: "q", label: `Cari: "${q}"` });
    if (kategori) {
      const cat = categories.find(
        (c) => c.slug === kategori || c.uuid === kategori
      );
      chips.push({
        key: "kategori",
        label: `Kategori: ${cat ? cat.nama : kategori}`,
      });
    }
    const selectedAdministrativeCode =
      administrativeRegionCodes.filter(Boolean).slice(-1)[0];
    if (selectedAdministrativeCode) {
      chips.push({
        key: "administrative_region",
        label: `Wilayah: ${administrativeRegionLabel || selectedAdministrativeCode}`,
      });
    } else if (region) {
      chips.push({
        key: "region",
        label: `Wilayah: ${
          selectedRegion?.id === region ? selectedRegion.nama : region
        }`,
      });
    }
    if (serah) {
      chips.push({ key: "serah", label: `Serah: ${serah === "ambil" ? "Ambil" : "Kirim"}` });
    }
    if (charity) {
      chips.push({
        key: "charity",
        label: charity === "true" ? "Barang Charity" : "Barang jual",
      });
    }
    if (status) {
      const statusLabels: Record<ItemPublicStatus, string> = {
        terbit: "Tersedia",
        dipesan: "Dipesan",
        terjual: "Terjual",
      };
      chips.push({ key: "status", label: `Status: ${statusLabels[status]}` });
    }
    if (kondisi) {
      chips.push({
        key: "kondisi",
        label: `Kondisi: ${getConditionLabel(kondisi)}`,
      });
    }
    if (minHarga) {
      chips.push({
        key: "min_harga",
        label: `Min: ${formatRupiah(Number(minHarga))}`,
      });
    }
    if (maxHarga) {
      chips.push({
        key: "max_harga",
        label: `Maks: ${formatRupiah(Number(maxHarga))}`,
      });
    }
    return chips;
  }, [
    q,
    kategori,
    region,
    administrativeRegionCodes.join("|"),
    administrativeRegionLabel,
    serah,
    charity,
    status,
    kondisi,
    minHarga,
    maxHarga,
    categories,
    selectedRegion,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (minInput !== null && maxInput !== null && minInput > maxInput) {
      setPriceError("Harga minimum tidak boleh lebih besar dari harga maksimum.");
      return;
    }
    setPriceError(null);
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set("q", searchInput.trim());
    else next.delete("q");
    if (minInput !== null && minInput >= 0)
      next.set("min_harga", String(minInput));
    else next.delete("min_harga");
    if (maxInput !== null && maxInput >= 0)
      next.set("max_harga", String(maxInput));
    else next.delete("max_harga");
    next.delete("page");
    setSearchParams(next);
    if (window.matchMedia("(max-width: 767px)").matches) {
      closeMobileFilters();
    } else {
      setMobileFiltersOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Katalog Barang</h1>
        <p className="mt-1 text-sm text-slate-600">
          Barang layak pakai yang telah dikurasi admin. Hasil penjualan
          digunakan untuk mendanai kegiatan.
        </p>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="catalog-mobile-search"
        role="search"
      >
        <IconField
          iconPosition="left"
          className="catalog-search-field min-w-0 flex-1"
        >
          <InputIcon className="pi pi-search" />
          <InputText
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari barang..."
            aria-label="Cari barang dalam katalog"
            className="w-full"
          />
        </IconField>
        <Button
          id="catalog-filter-trigger"
          type="button"
          className="catalog-filter-trigger"
          aria-haspopup="dialog"
          aria-expanded={mobileFiltersOpen}
          aria-controls="catalog-filter-panel"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <i className="pi pi-sliders-h" aria-hidden="true" />
          <span>Filter</span>
          {activeFilterChips.length > 0 && (
            <span className="catalog-filter-count">
              {activeFilterChips.length}
            </span>
          )}
        </Button>
      </form>

      <Button
        unstyled
        type="button"
        className={`catalog-sheet-backdrop ${
          mobileFiltersOpen ? "is-open" : ""
        }`}
        aria-label="Tutup filter"
        tabIndex={mobileFiltersOpen ? 0 : -1}
        onClick={closeMobileFilters}
      />

      {/* Filter & Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        id="catalog-filter-panel"
        role={mobileFiltersOpen ? "dialog" : undefined}
        aria-modal={mobileFiltersOpen ? true : undefined}
        aria-labelledby="catalog-filter-title"
        className={`catalog-filter-panel space-y-4 border p-4 ${
          mobileFiltersOpen ? "is-open" : ""
        }`}
      >
        <div className="catalog-sheet-title">
          <strong id="catalog-filter-title">Atur filter</strong>
          <Button type="button" aria-label="Tutup filter" onClick={closeMobileFilters}>
            <i className="pi pi-times" aria-hidden="true" />
          </Button>
        </div>

        <div className="catalog-filter-search hidden flex-col gap-3 md:flex md:flex-row">
          <IconField
            iconPosition="left"
            className="catalog-search-field min-w-0 flex-1"
          >
            <InputIcon className="pi pi-search" />
            <InputText
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama barang atau keterangan..."
              className="w-full"
            />
          </IconField>

          <Button type="submit" label="Terapkan" icon="pi pi-filter" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-5">
            <AdministrativeRegionPicker
              value={administrativeRegionCodes}
              label="Wilayah"
              onChange={updateAdministrativeRegion}
            />
          </div>
          <div>
            <label
              htmlFor="filter-kategori"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Kategori
            </label>
            <Dropdown
              inputId="filter-kategori"
              value={kategori || null}
              options={categoryOptions}
              placeholder="Semua Kategori"
              showClear
              filter={categoryOptions.length > 3}
              filterPlaceholder="Cari kategori..."
              onChange={(e) => updateParam("kategori", String(e.value ?? ""))}
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="filter-kondisi"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Kondisi
            </label>
            <Dropdown
              inputId="filter-kondisi"
              value={kondisi || null}
              options={CONDITION_OPTIONS}
              placeholder="Semua Kondisi"
              showClear
              filter={CONDITION_OPTIONS.length > 3}
              filterPlaceholder="Cari kondisi..."
              onChange={(e) => updateParam("kondisi", String(e.value ?? ""))}
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="filter-status"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Status
            </label>
            <Dropdown
              inputId="filter-status"
              value={status || null}
              options={STATUS_OPTIONS}
              placeholder="Tersedia & Dipesan"
              showClear
              filter={STATUS_OPTIONS.length > 3}
              filterPlaceholder="Cari status..."
              onChange={(e) => updateParam("status", String(e.value ?? ""))}
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="filter-serah"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Cara serah
            </label>
            <Dropdown
              inputId="filter-serah"
              value={serah || null}
              options={[
                { label: "Ambil atau kirim", value: "" },
                { label: "Ambil di toko", value: "ambil" },
                { label: "Kirim", value: "kirim" },
              ]}
              placeholder="Ambil atau kirim"
              onChange={(e) => updateParam("serah", String(e.value ?? ""))}
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="filter-charity"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Jalur barang
            </label>
            <Dropdown
              inputId="filter-charity"
              value={charity || null}
              options={[
                { label: "Semua barang", value: "" },
                { label: "Barang jual", value: "false" },
                { label: "Barang Charity", value: "true" },
              ]}
              placeholder="Semua barang"
              onChange={(e) => updateParam("charity", String(e.value ?? ""))}
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="filter-sort"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Urutkan
            </label>
            <Dropdown
              inputId="filter-sort"
              value={sort}
              options={SORT_OPTIONS}
              placeholder="Urutkan"
              filter={SORT_OPTIONS.length > 3}
              filterPlaceholder="Cari urutan..."
              onChange={(e) => updateParam("sort", String(e.value ?? "terbaru"))}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="filter-min-harga"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Harga Min
              </label>
              <InputNumber
                inputId="filter-min-harga"
                value={minInput}
                onValueChange={(e) => setMinInput(e.value ?? null)}
                min={0}
                step={5000}
                placeholder="0"
                locale="id-ID"
                invalid={!!priceError}
                className="w-full"
                inputClassName="w-full"
              />
            </div>
            <div>
              <label
                htmlFor="filter-max-harga"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Harga Maks
              </label>
              <InputNumber
                inputId="filter-max-harga"
                value={maxInput}
                onValueChange={(e) => setMaxInput(e.value ?? null)}
                min={0}
                step={5000}
                placeholder="∞"
                locale="id-ID"
                invalid={!!priceError}
                className="w-full"
                inputClassName="w-full"
              />
            </div>
          </div>
        </div>

        {priceError && <small className="p-error block">{priceError}</small>}

        {/* Active Filter Chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-xs font-medium text-slate-500">
              Filter aktif:
            </span>
            {activeFilterChips.map((chip) => (
              <Chip
                key={chip.key}
                label={chip.label}
                removable
                onRemove={() => {
                  if (chip.key === "administrative_region") {
                    updateAdministrativeRegion([], []);
                    return true;
                  }
                  if (chip.key === "region") {
                    setSelectedRegion(null);
                  }
                  updateParam(chip.key, "");
                  return true;
                }}
                className="bg-brand-50 text-xs font-medium text-brand-800"
              />
            ))}
            <Button
              type="button"
              label="Reset semua"
              link
              size="small"
              onClick={clearAllFilters}
              className="p-1 text-xs"
            />
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end md:hidden">
          <Button
            type="button"
            label="Hapus semua"
            outlined
            onClick={clearAllFilters}
          />
          <Button
            type="submit"
            label="Tampilkan hasil"
            icon="pi pi-check"
          />
        </div>
      </form>

      {/* Results Header */}
      {!loading && !error && pagination && (
        <p className="text-xs text-slate-500">
          Menampilkan <strong>{Math.min(visibleCount, items.length)}</strong> dari{" "}
          <strong>{pagination.total}</strong> barang
        </p>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="home-item-grid">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} height="18rem" borderRadius="1rem" />
          ))}
        </div>
      ) : error ? (
        <Message severity="error" text={error} className="w-full justify-start" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <i
            className="pi pi-inbox text-3xl text-slate-300"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-base font-bold text-slate-800">
            Barang tidak ditemukan
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Coba ubah kata kunci atau hapus sebagian filter untuk melihat barang
            lainnya.
          </p>
          {activeFilterChips.length > 0 && (
            <Button
              type="button"
              label="Reset Filter"
              icon="pi pi-refresh"
              onClick={clearAllFilters}
              className="mt-4 min-h-[44px]"
            />
          )}
        </div>
      ) : (
        <div className="home-item-grid">
          {items.slice(0, visibleCount).map((item) => (
            <ItemCard key={item.uuid} item={item} />
          ))}
        </div>
      )}

      {!loading && !error && visibleCount < items.length && (
        <div className="flex justify-center">
          <Button
            type="button"
            label="Muat lebih banyak"
            icon="pi pi-plus"
            outlined
            onClick={() => setVisibleCount((count) => count + 12)}
          />
        </div>
      )}
    </div>
  );
};
