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
    request_id?: string;
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
export type ItemSortOption =
  | "peringkat"
  | "terbaru"
  | "termurah"
  | "termahal";

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

export interface PublicItemStoreRef {
  uuid: string;
  nama: string;
  slug: string;
  area_publik: string;
  rating_avg: number | null;
  rating_count?: number;
  level: number | null;
}

export interface PublicRegion {
  id: string;
  uuid?: string;
  parent_id: string | null;
  level: number | "provinsi" | "kabkota" | "kecamatan" | "kelurahan";
  nama: string;
  kode_resmi?: string | null;
  kode_pos?: string | null;
}

export interface PublicAdministrativeRegion {
  code: string;
  name: string;
}

export interface PublicAdministrativeRegionResponse {
  data: PublicAdministrativeRegion[];
  meta: {
    administrative_area_level: number | string;
    updated_at: string;
  };
}

export interface PublicStore {
  uuid: string;
  nama: string;
  slug: string;
  deskripsi: string | null;
  kebijakan_tambahan: string | null;
  jam_operasional: string | Record<string, string> | null;
  area_publik: string;
  level: number | null;
  rating_avg: number | null;
  rating_count: number;
  status?: "aktif" | "dijeda";
  cover_url?: string | null;
  logo_url?: string | null;
}

export interface ShippingEstimate {
  zona: string;
  billable_weight_g: number;
  ongkir_idr: number;
  packing_fee_idr: number;
  pickup_only?: boolean;
}

export interface PublicItemCheck {
  kode: string;
  teks: string;
  lulus: boolean;
  teks_keterbukaan?: string | null;
}

export interface PublicItemSeal {
  sop_version: number;
  grade: string;
  checks: PublicItemCheck[];
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
  harga_baru_rupiah?: number | null;
  jalur?: "jual" | "charity";
  pickup_only?: boolean;
  stok_tersedia: number;
  status: ItemPublicStatus;
  status_label: string;
  donor_label: string;
  kategori: PublicItemCategoryRef | null;
  kegiatan: PublicItemActivityRef | null;
  toko: PublicItemStoreRef | null;
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
  segel_kurasi: PublicItemSeal | null;
}

export interface PublicItemsQuery {
  kategori?: string;
  status?: ItemPublicStatus;
  kondisi?: ItemConditionGrade;
  min_harga?: number;
  max_harga?: number;
  q?: string;
  region?: string;
  province_code?: string;
  regency_code?: string;
  district_code?: string;
  village_code?: string;
  daerah_id?: string;
  desa_id?: string;
  kelompok_id?: string;
  serah?: "ambil" | "kirim";
  charity?: boolean;
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
  wilayah?: string | null;
  penerima_manfaat_desc?: string | null;
  target_dana: number;
  dana_terkumpul_rupiah: number;
  total_penggunaan_rupiah: number | null;
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
  total_dana_kebaikan_idr: number;
  total_barang_terjual: number;
  total_barang_tersedia: number;
  total_program_terdanai: number;
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

export interface BuyerProfileCompleteness {
  ready: boolean;
  missing: string[];
}

export interface BuyerAddress {
  uuid: string;
  penerima: string;
  kontak_penerima: string;
  region_id: string;
  region_nama?: string;
  kode_pos: string;
  jalan: string;
  rt_rw: string;
  patokan: string;
  jenis_tempat: string;
  utama?: boolean;
  warnings?: string[];
}

export interface CheckoutQuote {
  subtotal_idr: number;
  ongkir_idr: number;
  packing_fee_idr: number;
  rounding_donation_idr: number;
  total_idr: number;
  zona: string;
}

export interface CheckoutValidation {
  quote: CheckoutQuote;
  items?: Array<{
    uuid: string;
    judul: string;
    price_idr: number;
    status: ItemPublicStatus;
    toko_nama?: string;
  }>;
}

export interface CheckoutOrder {
  uuid: string;
  kode: string;
  kode_pesanan?: string;
  status: string;
  hold_expires_at: string;
  serah?: "ambil" | "kirim";
  address_uuid?: string;
  total_idr?: number;
  items?: Array<{ judul: string; price_idr: number }>;
}

export interface PaymentInstruction {
  uuid?: string;
  status: string;
  metode: "qris" | "va" | "ewallet";
  gateway?: string;
  gateway_ref?: string;
  jumlah_idr?: number;
  kedaluwarsa_pada?: string;
  expires_at?: string;
  payment_url?: string;
  qris_url?: string;
  qr_string?: string;
  va_number?: string;
  instructions?: string[];
}

export interface BuyerOrder {
  uuid: string;
  kode: string;
  kode_pesanan?: string;
  status: string;
  created_at?: string;
  items?: Array<{ judul: string; price_idr: number }>;
  total_idr?: number;
  hold_expires_at?: string;
  serah?: "ambil" | "kirim";
  zona?: string;
  address_uuid?: string;
}

export interface BuyerReviewPayload {
  rating_barang: number;
  rating_layanan: number;
  teks: string;
}

export interface ImpactReceipt {
  rincian_pembayaran: Record<string, number>;
  kuitansi_kebaikan: Record<string, number>;
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
