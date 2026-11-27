import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "primereact/button";
import { Chip } from "primereact/chip";
import { Dropdown } from "primereact/dropdown";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Paginator, PaginatorPageChangeEvent } from "primereact/paginator";
import { Skeleton } from "primereact/skeleton";
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
import { kategoriToSlug } from "../utils/category";
import { formatRupiah, getConditionLabel } from "../utils/format";

const CONDITION_OPTIONS = [
  { label: "Grade A, sangat baik", value: "sangat_baik" },
  { label: "Grade B, baik", value: "baik" },
  { label: "Grade C, cukup", value: "cukup" },
];

const STATUS_OPTIONS = [
  { label: "Tersedia", value: "terbit" },
  { label: "Ditahan", value: "dipesan" },
  { label: "Terjual", value: "terjual" },
];

const SORT_OPTIONS = [
  { label: "Terbaru", value: "terbaru" },
  { label: "Harga termurah", value: "termurah" },
  { label: "Harga termahal", value: "termahal" },
];

const SERAH_OPTIONS = [
  { label: "Ambil di tempat", value: "ambil" },
  { label: "Kirim ke alamat", value: "kirim" },
];

const CHARITY_OPTIONS = [
  { label: "Program charity", value: "true" },
  { label: "Penjualan reguler", value: "false" },
];

