# Barokahiin Design System, versi 2

Redesign warna Jawa Barat, navbar yang lebih ringkas, dan interaksi yang lebih hidup. Dokumen ini **menggantikan `design.md` saat ini** dan dibangun di atasnya: semua yang sudah berjalan dipertahankan, perubahan ditandai jelas.

> **Status dokumen.** Berbeda dari versi sebelumnya (dokumentasi implementasi), dokumen ini adalah **spesifikasi target** untuk redesign. Bagian yang belum ada di kode ditandai **[Ubah]** atau **[Baru]**; yang sudah ada dan tetap dipakai ditandai **[Ada]**. Spesifikasi produk yang lebih luas ada di [`docs/frontend-spec.md`](docs/frontend-spec.md).
>
> **Prinsip kerja yang tidak berubah:** pertahankan React, TypeScript, Vite, React Router, Tailwind, PrimeReact, PrimeIcons, Motion, GSAP, dan Lenis. **Jangan menambah pustaka UI baru.** Usulan yang membutuhkan data atau endpoint baru ditandai dan **harus dicek ke backend dulu** sebelum dibuat.

## Ringkasan perubahan

| Area | Sebelumnya | Sekarang |
|---|---|---|
| **Warna** | Indigo, kunyit, hijau | **Delapan warna Jawa Barat** dengan tugas jelas (nila, kunyit, teh, bata, telang, langit, mawar, tanah) dan **warna kategori dinamis** |
| **Navbar desktop** | Pil mengambang berisi logo, pencarian, tautan, kategori, keranjang, akun, tombol donasi | **Enam elemen**: logo, Belanja, Dampak, pencarian dengan wilayah, keranjang, akun |
| **Navigasi ponsel** | Drawer dari kanan **dan** empat tab bawah | **Tanpa drawer.** Pencarian dan wilayah selalu terlihat; empat tab bawah: Beranda, Jelajah, Keranjang, Akun |
| **Token** | Warna saja; jarak dan radius tidak formal | Warna, jarak, radius, elevasi, dan gerak sebagai variabel CSS; Tailwind membaca variabel yang sama |
| **Interaksi** | Receipt, tab, sheet | Ditambah warna kategori dinamis, terbang ke keranjang, navbar cerdas, Segel Kurasi yang lebih kaya, kuitansi yang bisa dibuka, timer hold |
| **Performa gerak** | Lenis, GSAP, dan Motion aktif untuk semua | Lenis hanya untuk pointer halus, GSAP dimuat malas, indikator tab murni CSS |
| **Identitas lokal** | Belum ada | Pita Mega Mendung dekoratif, sapaan Sunda disertai arti Indonesia |

## 1. Arah desain

Barokahiin adalah storefront barang layak pakai yang dikurasi koordinator lokal, dan hasil penjualannya mendukung kegiatan sosial. Tampilannya sekarang memadukan:

- **Satu warna dominan (nila)** sebagai identitas, **kunyit untuk aksi**, dan **enam warna lain yang masing-masing punya tugas** (kategori, status, wilayah). Penuh warna, tetapi tertib.
- **Identitas Jawa Barat** yang ditarik dari tanah dan budayanya: tarum (nila) yang memberi nama Citarum, kebun teh, kunyit, genteng tanah liat, bunga telang, kembang batik. Tampil sebagai warna dan satu pola dekoratif, **bukan** sebagai dekorasi berlebihan.
- Permukaan terang, batas halus, ruang cukup, dan **foto barang sebagai fokus**.
- Bentuk membulat yang ramah, tanpa menjadikan semua elemen kartu tebal atau penuh bayangan.

Bahasa Indonesia yang langsung, ramah, dan jelas. Label berbentuk kalimat (sentence case), bukan kapital penuh. **Sapaan Sunda** ("Wilujeng sumping", "Hatur nuhun") **selalu disertai arti Indonesia** dan dipakai hemat agar tetap inklusif.

## 2. Teknologi UI

**[Ada] dan tidak berubah:** React + TypeScript (Vite, React Router), Tailwind CSS, PrimeReact (tema dasar Lara Light Teal), PrimeIcons, Motion, GSAP (receipt beranda), Lenis, Plus Jakarta Sans dan Bricolage Grotesque.

**Aturan tambahan:**
- Tema Lara Light Teal **tetap sebagai basis**, tetapi **semua variabel warnanya ditimpa token Barokahiin** (Bagian 3.5). Tidak boleh ada warna teal bawaan yang masih terlihat.
- Animasi baru memakai **Web Animations API atau CSS** bila cukup. Motion dipakai untuk yang memang butuh orkestrasi. **GSAP hanya untuk beranda (receipt)** dan **dimuat malas**.
- Usulan yang butuh endpoint baru ditandai **[Baru, butuh API]**.

## 3. Warna

### 3.1 Palet Jawa Barat **[Ubah]**

Semua token di `:root` pada `src/index.css` (atau berkas token terpisah yang diimpor di sana). Setiap warna punya tiga bentuk: **kuat** (isi tombol/lencana), **muda** (latar lembut), dan **tua** (teks di atas muda).

| Warna | Kuat | Muda | Tua | Asal dan tugas |
|---|---|---|---|---|
| **Nila** | `#24348F` | `#E4E8FA` | `#141C52` | Tarum, nila Citarum. **Identitas, aksi utama, tautan, harga, fokus** |
| **Kunyit** | `#F5B31A` | `#FFF1CC` | `#7A5200` | Kunyit dapur Sunda. **CTA beli, sorotan, peringatan ringan** |
| **Teh** | `#1B7F46` | `#DDF3E4` | `#14633A` | Kebun teh. **Charity, dampak, status berhasil/tersedia** |
| **Bata** | `#C8431F` | `#FCE5DD` | `#9E3217` | Genteng tanah liat. **Harga turun, barang baru, perabot** |
| **Telang** | `#6B3FA0` | `#EDE4F7` | `#53307E` | Bunga telang. **Kategori pakaian** |
| **Langit** | `#1668B0` | `#DCEBF8` | `#115590` | Langit pegunungan. **Informasi, elektronik** |
| **Mawar** | `#C43370` | `#FADFEA` | `#9C2A5A` | Kembang pada batik. **Bayi dan anak** |
| **Tanah** | `#7F5230` | `#F1E6DB` | `#6B4326` | Kayu dan tanah. **Alat dan perkakas** |

