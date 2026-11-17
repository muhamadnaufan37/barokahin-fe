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
  { label: "Terbaru", value: "terbaru" },
  { label: "Harga Termurah", value: "termurah" },
  { label: "Harga Termahal", value: "termahal" },
];

export const CatalogPage: React.FC = () => {
  const { categories } = useStorefront();
  const [searchParams, setSearchParams] = useSearchParams();

  const kategori = searchParams.get("kategori") || "";
  const status = (searchParams.get("status") || "") as ItemPublicStatus | "";
  const kondisi = (searchParams.get("kondisi") || "") as
    | ItemConditionGrade
    | "";
  const minHarga = searchParams.get("min_harga") || "";
  const maxHarga = searchParams.get("max_harga") || "";
  const q = searchParams.get("q") || "";
  const sort = (searchParams.get("sort") || "terbaru") as ItemSortOption;
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);

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
    document.title = "Katalog Barang — Barokahiin";
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
  }, [kategori, status, kondisi, minHarga, maxHarga, q, sort, page]);

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
  }, [q, kategori, status, kondisi, minHarga, maxHarga, categories]);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Katalog Barang</h1>
        <p className="mt-1 text-sm text-slate-600">
          Barang layak pakai yang telah dikurasi admin. Hasil penjualan
          digunakan untuk mendanai kegiatan.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
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

          <Button
            type="submit"
            label="Terapkan"
            icon="pi pi-filter"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
      </form>

      {/* Results Header */}
      {!loading && !error && pagination && (
        <p className="text-xs text-slate-500">
          Menampilkan <strong>{items.length}</strong> dari{" "}
          <strong>{pagination.total}</strong> barang
        </p>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          onPageChange={handlePageChange}
          className="rounded-2xl border border-slate-200 bg-white"
        />
      )}
    </div>
  );
};
