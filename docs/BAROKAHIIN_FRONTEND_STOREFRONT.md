# Panduan Integrasi Frontend 1: Storefront Barokahiin (Publik & Pembeli)

Dokumen ini khusus untuk tim **Frontend Storefront Barokahiin** yang mengonsumsi:

- **API Publik** (tanpa login): `/api/v1/barokahiin/public/*`
- **API Wilayah Administratif** (tanpa login): `/api/v1/public/wilayah/*`
- **API Pembeli** (akun wajib untuk membuat pesanan): `/api/v1/barokahiin/buyer/*`

Postman Collection siap impor: [barokahiin-v0.5.postman_collection.json](./postman/barokahiin-v0.5.postman_collection.json) (gunakan folder **1. Public** dan **2. Buyer**).

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

| Halaman                         | Endpoint                                                                                                                         | Variabel Respons Utama                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Katalog**                     | `GET /barokahiin/public/items`                                                                                                   | `data.items[]`: `uuid`, `kode_barang`, `slug`, `judul`, `grade` (`A`/`B`/`C`), `jalur` (`jual`/`charity`), `price_idr`, `ref_new_price_idr`, `pickup_only`, `status`, `donor_label` (`"Sahabat Berbagi"`), `cover_url`, `kategori` (`kode`, `nama`, `slug`), `toko` (`uuid`, `nama`, `slug`, `area_publik`, `rating_avg`, `level`), `program_charity`. |
| **Detail Barang**               | `GET /barokahiin/public/items/{slug}`                                                                                            | Semua field katalog + `keterangan`, `kekurangan`, `media[]` (`uuid`, `tipe`, `url`, `alt`, `urutan`, `lebar`, `tinggi`), dan **`segel_kurasi`** (`sop_version`, `grade`, `checks[]`: `kode`, `teks`, `lulus`, `teks_keterbukaan`).                                                                                                                     |
| **Estimasi Ongkir**             | `GET /barokahiin/public/items/{slug}/shipping-estimate?region={id}`                                                              | `zona`, `billable_weight_g`, `ongkir_idr`, `packing_fee_idr` (atau `pickup_only: true`).                                                                                                                                                                                                                                                               |
| **Daftar & Detail Toko**        | `GET /barokahiin/public/stores`, `/stores/{slug}`, `/stores/{slug}/items`                                                        | `uuid`, `nama`, `slug`, `deskripsi`, `kebijakan_tambahan`, `jam_operasional`, `area_publik`, `level`, `rating_avg`, `rating_count`. _(Alamat lengkap tidak pernah muncul di publik.)_                                                                                                                                                                  |
| **Program Charity**             | `GET /barokahiin/public/programs`, `/programs/{slug}`                                                                            | `uuid`, `judul`, `slug`, `tujuan`, `penerima_manfaat_desc`, `wilayah`, `target_idr`, `terkumpul_idr`, `status`, `laporan[]`.                                                                                                                                                                                                                           |
| **Ringkasan Dampak**            | `GET /barokahiin/public/impact`                                                                                                  | `total_dana_kebaikan_idr`, `total_barang_terjual`, `total_barang_tersedia`, `total_program_terdanai`.                                                                                                                                                                                                                                                  |
| **Master Wilayah & Kategori**   | `GET /barokahiin/public/regions?source=wilayah_id&level=provinsi`, `/public/wilayah/filters`, `/categories`                      | Wilayah gabungan: administratif `wilayah.id` (Provinsi → Kab/Kota → Kecamatan → Kelurahan) + organisasi (`daerah` → `desa` → `kelompok`).                                                                                                                                                                                                              |
| **Filter Wilayah Gabungan**     | `GET /public/wilayah/provinces`, `/regencies/{provinceCode}`, `/districts/{regencyCode}`, `/villages/{districtCode}`, `/filters` | Cascading dropdown wilayah administratif (`wilayah.id`, di-cache 7 hari) sekaligus daftar `daerah`, `desa`, `kelompok` dalam satu endpoint `/public/wilayah/filters`.                                                                                                                                                                                  |
| **Halaman Statis & Pengaturan** | `GET /barokahiin/public/pages/{key}`, `/settings`                                                                                | Konten halaman (`tentang`, `cara-kerja`, `faq`, `kebijakan`, `kontak`) dan rekening/WhatsApp resmi.                                                                                                                                                                                                                                                    |

Respons endpoint wilayah administratif (`provinces`, `regencies`, `districts`, `villages`) menggunakan daftar `{ code, name }` di dalam `data`, dengan metadata `meta.administrative_area_level` dan `meta.updated_at`. Katalog menggunakan kode resmi untuk `province_code`, `regency_code`, `district_code`, dan `village_code`; picker untuk profil/alamat tetap menggunakan `region_id` internal. Daftar administratif di-cache frontend selama 7 hari. Bentuk respons `/wilayah/filters` untuk `daerah`, `desa`, dan `kelompok` tetap mengikuti kontrak endpoint tersebut.