Tambahan: **`--pucuk` `#B7DB3A`** (pucuk teh) hanya untuk sorotan di atas nila atau nila tua, atau sebagai isian dengan teks `--tinta`.
Netral dan status yang **tetap**: `--kertas` `#F4F6FB`, `--putih` `#FFFFFF`, `--tinta` `#171B3D`, `--muted` `#566083`, `--garis` `#D9DEEE`, `--garis-kuat` `#7A83A6`, `--bahaya` `#BF3328`, `--bahaya-muda` `#FBE3E0`.

### 3.2 Kontras (sudah dihitung)

| Pasangan | Rasio | Catatan |
|---|---|---|
| Putih di atas nila | 10,70 | Tombol utama |
| Putih di atas teh | 5,04 | |
| Putih di atas bata | 4,91 | |
| Putih di atas telang | 7,38 | |
| Putih di atas langit | 5,77 | |
| Putih di atas mawar | 5,18 | |
| Putih di atas tanah | 6,66 | |
| **Tinta di atas kunyit** | **9,00** | **Teks di atas kunyit selalu tinta** |
| Tinta di atas pucuk | 10,48 | |
| Pucuk di atas nila | 6,73 | Sapaan di hero |
| Kunyit di atas nila | 5,78 | |
| Kunyit di atas nila tua | 8,61 | |
| Tua di atas muda: nila 8,77 · teh 6,26 · kunyit 6,16 · bata 5,95 · telang 8,15 · langit 6,34 · mawar 5,81 · tanah 6,96 | ≥ 5,8 | Lencana dan chip |
| Muted di atas nila muda | 5,07 | |
| Warna kuat sebagai **teks di atas kertas**: nila 9,89 · telang 6,83 · tanah 6,16 · langit 5,33 · mawar 4,79 · teh 4,66 · bata 4,54 | ≥ 4,5 | Untuk teks **di bawah 14 px** pakai varian **tua** |
| Garis kuat di atas putih | 3,73 | Batas komponen interaktif (≥ 3:1) |

**Aturan:** teks putih hanya di atas nila, teh, bata, telang, langit, mawar, tanah. Teks tinta di atas kunyit dan pucuk. **Jangan** memakai kunyit atau pucuk sebagai warna teks di latar terang. **Warna tidak boleh menjadi satu-satunya penanda**; selalu sertakan teks atau ikon.

### 3.3 Warna kategori dinamis **[Baru]**

Setiap kategori punya aksen. Pakai atribut `data-kategori` pada elemen pembungkus (halaman kategori) **dan** pada kartu barang, sehingga variabel `--aksen*` otomatis berubah.

| Kategori | Aksen | Ikon pembeda (PrimeIcons) |
|---|---|---|
| Pakaian | telang | `pi-tag` |
| Elektronik | langit | `pi-bolt` |
| Perabot | bata | `pi-home` |
| Buku | kunyit (teks tinta) | `pi-book` |
| Bayi dan anak | mawar | `pi-heart` |
| Sekolah | nila | `pi-pencil` |
| Alat dan perkakas | tanah | `pi-wrench` |
| Alat bantu kesehatan | langit | `pi-plus-circle` |
| Ibadah | teh | `pi-star` |
| Tanaman | teh | `pi-sun` |
| Lainnya | nila | `pi-box` |

> Elektronik dan alat bantu kesehatan berbagi langit, begitu pula ibadah dan tanaman berbagi teh; **ikon dan teks yang membedakan**, bukan warna saja. Periksa nama ikon di versi PrimeIcons yang terpasang dan ganti bila tidak ada. **Cek slug kategori dari API** lalu petakan lewat satu fungsi `kategoriToSlug()`.

**Aksen dipakai untuk:** chip kategori pada kartu, chip filter terpilih, garis aktif navigasi pada halaman kategori, pita beranda per kategori, tautan kategori. **Aksen tidak dipakai untuk** tombol aksi utama (tetap nila/kunyit) agar aksi selalu konsisten.

### 3.4 Kode token **[Ubah]**

Tempel di `:root`. **Nama lama dipertahankan sebagai alias** agar tidak ada CSS yang rusak saat migrasi.

