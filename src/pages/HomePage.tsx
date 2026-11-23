import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { Message } from "primereact/message";
import { ProgressBar } from "primereact/progressbar";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { ItemCard } from "../components/ItemCard";
import { RegionPicker } from "../components/RegionPicker";
import { TrustPaymentBanner } from "../components/TrustPaymentBanner";
import { useBuyer } from "../context/BuyerContext";
import { useStorefront } from "../context/StorefrontContext";
import { publicApi } from "../services/publicApi";
import { PublicActivity, PublicItem, PublicStore } from "../types";
import { formatRupiah } from "../utils/format";
import { setPageMetadata } from "../utils/seo";

const STEPS = [
  {
    title: "Barang diserahkan",
    description:
      "Donatur mengajukan barang layak pakai dan memberi izin untuk dijual.",
  },
  {
    title: "Dikurasi dengan jujur",
    description:
      "Koordinator memeriksa kondisi, mencatat kekurangan, dan menyiapkan barang.",
  },
  {
    title: "Kamu memesan",
    description:
      "Masukkan barang ke keranjang, lengkapi data, lalu periksa pesanan sebelum konfirmasi.",
  },
  {
    title: "Bayar dan lacak",
    description:
      "Bayar melalui QRIS, virtual account, atau e-wallet. Dana kegiatan dicatat dan dilaporkan.",
  },
];