**Query filter katalog (`GET /barokahiin/public/items`):**
`q`, `category` (slug/kode/uuid), `region` (ID wilayah internal), `province_code` (contoh `32`), `regency_code` (contoh `32.73`), `district_code` (contoh `32.73.28`), `village_code` (contoh `32.73.28.1001`), `daerah_id`, `desa_id`, `kelompok_id`, `price_min`, `price_max`, `grade` (`A`/`B`/`C`), `serah` (`ambil`/`kirim`), `charity` (`true`/`false`), `sort` (`peringkat` [default deterministik] | `terbaru` | `termurah` | `termahal`), `limit` (1–100).

---

## 3. Autentikasi Pembeli (OTP HP)

Menjelajah dan menyimpan keranjang lokal boleh tanpa akun. **Membuat pesanan wajib memiliki akun pembeli.**

1. **Minta OTP**: `POST /barokahiin/public/auth/otp/request` (`Idempotency-Key`)
   ```json
   { "phone": "081355556666" }
   ```
2. **Verifikasi OTP**: `POST /barokahiin/public/auth/otp/verify`
   ```json
   {
     "phone": "081355556666",
     "code": "123456",
     "nama_lengkap": "Pembeli Barokahiin"
   }
   ```
   Simpan `data.token` sebagai Bearer token pembeli, dan periksa `data.profile_completeness` (`{ ready, missing[] }`).

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
2. **Validasi Checkout (tanpa hold)**: `POST /barokahiin/buyer/checkout/validate`
   ```json
   {
     "item_uuids": ["<uuid>"],
     "serah": "kirim",
     "address_uuid": "<uuid>",
     "rounding_donation_idr": 2000
   }
   ```
   Tampilkan layar **"Periksa Pesananmu"** dengan ringkasan `data.quote` (`subtotal_idr`, `ongkir_idr`, `packing_fee_idr`, `rounding_donation_idr`, `total_idr`, `zona`) dan checkbox wajib **"Data sudah benar"**.
3. **Konfirmasi Pesanan (mulai hold 30 menit)**: `POST /barokahiin/buyer/checkout/confirm` (`Idempotency-Key`)
   - Wajib menyertakan `"data_confirmed": true`.
   - Jika sukses (`201`): tampilkan hitung mundur berdasarkan `data.hold_expires_at`.
4. **Buat Instruksi Bayar**: `POST /barokahiin/buyer/orders/{uuid}/pay` (`Idempotency-Key`) dengan `{ "metode": "qris" | "va" | "ewallet" }`.
5. **Lacak & Pasca-Bayar**:
   - **Status Pesanan**: `GET /barokahiin/buyer/orders/{kode}`
   - **Kuitansi Kebaikan**: `GET /barokahiin/buyer/orders/{kode}/impact-receipt` — tampilkan `rincian_pembayaran` dan `kuitansi_kebaikan` (`koordinator_net_idr`, `kegiatan_idr`, `operasional_idr`, `jaminan_idr`, `program_credits`).
   - **Alamat Lengkap Titik Ambil** _(hanya muncul bila `serah=ambil` dan status sudah `dibayar`)_: `GET /barokahiin/buyer/orders/{kode}/pickup`.
   - **Koreksi Alamat** _(hanya saat status `dibayar` & zona ongkir sama)_: `PATCH /barokahiin/buyer/orders/{uuid}/address` (`{ "address_uuid": "..." }`).
   - **Batal sebelum bayar**: `POST /barokahiin/buyer/orders/{uuid}/cancel`.
   - **Konfirmasi Diterima**: `POST /barokahiin/buyer/orders/{uuid}/confirm-received`.
   - **Komplain (≤ 48 jam setelah diterima)**: `POST /barokahiin/buyer/orders/{uuid}/disputes` (`{ "alasan": "..." }`).
   - **Ulasan**: `POST /barokahiin/buyer/orders/{uuid}/reviews` (`{ "rating_barang": 5, "rating_layanan": 5, "teks": "..." }`).

---

## 6. Penanganan Kode Error di Storefront

| HTTP  | `error.code`                  | Tindakan UI                                                                   |
| ----- | ----------------------------- | ----------------------------------------------------------------------------- |
| `401` | `OTP_INVALID` / token expired | Minta login OTP ulang.                                                        |
| `403` | `PICKUP_NOT_AVAILABLE`        | Tampilkan pesan bahwa alamat lengkap hanya muncul setelah pembayaran lunas.   |
| `409` | `ITEM_UNAVAILABLE`            | Barang sudah ditahan/terjual; segarkan keranjang dan tampilkan barang serupa. |
| `409` | `ORDER_UNDER_REVIEW`          | Pesanan ditahan untuk peninjauan keamanan (terdeteksi terkait koordinator).   |
| `409` | `ADDRESS_CHANGE_NOT_ALLOWED`  | Alamat tidak bisa diubah (pesanan sudah disiapkan atau berbeda zona ongkir).  |
| `409` | `DISPUTE_WINDOW_CLOSED`       | Jendela komplain 48 jam sudah berakhir.                                       |
| `422` | `PROFILE_INCOMPLETE`          | Arahkan ke halaman Lengkapi Profil berdasarkan `error.fields.missing[]`.      |
| `429` | Rate limited                  | Hormati header `Retry-After` sebelum mengulang.                               |
