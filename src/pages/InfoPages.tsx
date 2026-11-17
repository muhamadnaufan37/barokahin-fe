import React from "react";
import { Link } from "react-router-dom";
import { Button } from "primereact/button";
import { useApp } from "../context/AppContext";
import { SponsorCard } from "../components/SponsorCard";

export const HelpPage: React.FC = () => (
  <div className="mx-auto max-w-3xl space-y-5">
    <h1 className="text-2xl font-bold text-slate-900">Panduan Aman Berbagi & Bertransaksi</h1>
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-sm text-slate-700 leading-relaxed">
      <div>
        <h2 className="font-bold text-slate-900 text-base">1. Untuk Barang Berbayar: Bayar di Tempat</h2>
        <p>
          Barokahiin tidak memproses uang atau menyediakan rekening bersama. Pembayaran dilakukan
          langsung saat serah terima setelah kamu memeriksa kondisi barang. Jangan pernah
          mentransfer DP atau uang di muka.
        </p>
      </div>
      <div>
        <h2 className="font-bold text-slate-900 text-base">2. Keamanan Pertemuan</h2>
        <p>
          Alamat tepat hanya dibuka setelah klaim diterima. Pilih tempat bertemu yang terang atau
          titik publik yang aman (seperti pos satpam komplek atau halaman masjid).
        </p>
      </div>
      <div>
        <h2 className="font-bold text-slate-900 text-base">3. Serah Terima Berkode</h2>
        <p>
          Penerima menunjukkan kode 6 digit kepada Pemberi saat barang diterima agar status tercatat
          selesai dengan jelas dan adil.
        </p>
      </div>
      <div>
        <h2 className="font-bold text-slate-900 text-base">4. Keamanan Pangan (Jalur Segera)</h2>
        <p>
          Selalu periksa batas konsumsi, aroma, warna, dan kemasan makanan sebelum mengonsumsinya.
        </p>
      </div>
    </div>
  </div>
);

export const RulesPage: React.FC = () => (
  <div className="mx-auto max-w-3xl space-y-5">
    <h1 className="text-2xl font-bold text-slate-900">Aturan & Barang Terlarang</h1>
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 text-sm text-slate-700">
      <p>
        Aturan berikut berlaku untuk <strong>barang gratis maupun berbayar</strong> di Barokahiin:
      </p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Obat resep dokter / obat keras.</li>
        <li>Minuman beralkohol dan narkotika.</li>
        <li>Senjata tajam/api dan bahan berbahaya mudah meledak.</li>
        <li>Barang ilegal atau hasil tindak kejahatan.</li>
        <li>Produk palsu / bajakan.</li>
        <li>Hewan hidup.</li>
        <li>Konten SARA, kebencian, atau asusila.</li>
        <li>Uang tunai atau pengumpulan donasi tunai.</li>
        <li>
          <strong>Barang gratis dilarang diperjualbelikan kembali.</strong>
        </li>
      </ul>
    </div>
  </div>
);

export const AboutPage: React.FC = () => {
  const { sponsors } = useApp();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Tentang Barokahiin</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 text-sm text-slate-700 leading-relaxed">
        <p>
          <strong>Barokahiin</strong> — <em>"Berbagi yang barokah, dekat dari rumahmu."</em>
        </p>
        <p>
          Barokahiin adalah aplikasi web (PWA) hiperlokal untuk menyalurkan barang layak pakai dan
          makanan lebih di sekitar Bandung dan sekitarnya—baik secara gratis maupun berbayar
          dengan harga jelas.
        </p>
        <p>
          Operasional Barokahiin didukung oleh sponsor yang ditampilkan secara transparan. Sponsor{" "}
          <strong>tidak memengaruhi urutan hasil</strong> di Radar Barokah dan{" "}
          <strong>tidak menerima data pribadi</strong> pengguna.
        </p>
      </div>

      {sponsors.map((s) => (
        <SponsorCard key={s.id} sponsor={s} />
      ))}

      <Link to="/">
        <Button label="Kembali ke Radar Barokah" size="small" outlined />
      </Link>
    </div>
  );
};
