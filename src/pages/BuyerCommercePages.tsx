import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { useBuyer } from "../context/BuyerContext";
import {
  ApiClientError,
  createIdempotencyKey,
  publicApi,
} from "../services/publicApi";
import {
  BuyerOrder,
  BuyerProfileCompleteness,
  CheckoutOrder,
  CheckoutValidation,
  ImpactReceipt,
  PaymentInstruction,
} from "../types";
import { formatRupiah, getAddressWarningMessages } from "../utils/format";

function shouldLoadImpactReceipt(status: string): boolean {
  const normalized = status.toLowerCase();
  return ["dibayar", "dikirim", "diterima", "selesai"].some((value) =>
    normalized.includes(value)
  );
}

const REVIEW_RATING_OPTIONS = [1, 2, 3, 4, 5].map((value) => ({
  label: `${value} dari 5`,
  value,
}));

export const CartPage: React.FC = () => {
  const { cart, token, removeFromCart } = useBuyer();
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + item.harga_rupiah, 0);
  const groups = useMemo(() => {
    const grouped = new Map<string, typeof cart>();
    cart.forEach((item) => {
      grouped.set(item.toko_nama, [...(grouped.get(item.toko_nama) || []), item]);
    });
    return [...grouped.entries()];
  }, [cart]);

  useEffect(() => {
    document.title = "Keranjang — Barokahiin";
  }, []);

  if (!cart.length) {
    return (
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Keranjangmu kosong</h1>
        <p className="mt-2 text-sm text-slate-600">
          Barang tidak ditahan saat berada di keranjang. Penahanan baru dimulai
          setelah pesanan dikonfirmasi.
        </p>
        <Link className="primary-action mt-5" to="/katalog">
          Jelajahi katalog
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-700">
          {cart.length} barang unik
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Keranjang</h1>
      </header>

      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Barang belum ditahan. Stok diperiksa lagi saat checkout dan hold
        dimulai setelah konfirmasi pesanan.
      </p>

      <div className="space-y-4">
        {groups.map(([store, items]) => (
          <section className="form-card" key={store}>
            <h2 className="text-sm font-bold text-slate-700">{store}</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {items.map((item) => (
                <li className="flex items-center justify-between gap-4 py-4" key={item.uuid}>
                  <div className="min-w-0">
                    <Link className="font-semibold text-slate-900 hover:underline" to={`/barang/${item.slug}`}>
                      {item.judul}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatRupiah(item.harga_rupiah)}
                    </p>
                  </div>
                  <Button
                    className="text-sm font-semibold text-red-700 underline"
                    type="button"
                    onClick={() => removeFromCart(item.uuid)}
                  >
                    Hapus
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="form-card">
        <div className="flex justify-between gap-3 text-sm">
          <span>Subtotal barang</span>
          <strong>{formatRupiah(total)}</strong>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Ongkir dan biaya kemas dihitung setelah kamu memilih cara serah.
          Pesanan dari toko berbeda dapat memiliki ongkir terpisah.
        </p>
        <Button
          className="primary-action mt-5 w-full"
          type="button"
          onClick={() =>
            navigate(token ? "/checkout" : "/masuk?next=%2Fcheckout")
          }
        >
          {token ? "Lanjut ke checkout" : "Masuk untuk checkout"}
        </Button>
      </section>
    </div>
  );
};

function missingLabel(code: string): string {
  const labels: Record<string, string> = {
    PHONE_UNVERIFIED: "Verifikasi nomor HP",
    EMAIL_UNVERIFIED: "Verifikasi email",
    NAME_MISSING: "Lengkapi nama",
    TERMS_NOT_ACCEPTED: "Setujui syarat layanan",
    REGION_MISSING: "Pilih wilayah",
    ADDRESS_MISSING: "Tambahkan alamat",
    ADDRESS_INVALID: "Periksa kembali alamat",
  };
  return labels[code] || code;
}

export const CheckoutPage: React.FC = () => {
  const {
    token,
    cart,
    clearCart,
    recordOrder,
    addressWarningReviews,
    setAddressWarningReview,
  } = useBuyer();
  const navigate = useNavigate();
  const [handover, setHandover] = useState<"ambil" | "kirim">("kirim");
  const [addresses, setAddresses] = useState<
    Awaited<ReturnType<typeof publicApi.getBuyerAddresses>>
  >([]);
  const [addressUuid, setAddressUuid] = useState("");
  const [addressWarningsConfirmed, setAddressWarningsConfirmed] =
    useState(false);
  const [completeness, setCompleteness] =
    useState<BuyerProfileCompleteness | null>(null);
  const [quote, setQuote] = useState<CheckoutValidation | null>(null);
  const [baseQuote, setBaseQuote] = useState<CheckoutValidation | null>(null);
  const [rounding, setRounding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmKey = useRef<string | null>(null);

  useEffect(() => {
    document.title = "Periksa pesanan — Barokahiin";
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError(null);
    setQuote(null);
    setBaseQuote(null);
    setConfirmed(false);
    setRounding(false);
    confirmKey.current = null;
    Promise.all([
      publicApi.getBuyerProfileCompleteness(token, handover),
      handover === "kirim"
        ? publicApi.getBuyerAddresses(token)
        : Promise.resolve([]),
    ])
      .then(([profile, savedAddresses]) => {
        if (!active) return;
        setCompleteness(profile);
        if (handover === "kirim") {
          setAddresses(savedAddresses);
          setAddressUuid((current) =>
            current && savedAddresses.some((address) => address.uuid === current)
              ? current
              : savedAddresses.find((address) => address.utama)?.uuid || ""
          );
        }
      })
      .catch((cause) => {
        if (active) {
          if (
            cause instanceof ApiClientError &&
            (cause.status === 401 || cause.code === "OTP_INVALID")
          ) {
            navigate(`/masuk?next=${encodeURIComponent("/checkout")}`, {
              replace: true,
            });
            return;
          }
          setError(cause instanceof Error ? cause.message : "Checkout belum bisa dimuat.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, handover]);

  if (!token) return <Navigate to="/masuk?next=%2Fcheckout" replace />;
  if (!cart.length) return <Navigate to="/keranjang" replace />;

  const roundingAmount = baseQuote
    ? (1000 -
        ((baseQuote.quote.subtotal_idr +
          baseQuote.quote.ongkir_idr +
          baseQuote.quote.packing_fee_idr) %
          1000)) %
      1000
    : 0;
  const missingProfile = !!completeness && !completeness.ready;
  const selectedAddress = addresses.find(
    (address) => address.uuid === addressUuid
  );
  const selectedAddressWarningCodes =
    addressWarningReviews[addressUuid]?.warnings ||
    selectedAddress?.warnings ||
    [];
  const selectedAddressWarnings = getAddressWarningMessages(
    selectedAddressWarningCodes
  );
  const selectedAddressWarningsConfirmed =
    addressWarningReviews[addressUuid]?.confirmed || addressWarningsConfirmed;

  const validateCheckout = async (event?: FormEvent) => {
    event?.preventDefault();
    if (handover === "kirim" && !addressUuid) {
      setError("Pilih alamat pengiriman atau tambahkan alamat di akun.");
      return;
    }
    if (
      selectedAddressWarnings.length &&
      !selectedAddressWarningsConfirmed
    ) {
      setError("Periksa dan konfirmasi catatan alamat sebelum melanjutkan.");
      return;
    }
    setBusy(true);
    setError(null);
    setQuote(null);
    setBaseQuote(null);
    setConfirmed(false);
    setRounding(false);
    confirmKey.current = null;
    try {
      const result = await publicApi.validateBuyerCheckout(token, {
        item_uuids: cart.map((item) => item.uuid),
        serah: handover,
        ...(handover === "kirim" ? { address_uuid: addressUuid } : {}),
        rounding_donation_idr: 0,
      });
      setQuote(result);
      setBaseQuote(result);
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 409) {
        setError(
          `${cause.message} Keranjang belum ditahan; periksa ketersediaan barang lalu coba lagi.`
        );
      } else {
        setError(cause instanceof Error ? cause.message : "Pesanan belum bisa diperiksa.");
      }
    } finally {
      setBusy(false);
    }
  };

  const recalculateRounding = async (enabled: boolean) => {
    if (!baseQuote) return;
    const amount = enabled
      ? (1000 -
          ((baseQuote.quote.subtotal_idr +
            baseQuote.quote.ongkir_idr +
            baseQuote.quote.packing_fee_idr) %
            1000)) %
        1000
      : 0;
    setRounding(enabled);
    confirmKey.current = null;
    setBusy(true);
    setError(null);
    setQuote(null);
    setConfirmed(false);
    try {
      const result = await publicApi.validateBuyerCheckout(token, {
        item_uuids: cart.map((item) => item.uuid),
        serah: handover,
        ...(handover === "kirim" ? { address_uuid: addressUuid } : {}),
        rounding_donation_idr: amount,
      });
      setQuote(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Total gagal diperbarui.");
    } finally {
      setBusy(false);
    }
  };

  const confirmOrder = async () => {
    if (!quote || !confirmed || missingProfile) return;
    setBusy(true);
    setError(null);
    confirmKey.current ||= createIdempotencyKey();
    try {
      const order: CheckoutOrder = await publicApi.confirmBuyerCheckout(
        token,
        {
          item_uuids: cart.map((item) => item.uuid),
          serah: handover,
          ...(handover === "kirim" ? { address_uuid: addressUuid } : {}),
          rounding_donation_idr: rounding ? roundingAmount : 0,
          data_confirmed: true,
        },
        confirmKey.current
      );
      const code = order.kode || order.uuid;
      recordOrder(code);
      clearCart();
      navigate(`/pesanan/${encodeURIComponent(code)}`, {
        replace: true,
        state: { order },
      });
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 422) {
        const missing = cause.fields?.missing;
        if (Array.isArray(missing)) {
          setCompleteness({ ready: false, missing });
        }
        setError(
          `${cause.message} Perbarui data akun, lalu periksa kembali pesananmu.`
        );
      } else if (
        cause instanceof ApiClientError &&
        cause.code === "ORDER_UNDER_REVIEW"
      ) {
        setError(
          `${cause.message} Jangan mengirim ulang checkout; periksa status beberapa saat lagi.`
        );
      } else if (
        cause instanceof ApiClientError &&
        (cause.code === "ITEM_UNAVAILABLE" || cause.status === 409)
      ) {
        setError(
          `${cause.message} Barang mungkin sudah ditahan atau terjual; kembali ke keranjang untuk meninjau ulang.`
        );
      } else {
        setError(cause instanceof Error ? cause.message : "Pesanan belum berhasil dikonfirmasi.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-700">Checkout</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Periksa pesananmu
        </h1>
      </header>

      {error && <p className="form-alert error" role="alert">{error}</p>}
      {loading ? (
        <p className="form-card" role="status">Memeriksa profil dan alamat…</p>
      ) : missingProfile ? (
        <section className="form-card">
          <h2 className="text-lg font-bold text-slate-900">
            Lengkapi data sebelum checkout
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Barang belum ditahan selama kamu melengkapi data.
          </p>
          <ul className="mt-3 list-inside list-disc text-sm text-slate-700">
            {completeness?.missing.map((code) => (
              <li key={code}>{missingLabel(code)}</li>
            ))}
          </ul>
          <Link className="primary-action mt-4" to="/akun">
            Lengkapi data
          </Link>
        </section>
      ) : (
        <>
          <section className="form-card space-y-4">
            <label className="form-field">
              <span>Cara menerima barang</span>
              <Dropdown
                className="form-input"
                value={handover}
                options={[
                  { label: "Kirim ke alamat", value: "kirim" },
                  { label: "Ambil di toko koordinator", value: "ambil" },
                ]}
                onChange={(event) =>
                  setHandover(event.value as "ambil" | "kirim")
                }
              />
            </label>
            {handover === "kirim" ? (
              <div className="form-field">
                <label htmlFor="checkout-address">Alamat pengiriman</label>
                <Dropdown
                  inputId="checkout-address"
                  className="form-input"
                  value={addressUuid}
                  options={addresses.map((address) => ({
                    label: `${address.penerima} — ${address.jalan}, ${
                      address.region_nama || address.region_id
                    }`,
                    value: address.uuid,
                  }))}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Pilih alamat"
                  onChange={(event) => {
                    setAddressUuid(event.value || "");
                    setAddressWarningsConfirmed(false);
                    setQuote(null);
                    setBaseQuote(null);
                    setConfirmed(false);
                    confirmKey.current = null;
                  }}
                  required
                />
                <Link className="mt-1 inline-block text-sm text-indigo-700 underline" to="/akun">
                  Kelola alamat
                </Link>
                {selectedAddressWarnings.length > 0 && (
                  <div className="mt-3 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    <p className="font-semibold">
                      Periksa catatan pada alamat ini sebelum melanjutkan
                    </p>
                    <ul className="list-inside list-disc space-y-1">
                      {selectedAddressWarnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                    <div className="flex items-start gap-2">
                      <Checkbox
                        inputId="checkout-address-warnings-confirmed"
                        checked={selectedAddressWarningsConfirmed}
                        onChange={(event) => {
                          const confirmed = !!event.checked;
                          setAddressWarningsConfirmed(confirmed);
                          setAddressWarningReview(
                            addressUuid,
                            selectedAddressWarningCodes,
                            confirmed
                          );
                        }}
                      />
                      <label htmlFor="checkout-address-warnings-confirmed">
                        Saya sudah memeriksa dan mengonfirmasi alamat ini.
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                Area dan alamat lengkap titik ambil ditampilkan sesuai aturan
                pesanan setelah pembayaran.
              </p>
            )}
            <Button className="secondary-action" type="button" disabled={busy} onClick={() => void validateCheckout()}>
              {busy ? "Memeriksa…" : "Periksa ongkir dan ketersediaan"}
            </Button>
          </section>

          <section className="form-card">
            <h2 className="text-lg font-bold text-slate-900">Ringkasan barang</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {cart.map((item) => (
                <li className="flex justify-between gap-3 py-3 text-sm" key={item.uuid}>
                  <span>{item.judul}</span>
                  <strong>{formatRupiah(item.harga_rupiah)}</strong>
                </li>
              ))}
            </ul>
            {quote && (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-4 text-sm">
                <p className="flex justify-between"><span>Subtotal</span><strong>{formatRupiah(quote.quote.subtotal_idr)}</strong></p>
                <p className="flex justify-between"><span>Ongkir</span><strong>{formatRupiah(quote.quote.ongkir_idr)}</strong></p>
                <p className="flex justify-between"><span>Biaya kemas</span><strong>{formatRupiah(quote.quote.packing_fee_idr)}</strong></p>
                <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3">
                  <Checkbox
                    inputId="rounding"
                    checked={rounding}
                    onChange={(event) =>
                      void recalculateRounding(!!event.checked)
                    }
                  />
                  <label htmlFor="rounding">
                    Tambahkan Pembulatan Kebaikan{" "}
                    {rounding && roundingAmount > 0
                      ? `(${formatRupiah(roundingAmount)})`
                      : "(opsional)"}
                  </label>
                </div>
                <p className="flex justify-between border-t border-slate-100 pt-3 text-base">
                  <span>Total</span>
                  <strong>{formatRupiah(quote.quote.total_idr)}</strong>
                </p>
              </div>
            )}
            {quote && (
              <div className="mt-4 flex items-start gap-2 text-sm text-slate-700">
                <Checkbox
                  inputId="confirm-order-details"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(!!event.checked)}
                />
                <label htmlFor="confirm-order-details">Data sudah benar. Saya setuju pesanan dikonfirmasi dan barang ditahan selama 30 menit.</label>
              </div>
            )}
            <Button
              className="primary-action mt-5 w-full"
              type="button"
              disabled={!quote || !confirmed || busy}
              onClick={() => void confirmOrder()}
            >
              {busy ? "Mengonfirmasi…" : "Konfirmasi pesanan"}
            </Button>
          </section>
        </>
      )}
    </div>
  );
};

export const OrdersPage: React.FC = () => {
  const { token, recentOrderCodes } = useBuyer();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Pesanan saya — Barokahiin";
    if (!token) return;
    let active = true;
    if (!recentOrderCodes.length) {
      setLoading(false);
      return;
    }
    Promise.allSettled(
      recentOrderCodes.map((code) => publicApi.getBuyerOrder(token, code))
    ).then((results) => {
      if (!active) return;
      const loaded = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : []
      );
      setOrders(loaded);
      const rejected = results.find((result) => result.status === "rejected");
      if (rejected) {
        if (
          rejected.status === "rejected" &&
          rejected.reason instanceof ApiClientError &&
          (rejected.reason.status === 401 ||
            rejected.reason.code === "OTP_INVALID")
        ) {
          navigate(`/masuk?next=${encodeURIComponent("/pesanan")}`, {
            replace: true,
          });
          return;
        }
        const failureMessage =
          rejected.status === "rejected" &&
          rejected.reason instanceof Error
            ? rejected.reason.message
            : "Status pesanan belum bisa dimuat.";
        setError(
          loaded.length
            ? `Sebagian pesanan tidak dapat dimuat: ${failureMessage}`
            : failureMessage
        );
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [token, recentOrderCodes, navigate]);

  if (!token) return <Navigate to="/masuk?next=%2Fpesanan" replace />;
  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Pesanan saya</h1>
        <p className="mt-1 text-sm text-slate-600">
          Riwayat yang dibuat pada perangkat ini.
        </p>
      </header>
      {loading && <p role="status">Memuat pesanan…</p>}
      {error && <p className="form-alert error" role="alert">{error}</p>}
      {!loading && !orders.length && !error && (
        <p className="form-card">Belum ada pesanan tersimpan di perangkat ini.</p>
      )}
      <ul className="space-y-3">
        {orders.map((order) => (
          <li className="form-card flex flex-wrap items-center justify-between gap-3" key={order.uuid}>
            <div>
              <p className="font-semibold">{order.kode}</p>
              <p className="text-sm text-slate-600">Status: {order.status}</p>
            </div>
            <Link className="secondary-action" to={`/pesanan/${encodeURIComponent(order.kode)}`}>
              Lihat pesanan
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export const OrderPage: React.FC = () => {
  const { code = "" } = useParams<{ code: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useBuyer();
  const [order, setOrder] = useState<BuyerOrder | CheckoutOrder | null>(
    (location.state as { order?: CheckoutOrder } | null)?.order || null
  );
  const [receipt, setReceipt] = useState<ImpactReceipt | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentInstruction["metode"]>("qris");
  const [payment, setPayment] = useState<PaymentInstruction | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<
    Awaited<ReturnType<typeof publicApi.getBuyerAddresses>>
  >([]);
  const [selectedAddressUuid, setSelectedAddressUuid] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paymentKey = useRef<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [itemRating, setItemRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const loadOrder = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await publicApi.getBuyerOrder(token, code);
      setOrder(data);
      if (shouldLoadImpactReceipt(data.status)) {
        const orderReceipt = await publicApi.getBuyerImpactReceipt(
          token,
          code
        );
        setReceipt(orderReceipt);
      }
    } catch (cause) {
      if (
        cause instanceof ApiClientError &&
        (cause.status === 401 || cause.code === "OTP_INVALID")
      ) {
        navigate(
          `/masuk?next=${encodeURIComponent(`/pesanan/${code}`)}`,
          { replace: true }
        );
        return;
      }
      setError(cause instanceof Error ? cause.message : "Pesanan gagal dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = `Pesanan ${code} — Barokahiin`;
    void loadOrder();
  }, [token, code]);

  useEffect(() => {
    if (!token || !code) return;
    const timer = window.setInterval(() => {
      publicApi
        .getBuyerOrder(token, code)
        .then(async (latest) => {
          setOrder(latest);
          if (!receipt && shouldLoadImpactReceipt(latest.status)) {
            const latestReceipt = await publicApi.getBuyerImpactReceipt(
              token,
              code
            );
            setReceipt(latestReceipt);
          }
        })
        .catch((cause) => {
          if (
            cause instanceof ApiClientError &&
            (cause.status === 401 || cause.code === "OTP_INVALID")
          ) {
            navigate(
              `/masuk?next=${encodeURIComponent(`/pesanan/${code}`)}`,
              { replace: true }
            );
            return;
          }
          setError(
            cause instanceof Error
              ? cause.message
              : "Pembaruan status pesanan gagal."
          );
        });
    }, 15000);
    return () => window.clearInterval(timer);
  }, [token, code, receipt]);

  useEffect(() => {
    const expiresAt =
      order && "hold_expires_at" in order ? order.hold_expires_at : undefined;
    if (!expiresAt) {
      setSecondsRemaining(null);
      return;
    }
    const updateRemaining = () => {
      setSecondsRemaining(
        Math.max(
          0,
          Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
        )
      );
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [order]);

  useEffect(() => {
    paymentKey.current = null;
    setPayment(null);
  }, [paymentMethod]);

  useEffect(() => {
    if (
      !token ||
      !order ||
      order.status.toLowerCase() !== "dibayar" ||
      order.serah !== "kirim"
    ) {
      setSavedAddresses([]);
      return;
    }

    let active = true;
    publicApi
      .getBuyerAddresses(token)
      .then((addresses) => {
        if (!active) return;
        setSavedAddresses(addresses);
        setSelectedAddressUuid((current) => {
          if (current && addresses.some((address) => address.uuid === current)) {
            return current;
          }
          if (
            order.address_uuid &&
            addresses.some((address) => address.uuid === order.address_uuid)
          ) {
            return order.address_uuid;
          }
          return addresses.find((address) => address.utama)?.uuid || "";
        });
      })
      .catch((cause) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Buku alamat belum bisa dimuat."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [token, order?.uuid, order?.status, order?.serah, order?.address_uuid]);

  if (!token) {
    return (
      <section className="form-card mx-auto max-w-xl">
        <h1 className="text-xl font-bold">Masuk untuk melihat pesanan</h1>
        <Link className="primary-action mt-4" to={`/masuk?next=${encodeURIComponent(`/pesanan/${code}`)}`}>
          Masuk
        </Link>
      </section>
    );
  }

  const isPendingPayment =
    !!order &&
    ["menunggu_pembayaran", "menunggu pembayaran", "pending_payment"].includes(
      order.status.toLowerCase()
    );
  const hasHold = !!order && "hold_expires_at" in order && !!order.hold_expires_at;
  const holdExpiresAt =
    order && "hold_expires_at" in order ? order.hold_expires_at : undefined;

  const createPayment = async () => {
    if (!order || !("uuid" in order)) return;
    setBusy(true);
    setError(null);
    try {
      paymentKey.current ||= createIdempotencyKey();
      const instruction = await publicApi.createBuyerPayment(
        token,
        order.uuid,
        paymentMethod,
        paymentKey.current
      );
      setPayment(instruction);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Instruksi pembayaran gagal dibuat.");
    } finally {
      setBusy(false);
    }
  };

  const cancelOrder = async () => {
    if (!order || !window.confirm("Batalkan pesanan yang belum dibayar?")) return;
    setBusy(true);
    setError(null);
    try {
      await publicApi.cancelBuyerOrder(token, order.uuid);
      await loadOrder();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pesanan gagal dibatalkan.");
    } finally {
      setBusy(false);
    }
  };

  const confirmReceived = async () => {
    if (!order || !window.confirm("Konfirmasi barang sudah diterima?")) return;
    setBusy(true);
    setError(null);
    try {
      await publicApi.confirmBuyerOrderReceived(token, order.uuid);
      await loadOrder();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Konfirmasi penerimaan gagal.");
    } finally {
      setBusy(false);
    }
  };

  const submitDispute = async (event: FormEvent) => {
    event.preventDefault();
    if (!order || !disputeReason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await publicApi.createBuyerDispute(token, order.uuid, disputeReason.trim());
      setDisputeReason("");
      setNotice("Komplain berhasil dikirim.");
    } catch (cause) {
      setError(
        cause instanceof ApiClientError &&
          cause.code === "DISPUTE_WINDOW_CLOSED"
          ? "Batas waktu komplain 48 jam setelah penerimaan telah berakhir."
          : cause instanceof Error
            ? cause.message
            : "Komplain gagal dikirim."
      );
    } finally {
      setBusy(false);
    }
  };

  const updateOrderAddress = async () => {
    if (!order || !selectedAddressUuid) return;
    setBusy(true);
    setError(null);
    try {
      await publicApi.updateBuyerOrderAddress(
        token,
        order.uuid,
        selectedAddressUuid
      );
      await loadOrder();
      setNotice("Alamat pesanan berhasil diperbarui.");
    } catch (cause) {
      setError(
        cause instanceof ApiClientError &&
          cause.code === "ADDRESS_CHANGE_NOT_ALLOWED"
          ? "Alamat tidak dapat diubah karena pesanan sudah disiapkan atau alamat berada di zona ongkir berbeda."
          : cause instanceof Error
            ? cause.message
            : "Alamat pesanan gagal diperbarui."
      );
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!order) return;
    setBusy(true);
    setError(null);
    try {
      await publicApi.createBuyerReview(token, order.uuid, {
        rating_barang: itemRating,
        rating_layanan: serviceRating,
        teks: reviewText.trim(),
      });
      setReviewSubmitted(true);
      setNotice("Terima kasih, ulasanmu berhasil dikirim.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ulasan gagal dikirim.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="text-sm font-semibold text-indigo-700">Pesanan</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{code}</h1>
      </header>
      {error && <p className="form-alert error" role="alert">{error}</p>}
      {notice && <p className="form-alert success" role="status">{notice}</p>}
      {loading && <p role="status">Memuat status pesanan…</p>}
      {order && (
        <>
          <div className="form-card">
            <p className="text-sm text-slate-600">Status pesanan</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{order.status}</p>
            {hasHold && (
              <p className="mt-2 text-sm text-slate-600">
                Batas penahanan:{" "}
                {secondsRemaining === 0
                  ? "Masa penahanan telah berakhir."
                  : secondsRemaining !== null
                    ? `${Math.floor(secondsRemaining / 60)} menit ${secondsRemaining % 60} detik`
                    : holdExpiresAt
                      ? new Date(holdExpiresAt).toLocaleString("id-ID")
                      : ""}
              </p>
            )}
            <Button className="mt-3 text-sm font-semibold text-indigo-700 underline" type="button" onClick={() => void loadOrder()}>
              Perbarui status
            </Button>
          </div>

          {isPendingPayment && (
            <div className="form-card space-y-4">
              <h2 className="text-lg font-bold">Pilih metode pembayaran</h2>
              <label className="form-field">
                <span>Metode</span>
                <Dropdown
                  className="form-input"
                  value={paymentMethod}
                  options={[
                    { label: "QRIS", value: "qris" },
                    { label: "Transfer virtual account", value: "va" },
                    { label: "E-wallet", value: "ewallet" },
                  ]}
                  onChange={(event) =>
                    setPaymentMethod(event.value as PaymentInstruction["metode"])
                  }
                />
              </label>
              <Button className="primary-action" type="button" disabled={busy} onClick={() => void createPayment()}>
                {busy ? "Menyiapkan pembayaran…" : "Buat instruksi pembayaran"}
              </Button>
              {payment && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                  <p className="font-semibold">Instruksi pembayaran</p>
                  <p className="mt-1">Metode: {payment.metode.toUpperCase()}</p>
                  {payment.va_number && <p>Nomor virtual account: {payment.va_number}</p>}
                  {payment.qris_url && <img className="mt-3 max-h-64" src={payment.qris_url} alt="Kode QRIS pembayaran" />}
                  {payment.instructions?.map((instruction) => <p className="mt-1" key={instruction}>{instruction}</p>)}
                  {payment.payment_url && (
                    <a className="secondary-action mt-3" href={payment.payment_url} target="_blank" rel="noopener noreferrer">
                      Buka halaman pembayaran
                    </a>
                  )}
                  {payment.expires_at && <p className="mt-2">Batas pembayaran: {new Date(payment.expires_at).toLocaleString("id-ID")}</p>}
                </div>
              )}
              <Button className="text-sm font-semibold text-red-700 underline" type="button" disabled={busy} onClick={() => void cancelOrder()}>
                Batalkan sebelum membayar
              </Button>
            </div>
          )}

          {order.status.toLowerCase() === "dibayar" &&
            order.serah === "kirim" && (
              <div className="form-card space-y-3">
                <h2 className="text-lg font-bold">Koreksi alamat pengiriman</h2>
                <p className="text-sm text-slate-600">
                  Alamat hanya dapat diubah selama pesanan memenuhi syarat dan
                  tetap berada di zona ongkir yang sama.
                </p>
                <label className="form-field">
                  <span>Pilih alamat pengganti</span>
                  <Dropdown
                    className="form-input"
                    value={selectedAddressUuid}
                    options={savedAddresses.map((address) => ({
                      label: `${address.penerima} — ${address.jalan}, ${
                        address.region_nama || address.region_id
                      }`,
                      value: address.uuid,
                    }))}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Pilih alamat"
                    onChange={(event) =>
                      setSelectedAddressUuid(event.value || "")
                    }
                    disabled={!savedAddresses.length || busy}
                  />
                </label>
                <Button
                  className="secondary-action"
                  type="button"
                  disabled={
                    busy ||
                    !selectedAddressUuid ||
                    selectedAddressUuid === order.address_uuid
                  }
                  onClick={() => void updateOrderAddress()}
                >
                  Perbarui alamat
                </Button>
              </div>
            )}

          {receipt && (
            <div className="form-card">
              <section>
                <h2 className="text-lg font-bold">Rincian pembayaran</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  {Object.entries(receipt.rincian_pembayaran).map(
                    ([label, amount]) => (
                      <div className="flex justify-between gap-4" key={label}>
                        <dt>{label.replace(/_/g, " ")}</dt>
                        <dd className="font-semibold">{formatRupiah(amount)}</dd>
                      </div>
                    )
                  )}
                </dl>
              </section>
              <section className="mt-5 border-t border-slate-100 pt-4">
                <h2 className="text-lg font-bold">Kuitansi Kebaikan</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  {Object.entries(receipt.kuitansi_kebaikan).map(
                    ([label, amount]) => (
                      <div className="flex justify-between gap-4" key={label}>
                        <dt>{label.replace(/_/g, " ")}</dt>
                        <dd className="font-semibold">{formatRupiah(amount)}</dd>
                      </div>
                    )
                  )}
                </dl>
              </section>
            </div>
          )}

          {order.status.toLowerCase().includes("dikirim") && (
            <Button className="primary-action" type="button" disabled={busy} onClick={() => void confirmReceived()}>
              Konfirmasi barang diterima
            </Button>
          )}

          {(order.status.toLowerCase().includes("diterima") ||
            order.status.toLowerCase().includes("selesai")) && (
            <>
              <form className="form-card space-y-3" onSubmit={submitDispute}>
                <h2 className="text-lg font-bold">Ada masalah dengan barang?</h2>
                <label className="form-field">
                  <span>Jelaskan komplain (maksimal 48 jam setelah diterima)</span>
                  <InputTextarea
                    className="form-input min-h-28"
                    required
                    value={disputeReason}
                    onChange={(event) => setDisputeReason(event.target.value)}
                  />
                </label>
                <Button className="secondary-action" type="submit" disabled={busy}>
                  Kirim komplain
                </Button>
              </form>
              {!reviewSubmitted ? (
                <form className="form-card space-y-3" onSubmit={submitReview}>
                  <h2 className="text-lg font-bold">Bagikan pengalamanmu</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="form-field">
                      <span>Penilaian barang</span>
                      <Dropdown
                        className="form-input"
                        value={itemRating}
                        options={REVIEW_RATING_OPTIONS}
                        onChange={(event) =>
                          setItemRating(Number(event.value))
                        }
                      />
                    </label>
                    <label className="form-field">
                      <span>Penilaian layanan</span>
                      <Dropdown
                        className="form-input"
                        value={serviceRating}
                        options={REVIEW_RATING_OPTIONS}
                        onChange={(event) =>
                          setServiceRating(Number(event.value))
                        }
                      />
                    </label>
                  </div>
                  <label className="form-field">
                    <span>Ulasan</span>
                    <InputTextarea
                      className="form-input min-h-28"
                      required
                      value={reviewText}
                      onChange={(event) => setReviewText(event.target.value)}
                    />
                  </label>
                  <Button
                    className="primary-action"
                    type="submit"
                    disabled={busy}
                  >
                    Kirim ulasan
                  </Button>
                </form>
              ) : (
                <p className="form-alert success" role="status">
                  Ulasan pesanan ini sudah dikirim.
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
};
