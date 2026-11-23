# Barokahiin Design System

Dokumen ini mencatat pola visual dan interaksi yang sudah diterapkan di frontend saat ini. Gunakan sebagai acuan saat menambah atau mengubah halaman agar pengalaman tetap konsisten.

> Ini adalah dokumentasi implementasi yang ada, bukan spesifikasi target PRD. Spesifikasi lebih luas dapat dilihat di [`docs/frontend-spec.md`](docs/frontend-spec.md); beberapa rekomendasinya belum menjadi bagian dari implementasi saat ini.

## 1. Arah desain

Barokahiin adalah storefront barang layak pakai yang hasil penjualannya mendukung kegiatan sosial. Tampilannya memadukan:

- Nuansa lapak modern yang hangat dan mudah dipercaya.
- Indigo sebagai identitas utama, kunyit sebagai aksen, serta hijau untuk dampak dan status positif.
- Permukaan terang, batas halus, ruang yang cukup, dan foto barang sebagai fokus.
- Bentuk membulat yang terasa ramah, tanpa membuat semua elemen menjadi kartu tebal atau penuh bayangan.

Gunakan bahasa Indonesia yang langsung, ramah, dan jelas. Utamakan label berbentuk kalimat (sentence case), bukan label kapital penuh.

## 2. Teknologi UI yang dipakai

- React + TypeScript, dibangun dengan Vite dan routing menggunakan React Router.
- Tailwind CSS untuk layout dan utilitas; CSS di `src/index.css` untuk token, komponen khusus, dan aturan responsif.
- PrimeReact untuk kontrol interaktif seperti tombol, input, dropdown, dialog/sidebar, dan elemen status. Tema dasarnya Lara Light Teal, dengan styling proyek untuk identitas Barokahiin.
- PrimeIcons untuk ikon.
- Motion untuk transisi elemen dan indikator navigasi; GSAP untuk animasi receipt di halaman beranda; Lenis untuk smooth scrolling. Hormati preferensi reduced motion.
- Font Plus Jakarta Sans dan Bricolage Grotesque dimuat melalui Google Fonts di `index.html`.

Pertahankan stack ini untuk pengembangan berikutnya. Jangan menambah pustaka UI atau mengganti teknologi yang sudah dipakai tanpa kebutuhan yang jelas.

## 3. Warna

Token warna saat ini didefinisikan di `:root` pada `src/index.css`.

| Token | Nilai | Pemakaian utama |
|---|---|---|
| `--kertas` | `#F4F6FB` | Latar halaman |
| `--putih` | `#FFFFFF` | Kartu, form, dialog, dan permukaan |
| `--tinta` | `#171B3D` | Teks utama |
| `--muted` | `#566083` | Teks sekunder dan ikon pendukung |
| `--indigo` | `#1F2C7A` | Aksi utama, tautan, fokus, harga |
| `--indigo-tua` | `#141C52` | Hover/permukaan indigo yang lebih pekat |
| `--indigo-muda` | `#E6E9F8` | Latar terpilih atau aksen lembut |
| `--kunyit` | `#F5B31A` | CTA sekunder dan sorotan |
| `--kunyit-muda` | `#FFF1CC` | Latar aksen hangat |
| `--daun` | `#0F7A5C` | Status positif dan dampak sosial |
| `--daun-tua` | `#0A5A44` | Teks pada latar hijau muda |
| `--daun-muda` | `#DDF3EA` | Latar status positif |
| `--bahaya` | `#BF3328` | Status/error berbahaya |
| `--bahaya-muda` | `#FBE3E0` | Latar error |
| `--info` | `#1D5FA8` | Informasi |
| `--peringatan-teks` | `#8A5A00` | Teks peringatan |
| `--garis` | `#D9DEEE` | Garis pemisah dan batas lembut |
| `--garis-kuat` | `#7A83A6` | Batas input dan kontrol interaktif |
| `--e-float` | `0 16px 48px rgb(23 27 61 / 14%)` | Elevasi overlay dan elemen melayang |

Panduan pemakaian:

