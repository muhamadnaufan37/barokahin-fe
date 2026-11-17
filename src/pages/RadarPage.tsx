import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { SelectButton } from "primereact/selectbutton";
import { Button } from "primereact/button";
import { Chip } from "primereact/chip";
import { Checkbox } from "primereact/checkbox";
import { CATEGORIES } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { i18n } from "../i18n/id";
import { ListingCard } from "../components/ListingCard";
import { RadarMap } from "../components/RadarMap";
import { SponsorCard } from "../components/SponsorCard";

export const RadarPage: React.FC = () => {
  const { listings, selectedRegion, sponsors } = useApp();

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "gratis" | "berbayar">("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [maxDistance, setMaxDistance] = useState<number>(15);
  const [halalOnly, setHalalOnly] = useState(false);

  const urgentListings = useMemo(
    () => listings.filter((l) => l.isUrgent && l.status === "active"),
    [listings]
  );

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (l.status === "removed" || l.status === "cancelled") return false;
      if (!selectedRegion.isPilotBandung && l.regionId !== selectedRegion.id) return false;
      if (priceFilter !== "all" && l.priceType !== priceFilter) return false;
      if (categoryId !== "all" && l.categoryId !== categoryId) return false;
      if (l.distanceKm > maxDistance) return false;
      if (halalOnly && l.foodAttributes?.halalInfo !== "halal_self_declared") return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${l.title} ${l.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [listings, selectedRegion, priceFilter, categoryId, maxDistance, halalOnly, search]);

  const homeSponsor = sponsors.find((s) => s.placement === "home_bottom" && s.active);

  const hasActiveFilters =
    priceFilter !== "all" || categoryId !== "all" || maxDistance < 15 || halalOnly || search !== "";

  const resetFilters = () => {
    setSearch("");
    setPriceFilter("all");
    setCategoryId("all");
    setMaxDistance(15);
    setHalalOnly(false);
  };

  return (
    <div className="space-y-6">
      {/* Out-of-pilot friendly notice (DSC-07) */}
      {!selectedRegion.isPilotBandung && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 text-teal-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold">{i18n.pilot.outOfPilotTitle}</h2>
              <p className="text-sm text-teal-800 mt-1">{i18n.pilot.outOfPilotDesc}</p>
            </div>
            <Link to="/bagikan" className="shrink-0">
              <Button label="Jadilah Pemberi Pertama" icon="pi pi-plus" size="small" />
            </Link>
          </div>
        </div>
      )}

      {/* Jalur Segera Highlight Banner */}
      {selectedRegion.isPilotBandung && urgentListings.length > 0 && (
        <section
          aria-label="Sorotan Jalur Segera"
          className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4 sm:p-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white">
                <i className="pi pi-bolt text-lg" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold text-orange-950">
                  Jalur Segera: {urgentListings.length} Makanan Perlu Segera Diambil
                </h2>
                <p className="text-xs sm:text-sm text-orange-800">
                  Makanan siap saji & kemasan mendekati batas konsumsi di sekitar Bandung.
                </p>
              </div>
            </div>
            <Link to="/segera" className="shrink-0">
              <Button
                label="Lihat Jalur Segera"
                severity="warning"
                size="small"
                icon="pi pi-arrow-right"
                iconPos="right"
                className="touch-target"
              />
            </Link>
          </div>
        </section>
      )}

      {/* Search & Filter Controls */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <span className="p-input-icon-left flex-1">
            <i className="pi pi-search" aria-hidden="true" />
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nasi kotak, meja belajar, buku, mukena..."
              className="w-full"
              aria-label="Cari barang"
            />
          </span>

          <SelectButton
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.value || "all")}
            options={[
              { label: "Semua", value: "all" },
              { label: "Gratis", value: "gratis" },
              { label: "Berbayar", value: "berbayar" },
            ]}
            aria-label="Filter Tipe Harga"
          />

          <SelectButton
            value={viewMode}
            onChange={(e) => setViewMode(e.value || "list")}
            options={[
              { label: "Daftar", value: "list", icon: "pi pi-list" },
              { label: "Peta", value: "map", icon: "pi pi-map" },
            ]}
            aria-label="Mode Tampilan"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Dropdown
            value={categoryId}
            onChange={(e) => setCategoryId(e.value)}
            options={[
              { label: "Semua Kategori", value: "all" },
              ...CATEGORIES.map((c) => ({ label: c.name, value: c.id })),
            ]}
            className="w-full sm:w-56 text-sm"
            aria-label="Filter Kategori"
          />

          <Dropdown
            value={maxDistance}
            onChange={(e) => setMaxDistance(e.value)}
            options={[
              { label: "Radius ≤ 2 km", value: 2 },
              { label: "Radius ≤ 5 km", value: 5 },
              { label: "Radius ≤ 10 km", value: 10 },
              { label: "Radius ≤ 15 km", value: 15 },
            ]}
            className="w-full sm:w-44 text-sm"
            aria-label="Filter Jarak"
          />

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer touch-target px-1">
            <Checkbox
              checked={halalOnly}
              onChange={(e) => setHalalOnly(Boolean(e.checked))}
            />
            <span>Info Halal (diisi Pemberi)</span>
          </label>
        </div>

        {/* Removable Filter Chips (DSC-03) */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">Filter aktif:</span>
            {priceFilter !== "all" && (
              <Chip
                label={priceFilter === "gratis" ? "Gratis saja" : "Berbayar saja"}
                removable
                onRemove={() => {
                  setPriceFilter("all");
                  return true;
                }}
              />
            )}
            {categoryId !== "all" && (
              <Chip
                label={CATEGORIES.find((c) => c.id === categoryId)?.name || "Kategori"}
                removable
                onRemove={() => {
                  setCategoryId("all");
                  return true;
                }}
              />
            )}
            {maxDistance < 15 && (
              <Chip
                label={`≤ ${maxDistance} km`}
                removable
                onRemove={() => {
                  setMaxDistance(15);
                  return true;
                }}
              />
            )}
            {halalOnly && (
              <Chip
                label="Info Halal"
                removable
                onRemove={() => {
                  setHalalOnly(false);
                  return true;
                }}
              />
            )}
            <Button
              label="Reset Semua"
              link
              size="small"
              onClick={resetFilters}
              className="text-xs"
            />
          </div>
        )}
      </section>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900">
          Radar Barokah · {selectedRegion.district}
        </h1>
        <span className="text-xs sm:text-sm text-slate-500">{filtered.length} barang ditemukan</span>
      </div>

      {/* Results Body */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
          <i className="pi pi-search text-3xl text-slate-400" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-800">
            Belum ada barang yang cocok di sekitar sini
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Coba perluas radius pencarian, hapus beberapa filter, atau jadilah yang pertama
            membagikan barang bermanfaat.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            {hasActiveFilters && (
              <Button label="Reset Filter" outlined size="small" onClick={resetFilters} />
            )}
            <Link to="/bagikan">
              <Button label="Bagikan Barokah" icon="pi pi-plus" size="small" />
            </Link>
          </div>
        </div>
      ) : viewMode === "list" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      ) : (
        <RadarMap listings={filtered} />
      )}

      {/* Ethical Sponsor Slot */}
      {homeSponsor && <SponsorCard sponsor={homeSponsor} />}
    </div>
  );
};