```css
:root {
  /* Netral */
  --kertas: #F4F6FB; --putih: #FFFFFF; --tinta: #171B3D; --muted: #566083;
  --garis: #D9DEEE;  --garis-kuat: #7A83A6;

  /* Warna Jawa Barat: kuat, tua, muda */
  --nila:   #24348F; --nila-tua:   #141C52; --nila-muda:   #E4E8FA;
  --kunyit: #F5B31A; --kunyit-tua: #7A5200; --kunyit-muda: #FFF1CC;
  --teh:    #1B7F46; --teh-tua:    #14633A; --teh-muda:    #DDF3E4;
  --bata:   #C8431F; --bata-tua:   #9E3217; --bata-muda:   #FCE5DD;
  --telang: #6B3FA0; --telang-tua: #53307E; --telang-muda: #EDE4F7;
  --langit: #1668B0; --langit-tua: #115590; --langit-muda: #DCEBF8;
  --mawar:  #C43370; --mawar-tua:  #9C2A5A; --mawar-muda:  #FADFEA;
  --tanah:  #7F5230; --tanah-tua:  #6B4326; --tanah-muda:  #F1E6DB;
  --pucuk:  #B7DB3A;
  --bahaya: #BF3328; --bahaya-muda: #FBE3E0;

  /* Alias nama lama (hapus setelah semua pemakaian dimigrasi) */
  --indigo: var(--nila);   --indigo-tua: var(--nila-tua);   --indigo-muda: var(--nila-muda);
  --daun: var(--teh);      --daun-tua: var(--teh-tua);      --daun-muda: var(--teh-muda);
  --info: var(--langit);   --peringatan-teks: var(--kunyit-tua);

  /* Aksen kategori (bawaan: nila) */
  --aksen: var(--nila); --aksen-teks: #fff; --aksen-muda: var(--nila-muda); --aksen-tua: var(--nila);

  /* Bentuk, jarak, elevasi, gerak */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px; --s-6: 32px; --s-7: 48px; --s-8: 64px; --s-9: 96px;
  --r-kontrol: 8px; --r-kartu: 12px; --r-kartu-besar: 16px; --r-pop: 20px; --r-pil: 999px;
  --e-float: 0 16px 48px rgb(23 27 61 / 14%);
  --e-bar: 0 -8px 24px rgb(23 27 61 / 8%);
  --motion-ease: cubic-bezier(0.2, 0, 0, 1);
  --d-fast: 120ms; --d-base: 200ms; --d-slow: 320ms;
}

[data-kategori="pakaian"]    { --aksen: var(--telang); --aksen-teks: #fff; --aksen-muda: var(--telang-muda); --aksen-tua: var(--telang-tua); }
[data-kategori="elektronik"] { --aksen: var(--langit); --aksen-teks: #fff; --aksen-muda: var(--langit-muda); --aksen-tua: var(--langit-tua); }
[data-kategori="perabot"]    { --aksen: var(--bata);   --aksen-teks: #fff; --aksen-muda: var(--bata-muda);   --aksen-tua: var(--bata-tua); }
[data-kategori="buku"]       { --aksen: var(--kunyit); --aksen-teks: var(--tinta); --aksen-muda: var(--kunyit-muda); --aksen-tua: var(--kunyit-tua); }
[data-kategori="bayi-anak"]  { --aksen: var(--mawar);  --aksen-teks: #fff; --aksen-muda: var(--mawar-muda);  --aksen-tua: var(--mawar-tua); }
[data-kategori="sekolah"]    { --aksen: var(--nila);   --aksen-teks: #fff; --aksen-muda: var(--nila-muda);   --aksen-tua: var(--nila); }
[data-kategori="alat"]       { --aksen: var(--tanah);  --aksen-teks: #fff; --aksen-muda: var(--tanah-muda);  --aksen-tua: var(--tanah-tua); }
[data-kategori="kesehatan"]  { --aksen: var(--langit); --aksen-teks: #fff; --aksen-muda: var(--langit-muda); --aksen-tua: var(--langit-tua); }
[data-kategori="ibadah"],
[data-kategori="tanaman"]    { --aksen: var(--teh);    --aksen-teks: #fff; --aksen-muda: var(--teh-muda);    --aksen-tua: var(--teh-tua); }
```

Transisi saat berpindah kategori: `transition: background-color var(--d-base) var(--motion-ease), color var(--d-base) var(--motion-ease), border-color var(--d-base) var(--motion-ease);` dan hilangkan di `prefers-reduced-motion`.

### 3.5 Menimpa tema PrimeReact **[Ubah]**

Tema Lara Light Teal menyetel warna lewat variabel CSS. Timpa **setelah** berkas tema diimpor. **Periksa nama variabel** di berkas tema versi PrimeReact yang terpasang (cari `--primary-color`), lalu pastikan tidak ada teal tersisa.

```css
:root {
  --primary-color: var(--nila);
  --primary-color-text: #fff;
  --text-color: var(--tinta);
  --text-color-secondary: var(--muted);
  --surface-ground: var(--kertas);
  --surface-card: var(--putih);
  --surface-border: var(--garis);
  --highlight-bg: var(--nila-muda);
  --highlight-text-color: var(--nila);
  --border-radius: var(--r-kontrol);
  --font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}
/* Bila komponen masih menampilkan teal (hover, ring fokus), timpa skala --primary-50 sampai --primary-900
   dengan nila, atau timpa kelas komponennya. Cari sisa teal dengan: grep -ri "14b8a6\|teal" src/ */
```

Tombol aksi beli (kunyit) memakai kelas proyek di atas `Button` PrimeReact:

```css
.btn-cta { background: var(--kunyit); color: var(--tinta); border: 0; font-weight: 700; min-height: 48px; border-radius: var(--r-pil); }
.btn-cta:hover:not(:disabled) { background: #E5A312; }
.btn-cta:active:not(:disabled) { transform: translateY(1px); }
.btn-cta:disabled { background: var(--garis); color: var(--muted); }
:focus-visible { outline: 3px solid var(--nila); outline-offset: 2px; }
.on-dark :focus-visible { outline-color: var(--kunyit); }
```

### 3.6 Tailwind **[Ubah]**

Satu sumber warna: variabel CSS. Hapus keluarga `brand` dan `urgent` setelah semua pemakaiannya dipindah (`brand-*` ke `nila-*`, `urgent-*` ke `bata-*` atau `bahaya`).

```js
// tailwind.config.js
const token = (n) => `var(--${n})`;
const hue = (n) => ({ DEFAULT: token(n), tua: token(`${n}-tua`), muda: token(`${n}-muda`) });

export default {
  theme: {
    extend: {
      colors: {
        kertas: token('kertas'), putih: token('putih'), tinta: token('tinta'), muted: token('muted'),
        garis: { DEFAULT: token('garis'), kuat: token('garis-kuat') },
        nila: hue('nila'), kunyit: hue('kunyit'), teh: hue('teh'), bata: hue('bata'),
        telang: hue('telang'), langit: hue('langit'), mawar: hue('mawar'), tanah: hue('tanah'),
        pucuk: token('pucuk'),
        bahaya: { DEFAULT: token('bahaya'), muda: token('bahaya-muda') },
        aksen: { DEFAULT: token('aksen'), teks: token('aksen-teks'), muda: token('aksen-muda'), tua: token('aksen-tua') },
      },
      borderRadius: { kontrol: 'var(--r-kontrol)', kartu: 'var(--r-kartu)', 'kartu-besar': 'var(--r-kartu-besar)', pop: 'var(--r-pop)' },
      boxShadow: { float: 'var(--e-float)', bar: 'var(--e-bar)' },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```
> **Batasan:** warna yang didefinisikan sebagai `var(--...)` **tidak mendukung pengubah opasitas Tailwind** (mis. `bg-nila/50`). Bila perlu, definisikan juga versi kanal RGB, atau pakai warna `-muda`.

## 4. Tipografi **[Ada]**

Tidak berubah: **Plus Jakarta Sans** untuk antarmuka dan isi, **Bricolage Grotesque** untuk judul, harga, dan angka yang ditonjolkan; ukuran fluida dengan `clamp()`, dasar sekitar 16 px, line-height 1,55; angka tabular untuk harga.