- Gunakan `--indigo` untuk aksi utama; `--kunyit` untuk aksen dengan teks gelap.
- Gunakan hijau untuk status sukses/charity, bukan sebagai warna aksi utama umum.
- `--garis` cocok untuk pemisah dekoratif; gunakan `--garis-kuat` pada batas kontrol yang perlu terlihat.
- Hindari teks kecil berkontras rendah di atas warna aksen.
- Tailwind juga menyediakan keluarga warna `brand` dan `urgent` di `tailwind.config.js`. Untuk elemen baru, utamakan token CSS di atas agar warna konsisten dengan komponen khusus.

## 4. Tipografi

| Peran | Font | Penggunaan |
|---|---|---|
| Teks antarmuka dan isi | Plus Jakarta Sans | Paragraf, label, tombol, navigasi, form |
| Display | Bricolage Grotesque | Judul utama, judul bagian tertentu, harga, angka yang ingin ditonjolkan |
| Cadangan | `system-ui`, Segoe UI, Roboto, sans-serif | Fallback font |

Aturan yang sudah digunakan:

- Isi halaman menggunakan ukuran fluida melalui `clamp()`, ukuran dasar sekitar 16 px, dan line-height 1.55.
- Judul utama berukuran fluida, berbobot tebal, dan memakai tracking rapat.
- Teks sekunder menggunakan `--muted`; label dan harga tetap jelas di layar sempit.
- Harga dan angka ringkasan menggunakan angka tabular bila tersedia.
- Beri ruang bagi teks Indonesia yang panjang; hindari lebar tetap untuk tombol atau label.

## 5. Bentuk, jarak, dan elevasi

Belum ada skala token jarak/radius formal. Styling yang ada menggunakan kombinasi nilai CSS dan utilitas Tailwind. Pertahankan rentang yang sudah tampak pada UI:

- Kontrol/input: tinggi minimum sekitar 44 px, radius 8–9 px.
- Tombol: tinggi minimum sekitar 44 px; CTA berukuran 48 px pada hero/search tertentu.
- Kartu: radius sekitar 12–16 px, biasanya dengan border tipis dan tanpa shadow.
- Popover/dialog: radius sekitar 18–20 px.
- Pill: radius penuh untuk navigasi, badge, dan CTA tertentu.
- Target sentuh ikon/navigasi: sekitar 40–44 px atau lebih.
- Bayangan dipakai terutama pada navigasi floating, bottom bar, drawer, dialog, dan bottom sheet. Kartu konten umumnya mengandalkan border dan ruang.

Gunakan `--motion-ease: cubic-bezier(0.2, 0, 0, 1)` untuk transisi CSS yang mengikuti pola proyek, dan `--e-float` untuk elevasi overlay.

## 6. Pola komponen

### Navigasi utama

- Desktop (>= 1024 px): header sticky dengan navbar berbentuk floating pill, logo, pencarian cepat, tautan navigasi, kategori, keranjang, akun, dan CTA donasi.
- Lebar sampai 1023 px: navigasi desktop dan pencarian header disembunyikan. Tombol quick-search tersedia pada tablet; pada ponsel, pencarian dapat dibuka dari menu atau halaman katalog.
- Menu seluler dibuka sebagai PrimeReact Sidebar/drawer dari kanan.
- Navigasi bawah empat tab ditampilkan sampai lebar 1023 px. Tab aktif memakai indikator lembut beranimasi.

### Pencarian dan command palette

- Pencarian header menggunakan permukaan abu kebiruan, ikon, dan shortcut `Ctrl K`.
- Command palette tampil sebagai dialog overlay; pada layar kecil berubah menjadi panel dari bawah.
- Baris hasil memiliki ikon, judul, keterangan, serta status aktif yang jelas.
- Search katalog menggunakan ikon di dalam field dan tombol filter terpisah.

### Filter katalog dan wilayah

- Desktop: filter berada di panel inline. Field wilayah membentang selebar panel; tingkat wilayah tersusun berdampingan bila ruang mencukupi.
- Seluler: search bar tetap mudah dijangkau di bagian atas; filter dibuka sebagai bottom sheet dengan backdrop.
- Bottom sheet memiliki handle visual, tombol tutup, batas tinggi berbasis `dvh`, dan padding safe-area.
- Dropdown wilayah menggunakan pola PrimeReact yang sama dengan kontrol filter lain; tiap tingkat memiliki label yang jelas.
- Chip filter aktif dipakai untuk merangkum filter yang sedang diterapkan.

