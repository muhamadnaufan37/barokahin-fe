import {
  ApiErrorPayload,
  ApiResponse,
  BuyerAddress,
  BuyerAuthResult,
  BuyerOrder,
  BuyerOrderPickup,
  BuyerProfileCompleteness,
  BuyerReviewPayload,
  CheckoutOrder,
  CheckoutValidation,
  CreateBuyerAddressPayload,
  DonationRequestPayload,
  DonationRequestResult,
  ImpactReceipt,
  ItemConditionGrade,
  ItemPublicStatus,
  PublicActivity,
  PublicActivityDetail,
  PublicAdministrativeRegion,
  PublicAdministrativeRegionResponse,
  PublicCategory,
  PublicImpact,
  PublicItem,
  PublicItemDetail,
  PublicItemMedia,
  PublicItemSeal,
  PublicItemsQuery,
  PublicItemsResponse,
  PublicRegion,
  PublicSettings,
  PublicStore,
  PublicStaticPage,
  PublicVoucher,
  PaymentInstruction,
  PurchaseRequestPayload,
  PurchaseRequestResult,
  QrCreateResult,
  QrStatusResult,
  ShippingEstimate,
  StaticPageKey,
  VoucherPreviewResult,
} from "../types";

const RAW_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const RAW_PUBLIC_PREFIX = (
  import.meta.env.VITE_API_PUBLIC_PREFIX || "/api/v1/barokahiin/public"
).replace(/\/+$/, "");
const RAW_WILAYAH_PREFIX = (
  import.meta.env.VITE_API_WILAYAH_PREFIX || "/api/v1/public"
).replace(/\/+$/, "");

const PUBLIC_API_BASE = `${RAW_BASE_URL}${
  RAW_PUBLIC_PREFIX.startsWith("/") ? "" : "/"
}${RAW_PUBLIC_PREFIX}`;
const WILAYAH_API_BASE = `${RAW_BASE_URL}${
  RAW_WILAYAH_PREFIX.startsWith("/") ? "" : "/"
}${RAW_WILAYAH_PREFIX}`;
const API_ROOT = PUBLIC_API_BASE.replace(/\/public$/, "");
const BUYER_API_BASE = `${API_ROOT}/buyer`;
const ADMINISTRATIVE_REGION_CACHE_KEY = "barokahiin:administrative-regions:v1";
const ADMINISTRATIVE_REGION_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CachedAdministrativeRegionList {
  expiresAt: number;
  regions: PublicAdministrativeRegion[];
}

const administrativeRegionCache = new Map<
  string,
  CachedAdministrativeRegionList
>();

interface RawItemReference {
  uuid?: string;
  kode?: string;
  nama: string;
  slug: string;
}

interface RawPublicItem {
  uuid: string;
  kode_barang: string;
  slug: string;
  judul: string;
  keterangan?: string;
  kekurangan?: string;
  grade?: "A" | "B" | "C";
  kondisi_grade?: ItemConditionGrade;
  spesifikasi?: string | null;
  price_idr?: number;
  harga_rupiah?: number;
  ref_new_price_idr?: number | null;
  jalur?: "jual" | "charity";
  pickup_only?: boolean;
  stok_tersedia?: number;
  status: ItemPublicStatus;
  status_label?: string;
  donor_label?: string;
  kategori?: RawItemReference | null;
  kegiatan?: { uuid: string; judul: string; slug: string } | null;
  program_charity?: { uuid: string; judul: string; slug: string } | null;
  toko?: {
    uuid: string;
    nama: string;
    slug: string;
    area_publik: string;
    rating_avg: number | null;
    rating_count?: number;
    level: number | null;
  } | null;
  cover_url?: string | null;
  diterbitkan_pada?: string;
  published_at?: string;
  media?: PublicItemMedia[];
  segel_kurasi?: PublicItemSeal | null;
}

interface RawItemsResponse {
  items: RawPublicItem[];
  total?: number;
  pagination?: PublicItemsResponse["pagination"];
}

interface RawProgram {
  uuid: string;
  judul: string;
  slug: string;
  tujuan?: string;
  deskripsi?: string;
  wilayah?: string | null;
  penerima_manfaat_desc?: string | null;
  target_idr?: number;
  target_dana?: number;
  terkumpul_idr?: number;
  dana_terkumpul_rupiah?: number;
  total_penggunaan_rupiah?: number | null;
  status: "berjalan" | "aktif" | "selesai";
  periode_mulai?: string | null;
  periode_selesai?: string | null;
  periode?: string | null;
  diterbitkan_pada?: string | null;
  published_at?: string | null;
  media?: PublicActivityDetail["media"];
  laporan_penggunaan?: PublicActivityDetail["laporan_penggunaan"];
}

