import {
  ApiErrorPayload,
  ApiResponse,
  DonationRequestPayload,
  DonationRequestResult,
  PublicActivity,
  PublicActivityDetail,
  PublicCategory,
  PublicImpact,
  PublicItemDetail,
  PublicItemsQuery,
  PublicItemsResponse,
  PublicSettings,
  PublicStaticPage,
  PurchaseRequestPayload,
  PurchaseRequestResult,
  StaticPageKey,
} from "../types";

const RAW_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const RAW_PUBLIC_PREFIX = (
  import.meta.env.VITE_API_PUBLIC_PREFIX || "/api/v1/barokahiin/public"
).replace(/\/+$/, "");

const PUBLIC_API_BASE = `${RAW_BASE_URL}${
  RAW_PUBLIC_PREFIX.startsWith("/") ? "" : "/"
}${RAW_PUBLIC_PREFIX}`;

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly fields?: Record<string, string[] | string>;

  constructor(
    message: string,
    status: number,
    fields?: Record<string, string[] | string>
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.fields = fields;
  }
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

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${PUBLIC_API_BASE}${normalizedPath}`;

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
    throw new ApiClientError(message, response.status, fields);
  }

  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new ApiClientError("Format respons server tidak sesuai.", response.status);
  }

  if (payload.success === false) {
    const errPayload = payload as unknown as ApiErrorPayload;
    throw new ApiClientError(
      errPayload.message || "Permintaan tidak dapat diproses.",
      response.status,
      errPayload.errors
    );
  }

  return (payload as ApiResponse<T>).data;
}

export const publicApi = {
  /** 1.1 Katalog Barang */
  getItems(query: PublicItemsQuery = {}): Promise<PublicItemsResponse> {
    const qs = buildQueryString(query as Record<string, unknown>);
    return request<PublicItemsResponse>(`/items${qs}`);
  },

  /** 1.2 Detail Barang */
  getItemBySlug(slug: string): Promise<PublicItemDetail> {
    return request<PublicItemDetail>(`/items/${encodeURIComponent(slug)}`);
  },

  /** 1.3 Kategori Aktif */
  getCategories(): Promise<PublicCategory[]> {
    return request<PublicCategory[]>("/categories");
  },

  /** 1.4 Daftar Kegiatan & Transparansi Dana */
  getActivities(): Promise<PublicActivity[]> {
    return request<PublicActivity[]>("/activities");
  },

  /** 1.5 Detail Kegiatan */
  getActivityBySlug(slug: string): Promise<PublicActivityDetail> {
    return request<PublicActivityDetail>(
      `/activities/${encodeURIComponent(slug)}`
    );
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