export const CatalogPage: React.FC = () => {
  const { categories } = useStorefront();
  const { selectedRegion } = useBuyer();
  const [searchParams, setSearchParams] = useSearchParams();

  const kategori = searchParams.get("kategori") || "";
  const status = (searchParams.get("status") || "") as ItemPublicStatus | "";
  const kondisi = (searchParams.get("kondisi") || "") as
    | ItemConditionGrade
    | "";
  const minHarga = searchParams.get("min_harga") || "";
  const maxHarga = searchParams.get("max_harga") || "";
  const q = searchParams.get("q") || "";
  const serah = (searchParams.get("serah") || "") as "ambil" | "kirim" | "";
  const charity = searchParams.get("charity") || "";
  const wilayahMode = searchParams.get("wilayah") || "";
  const sort = (searchParams.get("sort") || "terbaru") as ItemSortOption;
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);

  const activeRegencyCode = useMemo(() => {
    if (wilayahMode === "semua" || !selectedRegion?.id) return undefined;
    const parts = selectedRegion.id.split(".");
    return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : undefined;
  }, [wilayahMode, selectedRegion?.id]);

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

  useEffect(() => {
    document.title = "Katalog Barang — Barokahinn";
  }, []);

  useEffect(() => {
    setSearchInput(q);
    setMinInput(minHarga ? Number(minHarga) : null);
    setMaxInput(maxHarga ? Number(maxHarga) : null);
  }, [q, minHarga, maxHarga]);

  const selectedCategoryObj = useMemo(
    () =>
      categories.find((c) => c.slug === kategori || c.uuid === kategori) ||
      null,
    [categories, kategori]
  );

  const pageCategorySlug = selectedCategoryObj
    ? kategoriToSlug(selectedCategoryObj)
    : kategori
    ? kategoriToSlug(kategori)
    : undefined;

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

  const clearAllFilters = () => {
    setSearchInput("");
    setMinInput(null);
    setMaxInput(null);
    setPriceError(null);
    setSearchParams(new URLSearchParams());
  };

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
          min_harga: minHarga ? Number(minHarga) : undefined,
          max_harga: maxHarga ? Number(maxHarga) : undefined,
          q: q || undefined,
          regency_code: activeRegencyCode,
          serah: serah || undefined,
          charity: charity === "true" ? true : charity === "false" ? false : undefined,
          sort,
          per_page: 12,
          page,
        });
        if (!active) return;
        setItems(res.items);
        setPagination(res.pagination);
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
    minHarga,
    maxHarga,
    q,
    activeRegencyCode,
    serah,
    charity,
    sort,
    page,
  ]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    if (q) chips.push({ key: "q", label: `Cari: "${q}"` });
    if (kategori) {
      chips.push({
        key: "kategori",
        label: `Kategori: ${
          selectedCategoryObj ? selectedCategoryObj.nama : kategori
        }`,
      });
    }
    if (status) {
      const statusLabels: Record<ItemPublicStatus, string> = {
        terbit: "Tersedia",
        dipesan: "Ditahan",
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
    if (serah) {
      chips.push({
        key: "serah",
        label: serah === "ambil" ? "Ambil di tempat" : "Kirim ke alamat",
      });
    }
    if (charity) {
      chips.push({
        key: "charity",
        label: charity === "true" ? "Program charity" : "Penjualan reguler",
      });
    }
    return chips;
  }, [q, kategori, status, kondisi, minHarga, maxHarga, serah, charity, selectedCategoryObj]);

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
  };

  const handlePageChange = (event: PaginatorPageChangeEvent) => {
    updateParam("page", String(event.page + 1));
  };

  return (
    <div
      data-kategori={pageCategorySlug}
      className="kategori-transition space-y-6"
    >
      <div className="border-b-2 border-aksen pb-3">
        <h1 className="font-display text-2xl font-bold text-tinta">
          {selectedCategoryObj
            ? `Katalog ${selectedCategoryObj.nama}`
            : "Katalog barang"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Barang layak pakai di Bandung Raya yang telah dikurasi admin. Hasil
          penjualan digunakan untuk mendanai kegiatan.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="space-y-4 rounded-kartu-besar border border-garis bg-putih p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <IconField iconPosition="left" className="flex-1">
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
          <div>
            <label
              htmlFor="filter-kategori"
              className="mb-1 block text-xs font-medium text-muted"
            >
              Kategori
            </label>
            <Dropdown
              inputId="filter-kategori"
              value={kategori || null}
              options={categoryOptions}
              placeholder="Semua kategori"
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
              className="mb-1 block text-xs font-medium text-muted"
            >
              Kondisi
            </label>
            <Dropdown
              inputId="filter-kondisi"
              value={kondisi || null}
              options={CONDITION_OPTIONS}
              placeholder="Semua kondisi"
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
              className="mb-1 block text-xs font-medium text-muted"
            >
              Status
            </label>
            <Dropdown
              inputId="filter-status"
              value={status || null}
              options={STATUS_OPTIONS}
              placeholder="Tersedia & ditahan"
              showClear
              filter={STATUS_OPTIONS.length > 3}
              filterPlaceholder="Cari status..."
              onChange={(e) => updateParam("status", String(e.value ?? ""))}
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="filter-sort"
              className="mb-1 block text-xs font-medium text-muted"
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
              onChange={(e) =>
                updateParam("sort", String(e.value ?? "terbaru"))
              }
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="filter-min-harga"
                className="mb-1 block text-xs font-medium text-muted"
              >
                Harga min
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
                className="mb-1 block text-xs font-medium text-muted"
              >
                Harga maks
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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="filter-serah"
              className="mb-1 block text-xs font-medium text-muted"
            >
              Cara serah
            </label>
            <Dropdown
              inputId="filter-serah"
              value={serah || null}
              options={SERAH_OPTIONS}
              placeholder="Semua cara serah"
              showClear
              onChange={(e) => updateParam("serah", String(e.value ?? ""))}
              className="w-full"
            />
          </div>
          <div>
            <label
              htmlFor="filter-charity"
              className="mb-1 block text-xs font-medium text-muted"
            >
              Jalur barang
            </label>
            <Dropdown
              inputId="filter-charity"
              value={charity || null}
              options={CHARITY_OPTIONS}
              placeholder="Semua jalur"
              showClear
              onChange={(e) => updateParam("charity", String(e.value ?? ""))}
              className="w-full"
            />
          </div>
        </div>

        {selectedRegion?.nama && (
          <div className="flex flex-wrap items-center gap-2 rounded-kontrol bg-kertas px-3 py-2 text-xs">
            <i className="pi pi-map-marker text-nila" aria-hidden="true" />
            <span className="text-muted">
              {activeRegencyCode ? (
                <>
                  Menampilkan barang sekitar{" "}
                  <strong className="text-tinta">{selectedRegion.nama}</strong>
                </>
              ) : (
                "Menampilkan barang dari semua wilayah"
              )}
            </span>
            <Button
              type="button"
              label={
                activeRegencyCode
                  ? "Tampilkan semua wilayah"
                  : `Filter ${selectedRegion.nama}`
              }
              outlined
              size="small"
              onClick={() =>
                updateParam("wilayah", activeRegencyCode ? "semua" : "")
              }
            />
          </div>
        )}

        {priceError && <small className="p-error block">{priceError}</small>}

        {/* Active Filter Chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-garis pt-3">
            <span className="text-xs font-medium text-muted">
              Filter aktif:
            </span>
            {activeFilterChips.map((chip) => (
              <Chip
                key={chip.key}
                label={chip.label}
                icon="pi pi-check"
                removable
                onRemove={() => {
                  updateParam(chip.key, "");
                  return true;
                }}
                className="bg-aksen-muda text-xs font-semibold text-aksen-tua"
              />
            ))}
            <Button
              type="button"
              label="Hapus semua"
              link
              size="small"
              onClick={clearAllFilters}
              className="p-1 text-xs"
            />
          </div>
        )}
      </form>

      {/* Results Header */}
      {!loading && !error && pagination && (
        <p className="text-xs text-muted">
          Menampilkan <strong className="text-tinta">{items.length}</strong>{" "}
          dari <strong className="text-tinta">{pagination.total}</strong> barang
          di Bandung Raya
        </p>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Skeleton key={idx} height="19rem" borderRadius="12px" />
          ))}
        </div>
      ) : error ? (
        <Message severity="error" text={error} className="w-full justify-start" />
      ) : items.length === 0 ? (
        <div className="rounded-kartu-besar border border-garis bg-putih p-10 text-center">
          <i className="pi pi-inbox text-3xl text-muted" aria-hidden="true" />
          <h2 className="mt-3 text-base font-bold text-tinta">
            Barang tidak ditemukan
          </h2>
          <p className="mt-1 text-xs text-muted">
            Coba ubah kata kunci atau hapus sebagian filter untuk melihat barang
            lainnya.
          </p>
          {activeFilterChips.length > 0 && (
            <Button
              type="button"
              label="Hapus semua filter"
              icon="pi pi-refresh"
              onClick={clearAllFilters}
              className="mt-4"
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item.uuid} item={item} />
          ))}
        </div>
      )}

      {/* PrimeReact Paginator */}
      {pagination && pagination.last_page > 1 && (
        <Paginator
          first={(pagination.current_page - 1) * pagination.per_page}
          rows={pagination.per_page}
          totalRecords={pagination.total}
          pageLinkSize={3}
          onPageChange={handlePageChange}
          className="rounded-kartu border border-garis bg-putih"
        />
      )}
    </div>
  );
};
