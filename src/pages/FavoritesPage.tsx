import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ItemCard } from "../components/ItemCard";
import { useBuyer } from "../context/BuyerContext";
import { publicApi } from "../services/publicApi";
import { PublicItem } from "../types";

export const FavoritesPage: React.FC = () => {
  const { favorites } = useBuyer();
  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Barang Favorit — Barokahiin";
    if (!favorites.length) {
      setItems([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    publicApi
      .getItems({ per_page: 100 })
      .then((response) => {
        if (active) {
          setItems(
            response.items.filter((item) => favorites.includes(item.uuid))
          );
        }
      })
      .catch((cause) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Favorit gagal dimuat.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [favorites]);

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-tinta">Barang favorit</h1>
        <p className="mt-1 text-sm text-muted">
          Favorit disimpan di perangkat ini dan tidak memerlukan akun.
        </p>
      </header>
      {loading && <p role="status">Memuat barang favorit…</p>}
      {error && <p className="form-alert error" role="alert">{error}</p>}
      {!loading && !error && !favorites.length && (
        <p className="form-card">
          Belum ada barang favorit. Simpan barang dari kartu atau halaman
          detailnya.
        </p>
      )}
      {!loading && !error && favorites.length > 0 && !items.length && (
        <p className="form-card">
          Barang favorit tidak lagi tersedia di katalog.{" "}
          <Link className="underline" to="/katalog">Kembali ke katalog</Link>
        </p>
      )}
      {items.length > 0 && (
        <div className="home-item-grid">
          {items.map((item) => <ItemCard item={item} key={item.uuid} />)}
        </div>
      )}
    </section>
  );
};
