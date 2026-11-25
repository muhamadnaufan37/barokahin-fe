# Panduan Integrasi Frontend 1: Storefront Barokahiin (Publik & Pembeli)

Dokumen ini khusus untuk tim **Frontend Storefront Barokahiin** yang mengonsumsi:
- **API Publik** (tanpa login): `/api/v1/barokahiin/public/*`
- **API Pembeli** (akun wajib untuk membuat pesanan): `/api/v1/barokahiin/buyer/*`

Postman Collection siap impor: [barokahiin-v0.5.postman_collection.json](./postman/barokahiin-v0.5.postman_collection.json) (gunakan folder **1. Public** dan **2. Buyer**).
Panduan khusus alur wilayah & alamat (kode `wilayah.id` tanpa `region_id`): [BAROKAHIIN_WILAYAH_FLOW.md](./BAROKAHIIN_WILAYAH_FLOW.md).

---

## 1. Konfigurasi HTTP Client & Konvensi

- **Base URL**: `https://apimain.digitaldatagenerus.com/api/v1` (atau `http://127.0.0.1:8000/api/v1` di lokal)
- **Format Uang**: semua harga/nominal adalah **integer Rupiah** (`price_idr`, `total_idr`, `ongkir_idr`, `packing_fee_idr`, `rounding_donation_idr`).
- **Header `Idempotency-Key`**: wajib kirim UUID unik (`crypto.randomUUID()`) pada `POST` kritis (`auth/otp/request`, `checkout/confirm`, `orders/{uuid}/pay`) agar klik ganda tidak membuat pesanan/pembayaran duplikat.
- **Format Respons Sukses**:
  ```json
  { "success": true, "message": "Success", "data": {} }
  ```
- **Format Error Terstruktur**:
  ```json
  {
    "success": false,
    "message": "Profil belum lengkap untuk membuat pesanan.",
    "error": {
      "code": "PROFILE_INCOMPLETE",
      "message": "Profil belum lengkap untuk membuat pesanan.",
      "fields": { "missing": ["EMAIL_UNVERIFIED", "ADDRESS_MISSING"] },
      "request_id": "uuid"
    }
  }
  ```

```js
import axios from "axios";

export const storefrontApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });
export const idempotentHeader = (token, key = crypto.randomUUID()) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  "Idempotency-Key": key,
});
```

---

## 2. Endpoint Publik (Tanpa Login)

| Halaman | Endpoint | Variabel Respons Utama |
|---|---|---|
| **Katalog** | `GET /barokahiin/public/items` | `data.items[]`: `uuid`, `kode_barang`, `slug`, `judul`, `grade` (`A`/`B`/`C`), `jalur` (`jual`/`charity`), `price_idr`, `ref_new_price_idr`, `pickup_only`, `status`, `donor_label` (`"Sahabat Berbagi"`), `cover_url`, `kategori` (`kode`, `nama`, `slug`), `toko` (`uuid`, `nama`, `slug`, `area_publik`, `rating_avg`, `level`), `program_charity`. |
| **Detail Barang** | `GET /barokahiin/public/items/{slug}` | Semua field katalog + `keterangan`, `kekurangan`, `media[]` (`uuid`, `tipe`, `url`, `alt`, `urutan`, `lebar`, `tinggi`), dan **`segel_kurasi`** (`sop_version`, `grade`, `checks[]`: `kode`, `teks`, `lulus`, `teks_keterbukaan`). |
| **Estimasi Ongkir** | `GET /barokahiin/public/items/{slug}/shipping-estimate?region={id}` | `zona`, `billable_weight_g`, `ongkir_idr`, `packing_fee_idr` (atau `pickup_only: true`). |
| **Daftar & Detail Toko** | `GET /barokahiin/public/stores`, `/stores/{slug}`, `/stores/{slug}/items` | `uuid`, `nama`, `slug`, `deskripsi`, `kebijakan_tambahan`, `jam_operasional`, `area_publik`, `level`, `rating_avg`, `rating_count`. *(Alamat lengkap tidak pernah muncul di publik.)* |
| **Program Charity** | `GET /barokahiin/public/programs`, `/programs/{slug}` | `uuid`, `judul`, `slug`, `tujuan`, `penerima_manfaat_desc`, `wilayah`, `target_idr`, `terkumpul_idr`, `status`, `laporan[]`. |
| **Ringkasan Dampak** | `GET /barokahiin/public/impact` | `total_dana_kebaikan_idr`, `total_barang_terjual`, `total_barang_tersedia`, `total_program_terdanai`. |
| **Master Wilayah & Kategori** | `GET /barokahiin/public/regions?source=wilayah_id&level=provinsi`, `/public/wilayah/filters`, `/categories` | Wilayah gabungan: administratif `wilayah.id` (Provinsi → Kab/Kota → Kecamatan → Kelurahan) + organisasi (`daerah` → `desa` → `kelompok`). |
| **Filter Wilayah Gabungan** | `GET /public/wilayah/provinces`, `/regencies/{provinceCode}`, `/districts/{regencyCode}`, `/villages/{districtCode}`, `/filters` | Cascading dropdown wilayah administratif (`wilayah.id`, di-cache 7 hari) sekaligus daftar `daerah`, `desa`, `kelompok` dalam satu endpoint `/public/wilayah/filters`. |
| **Halaman Statis & Pengaturan** | `GET /barokahiin/public/pages/{key}`, `/settings` | Konten halaman (`tentang`, `cara-kerja`, `faq`, `kebijakan`, `kontak`) dan rekening/WhatsApp resmi. |