Tambahan:
- Harga dan rincian biaya memakai `font-variant-numeric: tabular-nums` dan **rata kanan** (receipt, checkout, dompet).
- Input minimal **16 px** agar iOS tidak memperbesar halaman saat fokus.
- Sapaan Sunda memakai gaya teks biasa (bukan huruf kapital), diikuti arti dalam tanda kurung atau baris berikutnya.

## 5. Bentuk, jarak, elevasi, dan gerak

Token ada di Bagian 3.4. Nilai mengikuti rentang yang sudah tampak pada UI:

| Token | Nilai | Pemakaian |
|---|---|---|
| `--r-kontrol` | 8 px | Input, dropdown, chip kecil |
| `--r-kartu` | 12 px | Kartu barang, panel |
| `--r-kartu-besar` | 16 px | Kartu toko, panel besar |
| `--r-pop` | 20 px | Popover, dialog, bottom sheet |
| `--r-pil` | penuh | Navbar, badge, CTA, tab |
| `--s-1` sampai `--s-9` | 4 sampai 96 px | Jarak (skala 4-an) |
| `--e-float` | bayangan lembut | Overlay, dialog, drawer, menu |
| `--e-bar` | bayangan atas | Bilah tab bawah dan sticky bar |

Aturan: kartu konten **mengandalkan border, ruang, dan foto**, bukan bayangan. Tinggi minimum kontrol dan tombol **44 px** (CTA 48 px). Target sentuh ikon **44 px**.

## 6. Pola komponen

### 6.1 Navbar desktop **[Ubah]**

Terlalu banyak elemen sebelumnya. Sekarang **satu baris, enam elemen**:

```
[Logo]  [Belanja v]  [Dampak]  [ (pin) Bandung Raya | Cari barang layak pakai | Ctrl K ]  [Keranjang 2]  [Masuk]
```

| Elemen | Perilaku |
|---|---|
| **Logo** | Tautan ke beranda |
| **Belanja** | Membuka **menu besar**: delapan kategori berwarna (sesuai 3.3), "Semua barang", "Toko di wilayahmu", "Barang baru". Hover dengan jeda 150 ms di perangkat pointer; klik/ketuk di perangkat sentuh; `Esc` menutup; panah berpindah antar kategori |
| **Dampak** | Tautan ke halaman Dampak. **Di lebar 1024 sampai 1279 px** ia pindah ke dalam menu Belanja (baris bawah) agar bilah tidak sesak |
| **Pencarian dengan wilayah** | **Satu kontrol**: chip wilayah di kiri (membuka pemilih wilayah), kolom cari, dan petunjuk `Ctrl K`. Mengetuk kolom membuka **command palette** yang sudah ada |
| **Keranjang** | Ikon dengan lencana jumlah (bata, teks putih); `aria-label` memuat jumlah |
| **Akun** | "Masuk" (nila) bila belum login; avatar dan menu bila sudah (Pesanan saya, Alamat, Profil, Donasi barang, Keluar) |

- Bentuk tetap **pil mengambang** (kesinambungan), tinggi 64 px. Setelah gulir lebih dari 8 px, tambahkan `--e-float`.
- **Tombol "Donasi barang" dihapus dari navbar.** Ajakan donasi pindah ke hero beranda, halaman Dampak, menu akun, keadaan kosong, dan footer. Dengan begitu tidak ada lagi tombol yang hilang pada lebar 1023 sampai 1279 px.
- Pencarian header di tablet tidak lagi disembunyikan; di bawah 1024 px dipakai susunan ponsel (6.2).

### 6.2 Navigasi ponsel dan tablet **[Ubah]**

**Hapus drawer (Sidebar) dan tombol hamburger.** Drawer dan tab bawah sebelumnya saling menduplikasi.

- **Bilah atas:** logo ringkas, **chip wilayah**, lalu **kolom cari selebar penuh** di bawahnya. Pencarian selalu terlihat karena itu aksi utama.
- **Tab bawah, empat saja:** **Beranda**, **Jelajah** (katalog dengan segmen "Barang" dan "Toko"; kategori berwarna di sini), **Keranjang** (lencana jumlah), **Akun** (Pesanan saya, Alamat, Profil, **Dampak**, **Donasi barang**, Bantuan).
- **Dampak** dan **Donasi barang** tersedia di beranda, menu Akun, dan footer.
- Bilah atas **bersembunyi saat gulir turun dan muncul saat gulir naik** (6.8). Tidak bersembunyi saat pencarian fokus atau ada sheet terbuka.
- Berlaku untuk lebar di bawah 1024 px.

Implementasi tab bawah. Indikator aktif digeser **murni dengan CSS** (tanpa fitur layout Motion), sehingga ringan dan mulus:

```tsx
// BottomTabs.tsx
import { NavLink, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/',          label: 'Beranda',   icon: 'pi pi-home' },
  { to: '/katalog',   label: 'Jelajah',   icon: 'pi pi-compass' },   // sesuaikan dengan rute yang ada
  { to: '/keranjang', label: 'Keranjang', icon: 'pi pi-shopping-cart' },
  { to: '/akun',      label: 'Akun',      icon: 'pi pi-user' },
];

export function BottomTabs({ cartCount = 0 }: { cartCount?: number }) {
  const { pathname } = useLocation();
  const active = Math.max(0, tabs.findIndex(t => (t.to === '/' ? pathname === '/' : pathname.startsWith(t.to))));
  return (
    <nav aria-label="Navigasi bawah" className="bottom-tabs" style={{ ['--i' as string]: active }}>
      <span className="bottom-tabs__pill" aria-hidden="true" />
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className="bottom-tabs__item">
          <i className={t.icon} aria-hidden="true" />
          <span>{t.label}</span>
          {t.to === '/keranjang' && cartCount > 0 && (
            <b className="bottom-tabs__badge" aria-label={`${cartCount} barang`}>{cartCount}</b>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
```