### Kartu barang

- Kartu berwarna putih dengan border tipis dan radius sekitar 12 px.
- Foto memiliki rasio 4:5 dan memenuhi area gambar dengan `object-fit: cover`.
- Status barang dan kode barang ditempatkan di atas foto; kode menyerupai tag.
- Informasi disusun berurutan: kategori, judul, harga, dan kondisi.
- Harga memakai font display dan warna indigo; kondisi menjadi keterangan sekunder.
- Tombol favorit adalah aksi mandiri pada kartu, dengan nama aksesibel dan state `aria-pressed`.
- Foto dimuat secara lazy; sediakan placeholder saat foto tidak tersedia.

### Form dan kontrol PrimeReact

- Gunakan PrimeReact untuk kontrol interaktif; jangan menggantinya dengan elemen native kecuali ada alasan teknis dan konsistensi aksesibilitas tetap terjaga.
- Input, textarea, dropdown, dan tombol mengikuti tinggi minimum 44 px.
- Batas input menggunakan `--garis-kuat`; state fokus menggunakan outline yang terlihat.
- Label diletakkan dekat kontrol dan menjelaskan tujuan field.
- Pesan error/sukses memakai `.form-alert` atau komponen status yang sesuai; jangan hanya mengandalkan warna.

### CTA detail barang

- Pada layar seluler, aksi pembelian dapat memakai sticky bar di bagian bawah dengan harga dan tombol utama.
- Sisakan padding konten agar sticky bar tidak menutupi bagian halaman.
- Gunakan safe-area inset untuk perangkat dengan area bawah khusus.

### Beranda dan receipt

- Hero desktop menampilkan copy dan receipt dalam dua kolom; di ponsel ditumpuk.
- Receipt memakai permukaan putih, garis putus-putus, angka rata kanan, dan tepi bawah bergerigi sebagai momen visual khas.
- Animasi receipt dijalankan dengan GSAP dan dilewati saat pengguna memilih reduced motion.
- Bagian dampak menggunakan ringkasan data yang rapi; hindari dekorasi yang bersaing dengan barang dan isi utama.

### Detail barang dan kepercayaan

- Galeri detail memakai foto utama rasio 4:5, thumbnail yang dapat dipilih, dan video dengan kontrol serta poster bila tersedia.
- Status, harga, kondisi, kode, donor, kategori, dan tanggal terbit disusun dalam ringkasan yang mudah dipindai.
- Kekurangan barang ditampilkan secara terbuka sebagai catatan kurasi, bukan disembunyikan di balik interaksi.
- Segel kurasi menggunakan panel `details` yang dapat dibuka untuk menampilkan versi SOP dan checklist. Setiap butir membedakan pemeriksaan yang lulus dan catatan keterbukaan dengan ikon serta teks.
- Informasi toko dan kegiatan terkait berbentuk tautan/panel ringkas. Tampilkan hanya area publik toko.
- Pemilih wilayah menentukan estimasi ongkir; tampilkan zona, ongkir, dan biaya kemas sebagai baris terpisah. Untuk barang ambil-saja, jelaskan batasan tanpa menampilkan alamat lengkap.

### Toko, kegiatan, dan laporan dana

- Kartu toko menampilkan nama, area publik, level koordinator, dan rating; halaman detail dapat menambahkan jam operasional, deskripsi, kebijakan, dan daftar barang.
- Jangan menampilkan alamat rumah atau kontak pribadi koordinator pada halaman publik.
- Ringkasan dampak memakai angka dalam format Rupiah dan metrik yang diberi label jelas.
- Halaman kegiatan menunjukkan status, periode, dana terkumpul, target, dana digunakan, saldo, dan progres. Progress bar adalah pelengkap angka, bukan satu-satunya cara menyampaikan progres.
- Rincian pengeluaran disajikan sebagai tabel yang dapat digulir pada layar sempit. Dokumentasi foto/video memakai rasio konsisten, caption bila tersedia, dan kontrol video eksplisit.

