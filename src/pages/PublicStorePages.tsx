import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ItemCard } from "../components/ItemCard";
import { publicApi } from "../services/publicApi";
import { PublicItem, PublicStore } from "../types";
import { setPageMetadata } from "../utils/seo";

export const StoresPage: React.FC = () => {
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageMetadata({
      title: "Toko Koordinator — Barokahiin",
      description: "Temukan toko koordinator yang mengkurasi barang di wilayahnya.",
      path: "/toko",
    });
    let active = true;
    publicApi
      .getStores()
      .then((data) => {
        if (active) setStores(data);
      })
      .catch((cause) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Daftar toko gagal dimuat.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-5">
      <header>
        <p className="text-sm font-semibold text-indigo-700">Toko lokal</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Toko koordinator
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Kenali toko yang mengkurasi barang di wilayahnya.
        </p>
      </header>
      {loading && <p role="status">Memuat toko…</p>}
      {error && <p className="form-alert error" role="alert">{error}</p>}
      {!loading && !error && !stores.length && (
        <p className="form-card">Belum ada toko aktif yang ditampilkan.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <Link className="store-card" to={`/toko/${store.slug}`} key={store.uuid}>
            {store.cover_url && (
              <img src={store.cover_url} alt="" className="store-card-cover" loading="lazy" />
            )}
            <div className="store-card-content">
              <p className="text-sm text-slate-600">{store.area_publik}</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">{store.nama}</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="readiness-badge">
                  {store.level ? `Koordinator level ${store.level}` : "Toko baru"}
                </span>
                <span className="readiness-badge">
                  {store.rating_count > 0 && store.rating_avg !== null
                    ? `${store.rating_avg.toFixed(1)} · ${store.rating_count} ulasan`
                    : "Belum ada ulasan"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export const StoreDetailPage: React.FC = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const [store, setStore] = useState<PublicStore | null>(null);
  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([
      publicApi.getStoreBySlug(slug),
      publicApi.getStoreItems(slug, { per_page: 100 }),
    ])
      .then(([storeResult, itemResult]) => {
        if (!active) return;
        setStore(storeResult);
        setItems(itemResult.items);
        setPageMetadata({
          title: `${storeResult.nama} — Barokahiin`,
          description:
            storeResult.deskripsi ||
            `Barang terkurasi dari ${storeResult.nama} di ${storeResult.area_publik}.`,
          path: `/toko/${encodeURIComponent(storeResult.slug)}`,
          image: storeResult.cover_url || storeResult.logo_url,
          structuredData: {
            "@context": "https://schema.org",
            "@type": "Store",
            name: storeResult.nama,
            description: storeResult.deskripsi || undefined,
            image: storeResult.cover_url || storeResult.logo_url || undefined,
            areaServed: storeResult.area_publik,
            aggregateRating:
              storeResult.rating_count > 0 && storeResult.rating_avg !== null
                ? {
                    "@type": "AggregateRating",
                    ratingValue: storeResult.rating_avg,
                    reviewCount: storeResult.rating_count,
                  }
                : undefined,
          },
        });
      })
      .catch((cause) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Halaman toko gagal dimuat.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <p role="status">Memuat toko…</p>;
  if (error || !store) {
    return (
      <section className="form-card mx-auto max-w-xl">
        <h1 className="text-xl font-bold">Toko tidak tersedia</h1>
        <p className="mt-2 text-sm text-slate-600">{error || "Toko tidak ditemukan."}</p>
        <Link className="secondary-action mt-4" to="/toko">Lihat toko lain</Link>
      </section>
    );
  }

  const rating =
    store.rating_count > 0 && store.rating_avg !== null
      ? `${store.rating_avg.toFixed(1)} dari ${store.rating_count} ulasan`
      : "Toko baru";
  const operatingHours =
    typeof store.jam_operasional === "string"
      ? store.jam_operasional
      : store.jam_operasional
        ? Object.entries(store.jam_operasional)
            .map(
              ([day, hours]) =>
                `${day.charAt(0).toUpperCase()}${day.slice(1)} ${hours}`
            )
            .join(" · ")
        : "";

  return (
    <div className="space-y-7">
      <header className="store-profile">
        {store.cover_url && <img className="store-profile-cover" src={store.cover_url} alt="" />}
        <div className="store-profile-content">
          <p className="text-sm font-semibold text-indigo-700">{store.area_publik}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">{store.nama}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="readiness-badge">
              {store.level ? `Koordinator level ${store.level}` : "Toko baru"}
            </span>
            <span className="readiness-badge">{rating}</span>
          </div>
          {operatingHours && (
            <p className="mt-3 text-sm text-slate-600">
              Jam operasional: {operatingHours}
            </p>
          )}
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="form-card space-y-3">
          <h2 className="text-lg font-bold">Tentang toko</h2>
          <p className="text-sm leading-6 text-slate-700">
            {store.deskripsi || "Informasi toko belum ditambahkan."}
          </p>
          {store.kebijakan_tambahan && (
            <div>
              <h3 className="font-semibold">Kebijakan toko</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {store.kebijakan_tambahan}
              </p>
            </div>
          )}
          <p className="text-xs text-slate-500">
            Halaman ini hanya menampilkan wilayah publik, bukan alamat lengkap
            atau kontak pribadi koordinator.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Barang dari toko ini</h2>
            <p className="mt-1 text-sm text-slate-600">
              Barang terkurasi yang tersedia di katalog.
            </p>
          </div>
          {items.length ? (
            <div className="home-item-grid">
              {items.map((item) => <ItemCard item={item} key={item.uuid} />)}
            </div>
          ) : (
            <p className="form-card">Belum ada barang yang diterbitkan oleh toko ini.</p>
          )}
        </div>
      </section>
    </div>
  );
};
