import { PublicItemCategoryRef } from "../types";

export type CategorySlugKey =
  | "pakaian"
  | "elektronik"
  | "perabot"
  | "buku"
  | "bayi-anak"
  | "sekolah"
  | "alat"
  | "kesehatan"
  | "ibadah"
  | "tanaman"
  | "lainnya";

export interface CategoryMeta {
  slug: CategorySlugKey;
  icon: string;
}

const CATEGORY_ICON_MAP: Record<CategorySlugKey, string> = {
  pakaian: "pi pi-tag",
  elektronik: "pi pi-bolt",
  perabot: "pi pi-home",
  buku: "pi pi-book",
  "bayi-anak": "pi pi-heart",
  sekolah: "pi pi-pencil",
  alat: "pi pi-wrench",
  kesehatan: "pi pi-plus-circle",
  ibadah: "pi pi-star",
  tanaman: "pi pi-sun",
  lainnya: "pi pi-box",
};

export function kategoriToSlug(
  kategori?: Pick<PublicItemCategoryRef, "slug" | "nama"> | string | null
): CategorySlugKey {
  if (!kategori) return "lainnya";
  const raw =
    typeof kategori === "string"
      ? kategori
      : `${kategori.slug || ""} ${kategori.nama || ""}`;
  const s = raw.toLowerCase();

  if (s.includes("ibadah") || s.includes("mukena") || s.includes("sarung")) {
    return "ibadah";
  }
  if (s.includes("pakaian") || s.includes("baju") || s.includes("busana")) {
    return "pakaian";
  }
  if (s.includes("elektronik") || s.includes("gadget")) {
    return "elektronik";
  }
  if (s.includes("perabot") || s.includes("rumah") || s.includes("furnitur")) {
    return "perabot";
  }
  if (s.includes("buku") || s.includes("bacaan")) {
    return "buku";
  }
  if (s.includes("bayi") || s.includes("anak")) {
    return "bayi-anak";
  }
  if (s.includes("sekolah") || s.includes("tulis") || s.includes("pendidikan")) {
    return "sekolah";
  }
  if (s.includes("alat") || s.includes("perkakas")) {
    return "alat";
  }
  if (s.includes("kesehatan") || s.includes("medis")) {
    return "kesehatan";
  }
  if (s.includes("tanaman") || s.includes("bibit")) {
    return "tanaman";
  }
  return "lainnya";
}

export function getCategoryMeta(
  kategori?: Pick<PublicItemCategoryRef, "slug" | "nama"> | string | null
): CategoryMeta {
  const slug = kategoriToSlug(kategori);
  return {
    slug,
    icon: CATEGORY_ICON_MAP[slug] || "pi pi-box",
  };
}