### Profil, checkout, dan pesanan

- Sebelum checkout, tampilkan kelengkapan profil sebagai daftar kebutuhan yang dapat ditindaklanjuti; terjemahkan kode API menjadi label dan tautan tindakan yang bisa dimengerti, jangan tampilkan kode mentah.
- Keranjang menjelaskan bahwa stok belum ditahan. Hold 30 menit baru dimulai setelah konfirmasi pesanan berhasil.
- Checkout menampilkan pilihan ambil/kirim, alamat yang relevan, dan ringkasan biaya terpisah: subtotal, ongkir, biaya kemas, donasi pembulatan opsional, serta total.
- Gunakan persetujuan eksplisit sebelum konfirmasi. Jelaskan dampaknya, termasuk bahwa barang akan ditahan setelah pesanan dikonfirmasi.
- Pesanan menampilkan status dan waktu hold bila tersedia. Instruksi QRIS, virtual account, atau e-wallet diletakkan di panel khusus dengan batas waktu dan tautan pembayaran yang jelas.
- Kuitansi Kebaikan ditampilkan sebagai rincian transparan setelah status pesanan memenuhi syarat; gunakan format Rupiah untuk setiap komponen.
- Tampilkan tindakan lanjutan—membatalkan, konfirmasi diterima, atau komplain—hanya saat status dan jendela waktunya mengizinkan. Gunakan konfirmasi untuk tindakan yang sulit dibatalkan.
- Endpoint koreksi alamat, detail titik ambil, dan ulasan disebut di panduan integrasi. Terapkan hanya sesuai kelayakan status dan aturan backend; alamat lengkap titik ambil hanya boleh terlihat setelah pembayaran untuk pesanan ambil.

### Data API, angka, dan state

- Panduan kontrak API storefront adalah [`docs/BAROKAHIIN_FRONTEND_STOREFRONT.md`](docs/BAROKAHIIN_FRONTEND_STOREFRONT.md). Nilai uang API adalah integer Rupiah; format untuk manusia dengan formatter aplikasi, bukan menampilkan angka mentah.
- Tanggal dan waktu mengikuti locale Indonesia. Jangan mengarang estimasi atau status bila API belum mengirim nilainya.
- Untuk setiap data remote, sediakan state memuat, error, kosong, dan berhasil yang tetap mengikuti permukaan serta warna sistem.
- Terjemahkan error terstruktur ke pesan tindakan yang ramah; jangan tampilkan stack trace atau kode internal sebagai pesan utama.
- Hormati batas API: misalnya `Retry-After` untuk rate limit dan syarat status untuk detail sensitif.
- Panduan integrasi menjelaskan kontrak/endpoint yang tersedia; tidak semua endpoint otomatis berarti kontrol atau layar tersebut sudah tersedia di UI. Periksa implementasi dan kelayakan backend sebelum menambahkan affordance baru.

## 7. Responsivitas

Implementasi memadukan breakpoint CSS khusus dengan breakpoint default Tailwind.

| Lebar | Perilaku penting saat ini |
|---|---|
| `<= 380 px` | Navbar, brand, dan grid kartu dipadatkan untuk layar kecil |
| `<= 767 px` | Layout halaman mobile; hero satu kolom; grid barang dua kolom; katalog memakai search sticky dan filter bottom sheet |
| `<= 1023 px` | Navigasi desktop disembunyikan; drawer dan bottom tab bar digunakan; grid barang tiga kolom di area tablet |
| `<= 1279 px` | CTA donasi pada navbar desktop disembunyikan |
| `>= 1280 px` | Navbar desktop menggunakan jarak lebar |

Konvensi kontainer:

- Konten utama desktop dibatasi sekitar 1240 px dan diletakkan di tengah.
- Pada ponsel, konten memakai gutter sekitar 14 px.
- Grid barang menyesuaikan dari dua kolom pada ponsel, tiga pada tablet, dan empat pada desktop.
- Gunakan `minmax(0, 1fr)` dan `min-width: 0` pada grid/flex item yang bisa berisi teks panjang.
- Overlay, bottom sheet, dan sticky bar harus mempertimbangkan `env(safe-area-inset-bottom)`.

