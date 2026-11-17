import React, { useEffect, useState } from "react";
import { Skeleton } from "primereact/skeleton";
import { TrustPaymentBanner } from "../components/TrustPaymentBanner";
import { useStorefront } from "../context/StorefrontContext";
import { publicApi } from "../services/publicApi";
import { PublicStaticPage, StaticPageKey } from "../types";
import { buildWhatsAppLink, formatDateId } from "../utils/format";

interface StaticPageProps {
  pageKey: StaticPageKey;
}

const FALLBACK_CONTENT: Record<StaticPageKey, { judul: string; isi: string }> =
  {
    tentang: {
      judul: "Tentang Barokahiin",
      isi: "Barokahiin mengubah barang layak pakai dari masyarakat menjadi dana kebaikan. Barang dari donatur dikurasi dengan jujur oleh tim admin, dijual melalui storefront resmi ini, dan seluruh hasilnya disalurkan untuk mendanai kegiatan sosial serta keagamaan dengan laporan penggunaan dana yang transparan.",
    },
    "cara-kerja": {
      judul: "Cara Kerja Barokahiin",
      isi: "1. Donatur mengajukan donasi barang tanpa perlu membuat akun.\n2. Admin mencatat penerimaan, melakukan kurasi kondisi & kekurangan, memotret/merekam video, serta menetapkan harga wajar.\n3. Barang terbit di katalog storefront dengan identitas donatur tetap anonim (Sahabat Berbagi).\n4. Pembeli mengirim permintaan beli atau menghubungi admin via WhatsApp, lalu melakukan pembayaran hanya ke rekening resmi Barokahiin.\n5. Penjualan dicatat dan disalurkan untuk kegiatan, lengkap dengan laporan dana publik.",
    },
    faq: {
      judul: "Pertanyaan yang Sering Diajukan (FAQ)",
      isi: "Apakah identitas donatur ditampilkan?\nTidak. Secara default donatur ditampilkan sebagai Sahabat Berbagi dan data kontak donatur tidak pernah muncul di API maupun halaman publik.\n\nBagaimana cara membayar barang yang ingin dibeli?\nSetelah Anda mengirim permintaan beli, admin akan mengonfirmasi ketersediaan barang dan batas waktu pembayaran. Pembayaran dilakukan melalui transfer ke rekening resmi Barokahiin yang tercantum di website.\n\nApakah bisa mengajukan donasi makanan?\nSaat ini storefront MVP berfokus pada barang layak pakai non-makanan agar kualitas dan pengelolaannya terjaga.",
    },
    kebijakan: {
      judul: "Kebijakan & Privasi",
      isi: "Barokahiin menjaga privasi data donatur dan pembeli sesuai prinsip perlindungan data pribadi. Data kontak hanya digunakan oleh admin untuk keperluan koordinasi penerimaan barang dan konfirmasi pesanan, serta tidak pernah dipublikasikan ke storefront. Foto barang yang diunggah admin dibersihkan metadata lokasinya (EXIF) sebelum diterbitkan.",
    },
    kontak: {
      judul: "Kontak Resmi Barokahiin",
      isi: "Untuk pertanyaan seputar pembelian barang, penyerahan donasi barang di area Bandung dan sekitarnya, atau konfirmasi pembayaran, silakan hubungi kami melalui kanal resmi di bawah ini.",
    },
  };

export const StaticPage: React.FC<StaticPageProps> = ({ pageKey }) => {
  const { settings } = useStorefront();
  const [page, setPage] = useState<PublicStaticPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await publicApi.getStaticPage(pageKey);
        if (!active) return;
        setPage(data);
        document.title = `${data.judul} — Barokahiin`;
      } catch {
        if (!active) return;
        const fb = FALLBACK_CONTENT[pageKey];
        setPage({
          kunci: pageKey,
          judul: fb.judul,
          isi: fb.isi,
          updated_at: "",
        });
        document.title = `${fb.judul} — Barokahiin`;
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [pageKey]);

  const waLink = buildWhatsAppLink(
    settings?.whatsapp_resmi,
    "Halo Admin Barokahiin, saya ingin bertanya informasi lebih lanjut."
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton width="14rem" height="2rem" />
        <Skeleton height="14rem" borderRadius="1rem" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {page?.judul}
        </h1>
        {page?.updated_at && (
          <p className="mt-1 text-xs text-slate-400">
            Diperbarui pada {formatDateId(page.updated_at)}
          </p>
        )}
        <div className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {page?.isi}
        </div>

        {pageKey === "kontak" && waLink && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <i className="pi pi-whatsapp" aria-hidden="true" />
              <span>Hubungi WhatsApp Resmi</span>
            </a>
          </div>
        )}
      </article>

      {(pageKey === "cara-kerja" || pageKey === "kontak") && (
        <TrustPaymentBanner settings={settings} />
      )}
    </div>
  );
};