**Query filter katalog (`GET /barokahiin/public/items`):**
`q`, `category` (slug/kode/uuid), `region` (ID wilayah internal), `province_code` (contoh `32`), `regency_code` (contoh `32.73`), `district_code` (contoh `32.73.28`), `village_code` (contoh `32.73.28.1001`), `daerah_id`, `desa_id`, `kelompok_id`, `price_min`, `price_max`, `grade` (`A`/`B`/`C`), `serah` (`ambil`/`kirim`), `charity` (`true`/`false`), `sort` (`peringkat` [default deterministik] | `terbaru` | `termurah` | `termahal`), `limit` (1–100).

---

## 3. Autentikasi & Registrasi Pembeli (Multi-Metode)

Menjelajah dan menyimpan keranjang lokal boleh tanpa akun. **Membuat pesanan wajib memiliki akun pembeli.**

### A. Registrasi Akun Baru
- `POST /barokahiin/public/auth/register` (`Idempotency-Key`)
  ```json
  {
    "nama_lengkap": "Siti Rahma",
    "email": "siti.rahma@example.com",
    "phone": "081234567890",
    "password": "password123"
  }
  ```

### B. Login Email / Nomor HP + Password
- `POST /barokahiin/public/auth/login`
  ```json
  { "identifier": "siti.rahma@example.com", "password": "password123" }
  ```
  *(Kolom `identifier` menerima email atau nomor HP — tidak pernah meminta input nama ulang.)*

### C. Login OTP (SMS atau Email)
1. **Minta OTP**: `POST /barokahiin/public/auth/otp/request` (`Idempotency-Key`)
   - Via SMS: `{ "phone": "081200008888" }`
   - Via Email: `{ "email": "pembeli.sample@barokahiin.local" }`
   - Respons menyertakan `account_exists: true|false` dan `requires_name: false` sehingga saat login ulang frontend **tidak perlu menampilkan input nama**.
2. **Verifikasi OTP**: `POST /barokahiin/public/auth/otp/verify`
   - Via SMS: `{ "phone": "081200008888", "code": "123456" }`
   - Via Email: `{ "email": "pembeli.sample@barokahiin.local", "code": "123456" }`
   - Simpan `data.token` sebagai Bearer token pembeli, dan periksa `data.profile_completeness` (`{ ready, missing[] }`).

### D. Login via Scan QR Code (Akun Sudah Login di Perangkat Lain)
1. **Layar Web/Desktop** buat QR: `POST /barokahiin/public/auth/qr/create` → render `data.qr_payload` (`barokahiin://qr-login/{qr_token}`) sebagai QR Code (berlaku 3 menit).
2. **Layar Web/Desktop** polling setiap 2–3 detik: `GET /barokahiin/public/auth/qr/{qr_token}/status`.
3. **Perangkat Mobile (sudah login)** scan QR lalu kirim: `POST /barokahiin/buyer/auth/qr/approve` (Bearer token) dengan `{ "qr_token": "<qr_token atau qr_payload>" }`.
4. Begitu disetujui, polling pada langkah 2 mengembalikan `{ status: "approved", token, user, profile_completeness }` sekali pakai (lalu otomatis ditandai `consumed`).

---

## 4. Profil "Siap Beli" & Buku Alamat

- **Cek kelengkapan**: `GET /barokahiin/buyer/me/profile/completeness?serah=kirim` (atau `ambil`)
  Jika `ready === false`, tampilkan layar **"Lengkapi Data"** sesuai daftar kode pada `missing[]`:
  - `PHONE_UNVERIFIED` → verifikasi OTP HP
  - `EMAIL_UNVERIFIED` → `POST /barokahiin/buyer/me/email/verify`
  - `NAME_MISSING` / `TERMS_NOT_ACCEPTED` / `REGION_MISSING` → `PATCH /barokahiin/buyer/me/profile` (`{ nama_lengkap, region_id, accept_terms: true, terms_version: "0.5" }`)
  - `ADDRESS_MISSING` / `ADDRESS_INVALID` → `POST /barokahiin/buyer/me/addresses`
- **Buku Alamat**: `GET /barokahiin/buyer/me/addresses`, `POST /barokahiin/buyer/me/addresses`, `DELETE /barokahiin/buyer/me/addresses/{uuid}`
  - Maksimal 5 alamat.
  - Periksa `data.warnings[]` (mis. `ADDRESS_LOOKS_INCOMPLETE`, `ADDRESS_SUSPICIOUS_TEXT`) untuk menampilkan konfirmasi sebelum lanjut.
- **Anonimisasi Akun**: `DELETE /barokahiin/buyer/me` (menghapus data pribadi tanpa merusak catatan keuangan).

