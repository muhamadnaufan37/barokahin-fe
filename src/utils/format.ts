import { ItemConditionGrade, ItemPublicStatus } from "../types";

export function formatRupiah(amount: number | null | undefined): string {
  const safeValue = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return `Rp ${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(safeValue)}`;
}

export function formatDateId(isoDate: string | null | undefined): string {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export const CONDITION_GRADE_META: Record<
  ItemConditionGrade,
  { label: string; description: string; badgeClass: string }
> = {
  sangat_baik: {
    label: "Sangat Baik",
    description: "Seperti baru, fungsi optimal, minim atau tanpa tanda pakai.",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  baik: {
    label: "Baik",
    description: "Layak pakai, berfungsi normal dengan tanda pakai wajar.",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  cukup: {
    label: "Cukup",
    description: "Berfungsi, ada kekurangan kosmetik/minor yang dicatat jelas.",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

export function getConditionLabel(grade: ItemConditionGrade | string): string {
  return (
    CONDITION_GRADE_META[grade as ItemConditionGrade]?.label ||
    grade ||
    "Layak Pakai"
  );
}

export const ITEM_STATUS_META: Record<
  ItemPublicStatus,
  { label: string; icon: string; badgeClass: string }
> = {
  terbit: {
    label: "Tersedia",
    icon: "pi pi-check-circle",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  dipesan: {
    label: "Dipesan",
    icon: "pi pi-clock",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  terjual: {
    label: "Terjual",
    icon: "pi pi-verified",
    badgeClass: "bg-slate-200 text-slate-700 border-slate-300",
  },
};

export function normalizeWhatsAppNumber(rawPhone: string | null | undefined): string {
  if (!rawPhone) return "";
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith("62")) {
    return digits;
  }
  return `62${digits}`;
}

export function buildWhatsAppLink(
  rawPhone: string | null | undefined,
  message: string
): string | null {
  const normalized = normalizeWhatsAppNumber(rawPhone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function extractFirstFieldError(
  fields?: Record<string, string[] | string>
): string | null {
  if (!fields) return null;
  const firstValue = Object.values(fields)[0];
  if (!firstValue) return null;
  return Array.isArray(firstValue) ? firstValue[0] : firstValue;
}

const ADDRESS_WARNING_MESSAGES: Record<string, string> = {
  ADDRESS_LOOKS_INCOMPLETE:
    "Alamat terlihat belum lengkap. Pastikan nama jalan, nomor, dan detail wilayah sudah benar.",
  ADDRESS_SUSPICIOUS_TEXT:
    "Sebagian teks alamat perlu diperiksa kembali sebelum digunakan.",
};

export function getAddressWarningMessages(
  warnings: string[] | undefined
): string[] {
  return (warnings || []).map(
    (warning) =>
      ADDRESS_WARNING_MESSAGES[warning] ||
      "Periksa kembali detail alamat ini."
  );
}