const CONDITION_BY_GRADE: Record<
  NonNullable<RawPublicItem["grade"]>,
  ItemConditionGrade
> = {
  A: "sangat_baik",
  B: "baik",
  C: "cukup",
};

const STATUS_LABEL: Record<ItemPublicStatus, string> = {
  terbit: "Tersedia",
  dipesan: "Sedang dipesan",
  terjual: "Terjual",
};

function mapPublicItem(item: RawPublicItem): PublicItem {
  const grade = item.grade ? CONDITION_BY_GRADE[item.grade] : item.kondisi_grade;
  const category = item.kategori;
  const program = item.program_charity || item.kegiatan || null;
  const price = item.price_idr ?? item.harga_rupiah;
  if (!grade || typeof price !== "number" || !Number.isFinite(price)) {
    throw new ApiClientError(
      "Data kondisi atau harga barang dari server belum lengkap.",
      502
    );
  }

  return {
    uuid: item.uuid,
    kode_barang: item.kode_barang,
    slug: item.slug,
    judul: item.judul,
    keterangan: item.keterangan || "",
    kekurangan: item.kekurangan || "",
    kondisi_grade: grade,
    spesifikasi: item.spesifikasi || null,
    harga_rupiah: price,
    harga_baru_rupiah: item.ref_new_price_idr ?? null,
    jalur: item.jalur,
    pickup_only: item.pickup_only ?? false,
    stok_tersedia:
      item.stok_tersedia ?? (item.status === "terjual" ? 0 : 1),
    status: item.status,
    status_label: item.status_label || STATUS_LABEL[item.status],
    donor_label: item.donor_label || "Sahabat Berbagi",
    kategori: category
      ? {
          uuid: category.uuid || category.kode || category.slug,
          nama: category.nama,
          slug: category.slug,
        }
      : null,
    kegiatan: program,
    toko: item.toko
      ? {
          uuid: item.toko.uuid,
          nama: item.toko.nama,
          slug: item.toko.slug,
          area_publik: item.toko.area_publik,
          rating_avg: item.toko.rating_avg,
          rating_count: item.toko.rating_count,
          level: item.toko.level,
        }
      : null,
    cover_url: item.cover_url || item.media?.[0]?.url || null,
    diterbitkan_pada: item.published_at || item.diterbitkan_pada || "",
  };
}

function mapPublicProgram(program: RawProgram): PublicActivity {
  const status =
    program.status === "berjalan" || program.status === "aktif"
      ? "aktif"
      : program.status === "selesai"
        ? "selesai"
        : null;
  const target = program.target_idr ?? program.target_dana;
  const collected = program.terkumpul_idr ?? program.dana_terkumpul_rupiah;
  if (
    !status ||
    typeof target !== "number" ||
    !Number.isFinite(target) ||
    typeof collected !== "number" ||
    !Number.isFinite(collected)
  ) {
    throw new ApiClientError(
      "Data program dari server belum lengkap.",
      502
    );
  }
  const period =
    program.periode ||
    (program.periode_mulai && program.periode_selesai
      ? `${program.periode_mulai} – ${program.periode_selesai}`
      : null);

  return {
    uuid: program.uuid,
    judul: program.judul,
    slug: program.slug,
    deskripsi: program.tujuan || program.deskripsi || "",
    wilayah: program.wilayah || null,
    penerima_manfaat_desc: program.penerima_manfaat_desc || null,
    target_dana: target,
    dana_terkumpul_rupiah: collected,
    total_penggunaan_rupiah: program.total_penggunaan_rupiah ?? null,
    periode: period,
    status,
    diterbitkan_pada: program.published_at || program.diterbitkan_pada || null,
  };
}

function normalizeProgramResponse(
  response: RawProgram | RawProgram[]
): RawProgram[] {
  return Array.isArray(response) ? response : [response];
}