```css
.bottom-tabs { position: fixed; inset: auto 0 0 0; z-index: 40; display: grid; grid-template-columns: repeat(4, 1fr);
  padding: 8px 10px calc(8px + env(safe-area-inset-bottom)); background: var(--putih);
  border-top: 1px solid var(--garis); box-shadow: var(--e-bar); }
.bottom-tabs__pill { position: absolute; top: 8px; left: 10px; width: calc((100% - 20px) / 4);
  height: calc(100% - 16px - env(safe-area-inset-bottom)); border-radius: var(--r-pil); background: var(--nila-muda);
  transform: translateX(calc(var(--i) * 100%)); transition: transform var(--d-base) var(--motion-ease); }
.bottom-tabs__item { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px;
  min-height: 48px; padding: 6px 0; font-size: 12px; font-weight: 600; color: var(--muted); border-radius: var(--r-pil); }
.bottom-tabs__item.active { color: var(--nila); }
.bottom-tabs__badge { position: absolute; top: 2px; right: 22%; min-width: 18px; padding: 1px 5px; border-radius: var(--r-pil);
  background: var(--bata); color: #fff; font-size: 11px; line-height: 16px; text-align: center; }
@media (min-width: 1024px) { .bottom-tabs { display: none; } }
@media (prefers-reduced-motion: reduce) { .bottom-tabs__pill { transition: none; } }
```
> Beri `padding-bottom` pada konten utama setara tinggi bilah (sekitar 72 px + area aman) agar konten terakhir tidak tertutup.

### 6.3 Pemilih wilayah dan pencarian

- **Chip wilayah** (kunyit muda, teks `--kunyit-tua`, ikon `pi-map-marker`) selalu menampilkan wilayah aktif. Ketuk membuka **pemilih wilayah**: di desktop sebagai popover (PrimeReact `OverlayPanel`), di ponsel sebagai **bottom sheet** (Sidebar posisi bawah) yang sudah ada polanya.
- Isi pemilih: tombol **"Gunakan lokasi saya"** (meminta izin dengan alasan yang jelas), lalu `RegionPicker` bertingkat yang sudah ada.
- **Command palette [Ada]** diperkaya: kategori berwarna sebagai pintasan, **pencarian terakhir** (disimpan lokal, tanpa data pribadi), saran toko, dan pindah wilayah.
- Hasil pencarian mengikuti wilayah aktif; tampilkan wilayah di keterangan hasil.

### 6.4 Kartu barang **[Ubah]**

Dasar yang **tetap**: kartu putih, border tipis, radius 12 px, foto 4:5 `object-fit: cover`, kode barang seperti tag, harga Bricolage nila, favorit sebagai aksi mandiri dengan `aria-pressed`, foto lazy.

Tambahan:
- **Chip kategori** di atas foto memakai `--aksen` (teks `--aksen-teks`) **dengan ikon kategori** di dalamnya.
- **Lencana status** dengan ikon dan teks: Tersedia (teh muda, `pi-check-circle`), Ditahan (kunyit muda, `pi-clock`), Terjual (garis, `pi-lock`).
- **Tombol tambah cepat** (ikon `pi-plus`, 44 px) di pojok bawah foto, `aria-label="Tambah [judul] ke keranjang"`. Di perangkat hover muncul saat hover atau fokus; di perangkat sentuh selalu terlihat. Tidak tampil untuk barang yang tidak tersedia.
- **Segel mini** (ikon `pi-verified` bila tersedia, atau `pi-shield`) membuka versi ringkas hasil kurasi dalam bottom sheet.
- **Pita "Harga turun"** (bata) bila barang mengalami penurunan harga dari sistem.
- Gunakan **container query** pada pembungkus kartu supaya kartu menyesuaikan lebar kolomnya, bukan lebar layar:

```css
.item-card-wrap { container-type: inline-size; }
@container (max-width: 170px) { .item-card__meta { font-size: 12px; } .item-card__title { -webkit-line-clamp: 2; } }
```
- Pasang `data-kategori={kategoriToSlug(item.category)}` pada elemen kartu.

### 6.5 Chip filter, lencana, dan status

- **Chip filter** terpilih: latar `--aksen-muda`, teks `--aksen-tua`, **ikon centang** (tidak hanya warna). Chip aktif dapat dihapus satu per satu; ada "Hapus semua".
- **Lencana grade**: kata ("Grade B, baik"), bukan hanya huruf.
- **Lencana level toko**: "Level 1/2/3" dalam teks. Level 1 outline nila, level 2 isi nila muda, level 3 isi kunyit dengan teks tinta.
- **Pita harga turun/baru**: bata dengan teks putih.

### 6.6 Filter katalog **[Ada]**

Tetap: panel inline di desktop; bottom sheet di ponsel dengan handle, tombol tutup, batas tinggi `dvh`, padding area aman. Tambahan: tombol sheet **"Tampilkan N barang"** menempel di bawah, dan **warna aksen halaman mengikuti kategori terpilih**.

### 6.7 Beranda dan receipt **[Ubah]**

- **Hero** (nila): sapaan **"Wilujeng sumping"** (pucuk, teks biasa) dengan arti **"Selamat datang"** pada teks bantu; judul Bricolage; CTA utama **kunyit**; CTA sekunder "Donasi barang" (garis putih). **Tidak ada teks di atas pola.**
- **Pita Mega Mendung** dekoratif di sisi bawah hero (`aria-hidden`), bergaya awan berlapis dalam gradasi nila dan langit:

```css
.pita-mendung { height: 64px; background:
  repeating-radial-gradient(circle at 50% 130%, var(--nila) 0 9px, var(--langit) 9px 18px, #3F8FD2 18px 27px); }
```
- **Rel kategori berwarna** (geser horizontal): petak 92 px, warna kuat per kategori, ikon + nama.
- **"Baru di [wilayah]"**: grid kartu.
- **"Toko di wilayahmu"**: baris kartu toko.
- **Receipt [Ada]**: tetap dua kolom di desktop dan ditumpuk di ponsel, GSAP dimuat malas, dilewati saat reduced motion. Tambahan: baris-barisnya dapat dibuka (7.4) dan ditutup dengan **"Hatur nuhun"** (terima kasih).
- Bagian **Dampak**: angka Rupiah dengan label jelas; hindari dekorasi yang bersaing dengan barang.

### 6.8 Detail barang dan kepercayaan **[Ubah]**

Yang **tetap**: galeri 4:5 dengan thumbnail dan video berposter; kekurangan terbuka sebagai catatan kurasi; ongkir, zona, dan biaya kemas sebagai baris terpisah; barang ambil-saja tanpa alamat lengkap; sticky bar di ponsel.

