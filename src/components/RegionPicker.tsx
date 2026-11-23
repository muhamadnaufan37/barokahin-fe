import React, { useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { PublicRegion } from "../types";
import { publicApi } from "../services/publicApi";

interface RegionPickerProps {
  value: string;
  path?: string[];
  onChange: (
    region: PublicRegion | null,
    path?: string[],
    regionPath?: PublicRegion[]
  ) => void;
  label?: string;
}

export const RegionPicker: React.FC<RegionPickerProps> = ({
  value,
  path,
  onChange,
  label = "Wilayah",
}) => {
  const [levels, setLevels] = useState<PublicRegion[][]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    publicApi
      .getRegions()
      .then((regions) => {
        if (active) setLevels([regions]);
      })
      .catch((cause) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Wilayah belum bisa dimuat."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (levels.length === 0) return;
    if (!value) {
      if (selectedIds.length) {
        setSelectedIds([]);
        setLevels([levels[0]]);
      }
      return;
    }
    if (selectedIds[selectedIds.length - 1] === value) return;
    let active = true;
    const restorePath = async () => {
      const restoredIds: string[] = [];
      const restoredLevels = [levels[0]];
      let options = levels[0];
      const ids = path?.length && path[path.length - 1] === value
        ? path
        : [value];

      setLoading(true);
      try {
        for (const id of ids) {
          const region = options.find((entry) => entry.id === id);
          if (!region) break;
          restoredIds.push(region.id);
          if (region.id === value) break;
          options = await publicApi.getRegions(region.id);
          if (!options.length) break;
          restoredLevels.push(options);
        }
        if (active && restoredIds[restoredIds.length - 1] === value) {
          setSelectedIds(restoredIds);
          setLevels(restoredLevels);
        }
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Wilayah tersimpan gagal dipulihkan."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void restorePath();
    return () => {
      active = false;
    };
  }, [levels, path, selectedIds.length, value]);

  const handleChange = async (index: number, id: string) => {
    const region = levels[index]?.find((entry) => entry.id === id) || null;
    const nextIds = selectedIds.slice(0, index);
    if (region) nextIds[index] = region.id;
    setSelectedIds(nextIds);
    setLevels((current) => current.slice(0, index + 1));
    setError(null);
    const nextPath = region
      ? [
          ...levels.slice(0, index).flatMap((options, pathIndex) => {
            const selected = options.find(
              (entry) => entry.id === nextIds[pathIndex]
            );
            return selected ? [selected] : [];
          }),
          region,
        ]
      : [];
    onChange(region, nextPath.map((entry) => entry.id), nextPath);
    if (!region) return;

    setLoading(true);
    try {
      const children = await publicApi.getRegions(region.id);
      if (children.length) {
        setLevels((current) => [...current.slice(0, index + 1), children]);
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Wilayah lanjutan gagal dimuat."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <fieldset className="region-picker space-y-3">
      <legend className="text-sm font-semibold text-slate-800">
        {label}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {levels.map((options, index) => (
          <label className="region-picker-field min-w-0" key={index}>
            <span className="mb-1 block text-xs font-medium text-slate-600">
              {index === 0
                ? "Provinsi"
                : index === 1
                  ? "Kabupaten/Kota"
                  : index === 2
                    ? "Kecamatan"
                    : "Kelurahan/Desa"}
            </span>
            <Dropdown
              aria-label={index === 0
                ? "Provinsi"
                : index === 1
                  ? "Kabupaten/Kota"
                  : index === 2
                    ? "Kecamatan"
                    : "Kelurahan/Desa"}
              value={selectedIds[index] || null}
              options={options.map((region) => ({
                label: region.nama,
                value: region.id,
              }))}
              optionLabel="label"
              optionValue="value"
              placeholder={
                index === 0 ? "Pilih provinsi" : "Pilih wilayah"
              }
              filter
              filterBy="label"
              filterPlaceholder="Cari wilayah"
              emptyFilterMessage="Wilayah tidak ditemukan"
              className="region-picker-dropdown w-full"
              panelClassName="region-picker-panel"
              onChange={(event) =>
                void handleChange(index, event.value || "")
              }
              disabled={loading && index === 0}
            />
          </label>
        ))}
      </div>
      {loading && (
        <p className="text-xs text-slate-500" role="status">
          Memuat wilayah…
        </p>
      )}
      {error && (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
};
