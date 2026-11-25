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
    label: "Grade A, sangat baik",
    description: "Seperti baru, fungsi optimal, minim atau tanpa tanda pakai.",
    badgeClass: "bg-teh-muda text-teh-tua border-teh-muda",
  },
  baik: {
    label: "Grade B, baik",
    description: "Layak pakai, berfungsi normal dengan tanda pakai wajar.",
    badgeClass: "bg-langit-muda text-langit-tua border-langit-muda",
  },
  cukup: {
    label: "Grade C, cukup",
    description: "Berfungsi, ada kekurangan kosmetik/minor yang dicatat jelas.",
    badgeClass: "bg-kunyit-muda text-kunyit-tua border-kunyit-muda",
  },
};

export function getConditionLabel(grade: ItemConditionGrade | string): string {
  return (
    CONDITION_GRADE_META[grade as ItemConditionGrade]?.label ||
    grade ||
    "Layak pakai"
  );
}

export const ITEM_STATUS_META: Record<
  ItemPublicStatus,
  { label: string; icon: string; badgeClass: string }
> = {
  terbit: {
    label: "Tersedia",
    icon: "pi pi-check-circle",
    badgeClass: "bg-teh-muda text-teh-tua border-teh-muda",
  },
  dipesan: {
    label: "Ditahan",
    icon: "pi pi-clock",
    badgeClass: "bg-kunyit-muda text-kunyit-tua border-kunyit-muda",
  },
  terjual: {
    label: "Terjual",
    icon: "pi pi-lock",
    badgeClass: "bg-garis text-muted border-garis",
  },
};

export interface OrderStatusMeta {
  label: string;
  icon: string;
  badgeClass: string;
}

const ORDER_STATUS_META: Record<string, OrderStatusMeta> = {
  menunggu_bayar: {
    label: "Menunggu pembayaran",
    icon: "pi pi-clock",
    badgeClass: "bg-kunyit-muda text-kunyit-tua border-kunyit",
  },
  menunggu_pembayaran: {
    label: "Menunggu pembayaran",
    icon: "pi pi-clock",
    badgeClass: "bg-kunyit-muda text-kunyit-tua border-kunyit",
  },
  pending_payment: {
    label: "Menunggu pembayaran",
    icon: "pi pi-clock",
    badgeClass: "bg-kunyit-muda text-kunyit-tua border-kunyit",
  },
  dibayar: {
    label: "Sudah dibayar",
    icon: "pi pi-check-circle",
    badgeClass: "bg-langit-muda text-langit-tua border-langit",
  },
  disiapkan: {
    label: "Disiapkan",
    icon: "pi pi-box",
    badgeClass: "bg-telang-muda text-telang-tua border-telang",
  },
  dikemas: {
    label: "Dikemas",
    icon: "pi pi-box",
    badgeClass: "bg-telang-muda text-telang-tua border-telang",
  },
  diproses: {
    label: "Diproses",
    icon: "pi pi-box",
    badgeClass: "bg-telang-muda text-telang-tua border-telang",
  },
  siap_ambil: {
    label: "Siap diambil",
    icon: "pi pi-map-marker",
    badgeClass: "bg-telang-muda text-telang-tua border-telang",
  },
  siap_diambil: {
    label: "Siap diambil",
    icon: "pi pi-map-marker",
    badgeClass: "bg-telang-muda text-telang-tua border-telang",
  },
  dikirim: {
    label: "Dalam pengiriman",
    icon: "pi pi-truck",
    badgeClass: "bg-nila-muda text-nila border-nila",
  },
  dalam_pengiriman: {
    label: "Dalam pengiriman",
    icon: "pi pi-truck",
    badgeClass: "bg-nila-muda text-nila border-nila",
  },
  diterima: {
    label: "Diterima",
    icon: "pi pi-check-square",
    badgeClass: "bg-teh-muda text-teh-tua border-teh",
  },
  selesai: {
    label: "Selesai",
    icon: "pi pi-verified",
    badgeClass: "bg-teh-muda text-teh-tua border-teh",
  },
  dibatalkan: {
    label: "Dibatalkan",
    icon: "pi pi-times-circle",
    badgeClass: "bg-bata-muda text-bata-tua border-bata",
  },
  batal: {
    label: "Dibatalkan",
    icon: "pi pi-times-circle",
    badgeClass: "bg-bata-muda text-bata-tua border-bata",
  },
  kedaluwarsa: {
    label: "Kedaluwarsa",
    icon: "pi pi-exclamation-circle",
    badgeClass: "bg-bahaya-muda text-bahaya border-bahaya",
  },
  kadaluarsa: {
    label: "Kedaluwarsa",
    icon: "pi pi-exclamation-circle",
    badgeClass: "bg-bahaya-muda text-bahaya border-bahaya",
  },
  expired: {
    label: "Kedaluwarsa",
    icon: "pi pi-exclamation-circle",
    badgeClass: "bg-bahaya-muda text-bahaya border-bahaya",
  },
  komplain: {
    label: "Dalam komplain",
    icon: "pi pi-flag",
    badgeClass: "bg-bata-muda text-bata-tua border-bata",
  },
  dispute: {
    label: "Dalam komplain",
    icon: "pi pi-flag",
    badgeClass: "bg-bata-muda text-bata-tua border-bata",
  },
};

export function getOrderStatusMeta(
  status: string | null | undefined
): OrderStatusMeta {
  const normalized = (status || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (ORDER_STATUS_META[normalized]) {
    return ORDER_STATUS_META[normalized];
  }
  return {
    label: status ? status.replace(/_/g, " ") : "Status tidak diketahui",
    icon: "pi pi-info-circle",
    badgeClass: "bg-garis text-tinta border-garis-kuat",
  };
}

export function normalizeWhatsAppNumber(
  rawPhone: string | null | undefined
): string {
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