Tambahan dan perubahan:
- **Catatan kurasi (kekurangan)**: panel kunyit muda dengan judul teks `--kunyit-tua`.
- **Segel Kurasi** tetap `details`, kini dengan **ikon dan lencana teks**: "Lulus" (teh) dan "Catatan" (kunyit), serta **tautan ke foto atau video bukti** yang dibuka dalam Dialog.
- **Label donatur:** tampilkan **hanya label publik dari API** (anonim, mis. "Sahabat Berbagi"). **Jangan menampilkan nama asli donatur.** *Dokumen sebelumnya menyebut "donor" pada ringkasan; konfirmasi kontrak API sebelum menampilkannya.*
- **Kartu toko ringkas**: nama toko, area publik, lencana level, rating (atau "Toko baru" bila < 10 pesanan). **Tanpa alamat atau kontak pribadi.**
- **Aksen halaman** mengikuti kategori barang (`data-kategori`).
- Sticky bar: harga (Bricolage nila) dan tombol **kunyit**.

### 6.9 Toko, kegiatan, dan laporan dana **[Ubah]**

**Halaman Toko**
- **Sampul:** foto toko bila ada; **bila belum ada, sampul bawaan** nila tua dengan pita Mega Mendung.
- Logo, nama toko, area publik, lencana level, rating, **jam operasional** dengan status "Buka sekarang" atau "Tutup, buka lagi [waktu]" (zona waktu wilayah).
- Tab: **Barang**, **Tentang**, **Program**, **Ulasan**.
- Toko yang dijeda: banner "Toko sedang libur sampai [tanggal]"; barang tidak tampil di katalog.
- **Tidak menampilkan** alamat rumah atau kontak pribadi koordinator.

**Halaman Kegiatan**
- Status (lencana), periode, **dana terkumpul, target, dana digunakan, saldo** dengan label jelas dan format Rupiah.
- **Progress bar teh** adalah pelengkap; **angka tetap tertulis** di sampingnya.
- Rincian pengeluaran sebagai tabel yang **dapat digulir horizontal** pada layar sempit (`role="region"`, `tabindex="0"`, `aria-label`).
- Dokumentasi foto/video dengan rasio konsisten, caption, dan kontrol video eksplisit.
- **Opsional [Baru]:** visualisasi **tabung angklung** (batang bambu vertikal sesuai progres per program) sebagai tambahan. **Nilai selalu tertulis**; bukan satu-satunya cara menyampaikan data.

### 6.10 Profil, checkout, dan pesanan **[Ada], dengan penyempurnaan**

Perilaku yang sudah ada **tetap**: daftar kelengkapan profil yang dapat ditindaklanjuti (tanpa kode mentah), keranjang menjelaskan stok belum ditahan, hold 30 menit baru dimulai setelah konfirmasi, persetujuan eksplisit, rincian biaya terpisah (subtotal, ongkir, biaya kemas, donasi pembulatan opsional, total), tindakan lanjutan hanya saat status mengizinkan.

Penyempurnaan visual:
- **Timer hold melingkar [Baru]** pada panel pembayaran: cincin teh yang berkurang, angka menit:detik di tengah. Hitung dari **jam server**. Pembaca layar diberi tahu **hanya pada ambang** (10, 5, 1 menit) lewat `aria-live="polite"`, bukan tiap detik. Rumus: `offset = keliling × (1 − sisa / total)`.
- **Layar "Periksa pesananmu"**: blok per bagian dengan tautan **Ubah**; kotak centang "Data sudah benar"; tombol **Konfirmasi dan bayar** (`.btn-cta`) nonaktif sampai dicentang.
- **Pembulatan Kebaikan**: tidak dicentang secara default; teks menjelaskan program tujuannya.
- **Status pesanan** sebagai lini masa berurutan dengan langkah aktif bertanda teks.
- **Kuitansi Kebaikan**: format Rupiah, angka rata kanan, baris dapat dibuka (7.4).

### 6.11 Form dan kontrol PrimeReact **[Ada]**

Tetap: PrimeReact untuk semua kontrol interaktif; tinggi minimum 44 px; batas `--garis-kuat`; label dekat kontrol; pesan galat memakai `.form-alert` dengan ikon dan teks.

## 7. Interaksi dan gerak

Prinsip: gerak **menjawab aksi pengguna**; tidak ada animasi dekoratif berulang. `prefers-reduced-motion` dihormati untuk semuanya.

### 7.1 Warna kategori dinamis **[Baru]**
Memilih kategori menetapkan `data-kategori` pada pembungkus halaman, dan aksen berubah (chip, garis navigasi, pita, tautan) dengan transisi `--d-base`. Tidak mengubah tombol aksi utama. Tanpa gerak spasial, sehingga aman untuk reduced motion.

### 7.2 Terbang ke keranjang **[Baru]**
Foto kecil barang melayang ke ikon keranjang, lencana memantul. Memakai **Web Animations API** (tanpa pustaka). Saat reduced motion: hanya lencana yang berdenyut dan toast "Ditambahkan ke keranjang" (`aria-live="polite"`).