function mapPublicProgramDetail(program: RawProgram): PublicActivityDetail {
  return {
    ...mapPublicProgram(program),
    media: program.media || [],
    laporan_penggunaan: program.laporan_penggunaan || [],
  };
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly fields?: Record<string, string[] | string>;
  public readonly code?: string;
  public readonly requestId?: string;
  public readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    status: number,
    fields?: Record<string, string[] | string>,
    details?: {
      code?: string;
      requestId?: string;
      retryAfterSeconds?: number;
    }
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.fields = fields;
    this.code = details?.code;
    this.requestId = details?.requestId;
    this.retryAfterSeconds = details?.retryAfterSeconds;
  }
}

function getRetryAfterSeconds(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds));
  const retryAt = Date.parse(value);
  return Number.isNaN(retryAt)
    ? undefined
    : Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
}

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) {
    return url;
  }
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${RAW_BASE_URL}${normalizedPath}`;
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

function getCachedAdministrativeRegions(
  path: string
): PublicAdministrativeRegion[] | null {
  const memoryEntry = administrativeRegionCache.get(path);
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
    return memoryEntry.regions;
  }

  try {
    const raw = window.localStorage.getItem(
      `${ADMINISTRATIVE_REGION_CACHE_KEY}:${path}`
    );
    if (!raw) return null;

    const cached = JSON.parse(raw) as CachedAdministrativeRegionList;
    if (
      typeof cached.expiresAt !== "number" ||
      cached.expiresAt <= Date.now() ||
      !Array.isArray(cached.regions) ||
      !cached.regions.every(
        (region) =>
          typeof region.code === "string" && typeof region.name === "string"
      )
    ) {
      window.localStorage.removeItem(
        `${ADMINISTRATIVE_REGION_CACHE_KEY}:${path}`
      );
      return null;
    }

    administrativeRegionCache.set(path, cached);
    return cached.regions;
  } catch (error) {
    console.warn("Unable to read cached administrative regions", error);
    return null;
  }
}

function cacheAdministrativeRegions(
  path: string,
  regions: PublicAdministrativeRegion[]
): void {
  const cached: CachedAdministrativeRegionList = {
    expiresAt: Date.now() + ADMINISTRATIVE_REGION_CACHE_TTL_MS,
    regions,
  };
  administrativeRegionCache.set(path, cached);

  try {
    window.localStorage.setItem(
      `${ADMINISTRATIVE_REGION_CACHE_KEY}:${path}`,
      JSON.stringify(cached)
    );
  } catch (error) {
    console.warn("Unable to cache administrative regions", error);
  }
}

async function getAdministrativeRegionList(
  path: string
): Promise<PublicAdministrativeRegion[]> {
  const cacheKey = `${WILAYAH_API_BASE}${path}`;
  const cached = getCachedAdministrativeRegions(cacheKey);
  if (cached) return cached;

  const response = await request<
    PublicAdministrativeRegionResponse | PublicAdministrativeRegion[]
  >(
    path,
    {},
    WILAYAH_API_BASE
  );
  const regions = Array.isArray(response) ? response : response.data;
  if (
    !Array.isArray(regions) ||
    !regions.every(
      (region) =>
        typeof region.code === "string" && typeof region.name === "string"
    )
  ) {
    throw new ApiClientError(
      "Respons wilayah administratif harus berisi daftar dengan kode dan nama.",
      200
    );
  }
  cacheAdministrativeRegions(cacheKey, regions);
  return regions;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  baseUrl = PUBLIC_API_BASE
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiClientError(
      "Tidak dapat terhubung ke server Barokahiin. Periksa koneksi internet Anda atau coba beberapa saat lagi.",
      0
    );
  }

  let payload: ApiResponse<T> | ApiErrorPayload | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T> | ApiErrorPayload;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errPayload = payload as ApiErrorPayload | null;
    const message =
      errPayload?.error?.message ||
      errPayload?.message ||
      `Permintaan gagal (kode ${response.status}).`;
    const fields = errPayload?.error?.fields || errPayload?.errors;
    throw new ApiClientError(message, response.status, fields, {
      code: errPayload?.error?.code,
      requestId: errPayload?.error?.request_id,
      retryAfterSeconds: getRetryAfterSeconds(response.headers.get("Retry-After")),
    });
  }

  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new ApiClientError("Format respons server tidak sesuai.", response.status);
  }

  if (payload.success === false) {
    const errPayload = payload as unknown as ApiErrorPayload;
    throw new ApiClientError(
      errPayload.error?.message ||
        errPayload.message ||
        "Permintaan tidak dapat diproses.",
      response.status,
      errPayload.error?.fields || errPayload.errors,
      {
        code: errPayload.error?.code,
        requestId: errPayload.error?.request_id,
        retryAfterSeconds: getRetryAfterSeconds(
          response.headers.get("Retry-After")
        ),
      }
    );
  }

  return (payload as ApiResponse<T>).data;
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  throw new ApiClientError(
    "Peramban ini belum mendukung transaksi aman. Perbarui peramban sebelum melanjutkan.",
    0
  );
}

function buyerRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return request<T>(path, { ...options, headers }, BUYER_API_BASE);
}

export const publicApi = {
  /** 1.1 Katalog Barang */
  async getItems(query: PublicItemsQuery = {}): Promise<PublicItemsResponse> {
    const gradeByCondition: Record<ItemConditionGrade, "A" | "B" | "C"> = {
      sangat_baik: "A",
      baik: "B",
      cukup: "C",
    };
    const qs = buildQueryString({
      q: query.q,
      category: query.kategori,
      status: query.status,
      grade: query.kondisi ? gradeByCondition[query.kondisi] : undefined,
      price_min: query.min_harga,
      price_max: query.max_harga,
      region: query.region,
      province_code: query.province_code,
      regency_code: query.regency_code,
      district_code: query.district_code,
      village_code: query.village_code,
      daerah_id: query.daerah_id,
      desa_id: query.desa_id,
      kelompok_id: query.kelompok_id,
      serah: query.serah,
      charity: query.charity === undefined ? undefined : String(query.charity),
      sort: query.sort,
      limit: query.per_page,
      page: query.page,
    });
    const response = await request<RawItemsResponse>(`/items${qs}`);
    const total =
      response.total ?? response.pagination?.total ?? response.items.length;
    const perPage =
      response.pagination?.per_page ??
      query.per_page ??
      (response.items.length || 1);
    return {
      items: response.items.map(mapPublicItem),
      pagination: response.pagination || {
        current_page: query.page || 1,
        last_page: Math.max(1, Math.ceil(total / perPage)),
        per_page: perPage,
        total,
      },
    };
  },

  /** 1.2 Detail Barang */
  async getItemBySlug(slug: string): Promise<PublicItemDetail> {
    const item = await request<RawPublicItem>(
      `/items/${encodeURIComponent(slug)}`
    );
    return {
      ...mapPublicItem(item),
      media: item.media || [],
      segel_kurasi: item.segel_kurasi || null,
    };
  },

  /** 1.3 Kategori Aktif */
  getCategories(): Promise<PublicCategory[]> {
    return request<PublicCategory[]>("/categories");
  },

  getAdministrativeProvinces(): Promise<PublicAdministrativeRegion[]> {
    return getAdministrativeRegionList("/wilayah/provinces");
  },

  getAdministrativeRegencies(
    provinceCode: string
  ): Promise<PublicAdministrativeRegion[]> {
    return getAdministrativeRegionList(
      `/wilayah/regencies/${encodeURIComponent(provinceCode)}`
    );
  },

  getAdministrativeDistricts(
    regencyCode: string
  ): Promise<PublicAdministrativeRegion[]> {
    return getAdministrativeRegionList(
      `/wilayah/districts/${encodeURIComponent(regencyCode)}`
    );
  },

  getAdministrativeVillages(
    districtCode: string
  ): Promise<PublicAdministrativeRegion[]> {
    return getAdministrativeRegionList(
      `/wilayah/villages/${encodeURIComponent(districtCode)}`
    );
  },

  async getRegions(parentId?: string): Promise<PublicRegion[]> {
    const regions = await request<
      Array<Omit<PublicRegion, "id" | "parent_id"> & {
        id: string | number;
        parent_id: string | number | null;
      }>
    >(`/regions${buildQueryString({ parent_id: parentId })}`);
    const normalized = regions.map((region) => ({
      ...region,
      id: String(region.id),
      parent_id:
        region.parent_id === null ? null : String(region.parent_id),
    }));
    return normalized.filter((region) =>
      parentId === undefined
        ? region.parent_id === null
        : region.parent_id === parentId
    );
  },

  async getStores(): Promise<PublicStore[]> {
    const response = await request<
      PublicStore[] | { items: PublicStore[] }
    >("/stores");
    return Array.isArray(response) ? response : response.items;
  },

  getStoreBySlug(slug: string): Promise<PublicStore> {
    return request<PublicStore>(`/stores/${encodeURIComponent(slug)}`);
  },

  async getStoreItems(
    slug: string,
    query: PublicItemsQuery = {}
  ): Promise<PublicItemsResponse> {
    const qs = buildQueryString({
      q: query.q,
      category: query.kategori,
      status: query.status,
      grade: query.kondisi
        ? { sangat_baik: "A", baik: "B", cukup: "C" }[query.kondisi]
        : undefined,
      price_min: query.min_harga,
      price_max: query.max_harga,
      region: query.region,
      province_code: query.province_code,
      regency_code: query.regency_code,
      district_code: query.district_code,
      village_code: query.village_code,
      daerah_id: query.daerah_id,
      desa_id: query.desa_id,
      kelompok_id: query.kelompok_id,
      limit: query.per_page,
      page: query.page,
    });
    const response = await request<RawPublicItem[] | RawItemsResponse>(
      `/stores/${encodeURIComponent(slug)}/items${qs}`
    );
    const rawItems = Array.isArray(response) ? response : response.items;
    const pagination = Array.isArray(response) ? undefined : response.pagination;
    const total = Array.isArray(response)
      ? rawItems.length
      : response.total ?? rawItems.length;
    const perPage =
      (pagination?.per_page ?? query.per_page ?? rawItems.length) || 1;
    return {
      items: rawItems.map(mapPublicItem),
      pagination: pagination || {
        current_page: query.page || 1,
        last_page: Math.max(1, Math.ceil(total / perPage)),
        per_page: perPage,
        total,
      },
    };
  },

  getShippingEstimate(
    slug: string,
    wilayah: string | { village_code?: string; regency_code?: string; wilayah_code?: string; region?: string }
  ): Promise<ShippingEstimate> {
    const query =
      typeof wilayah === "string"
        ? wilayah.includes(".")
          ? { village_code: wilayah }
          : { wilayah_code: wilayah }
        : wilayah;
    return request<ShippingEstimate>(
      `/items/${encodeURIComponent(slug)}/shipping-estimate${buildQueryString(query)}`
    );
  },

  /** 1.4 Daftar Kegiatan & Transparansi Dana */
  async getActivities(): Promise<PublicActivity[]> {
    const response = await request<RawProgram | RawProgram[]>("/programs");
    return normalizeProgramResponse(response).map(mapPublicProgram);
  },

  /** 1.5 Detail Kegiatan */
  async getActivityBySlug(slug: string): Promise<PublicActivityDetail> {
    const program = await request<RawProgram>(
      `/programs/${encodeURIComponent(slug)}`
    );
    return mapPublicProgramDetail(program);
  },

  /** 1.6 Ringkasan Dampak */
  getImpact(): Promise<PublicImpact> {
    return request<PublicImpact>("/impact");
  },

  /** 1.7 Halaman Statis */
  getStaticPage(key: StaticPageKey | string): Promise<PublicStaticPage> {
    return request<PublicStaticPage>(`/pages/${encodeURIComponent(key)}`);
  },

  /** 1.7 Pengaturan Publik */
  getSettings(): Promise<PublicSettings> {
    return request<PublicSettings>("/settings");
  },

  registerBuyer(payload: {
    nama_lengkap: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<BuyerAuthResult> {
    return request<BuyerAuthResult>("/auth/register", {
      method: "POST",
      headers: { "Idempotency-Key": createIdempotencyKey() },
      body: JSON.stringify(payload),
    });
  },

  loginBuyer(payload: {
    identifier: string;
    password: string;
  }): Promise<BuyerAuthResult> {
    return request<BuyerAuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  requestBuyerOtp(
    target: string | { phone?: string; email?: string }
  ): Promise<{
    expires_in_seconds: number;
    account_exists?: boolean;
    requires_name?: boolean;
  }> {
    const body =
      typeof target === "string" ? { phone: target } : target;
    return request("/auth/otp/request", {
      method: "POST",
      headers: { "Idempotency-Key": createIdempotencyKey() },
      body: JSON.stringify(body),
    });
  },

  verifyBuyerOtp(
    target: string | { phone?: string; email?: string },
    code: string,
    namaLengkap?: string
  ): Promise<BuyerAuthResult> {
    const base =
      typeof target === "string" ? { phone: target } : target;
    return request<BuyerAuthResult>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({
        ...base,
        code,
        ...(namaLengkap ? { nama_lengkap: namaLengkap } : {}),
      }),
    });
  },

  createQrLogin(): Promise<QrCreateResult> {
    return request<QrCreateResult>("/auth/qr/create", {
      method: "POST",
    });
  },

  getQrLoginStatus(qrToken: string): Promise<QrStatusResult> {
    return request<QrStatusResult>(
      `/auth/qr/${encodeURIComponent(qrToken)}/status`
    );
  },

  approveQrLogin(token: string, qrToken: string): Promise<unknown> {
    return buyerRequest("/auth/qr/approve", token, {
      method: "POST",
      body: JSON.stringify({ qr_token: qrToken }),
    });
  },

  refreshBuyerAuth(token: string): Promise<BuyerAuthResult> {
    return buyerRequest<BuyerAuthResult>("/auth/refresh", token, {
      method: "POST",
    });
  },

  getBuyerProfileCompleteness(
    token: string,
    handover: "ambil" | "kirim"
  ): Promise<BuyerProfileCompleteness> {
    return buyerRequest(
      `/me/profile/completeness${buildQueryString({ serah: handover })}`,
      token
    );
  },

  updateBuyerProfile(
    token: string,
    payload: {
      nama_lengkap: string;
      village_code?: string;
      wilayah_code?: string;
      region_id?: string;
      accept_terms: true;
      terms_version: "0.5";
    }
  ): Promise<BuyerProfileCompleteness> {
    return buyerRequest("/me/profile", token, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  requestBuyerEmailVerification(
    token: string,
    email: string
  ): Promise<{ profile_completeness?: BuyerProfileCompleteness }> {
    return buyerRequest("/me/email/verify", token, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async getBuyerAddresses(token: string): Promise<BuyerAddress[]> {
    const response = await buyerRequest<
      Array<BuyerAddress & { phone_penerima?: string; jalan_nomor?: string }> | { items: Array<BuyerAddress & { phone_penerima?: string; jalan_nomor?: string }> }
    >("/me/addresses", token);
    const list = Array.isArray(response) ? response : response.items;
    return list.map((addr) => {
      const villageCode = addr.village_code || addr.region?.kode_resmi;
      const parts = villageCode ? villageCode.split(".") : [];
      return {
        ...addr,
        kontak_penerima: addr.kontak_penerima || addr.phone_penerima || "",
        jalan: addr.jalan || addr.jalan_nomor || "",
        utama: addr.utama ?? addr.is_default ?? false,
        region_nama: addr.region_nama || addr.region?.nama,
        kode_pos: addr.kode_pos || addr.region?.kode_pos || "",
        province_code: addr.province_code || parts[0],
        regency_code:
          addr.regency_code ||
          (parts.length >= 2 ? `${parts[0]}.${parts[1]}` : undefined),
        district_code:
          addr.district_code ||
          (parts.length >= 3
            ? `${parts[0]}.${parts[1]}.${parts[2]}`
            : undefined),
        village_code: villageCode,
      };
    });
  },

  async createBuyerAddress(
    token: string,
    payload: CreateBuyerAddressPayload
  ): Promise<BuyerAddress> {
    const apiPayload = {
      penerima: payload.penerima,
      phone_penerima: payload.kontak_penerima,
      province_code: payload.province_code,
      regency_code: payload.regency_code,
      district_code: payload.district_code,
      village_code: payload.village_code,
      kode_pos: payload.kode_pos,
      jalan_nomor: payload.jalan,
      rt_rw: payload.rt_rw,
      patokan: payload.patokan,
      jenis_tempat: payload.jenis_tempat,
      is_default: payload.is_default ?? true,
    };
    const created = await buyerRequest<
      BuyerAddress & { phone_penerima?: string; jalan_nomor?: string }
    >("/me/addresses", token, {
      method: "POST",
      body: JSON.stringify(apiPayload),
    });
    return {
      ...created,
      kontak_penerima: created.kontak_penerima || created.phone_penerima || payload.kontak_penerima,
      jalan: created.jalan || created.jalan_nomor || payload.jalan,
    };
  },

  async updateBuyerAddress(
    token: string,
    uuid: string,
    payload: Partial<CreateBuyerAddressPayload>
  ): Promise<BuyerAddress> {
    const apiPayload: Record<string, unknown> = {};
    if (payload.penerima !== undefined) apiPayload.penerima = payload.penerima;
    if (payload.kontak_penerima !== undefined)
      apiPayload.phone_penerima = payload.kontak_penerima;
    if (payload.province_code !== undefined)
      apiPayload.province_code = payload.province_code;
    if (payload.regency_code !== undefined)
      apiPayload.regency_code = payload.regency_code;
    if (payload.district_code !== undefined)
      apiPayload.district_code = payload.district_code;
    if (payload.village_code !== undefined)
      apiPayload.village_code = payload.village_code;
    if (payload.kode_pos !== undefined) apiPayload.kode_pos = payload.kode_pos;
    if (payload.jalan !== undefined) apiPayload.jalan_nomor = payload.jalan;
    if (payload.rt_rw !== undefined) apiPayload.rt_rw = payload.rt_rw;
    if (payload.patokan !== undefined) apiPayload.patokan = payload.patokan;
    if (payload.jenis_tempat !== undefined)
      apiPayload.jenis_tempat = payload.jenis_tempat;
    if (payload.is_default !== undefined)
      apiPayload.is_default = payload.is_default;

    const updated = await buyerRequest<
      BuyerAddress & { phone_penerima?: string; jalan_nomor?: string }
    >(`/me/addresses/${encodeURIComponent(uuid)}`, token, {
      method: "PATCH",
      body: JSON.stringify(apiPayload),
    });
    return {
      ...updated,
      kontak_penerima:
        updated.kontak_penerima ||
        updated.phone_penerima ||
        payload.kontak_penerima ||
        "",
      jalan: updated.jalan || updated.jalan_nomor || payload.jalan || "",
      utama: updated.utama ?? updated.is_default ?? payload.is_default ?? false,
      region_nama: updated.region_nama || updated.region?.nama,
    };
  },

  deleteBuyerAddress(token: string, uuid: string): Promise<unknown> {
    return buyerRequest(`/me/addresses/${encodeURIComponent(uuid)}`, token, {
      method: "DELETE",
    });
  },

  addBuyerCartItem(
    token: string,
    itemUuid: string
  ): Promise<unknown> {
    return buyerRequest("/cart", token, {
      method: "POST",
      body: JSON.stringify({ item_uuid: itemUuid }),
    });
  },

  async getPublicVouchers(): Promise<PublicVoucher[]> {
    const res = await request<PublicVoucher[] | { items: PublicVoucher[] }>("/vouchers");
    return Array.isArray(res) ? res : res.items || [];
  },

  previewBuyerVoucher(
    token: string,
    payload: {
      voucher_code: string;
      item_uuids: string[];
      serah: "ambil" | "kirim";
      address_uuid?: string;
    }
  ): Promise<VoucherPreviewResult> {
    return buyerRequest<VoucherPreviewResult>("/vouchers/preview", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  validateBuyerCheckout(
    token: string,
    payload: {
      item_uuids: string[];
      serah: "ambil" | "kirim";
      address_uuid?: string;
      voucher_code?: string;
      rounding_donation_idr: number;
    }
  ): Promise<CheckoutValidation> {
    return buyerRequest("/checkout/validate", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async confirmBuyerCheckout(
    token: string,
    payload: {
      item_uuids: string[];
      serah: "ambil" | "kirim";
      address_uuid?: string;
      voucher_code?: string;
      rounding_donation_idr: number;
      data_confirmed: true;
    },
    idempotencyKey = createIdempotencyKey()
  ): Promise<CheckoutOrder> {
    const raw = await buyerRequest<
      Omit<CheckoutOrder, "items"> & {
        kode_pesanan?: string;
        items?: Array<{
          judul?: string;
          judul_snapshot?: string;
          price_idr?: number;
          harga_idr?: number;
        }>;
      }
    >("/checkout/confirm", token, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(payload),
    });
    return {
      ...raw,
      kode: raw.kode || raw.kode_pesanan || raw.uuid,
      items: raw.items?.map((item) => ({
        judul: item.judul || item.judul_snapshot || "Barang",
        price_idr: item.price_idr ?? item.harga_idr ?? 0,
      })),
    };
  },

  createBuyerPayment(
    token: string,
    orderUuid: string,
    method: PaymentInstruction["metode"],
    bankOrKey?: string,
    idempotencyKey = createIdempotencyKey()
  ): Promise<PaymentInstruction> {
    const isUuidKey =
      bankOrKey &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        bankOrKey
      );
    const bank = isUuidKey ? undefined : bankOrKey;
    const key = isUuidKey ? bankOrKey : idempotencyKey;
    return buyerRequest(`/orders/${encodeURIComponent(orderUuid)}/pay`, token, {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify({
        metode: method,
        ...(bank ? { bank } : {}),
      }),
    });
  },

  deleteBuyerAccount(token: string): Promise<unknown> {
    return buyerRequest("/me", token, { method: "DELETE" });
  },

  async getBuyerOrder(token: string, code: string): Promise<BuyerOrder> {
    const raw = await buyerRequest<
      Omit<BuyerOrder, "items"> & {
        kode_pesanan?: string;
        items?: Array<{
          judul?: string;
          judul_snapshot?: string;
          price_idr?: number;
          harga_idr?: number;
        }>;
      }
    >(`/orders/${encodeURIComponent(code)}`, token);
    return {
      ...raw,
      kode: raw.kode || raw.kode_pesanan || code,
      items: raw.items?.map((item) => ({
        judul: item.judul || item.judul_snapshot || "Barang",
        price_idr: item.price_idr ?? item.harga_idr ?? 0,
      })),
    };
  },

  async syncBuyerOrderPayment(
    token: string,
    uuid: string
  ): Promise<BuyerOrder> {
    const raw = await buyerRequest<
      Omit<BuyerOrder, "items"> & {
        kode_pesanan?: string;
        items?: Array<{
          judul?: string;
          judul_snapshot?: string;
          price_idr?: number;
          harga_idr?: number;
        }>;
      }
    >(`/orders/${encodeURIComponent(uuid)}/sync-payment`, token, {
      method: "POST",
    });
    return {
      ...raw,
      kode: raw.kode || raw.kode_pesanan || "",
      items: raw.items?.map((item) => ({
        judul: item.judul || item.judul_snapshot || "Barang",
        price_idr: item.price_idr ?? item.harga_idr ?? 0,
      })),
    };
  },

  getBuyerImpactReceipt(token: string, code: string): Promise<ImpactReceipt> {
    return buyerRequest(
      `/orders/${encodeURIComponent(code)}/impact-receipt`,
      token
    );
  },

  getBuyerOrderPickup(
    token: string,
    code: string
  ): Promise<BuyerOrderPickup> {
    return buyerRequest(`/orders/${encodeURIComponent(code)}/pickup`, token);
  },

  cancelBuyerOrder(token: string, uuid: string): Promise<unknown> {
    return buyerRequest(`/orders/${encodeURIComponent(uuid)}/cancel`, token, {
      method: "POST",
    });
  },

  confirmBuyerOrderReceived(token: string, uuid: string): Promise<unknown> {
    return buyerRequest(
      `/orders/${encodeURIComponent(uuid)}/confirm-received`,
      token,
      { method: "POST" }
    );
  },

  updateBuyerOrderAddress(
    token: string,
    uuid: string,
    addressUuid: string
  ): Promise<unknown> {
    return buyerRequest(
      `/orders/${encodeURIComponent(uuid)}/address`,
      token,
      {
        method: "PATCH",
        body: JSON.stringify({ address_uuid: addressUuid }),
      }
    );
  },

  createBuyerDispute(
    token: string,
    uuid: string,
    reason: string
  ): Promise<unknown> {
    return buyerRequest(
      `/orders/${encodeURIComponent(uuid)}/disputes`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ alasan: reason }),
      }
    );
  },

  createBuyerReview(
    token: string,
    uuid: string,
    payload: BuyerReviewPayload
  ): Promise<unknown> {
    return buyerRequest(
      `/orders/${encodeURIComponent(uuid)}/reviews`,
      token,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /** 1.8 Form Permintaan Beli */
  createPurchaseRequest(
    payload: PurchaseRequestPayload,
    idempotencyKey?: string
  ): Promise<PurchaseRequestResult> {
    const key =
      idempotencyKey ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `pr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

    return request<PurchaseRequestResult>("/purchase-requests", {
      method: "POST",
      headers: {
        "Idempotency-Key": key,
      },
      body: JSON.stringify(payload),
    });
  },

  /** 1.9 Form Pengajuan Donasi Barang */
  createDonationRequest(
    payload: DonationRequestPayload
  ): Promise<DonationRequestResult> {
    return request<DonationRequestResult>("/donation-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
