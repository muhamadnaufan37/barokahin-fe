import React, { useEffect, useRef, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { PublicAdministrativeRegion } from "../types";
import { publicApi } from "../services/publicApi";

interface AdministrativeRegionPickerProps {
  value: string[];
  onChange: (codes: string[], names: string[]) => void;
  label?: string;
}

const FIELD_LABELS = [
  "Provinsi",
  "Kabupaten/Kota",
  "Kecamatan",
  "Kelurahan/Desa",
];

async function getChildren(
  level: number,
  code: string
): Promise<PublicAdministrativeRegion[]> {
  switch (level) {
    case 0:
      return publicApi.getAdministrativeRegencies(code);
    case 1:
      return publicApi.getAdministrativeDistricts(code);
    case 2:
      return publicApi.getAdministrativeVillages(code);
    default:
      return [];
  }
}

export const AdministrativeRegionPicker: React.FC<
  AdministrativeRegionPickerProps
> = ({ value, onChange, label = "Wilayah administratif" }) => {
  const [levels, setLevels] = useState<PublicAdministrativeRegion[][]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>(value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const lastEmittedValueKey = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueKey = value.join("|");
  const provinces = levels[0];

  useEffect(() => {
    let active = true;
    setLoading(true);
    publicApi
      .getAdministrativeProvinces()
      .then((regions) => {
        if (active) setLevels([regions]);
      })
      .catch((cause) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Wilayah administratif belum bisa dimuat."
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
    if (!provinces) return;
    if (valueKey === lastEmittedValueKey.current) {
      lastEmittedValueKey.current = null;
      return;
    }
    let active = true;

    const restoreSelection = async () => {
      if (!valueKey) {
        setSelectedCodes((prev) => (prev.length ? [] : prev));
        setLevels((prev) => (prev.length > 1 ? [provinces] : prev));
        return;
      }

      const requestedCodes = valueKey.split("|");
      const restoredCodes: string[] = [];
      const restoredNames: string[] = [];
      const restoredLevels = [provinces];
      let options = provinces;
      setLoading(true);

      try {
        for (let index = 0; index < requestedCodes.length; index += 1) {
          const region = options.find(
            (entry) => entry.code === requestedCodes[index]
          );
          if (!region) break;

          restoredCodes.push(region.code);
          restoredNames.push(region.name);
          if (index === requestedCodes.length - 1 || index >= 3) break;

          options = await getChildren(index, region.code);
          if (!active || options.length === 0) break;
          restoredLevels.push(options);
        }

        if (!active) return;
        setSelectedCodes(restoredCodes);
        setLevels(restoredLevels);
        if (restoredCodes.length) onChangeRef.current(restoredCodes, restoredNames);
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

    void restoreSelection();
    return () => {
      active = false;
    };
  }, [provinces, valueKey]);

  const handleChange = async (index: number, code: string) => {
    const currentOptions = levels[index] || [];
    const selected = currentOptions.find((entry) => entry.code === code);
    const nextCodes = selected
      ? [...selectedCodes.slice(0, index), selected.code]
      : selectedCodes.slice(0, index);
    const nextNames = levels
      .slice(0, index)
      .map((options, pathIndex) =>
        options.find((entry) => entry.code === nextCodes[pathIndex])?.name
      )
      .filter((name): name is string => Boolean(name));
    if (selected) nextNames.push(selected.name);

    const currentRequestId = ++requestId.current;
    lastEmittedValueKey.current = nextCodes.join("|");
    setSelectedCodes(nextCodes);
    setLevels((current) => current.slice(0, index + 1));
    setError(null);
    onChange(nextCodes, nextNames);
    if (!selected || index >= 3) return;

    setLoading(true);
    try {
      const children = await getChildren(index, selected.code);
      if (requestId.current === currentRequestId && children.length) {
        setLevels((current) => [...current.slice(0, index + 1), children]);
      }
    } catch (cause) {
      if (requestId.current === currentRequestId) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Wilayah lanjutan gagal dimuat."
        );
      }
    } finally {
      if (requestId.current === currentRequestId) setLoading(false);
    }
  };

  return (
    <fieldset className="region-picker space-y-3">
      <legend className="text-sm font-semibold text-tinta">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {levels.map((options, index) => (
          <label className="region-picker-field min-w-0" key={index}>
            <span className="mb-1 block text-xs font-medium text-muted">
              {FIELD_LABELS[index]}
            </span>
            <Dropdown
              aria-label={FIELD_LABELS[index]}
              value={selectedCodes[index] || null}
              options={options.map((region) => ({
                label: region.name,
                value: region.code,
              }))}
              optionLabel="label"
              optionValue="value"
              placeholder={
                index === 0
                  ? "Pilih provinsi"
                  : `Pilih ${FIELD_LABELS[index].toLowerCase()}`
              }
              showClear
              filter
              filterBy="label"
              filterPlaceholder="Cari wilayah"
              emptyFilterMessage="Wilayah tidak ditemukan"
              className="region-picker-dropdown w-full"
              panelClassName="region-picker-panel"
              onChange={(event) =>
                void handleChange(index, String(event.value || ""))
              }
              disabled={loading}
            />
          </label>
        ))}
      </div>
      {loading && (
        <p className="text-xs text-muted" role="status">
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