```ts
export function flyToCart(src: HTMLElement, cart: HTMLElement) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { pulse(cart); return; }
  const a = src.getBoundingClientRect(), b = cart.getBoundingClientRect();
  const ghost = src.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, { position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`,
    height: `${a.height}px`, margin: '0', zIndex: '80', pointerEvents: 'none', borderRadius: '12px', objectFit: 'cover' });
  ghost.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  ghost.animate(
    [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(0.12)`, opacity: 0.4 }],
    { duration: 520, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
  ).finished.then(() => { ghost.remove(); pulse(cart); });
}
function pulse(el: HTMLElement) {
  el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
    { duration: 280, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
}
```

### 7.3 Segel Kurasi yang lebih kaya **[Ubah]**
Panel `details` di detail barang diperkaya (6.8). Di kartu, ketukan segel membuka **bottom sheet ringkas** (PrimeReact Sidebar posisi bawah, sudah ada polanya) berisi butir yang lulus dan catatan, dengan tautan bukti.

### 7.4 Kuitansi yang bisa dibuka **[Baru]**
Setiap baris kuitansi adalah **tombol disclosure** (`<button aria-expanded aria-controls>`) yang membuka satu kalimat penjelasan ("Biaya transaksi dipotong dulu sebelum keuntungan dibagi"). Animasi masuk receipt tetap GSAP yang dimuat malas:

```ts
useEffect(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ctx: { revert: () => void } | undefined;
  (async () => {
    const { gsap } = await import('gsap');
    ctx = gsap.context(() => {
      gsap.from('.receipt-row', { y: 12, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out' });
    }, receiptRef);
  })();
  return () => ctx?.revert();
}, []);
```

### 7.5 Navbar cerdas **[Baru]**
Bilah atas ponsel bersembunyi saat gulir turun, muncul saat gulir naik. Pencarian mengembang menjadi command palette. Indikator tab bergeser (6.2).

```ts
// useHideOnScroll.ts
import { useEffect, useState } from 'react';
export function useHideOnScroll(threshold = 12) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY, ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY, dy = y - last;
        if (Math.abs(dy) > threshold) { setHidden(dy > 0 && y > 80); last = y; }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return hidden;
}
```
Terapkan `transform: translateY(-100%)` bila `hidden`, dengan transisi `--d-base`, **hanya di bawah 1024 px**, dan **jangan sembunyikan** saat pencarian fokus atau sheet terbuka.

### 7.6 Peta kotak Jawa Barat **[Baru, butuh API]**
Pemilih wilayah alternatif berupa **kotak Kabupaten/Kota** (27 wilayah) yang tersusun skematis, warna nila bertingkat sesuai jumlah toko aktif. Ketuk kotak untuk memfilter. Setiap kotak adalah `<button>` dengan nama dan jumlah; **daftar teks setara selalu tersedia**; di ponsel dibuka dalam bottom sheet. Posisi kotak ditetapkan UI/UX (skematis, bukan peta akurat). **Butuh endpoint jumlah toko/barang per wilayah; periksa backend dulu. Bila belum ada, jangan dibuat.**

### 7.7 Timer hold dan status pesanan
Lihat 6.10.

### 7.8 Lenis dan performa gerak **[Ubah]**
- **Lenis hanya untuk pointer halus (desktop) dan bukan reduced motion.** Di perangkat sentuh gunakan gulir bawaan (lebih mulus dan hemat baterai).
- Beri `data-lenis-prevent` pada kontainer yang dapat digulir di dalam overlay (isi Sidebar/Dialog, command palette, daftar hasil), agar gulirnya tidak ikut ditangkap Lenis. Pada PrimeReact, lewat `pt` (passthrough) atau elemen pembungkus di dalam isi.

```ts
useEffect(() => {
  const fine = matchMedia('(pointer: fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduce) return;
  const lenis = new Lenis({ lerp: 0.12 });
  let raf = 0;
  const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); lenis.destroy(); };
}, []);
```

## 8. Responsivitas **[Ubah: satu sumber]**

Breakpoint Tailwind bawaan dipertahankan dan **menjadi satu-satunya sumber**: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. Media query khusus diganti:

| Sebelumnya | Gunakan |
|---|---|
| `<= 380 px` | `max-[380px]:` |
| `<= 767 px` | `max-md:` |
| `<= 1023 px` | `max-lg:` |
| `<= 1279 px` | `max-xl:` |

| Lebar | Perilaku |
|---|---|
| `< 380 px` | Chip wilayah dipadatkan (hanya ikon + nama singkat); grid kartu tetap dua kolom |
| `< 768 px` | Hero satu kolom; grid dua kolom; kolom cari selebar penuh; filter bottom sheet; tab bawah |
| `768 sampai 1023 px` | Tiga kolom; susunan ponsel (kolom cari tampil penuh karena ruang cukup); tab bawah |
| `1024 sampai 1279 px` | Navbar desktop (Dampak masuk menu Belanja); empat kolom; sidebar filter |
| `>= 1280 px` | Navbar desktop penuh; empat kolom (lima di 1536 px) |

Konvensi tetap: konten maksimum sekitar **1240 px**, gutter 14 px di ponsel, `minmax(0, 1fr)` dan `min-width: 0` pada grid/flex yang berisi teks panjang, `env(safe-area-inset-bottom)` pada bottom sheet, sticky bar, dan tab bawah. **Gunakan container query pada kartu** (6.4).

## 9. Aksesibilitas dan konten

Semua aturan sebelumnya **tetap** (`lang="id"`, `viewport-fit=cover`, landmark, label form, nama aksesibel, status tidak hanya warna, fokus 3 px, alt gambar bermakna, state kosong/memuat/galat). Tambahan:
- `<nav aria-label="Utama">` untuk navbar desktop dan `<nav aria-label="Navigasi bawah">` untuk tab; tautan aktif memakai `aria-current="page"`.
- Tombol menu besar memakai `aria-expanded` dan `aria-controls`; fokus kembali ke tombol saat menu ditutup.
- **Warna kategori tidak menjadi satu-satunya penanda** (ikon + teks).
- Hitung mundur diumumkan hanya pada ambang.
- Setiap gerak punya padanan reduced motion.
- Sapaan Sunda diberi `lang="su"` pada elemennya dan arti Indonesia di dekatnya.
- Peta kotak dan visualisasi angklung memiliki **padanan teks/daftar**.
- Kontras mengikuti tabel 3.2; **uji ulang bila menambah pasangan warna baru**.

## 10. Performa

Target (dari spesifikasi frontend): LCP ≤ 2,5 dtk, CLS ≤ 0,1, INP ≤ 200 ms pada ponsel kelas menengah ke bawah dengan jaringan 4G lambat; JS awal per rute sekitar ≤ 170 KB gzip **[Usulan]**.

Tindakan:
1. **GSAP dimuat malas** hanya di beranda (7.4); jangan diimpor global.
2. **Lenis hanya di desktop** (7.8).
3. **Indikator tab dan transisi aksen memakai CSS**, bukan Motion.
4. Bila memakai Motion untuk komponen lain, gunakan `LazyMotion` dengan `domAnimation` (**fitur layout/`layoutId` butuh `domMax`**; hindari bila bisa dengan CSS).
5. Impor PrimeReact **per komponen** (`primereact/button`, dst.); periksa ukuran berkas tema dan hanya muat yang diperlukan.
6. Foto: `loading="lazy"`, dimensi eksplisit, placeholder warna; foto LCP di hero tidak di-lazy.
7. Font: `display=swap` dan `preconnect`; pertimbangkan hosting sendiri subset Latin.
8. Ukur: jalankan `npm run build` dan periksa ukuran bundel; Lighthouse pada Beranda, Katalog, dan Detail (ponsel).

## 11. Rencana migrasi bertahap

Urutan ini menjaga situs tetap berjalan di setiap langkah. Setiap langkah punya kriteria selesai.

| # | Langkah | Sentuh | Selesai bila |
|---|---|---|---|
| 1 | **Token** (3.4) dengan alias nama lama | `src/index.css` | Tampilan **tidak berubah** selain nila/hijau yang sedikit bergeser; build lulus |
| 2 | **Timpa variabel PrimeReact** (3.5) dan kelas `.btn-cta` | `src/index.css` | Tidak ada teal tersisa (`grep` bersih); fokus dan hover benar |
| 3 | **Tailwind membaca token** (3.6); migrasi `brand`/`urgent`; ganti media query khusus ke varian Tailwind (Bagian 8) | `tailwind.config.js`, CSS | Tidak ada nilai warna/breakpoint ganda; tampilan setara |
| 4 | **Navbar dan navigasi** (6.1 sampai 6.3): hapus drawer, buat `BottomTabs`, header 6 elemen, chip wilayah, hook sembunyi saat gulir | `Layout.tsx` + berkas baru | Lulus uji 320 sampai 1440 px; keyboard; tidak ada tombol hilang pada 1024 sampai 1279 px |
| 5 | **Kartu dan chip berwarna kategori** (6.4, 6.5, 3.3) | `ItemCard.tsx`, `CatalogPage.tsx` | `data-kategori` bekerja; kontras lolos; ikon pembeda ada |
| 6 | **Beranda** (6.7): hero, pita Mega Mendung, rel kategori, "Toko di wilayahmu" | `HomePage.tsx` | LCP dalam target; GSAP dimuat malas |
| 7 | **Detail, toko, kegiatan, checkout** (6.8 sampai 6.10) | halaman terkait | Label donatur sesuai API; timer hold; tabel dapat digulir |
| 8 | **Interaksi** (7.2 sampai 7.5, 7.8) | komponen terkait | Semua punya padanan reduced motion |
| 9 | **Opsional:** peta kotak (7.6) dan angklung (6.9) | halaman baru | Hanya bila API tersedia |
| 10 | **Hapus alias lama** | `src/index.css` | Tidak ada pemakaian `--indigo*`, `--daun*` yang tersisa |

## 12. Checklist saat menambah fitur

1. Pakai token (warna, jarak, radius, gerak) sebelum menambah nilai baru. **Tidak ada hex atau angka acak di komponen.**
2. Pasangan warna baru **diuji kontrasnya** (teks ≥ 4,5:1; batas komponen ≥ 3:1).
3. Kartu: border dan ruang, bukan bayangan. Radius mengikuti token.
4. PrimeReact untuk kontrol interaktif, PrimeIcons untuk ikon. **Tidak ada pustaka UI baru.**
5. Uji lebar 320 sampai 390 px, tablet, dan desktop; tidak ada overflow horizontal; teks Indonesia yang panjang aman.
6. Uji tanpa hover, dengan keyboard, dan dengan pembaca layar pada alur beli.
7. Uji bottom sheet, tab bawah, dan sticky bar dengan area aman dan reduced motion.
8. Gerak baru punya padanan reduced motion dan tidak memuat pustaka berat secara global.
9. Data baru: cek **kontrak API** (`docs/BAROKAHIIN_FRONTEND_STOREFRONT.md`); jangan membuat kontrol untuk endpoint yang belum ada.
10. Jalankan `npm run build` dan periksa ukuran bundel.

## 13. Hal yang perlu dicek sebelum dikerjakan

| # | Pertanyaan | Mengapa |
|---|---|---|
| 1 | Slug/kode kategori dari API apa saja? | Untuk `kategoriToSlug()` dan `data-kategori` |
| 2 | Apakah API sudah mengirim **label donatur anonim**? | Mencegah tampilnya nama donor |
| 3 | Nama variabel di tema PrimeReact yang terpasang | Untuk menimpa tema dengan tepat (3.5) |
| 4 | Nama rute (`/katalog`, `/keranjang`, `/akun`, dst.) | Untuk `BottomTabs` dan navbar |
| 5 | Ada endpoint **jumlah toko/barang per wilayah**? | Syarat peta kotak (7.6) |
| 6 | Nama ikon PrimeIcons di versi terpasang | Beberapa ikon usulan bisa tidak ada |
| 7 | Versi Motion/framer-motion dan cara impornya | Untuk keputusan `LazyMotion` |

## 14. Sumber implementasi (berkas yang disentuh)

- Token, tipografi dasar, komponen khusus, breakpoint, tema PrimeReact: `src/index.css` (pertimbangkan memisahkan token ke `src/styles/tokens.css`).
- Warna, jarak, radius, font di Tailwind: `tailwind.config.js`.
- Header, navigasi, tab bawah, Lenis, pintasan: `src/components/Layout.tsx` (pecah menjadi `SiteHeader`, `MegaMenu`, `SearchField`, `RegionChip`, `BottomTabs`).
- Kartu barang: `src/components/ItemCard.tsx`.
- Filter katalog dan bottom sheet: `src/pages/CatalogPage.tsx`.
- Wilayah bertingkat: `src/components/RegionPicker.tsx`.
- Hero dan receipt: `src/pages/HomePage.tsx`.
- Detail barang, segel kurasi, ongkir: `src/pages/ItemDetailPage.tsx`.
- Toko publik: `src/pages/PublicStorePages.tsx`.
- Kegiatan dan laporan dana: `src/pages/ActivitiesPage.tsx`, `src/pages/ActivityDetailPage.tsx`.
- Profil, checkout, pembayaran, pesanan: `src/pages/BuyerAccountPage.tsx`, `src/pages/BuyerCommercePages.tsx`.
- Reduced-motion MotionConfig: `src/App.tsx`.
- Rujukan visual redesign: kanvas "Barokahiin Redesign Jawa Barat".