Tailwind memakai breakpoint default proyek (`sm`, `md`, `lg`, `xl`, `2xl`). Jika breakpoint utility Tailwind berdekatan dengan media query CSS khusus, periksa hasil layout di kedua sisi breakpoint sebelum mengubahnya.

## 8. Interaksi dan gerak

- Animasi harus memberi respons atas tindakan: membuka drawer/sheet, berpindah tab, memunculkan kategori, atau menampilkan receipt.
- Gunakan transisi CSS pendek untuk hover/focus/active; tombol dapat memberi umpan balik tekan yang ringan.
- Motion dikonfigurasi untuk mengikuti preferensi reduced motion pengguna.
- Lenis tidak diinisialisasi saat `prefers-reduced-motion: reduce`; animasi GSAP receipt juga dilewati pada kondisi tersebut.
- CSS menonaktifkan smooth scrolling browser pada reduced motion.
- Hindari animasi dekoratif berulang atau gerakan besar yang mengganggu pembacaan.
- Hover hanya pelengkap; semua aksi utama tetap dapat diakses melalui klik/tap dan keyboard.

## 9. Aksesibilitas dan konten

- Pertahankan `lang="id"` dan konfigurasi viewport dengan `viewport-fit=cover`.
- Gunakan heading semantik, landmark (`header`, `main`, `nav`, `footer`), label form, dan nama aksesibel pada tombol ikon.
- Jangan menyampaikan status hanya melalui warna; sertakan teks/status semantik.
- Fokus keyboard harus jelas. Gaya fokus global saat ini menggunakan outline indigo 3 px.
- Gunakan `aria-expanded`, `aria-controls`, `aria-label`, dan state pressed/selected pada kontrol yang sesuai.
- Tautan dan kontrol utama ditargetkan agar mudah disentuh; hindari menambahkan kontrol kecil tanpa area interaksi yang cukup.
- Gambar barang membutuhkan alt yang menjelaskan barang, bukan nama file.
- Sediakan empty state, loading state, dan error state yang menjelaskan tindakan berikutnya.

## 10. Checklist saat menambah fitur

1. Gunakan warna dan font yang sudah tersedia sebelum menambah token baru.
2. Ikuti radius dan tinggi kontrol dari komponen terdekat; utamakan border daripada shadow untuk kartu.
3. Pertahankan PrimeReact untuk kontrol interaktif dan gunakan PrimeIcons untuk ikon.
4. Uji lebar 320–390 px, tablet, dan desktop; periksa teks panjang serta tidak adanya overflow horizontal.
5. Uji semua aksi tanpa hover, termasuk keyboard, dan pastikan label/nama aksesibel tersedia.
6. Uji bottom sheet/sticky bar dengan safe area dan reduced motion.
7. Jalankan `npm run build` setelah perubahan UI.

## 11. Sumber implementasi

- Token, tipografi dasar, komponen khusus, breakpoint, dan state responsif: `src/index.css`.
- Warna/font utilitas Tailwind: `tailwind.config.js`.
- Tema PrimeReact dan PrimeIcons: `src/index.css`.
- Header, drawer, bottom tabs, Lenis, dan shortcut: `src/components/Layout.tsx`.
- Kartu barang: `src/components/ItemCard.tsx`.
- Filter katalog dan bottom sheet: `src/pages/CatalogPage.tsx`.
- Wilayah bertingkat: `src/components/RegionPicker.tsx`.
- Hero dan receipt beranda: `src/pages/HomePage.tsx`.
- Detail barang, segel kurasi, serta estimasi ongkir: `src/pages/ItemDetailPage.tsx`.
- Toko publik: `src/pages/PublicStorePages.tsx`.
- Kegiatan, progres, dan laporan dana: `src/pages/ActivitiesPage.tsx` dan `src/pages/ActivityDetailPage.tsx`.
- Profil, checkout, pembayaran, dan pesanan: `src/pages/BuyerAccountPage.tsx` dan `src/pages/BuyerCommercePages.tsx`.
- Reduced-motion MotionConfig: `src/App.tsx`.