export const HomePage: React.FC = () => {
  const { impact, settings, categories } = useStorefront();
  const { selectedRegion, setSelectedRegion } = useBuyer();
  const [items, setItems] = useState<PublicItem[]>([]);
  const [activities, setActivities] = useState<PublicActivity[]>([]);
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const receiptRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setPageMetadata({
      title: "Barokahiin — Barang layak pakai, kebaikan yang tercatat",
      description:
        "Temukan barang layak pakai yang dikurasi. Setiap penjualan mendukung kegiatan sosial dan keagamaan dengan laporan dana transparan.",
      path: "/",
    });
    let active = true;

    const loadHomeData = async () => {
      setLoading(true);
      setError(null);
      setActivityError(null);
      setStoreError(null);
      const [itemsRes, activitiesRes, storesRes] = await Promise.allSettled([
        publicApi.getItems({
          per_page: 6,
          sort: "terbaru",
          region: selectedRegion?.id,
        }),
        publicApi.getActivities(),
        publicApi.getStores(),
      ]);

      if (!active) return;

      if (itemsRes.status === "fulfilled") {
        setItems(itemsRes.value.items);
      } else {
        setError(
          itemsRes.reason instanceof Error
            ? itemsRes.reason.message
            : "Sorotan barang belum bisa dimuat."
        );
      }

      if (activitiesRes.status === "fulfilled") {
        setActivities(activitiesRes.value.slice(0, 3));
      } else {
        setActivityError(
          activitiesRes.reason instanceof Error
            ? activitiesRes.reason.message
            : "Kegiatan belum bisa dimuat."
        );
      }
      if (storesRes.status === "fulfilled") {
        setStores(storesRes.value.slice(0, 3));
      } else {
        setStoreError(
          storesRes.reason instanceof Error
            ? storesRes.reason.message
            : "Daftar toko belum bisa dimuat."
        );
      }
      setLoading(false);
    };

    void loadHomeData();
    return () => {
      active = false;
    };
  }, [selectedRegion?.id]);

  useEffect(() => {
    const receipt = receiptRef.current;
    if (!receipt || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const animation = gsap.fromTo(
      receipt,
      { opacity: 0, y: -14, scaleY: 0.96, transformOrigin: "top center" },
      { opacity: 1, y: 0, scaleY: 1, duration: 0.58, ease: "power2.out" }
    );
    return () => {
      animation.kill();
    };
  }, []);

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <h1 id="home-title">
            Barang layak pakai, kebaikan yang tercatat.
          </h1>
          <p>
            Temukan barang pilihan dari warga. Setiap prosesnya dikurasi dengan
            jujur dan hasil penjualannya mendukung kegiatan yang bisa kamu ikuti.
          </p>
          <div className="home-hero-actions">
            <Link to="/katalog">
              <i className="pi pi-shopping-bag" aria-hidden="true" />
              <span>Lihat barang</span>
            </Link>
            <Link to="/donasi-barang" className="secondary">
              <i className="pi pi-gift" aria-hidden="true" />
              <span>Titip donasi</span>
            </Link>
          </div>
          <div className="home-region-picker">
            <RegionPicker
              label="Pilih wilayah untuk melihat barang sekitar"
              value={selectedRegion?.id || ""}
              path={selectedRegion?.path}
              onChange={(region, path) =>
                setSelectedRegion(
                  region ? { id: region.id, nama: region.nama, path } : null
                )
              }
            />
            {selectedRegion && (
              <p className="text-xs text-slate-600">
                Barang di sekitar: <strong>{selectedRegion.nama}</strong>
              </p>
            )}
          </div>
        </div>

        <aside
          ref={receiptRef}
          className="home-receipt"
          aria-labelledby="receipt-title"
        >
          <div className="receipt-top">
            <span className="receipt-seal" aria-hidden="true">
              <i className="pi pi-check" />
            </span>
            <h2 id="receipt-title">Kuitansi kebaikan</h2>
            <p>
              Jejak pembelian dan dana kegiatan disajikan terbuka, bukan
              disembunyikan di balik transaksi.
            </p>
          </div>
          <hr className="receipt-rule" />
          <dl className="receipt-lines">
            <div>
              <dt>Barang terkurasi</dt>
              <dd>Dicatat</dd>
            </div>
            <div>
              <dt>Biaya transaksi</dt>
              <dd>Dirinci</dd>
            </div>
            <div>
              <dt>Dana kegiatan</dt>
              <dd>Dilaporkan</dd>
            </div>
          </dl>
          <p className="receipt-note">
            Rincian nilai mengikuti laporan transaksi dan kegiatan yang
            diterbitkan.
          </p>
        </aside>
      </section>

      {categories.length > 0 && (
        <section className="home-section" aria-labelledby="home-categories-title">
          <div className="home-section-heading">
            <div>
              <h2 id="home-categories-title">Jelajahi kategori</h2>
              <p>Pilih jenis barang yang sedang kamu cari.</p>
            </div>
          </div>
          <div className="category-chip-list">
            {categories.map((category) => (
              <Link
                className="category-chip"
                key={category.uuid}
                to={`/katalog?kategori=${encodeURIComponent(category.slug)}`}
              >
                {category.nama}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="home-section" aria-labelledby="home-stores-title">
        <div className="home-section-heading">
          <div>
            <h2 id="home-stores-title">
              Toko di {selectedRegion?.nama || "wilayah pilot"}
            </h2>
            <p>Kenali koordinator lokal yang mengkurasi barang.</p>
          </div>
          <Link to="/toko">
            <span>Lihat semua toko</span>
            <i className="pi pi-arrow-up-right" aria-hidden="true" />
          </Link>
        </div>
        {storeError ? (
          <Message severity="error" text={storeError} className="w-full justify-start" />
        ) : stores.filter((store) =>
          selectedRegion
            ? store.area_publik
                .toLocaleLowerCase("id-ID")
                .includes(selectedRegion.nama.toLocaleLowerCase("id-ID"))
            : true
        ).length ? (
          <div className="store-strip">
            {stores
              .filter((store) =>
                selectedRegion
                  ? store.area_publik
                      .toLocaleLowerCase("id-ID")
                      .includes(selectedRegion.nama.toLocaleLowerCase("id-ID"))
                  : true
              )
              .map((store) => (
              <Link className="store-mini-card" to={`/toko/${store.slug}`} key={store.uuid}>
                <strong>{store.nama}</strong>
                <span>{store.area_publik}</span>
                <small>
                  {store.rating_count > 0 && store.rating_avg !== null
                    ? `${store.rating_avg.toFixed(1)} · ${store.rating_count} ulasan`
                    : "Toko baru"}
                </small>
              </Link>
              ))}
          </div>
        ) : (
          !loading && <p className="form-card">Belum ada toko aktif di wilayah ini.</p>
        )}
      </section>

      <section className="home-section" aria-labelledby="latest-items-title">
        <div className="home-section-heading">
          <div>
            <h2 id="latest-items-title">Barang terbaru</h2>
            <p>Temukan barang yang sudah diperiksa dan dijelaskan apa adanya.</p>
          </div>
          <Link to="/katalog">
            <span>Lihat semua</span>
            <i className="pi pi-arrow-up-right" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="home-item-grid" aria-label="Memuat barang terbaru">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} height="21rem" borderRadius="0.75rem" />
            ))}
          </div>
        ) : error ? (
          <Message
            severity="error"
            text={`${error} Buka katalog untuk mencoba lagi.`}
            className="w-full justify-start"
          />
        ) : items.length ? (
          <div className="home-item-grid">
            {items.map((item) => (
              <ItemCard key={item.uuid} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-400 bg-white p-7">
            <h3 className="m-0 text-base font-bold text-slate-900">
              Belum ada barang baru
            </h3>
            <p className="mb-4 mt-2 max-w-xl text-sm text-slate-600">
              Katalog akan menampilkan barang setelah selesai dikurasi. Kamu
              bisa kembali melihatnya nanti atau mengajukan donasi barang.
            </p>
            <Link to="/donasi-barang" className="home-text-link">
              Ajukan donasi barang
              <i className="pi pi-arrow-up-right" aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      <section className="home-section" aria-labelledby="impact-title">
        <div className="home-section-heading">
          <div>
            <h2 id="impact-title">Kebaikan yang tercatat</h2>
            <p>Ringkasan dari data publik Barokahiin.</p>
          </div>
          <Link to="/kegiatan">
            <span>Lihat laporan</span>
            <i className="pi pi-arrow-up-right" aria-hidden="true" />
          </Link>
        </div>

        <div className="home-impact-grid">
          {impact ? (
            <>
              <div className="home-impact-item">
                <span>Dana terkumpul</span>
                <strong>{formatRupiah(impact.total_dana_kebaikan_idr)}</strong>
              </div>
              <div className="home-impact-item">
                <span>Barang terjual</span>
                <strong>{impact.total_barang_terjual.toLocaleString("id-ID")}</strong>
              </div>
              <div className="home-impact-item">
                <span>Barang tersedia</span>
                <strong>{impact.total_barang_tersedia.toLocaleString("id-ID")}</strong>
              </div>
              <div className="home-impact-item">
                <span>Kegiatan terdanai</span>
                <strong>{impact.total_program_terdanai.toLocaleString("id-ID")}</strong>
              </div>
            </>
          ) : (
            <p className="home-impact-empty">
              Ringkasan dampak belum tersedia. Lihat halaman kegiatan untuk
              laporan terbaru.
            </p>
          )}
        </div>
      </section>

      <section className="home-section" aria-labelledby="how-title">
        <div className="home-section-heading">
          <div>
            <h2 id="how-title">Dari barang menjadi manfaat</h2>
            <p>Alur yang jelas, dari penyerahan sampai laporan kegiatan.</p>
          </div>
          <Link to="/cara-kerja">
            <span>Cara kerja</span>
            <i className="pi pi-arrow-up-right" aria-hidden="true" />
          </Link>
        </div>
        <ol className="home-steps">
          {STEPS.map((step, index) => (
            <li className="home-step" key={step.title}>
              <span className="home-step-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {activityError ? (
        <section className="home-section" aria-labelledby="activities-title">
          <div className="home-section-heading">
            <div>
              <h2 id="activities-title">Kegiatan yang didukung</h2>
              <p>Laporan kegiatan belum dapat dimuat saat ini.</p>
            </div>
            <Link to="/kegiatan">
              <span>Buka laporan</span>
              <i className="pi pi-arrow-up-right" aria-hidden="true" />
            </Link>
          </div>
          <Message
            severity="error"
            text={activityError}
            className="w-full justify-start"
          />
        </section>
      ) : activities.length > 0 ? (
        <section className="home-section" aria-labelledby="activities-title">
          <div className="home-section-heading">
            <div>
              <h2 id="activities-title">Kegiatan yang didukung</h2>
              <p>Lihat tujuan, progres, dan catatan penggunaan dana.</p>
            </div>
            <Link to="/kegiatan">
              <span>Semua kegiatan</span>
              <i className="pi pi-arrow-up-right" aria-hidden="true" />
            </Link>
          </div>
          <div className="home-activity-grid">
            {activities.map((activity) => {
              const progress =
                activity.target_dana > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (activity.dana_terkumpul_rupiah /
                          activity.target_dana) *
                          100
                      )
                    )
                  : 0;
              return (
                <Link
                  key={activity.uuid}
                  to={`/kegiatan/${activity.slug}`}
                  className="home-activity-card"
                >
                  <div>
                    <Tag
                      value={activity.status === "aktif" ? "Berjalan" : "Selesai"}
                      icon={activity.status === "aktif" ? "pi pi-clock" : "pi pi-check"}
                      severity={activity.status === "aktif" ? "success" : "secondary"}
                      rounded
                    />
                    <h3>{activity.judul}</h3>
                    <p>{activity.deskripsi}</p>
                  </div>
                  <div>
                    <div className="home-activity-total">
                      <strong>
                        Terkumpul {formatRupiah(activity.dana_terkumpul_rupiah)}
                      </strong>
                      <span>{progress}% dari target</span>
                    </div>
                    <ProgressBar value={progress} showValue={false} className="mt-2 h-2" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <TrustPaymentBanner settings={settings} />
    </div>
  );
};
