import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Message } from "primereact/message";
import { Skeleton } from "primereact/skeleton";
import { ItemCard } from "../components/ItemCard";
import { publicApi, resolveMediaUrl } from "../services/publicApi";
import { PublicItem, PublicStore } from "../types";
import { setPageMetadata } from "../utils/seo";

function getStoreLevelBadge(level: number | null): {
  label: string;
  className: string;
} {
  if (level === 3) {
    return {
      label: "Level 3",
      className: "bg-kunyit text-tinta",
    };
  }
  if (level === 2) {
    return {
      label: "Level 2",
      className: "bg-nila-muda text-nila-tua",
    };
  }
  if (level === 1) {
    return {
      label: "Level 1",
      className: "border border-nila bg-putih text-nila",
    };
  }
  return {
    label: "Toko baru",
    className: "bg-nila-muda text-nila-tua",
  };
}

export const StoresPage: React.FC = () => {
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageMetadata({
      title: "Toko Koordinator — Barokahinn",
      description:
        "Temukan toko koordinator yang mengkurasi barang di wilayahnya.",
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
          setError(
            cause instanceof Error
              ? cause.message
              : "Daftar toko gagal dimuat."
          );
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
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-nila">
          Toko lokal
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold text-tinta sm:text-3xl">
          Toko koordinator
        </h1>
        <p className="mt-1 text-sm text-muted">
          Kenali toko yang mengkurasi barang layak pakai di wilayah Jawa Barat
          dan sekitarnya.
        </p>
      </header>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} height="15rem" borderRadius="16px" />
          ))}
        </div>
      )}

      {error && (
        <Message severity="error" text={error} className="w-full justify-start" />
      )}

      {!loading && !error && !stores.length && (
        <div className="rounded-kartu-besar border border-garis bg-putih p-8 text-center">
          <p className="text-sm font-semibold text-tinta">
            Belum ada toko aktif yang ditampilkan.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => {
          const coverSrc = resolveMediaUrl(store.cover_url);
          const logoSrc = resolveMediaUrl(store.logo_url);
          const levelBadge = getStoreLevelBadge(store.level);
          return (
            <Link
              to={`/toko/${store.slug}`}
              key={store.uuid}
              className="group flex flex-col overflow-hidden rounded-kartu-besar border border-garis bg-putih transition-colors hover:border-nila"
            >
              {coverSrc ? (
                <div className="aspect-[16/7] w-full overflow-hidden bg-kertas">
                  <img
                    src={coverSrc}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              ) : (
                <div className="bg-nila-tua pt-5" aria-hidden="true">
                  <div className="pita-mendung w-full" />
                </div>
              )}

              <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-kartu border border-garis bg-nila-muda text-nila">
                    {logoSrc ? (
                      <img
                        src={logoSrc}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <i className="pi pi-shop text-base" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-xs font-medium text-muted">
                      <i
                        className="pi pi-map-marker text-[10px] text-nila"
                        aria-hidden="true"
                      />
                      <span className="truncate">{store.area_publik}</span>
                    </p>
                    <h2 className="font-display mt-0.5 truncate text-lg font-bold text-tinta group-hover:text-nila">
                      {store.nama}
                    </h2>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-garis pt-3 text-xs font-semibold">
                  <span className={`rounded-pil px-2.5 py-0.5 ${levelBadge.className}`}>
                    {levelBadge.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-pil bg-teh-muda px-2.5 py-0.5 text-teh-tua">
                    <i className="pi pi-star-fill text-[10px]" aria-hidden="true" />
                    <span>
                      {store.rating_count > 0 && store.rating_avg !== null
                        ? `${store.rating_avg.toFixed(1)} (${store.rating_count})`
                        : "Toko baru"}
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
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
          title: `${storeResult.nama} — Barokahinn`,
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
          setError(
            cause instanceof Error
              ? cause.message
              : "Halaman toko gagal dimuat."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton height="15rem" borderRadius="16px" />
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Skeleton height="14rem" borderRadius="12px" />
          </div>
          <div className="lg:col-span-8">
            <Skeleton height="18rem" borderRadius="12px" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <section className="mx-auto max-w-xl space-y-4 rounded-kartu-besar border border-garis bg-putih p-8 text-center">
        <i className="pi pi-shop text-3xl text-muted" aria-hidden="true" />
        <h1 className="font-display text-xl font-bold text-tinta">
          Toko tidak tersedia
        </h1>
        <p className="text-sm text-muted">
          {error || "Toko tidak ditemukan."}
        </p>
        <Link className="secondary-action" to="/toko">
          Lihat toko lain
        </Link>
      </section>
    );
  }

  const coverSrc = resolveMediaUrl(store.cover_url);
  const logoSrc = resolveMediaUrl(store.logo_url);
  const levelBadge = getStoreLevelBadge(store.level);
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
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-xs text-muted"
      >
        <Link to="/" className="hover:text-nila">
          Beranda
        </Link>
        <span>/</span>
        <Link to="/toko" className="hover:text-nila">
          Toko koordinator
        </Link>
        <span>/</span>
        <span className="font-medium text-tinta">{store.nama}</span>
      </nav>

      {/* Store Cover & Header */}
      <header className="overflow-hidden rounded-kartu-besar border border-garis bg-putih">
        {coverSrc ? (
          <img
            className="h-44 w-full object-cover sm:h-56"
            src={coverSrc}
            alt=""
          />
        ) : (
          <div className="bg-nila-tua pt-10" aria-hidden="true">
            <div className="pita-mendung w-full" />
          </div>
        )}

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-kartu border border-garis bg-nila-muda text-nila">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <i className="pi pi-shop text-xl" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-nila">
                  <i className="pi pi-map-marker text-[11px]" aria-hidden="true" />
                  <span>{store.area_publik}</span>
                </p>
                <h1 className="font-display mt-0.5 text-2xl font-bold text-tinta sm:text-3xl">
                  {store.nama}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className={`rounded-pil px-3 py-1 ${levelBadge.className}`}>
                {levelBadge.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-pil bg-teh-muda px-3 py-1 text-teh-tua">
                <i className="pi pi-star-fill text-[10px]" aria-hidden="true" />
                <span>{rating}</span>
              </span>
            </div>
          </div>

          {operatingHours && (
            <p className="mt-4 flex items-center gap-2 border-t border-garis pt-3 text-xs text-muted">
              <i className="pi pi-clock text-nila" aria-hidden="true" />
              <span>
                <strong className="text-tinta">Jam operasional:</strong>{" "}
                {operatingHours}
              </span>
            </p>
          )}
        </div>
      </header>

      {store.status === "dijeda" && (
        <Message
          severity="warn"
          text="Toko sedang dijeda sementara oleh koordinator. Barang dari toko ini tidak tersedia untuk pemesanan."
          className="w-full justify-start"
        />
      )}

      {/* Store Info + Items Grid */}
      <section className="grid gap-6 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-4">
          <div className="rounded-kartu border border-garis bg-putih p-5 space-y-4">
            <div>
              <h2 className="font-display text-base font-bold text-tinta">
                Tentang toko
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-tinta">
                {store.deskripsi || "Informasi toko belum ditambahkan."}
              </p>
            </div>

            {store.kebijakan_tambahan && (
              <div className="border-t border-garis pt-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Kebijakan toko
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">
                  {store.kebijakan_tambahan}
                </p>
              </div>
            )}

            <div className="rounded-kontrol border border-garis bg-kertas p-3 text-xs leading-relaxed text-muted">
              <i className="pi pi-shield mr-1.5 text-nila" aria-hidden="true" />
              Halaman ini hanya menampilkan wilayah publik, bukan alamat lengkap
              atau kontak pribadi koordinator.
            </div>
          </div>
        </aside>

        <div className="space-y-4 lg:col-span-8">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold text-tinta">
                Barang dari toko ini
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                {items.length} barang terkurasi tersedia di katalog.
              </p>
            </div>
          </div>

          {items.length ? (
            <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-3">
              {items.map((item) => (
                <ItemCard item={item} key={item.uuid} />
              ))}
            </div>
          ) : (
            <div className="rounded-kartu border border-garis bg-putih p-8 text-center text-sm text-muted">
              Belum ada barang yang diterbitkan oleh toko ini.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