---

## 5. Alur Keranjang, Checkout (Hold 30 Menit), & Pasca-Bayar

1. **Keranjang**: `GET /barokahiin/buyer/cart` dan `POST /barokahiin/buyer/cart` (`{ "item_uuid": "..." }`).
2. **Voucher (Opsional)**:
   - Daftar voucher publik aktif: `GET /barokahiin/public/vouchers`
   - Cek & hitung potongan voucher: `POST /barokahiin/buyer/vouchers/preview` dengan `{ "voucher_code": "BERKAH25", "item_uuids": ["<uuid>"], "serah": "kirim", "address_uuid": "<uuid>" }`.
3. **Validasi Checkout (tanpa hold)**: `POST /barokahiin/buyer/checkout/validate`
   ```json
   {
     "item_uuids": ["<uuid>"],
     "serah": "kirim",
     "address_uuid": "<uuid>",
     "voucher_code": "BERKAH25",
     "rounding_donation_idr": 2000
   }
   ```
   Tampilkan layar **"Periksa Pesananmu"** dengan ringkasan `data.quote` (`subtotal_idr`, `ongkir_idr`, `packing_fee_idr`, `rounding_donation_idr`, `voucher_code`, `voucher_discount_idr`, `total_idr`, `zona`) dan checkbox wajib **"Data sudah benar"**.
4. **Konfirmasi Pesanan (mulai hold 30 menit)**: `POST /barokahiin/buyer/checkout/confirm` (`Idempotency-Key`)
   - Wajib menyertakan `"data_confirmed": true` (dan `"voucher_code"` jika memakai voucher).
   - Jika sukses (`201`): tampilkan hitung mundur berdasarkan `data.hold_expires_at`.
5. **Buat Pembayaran Midtrans Snap**: `POST /barokahiin/buyer/orders/{uuid}/pay` (`Idempotency-Key`)
   - Body: `{ "metode": "snap" | "qris" | "va" | "ewallet", "bank": "bca" }` (`bank` opsional untuk `va`).
   - Respons mengembalikan `snap_token`, `redirect_url`, `client_key`, dan `is_production`. Frontend dapat langsung memanggil `window.snap.pay(data.snap_token)` atau mengarahkan ke `data.redirect_url`.
   - Webhook Midtrans backend: `POST /api/v1/barokahiin/public/payments/webhook/midtrans` (verifikasi `signature_key` SHA512 otomatis).
5. **Lacak & Pasca-Bayar**:
   - **Status Pesanan**: `GET /barokahiin/buyer/orders/{kode}`
   - **Kuitansi Kebaikan**: `GET /barokahiin/buyer/orders/{kode}/impact-receipt` — tampilkan `rincian_pembayaran` dan `kuitansi_kebaikan` (`koordinator_net_idr`, `kegiatan_idr`, `operasional_idr`, `jaminan_idr`, `program_credits`).
   - **Alamat Lengkap Titik Ambil** *(hanya muncul bila `serah=ambil` dan status sudah `dibayar`)*: `GET /barokahiin/buyer/orders/{kode}/pickup`.
   - **Koreksi Alamat** *(hanya saat status `dibayar` & zona ongkir sama)*: `PATCH /barokahiin/buyer/orders/{uuid}/address` (`{ "address_uuid": "..." }`).
   - **Batal sebelum bayar**: `POST /barokahiin/buyer/orders/{uuid}/cancel`.
   - **Konfirmasi Diterima**: `POST /barokahiin/buyer/orders/{uuid}/confirm-received`.
   - **Komplain (≤ 48 jam setelah diterima)**: `POST /barokahiin/buyer/orders/{uuid}/disputes` (`{ "alasan": "..." }`).
   - **Ulasan**: `POST /barokahiin/buyer/orders/{uuid}/reviews` (`{ "rating_barang": 5, "rating_layanan": 5, "teks": "..." }`).

---

## 6. Penanganan Kode Error di Storefront

| HTTP | `error.code` | Tindakan UI |
|---|---|---|
| `401` | `OTP_INVALID` / token expired | Minta login OTP ulang. |
| `403` | `PICKUP_NOT_AVAILABLE` | Tampilkan pesan bahwa alamat lengkap hanya muncul setelah pembayaran lunas. |
| `409` | `ITEM_UNAVAILABLE` | Barang sudah ditahan/terjual; segarkan keranjang dan tampilkan barang serupa. |
| `409` | `ORDER_UNDER_REVIEW` | Pesanan ditahan untuk peninjauan keamanan (terdeteksi terkait koordinator). |
| `409` | `ADDRESS_CHANGE_NOT_ALLOWED` | Alamat tidak bisa diubah (pesanan sudah disiapkan atau berbeda zona ongkir). |
| `409` | `DISPUTE_WINDOW_CLOSED` | Jendela komplain 48 jam sudah berakhir. |
| `422` | `PROFILE_INCOMPLETE` | Arahkan ke halaman Lengkapi Profil berdasarkan `error.fields.missing[]`. |
| `429` | Rate limited | Hormati header `Retry-After` sebelum mengulang. |
