export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorPayload {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[] | string>;
  };
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export type ItemConditionGrade = "sangat_baik" | "baik" | "cukup";
export type ItemPublicStatus = "terbit" | "dipesan" | "terjual";
export type ItemSortOption = "terbaru" | "termurah" | "termahal";

export interface PublicCategory {
  uuid: string;
  nama: string;
  slug: string;
  urutan: number;
}

export interface PublicItemCategoryRef {
  uuid: string;
  nama: string;
  slug: string;
}

export interface PublicItemActivityRef {
  uuid: string;
  judul: string;
  slug: string;
}

export interface PublicItem {
  uuid: string;
  kode_barang: string;
  slug: string;
  judul: string;
  keterangan: string;
  kekurangan: string;
  kondisi_grade: ItemConditionGrade;
  spesifikasi: string | null;
  harga_rupiah: number;
  stok_tersedia: number;
  status: ItemPublicStatus;
  status_label: string;
  donor_label: string;
  kategori: PublicItemCategoryRef | null;
  kegiatan: PublicItemActivityRef | null;
  cover_url: string | null;
  diterbitkan_pada: string;
}

export interface PublicItemMedia {
  uuid: string;
  tipe: "foto" | "video";
  url: string;
  thumbnail_url: string | null;
  alt: string | null;
  urutan: number;
}

export interface PublicItemDetail extends PublicItem {
  media: PublicItemMedia[];
}

export interface PublicItemsQuery {
  kategori?: string;
  status?: ItemPublicStatus;
  kondisi?: ItemConditionGrade;
  min_harga?: number;
  max_harga?: number;
  q?: string;
  sort?: ItemSortOption;
  per_page?: number;
  page?: number;
}

export interface PublicItemsResponse {
  items: PublicItem[];
  pagination: PaginationMeta;
}

export interface PublicActivity {
  uuid: string;
  judul: string;
  slug: string;
  deskripsi: string;
  target_dana: number;
  dana_terkumpul_rupiah: number;
  total_penggunaan_rupiah: number;
  periode: string | null;
  status: "aktif" | "selesai";
  diterbitkan_pada: string | null;
}

export interface PublicActivityMedia {
  uuid: string;
  tipe: "foto" | "video";
  url: string;
  keterangan: string | null;
  alt: string | null;
}

export interface PublicActivityExpense {
  uuid: string;
  pos: string;
  nominal_rupiah: number;
  tanggal: string;
  keterangan: string | null;
}

export interface PublicActivityDetail extends PublicActivity {
  media: PublicActivityMedia[];
  laporan_penggunaan: PublicActivityExpense[];
}

export interface PublicImpact {
  total_dana_terkumpul_rupiah: number;
  total_barang_terjual: number;
  total_barang_tersedia: number;
  total_kegiatan_terdanai: number;
}

export type StaticPageKey =
  | "tentang"
  | "cara-kerja"
  | "faq"
  | "kebijakan"
  | "kontak";

export interface PublicStaticPage {
  kunci: StaticPageKey | string;
  judul: string;
  isi: string;
  updated_at: string;
}

export interface PublicSettings {
  rekening_resmi_bank: string;
  rekening_resmi_nomor: string;
  rekening_resmi_atas_nama: string;
  whatsapp_resmi: string;
  label_anonim: string;
  batas_bayar_jam: number;
  lokasi_pengambilan: string;
}

export interface PurchaseRequestPayload {
  item_slug: string;
  nama_pembeli: string;
  kontak_pembeli: string;
  jumlah?: number;
  catatan?: string;
}

export interface PurchaseRequestResult {
  uuid: string;
  status: string;
  jumlah: number;
  created_at: string;
}

export interface DonationRequestPayload {
  nama_donatur: string;
  kontak_donatur: string;
  wilayah?: string;
  preferensi_anonim?: boolean;
  nama_barang: string;
  kategori_uuid?: string;
  kondisi_grade: ItemConditionGrade;
  jumlah?: number;
  cara_terima: "diantar" | "dijemput";
  catatan?: string;
  persetujuan_jual: boolean;
  persetujuan_media: boolean;
}

export interface DonationRequestResult {
  kode_barang: string;
  status: string;
}
