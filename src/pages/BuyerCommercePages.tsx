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
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { useBuyer } from "../context/BuyerContext";
import {
  ApiClientError,
  createIdempotencyKey,
  publicApi,
} from "../services/publicApi";
import {
  BuyerOrder,
  BuyerOrderPickup,
  BuyerProfileCompleteness,
  CheckoutOrder,
  CheckoutValidation,
  ImpactReceipt,
  PaymentInstruction,
  PublicVoucher,
} from "../types";
import {
  formatDateId,
  formatRupiah,
  getAddressWarningMessages,
  getOrderStatusMeta,
} from "../utils/format";
import { payWithMidtrans, pollOrderUntilPaid } from "../utils/midtrans";

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

const REVIEWED_ORDERS_KEY = "barokahiin:reviewed-orders:v1";

type SavedReviewEntry = { rating?: number; komentar?: string };

function readReviewedOrders(): Record<string, SavedReviewEntry> {
  try {
    const raw = window.localStorage.getItem(REVIEWED_ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SavedReviewEntry>) : {};
  } catch {
    return {};
  }
}

function getLocalOrderReview(
  ...keys: Array<string | undefined | null>
): SavedReviewEntry | null {
  const map = readReviewedOrders();
  for (const key of keys) {
    if (key && map[key]) return map[key];
  }
  return null;
}

function saveLocalOrderReview(
  keys: Array<string | undefined | null>,
  entry: SavedReviewEntry
): void {
  try {
    const map = readReviewedOrders();
    for (const key of keys) {
      if (key) map[key] = entry;
    }
    window.localStorage.setItem(REVIEWED_ORDERS_KEY, JSON.stringify(map));
  } catch {
    // Abaikan error penyimpanan lokal
  }
}

function extractOrderReview(
  order: BuyerOrder | CheckoutOrder | null | undefined,
  code?: string
): SavedReviewEntry | null {
  if (order && "review" in order && order.review) {
    return {
      rating: order.review.rating,
      komentar: order.review.komentar || order.review.teks || undefined,
    };
  }
  if (order && "reviews" in order && order.reviews?.length) {
    const first = order.reviews[0];
    return {
      rating: first.rating,
      komentar: first.komentar || first.teks || undefined,
    };
  }
  if (order && "has_review" in order && order.has_review) {
    return {};
  }
  return getLocalOrderReview(order?.uuid, code);
}

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
    document.title = "Keranjang — Barokahinn";
  }, []);

  if (!cart.length) {
    return (
      <section className="mx-auto max-w-xl rounded-kartu-besar border border-garis bg-putih p-8 text-center">
        <h1 className="text-2xl font-bold text-tinta">Keranjangmu kosong</h1>
        <p className="mt-2 text-sm text-muted">
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
        <p className="text-sm font-semibold text-nila">
          {cart.length} barang unik
        </p>
        <h1 className="mt-1 text-2xl font-bold text-tinta">Keranjang</h1>
      </header>

      <p className="rounded-kartu border border-kunyit bg-kunyit-muda p-4 text-sm text-kunyit-tua">
        Barang belum ditahan. Stok diperiksa lagi saat checkout dan hold
        dimulai setelah konfirmasi pesanan.
      </p>

      <div className="space-y-4">
        {groups.map(([store, items]) => (
          <section className="form-card" key={store}>
            <h2 className="text-sm font-bold text-tinta">{store}</h2>
            <ul className="mt-3 divide-y divide-garis">
              {items.map((item) => (
                <li className="flex items-center justify-between gap-4 py-4" key={item.uuid}>
                  <div className="min-w-0">
                    <Link className="font-semibold text-tinta hover:underline" to={`/barang/${item.slug}`}>
                      {item.judul}
                    </Link>
                    <p className="mt-1 text-sm text-muted">
                      {formatRupiah(item.harga_rupiah)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    label="Hapus"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    size="small"
                    onClick={() => removeFromCart(item.uuid)}
                  />
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
        <p className="mt-2 text-xs text-muted">
          Ongkir dan biaya kemas dihitung setelah kamu memilih cara serah.
          Pesanan dari toko berbeda dapat memiliki ongkir terpisah.
        </p>
        <button
          className="btn-cta mt-5 w-full text-sm"
          type="button"
          onClick={() =>
            navigate(token ? "/checkout" : "/masuk?next=%2Fcheckout")
          }
        >
          <i className="pi pi-shopping-bag text-sm" aria-hidden="true" />
          <span>{token ? "Lanjut ke checkout" : "Masuk untuk checkout"}</span>
        </button>
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
  const hasPickupOnlyItem = cart.some((item) => item.pickup_only);
  const [handover, setHandover] = useState<"ambil" | "kirim">(
    hasPickupOnlyItem ? "ambil" : "kirim"
  );
  const [addresses, setAddresses] = useState<
    Awaited<ReturnType<typeof publicApi.getBuyerAddresses>>
  >([]);
  const [publicVouchers, setPublicVouchers] = useState<PublicVoucher[]>([]);
  const [addressUuid, setAddressUuid] = useState("");
  const [addressWarningsConfirmed, setAddressWarningsConfirmed] =
    useState(false);
  const [completeness, setCompleteness] =
    useState<BuyerProfileCompleteness | null>(null);
  const [quote, setQuote] = useState<CheckoutValidation | null>(null);
  const [baseQuote, setBaseQuote] = useState<CheckoutValidation | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);
  const [voucherDialogOpen, setVoucherDialogOpen] = useState(false);
  const [rounding, setRounding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmKey = useRef<string | null>(null);

  useEffect(() => {
    document.title = "Periksa pesanan — Barokahinn";
    publicApi
      .getPublicVouchers()
      .then((list) => setPublicVouchers(list))
      .catch(() => {
        // Voucher publik opsional
      });
  }, []);

  useEffect(() => {
    if (hasPickupOnlyItem && handover !== "ambil") {
      setHandover("ambil");
    }
  }, [hasPickupOnlyItem, handover]);

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
              : savedAddresses.find((address) => address.utama || address.is_default)
                ?.uuid ||
              savedAddresses[0]?.uuid ||
              ""
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
        ...(appliedVoucher ? { voucher_code: appliedVoucher } : {}),
        rounding_donation_idr: 0,
      });
      if (result.voucher_error) {
        setAppliedVoucher(null);
        setVoucherMessage(null);
        setError(result.voucher_error);
      }
      if (result.cart_issues && result.cart_issues.length > 0) {
        const issueText = result.cart_issues
          .map((issue) =>
            typeof issue === "string"
              ? issue
              : issue.message || issue.reason || "Barang tidak tersedia."
          )
          .join(" ");
        setError(issueText);
        return;
      }
      if (result.ready === false && result.missing?.length) {
        setCompleteness({ ready: false, missing: result.missing });
        return;
      }
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
        ...(appliedVoucher ? { voucher_code: appliedVoucher } : {}),
        rounding_donation_idr: amount,
      });
      setQuote(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Total gagal diperbarui.");
    } finally {
      setBusy(false);
    }
  };

  const applyVoucher = async (overrideCode?: string) => {
    const trimmed = (overrideCode ?? voucherCode).trim().toUpperCase();
    if (overrideCode !== undefined) {
      setVoucherCode(trimmed);
    }
    if (!trimmed) {
      setAppliedVoucher(null);
      setVoucherMessage(null);
      return;
    }
    setBusy(true);
    setError(null);
    setVoucherMessage(null);
    try {
      const preview = await publicApi.previewBuyerVoucher(token, {
        voucher_code: trimmed,
        item_uuids: cart.map((item) => item.uuid),
        serah: handover,
        ...(handover === "kirim" ? { address_uuid: addressUuid } : {}),
      });
      const disc = preview.voucher_discount_idr ?? preview.discount_idr ?? 0;
      setAppliedVoucher(preview.voucher_code || trimmed);
      setVoucherMessage(
        preview.message ||
        `Voucher ${preview.voucher_code || trimmed} diterapkan (-${formatRupiah(disc)}).`
      );
      if (quote) {
        const refreshed = await publicApi.validateBuyerCheckout(token, {
          item_uuids: cart.map((item) => item.uuid),
          serah: handover,
          ...(handover === "kirim" ? { address_uuid: addressUuid } : {}),
          voucher_code: preview.voucher_code || trimmed,
          rounding_donation_idr: rounding ? roundingAmount : 0,
        });
        setQuote(refreshed);
        setBaseQuote(refreshed);
      }
    } catch (cause) {
      setAppliedVoucher(null);
      setError(
        cause instanceof Error ? cause.message : "Voucher tidak dapat digunakan."
      );
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
          ...(appliedVoucher ? { voucher_code: appliedVoucher } : {}),
          rounding_donation_idr: rounding ? roundingAmount : 0,
          data_confirmed: true,
        },
        confirmKey.current
      );
      const code = order.kode || order.kode_pesanan || order.uuid;
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
        <p className="text-sm font-semibold text-nila">Checkout</p>
        <h1 className="mt-1 text-2xl font-bold text-tinta">
          Periksa pesananmu
        </h1>
      </header>

      {error && <p className="form-alert error" role="alert">{error}</p>}
      <section className="form-card space-y-3">
        <label className="form-field">
          <span>Cara menerima barang</span>
          <Dropdown
            className="form-input"
            value={handover}
            options={[
              {
                label: hasPickupOnlyItem
                  ? "Kirim ke alamat (tidak tersedia untuk barang khusus ambil)"
                  : "Kirim ke alamat",
                value: "kirim",
                disabled: hasPickupOnlyItem,
              },
              { label: "Ambil di toko koordinator", value: "ambil" },
            ]}
            onChange={(event) => {
              if (hasPickupOnlyItem && event.value === "kirim") return;
              setHandover(event.value as "ambil" | "kirim");
            }}
          />
        </label>
        {hasPickupOnlyItem && (
          <p className="rounded-kartu border border-kunyit bg-kunyit-muda px-3 py-2 text-xs font-medium text-kunyit-tua">
            Salah satu barang di keranjang hanya tersedia untuk diambil langsung
            di titik ambil koordinator (`serah = ambil`).
          </p>
        )}
      </section>

      {loading ? (
        <p className="form-card" role="status">Memeriksa profil dan alamat…</p>
      ) : missingProfile ? (
        <section className="form-card">
          <h2 className="text-lg font-bold text-tinta">
            Lengkapi data sebelum checkout
          </h2>
          <p className="mt-1 text-sm text-muted">
            Barang belum ditahan selama kamu melengkapi data.
          </p>
          <ul className="mt-3 list-inside list-disc text-sm text-tinta">
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
            {handover === "kirim" ? (
              <div className="form-field">
                <label htmlFor="checkout-address">Alamat pengiriman</label>
                <Dropdown
                  inputId="checkout-address"
                  className="form-input"
                  value={addressUuid}
                  options={addresses.map((address) => ({
                    label: `${address.penerima} — ${address.jalan_nomor_enc}, ${address.region_nama ||
                      address.village_code ||
                      address.region_id ||
                      "Wilayah tersimpan"
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
                <Link className="mt-1 inline-block text-sm text-nila underline" to="/akun">
                  Kelola alamat
                </Link>
                {selectedAddressWarnings.length > 0 && (
                  <div className="mt-3 space-y-3 rounded-kartu border border-kunyit bg-kunyit-muda p-4 text-sm text-kunyit-tua">
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
              <p className="rounded-lg bg-kertas p-3 text-sm text-muted">
                Area dan alamat lengkap titik ambil ditampilkan sesuai aturan
                pesanan setelah pembayaran.
              </p>
            )}
            <Button
              type="button"
              label={busy ? "Memeriksa…" : "Periksa ongkir dan ketersediaan"}
              icon="pi pi-truck"
              outlined
              size="small"
              disabled={busy}
              onClick={() => void validateCheckout()}
            />
          </section>

          <section className="form-card">
            <h2 className="text-lg font-bold text-tinta">Ringkasan barang</h2>
            <ul className="mt-3 divide-y divide-garis">
              {cart.map((item) => (
                <li className="flex justify-between gap-3 py-3 text-sm" key={item.uuid}>
                  <span>{item.judul}</span>
                  <strong>{formatRupiah(item.harga_rupiah)}</strong>
                </li>
              ))}
            </ul>
            {/* Voucher (Opsional) */}
            <div className="mt-4 space-y-2 border-t border-garis pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-tinta">
                  Kode voucher (opsional)
                </span>
                {publicVouchers.length > 0 && (
                  <Button
                    type="button"
                    label={`Pilih Voucher (${publicVouchers.length})`}
                    icon="pi pi-ticket"
                    outlined
                    size="small"
                    onClick={() => setVoucherDialogOpen(true)}
                  />
                )}
              </div>
              <div className="flex gap-2">
                <InputText
                  className="form-input flex-1"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: BAROKAH25"
                />
                <Button
                  type="button"
                  label="Pakai"
                  outlined
                  size="small"
                  disabled={busy}
                  onClick={() => void applyVoucher()}
                />
              </div>
              {voucherMessage && (
                <p className="text-xs font-medium text-teh-tua">
                  {voucherMessage}
                </p>
              )}
              <Dialog
                header="Pilih Voucher Aktif"
                visible={voucherDialogOpen}
                onHide={() => setVoucherDialogOpen(false)}
                className="w-[92vw] max-w-lg"
              >
                <div className="space-y-3">
                  {publicVouchers.map((voucher) => {
                    const cartSubtotal = cart.reduce(
                      (sum, item) => sum + item.harga_rupiah,
                      0
                    );
                    const minSpend = voucher.min_subtotal_idr || 0;
                    const eligible = cartSubtotal >= minSpend;
                    const vType = voucher.tipe || voucher.discount_type || "fixed";
                    const vValue = voucher.nilai ?? voucher.discount_value ?? 0;
                    const benefitLabel =
                      vType === "percent"
                        ? `Diskon ${vValue}%${voucher.max_discount_idr
                          ? ` (maks. ${formatRupiah(voucher.max_discount_idr)})`
                          : ""
                        }`
                        : vType === "free_shipping"
                          ? `Potongan ongkir${voucher.max_discount_idr
                            ? ` s/d ${formatRupiah(voucher.max_discount_idr)}`
                            : ""
                          }`
                          : `Potongan ${formatRupiah(vValue)}`;
                    const quotaRemaining =
                      typeof voucher.quota_total === "number" &&
                        typeof voucher.quota_used === "number"
                        ? Math.max(0, voucher.quota_total - voucher.quota_used)
                        : null;

                    return (
                      <div
                        key={voucher.uuid || voucher.code}
                        className={`rounded-kartu border p-3.5 ${eligible
                          ? "border-teh bg-teh-muda/35"
                          : "border-garis bg-kertas opacity-85"
                          }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-pil bg-nila-muda px-2.5 py-0.5 font-mono text-xs font-bold text-nila">
                                {voucher.code}
                              </span>
                              <span className="rounded-pil bg-teh-muda px-2 py-0.5 text-[11px] font-semibold text-teh-tua">
                                {benefitLabel}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-tinta">
                              {voucher.nama || voucher.judul || voucher.code}
                            </p>
                            {voucher.deskripsi && (
                              <p className="text-xs text-muted">
                                {voucher.deskripsi}
                              </p>
                            )}
                            <p className="text-[11px] text-muted">
                              {minSpend > 0
                                ? `Min. belanja ${formatRupiah(minSpend)}`
                                : "Tanpa minimum belanja"}
                              {quotaRemaining !== null
                                ? ` · Sisa kuota ${quotaRemaining}`
                                : ""}
                              {(voucher.ends_at || voucher.valid_until) &&
                                ` · Berlaku s/d ${formatDateId(
                                  voucher.ends_at || voucher.valid_until
                                )}`}
                            </p>
                          </div>
                          <Button
                            type="button"
                            label={eligible ? "Pakai" : "Belum memenuhi"}
                            size="small"
                            disabled={!eligible || busy}
                            onClick={() => {
                              setVoucherDialogOpen(false);
                              void applyVoucher(voucher.code);
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Dialog>
            </div>

            {quote && (
              <div className="mt-3 space-y-2 border-t border-garis pt-4 text-sm">
                <p className="flex justify-between"><span>Subtotal</span><strong>{formatRupiah(quote.quote.subtotal_idr)}</strong></p>
                <p className="flex justify-between"><span>Ongkir</span><strong>{formatRupiah(quote.quote.ongkir_idr)}</strong></p>
                <p className="flex justify-between"><span>Biaya kemas</span><strong>{formatRupiah(quote.quote.packing_fee_idr)}</strong></p>
                {typeof quote.quote.voucher_discount_idr === "number" &&
                  quote.quote.voucher_discount_idr > 0 && (
                    <p className="flex justify-between text-teh-tua">
                      <span>
                        Diskon voucher{" "}
                        {quote.quote.voucher_code
                          ? `(${quote.quote.voucher_code})`
                          : ""}
                      </span>
                      <strong>
                        -{formatRupiah(quote.quote.voucher_discount_idr)}
                      </strong>
                    </p>
                  )}
                <div className="flex items-start gap-2 rounded-lg bg-teh-muda p-3">
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
                <p className="flex justify-between border-t border-garis pt-3 text-base">
                  <span>Total</span>
                  <strong>{formatRupiah(quote.quote.total_idr)}</strong>
                </p>
              </div>
            )}
            {quote && (
              <div className="mt-4 flex items-start gap-2 text-sm text-tinta">
                <Checkbox
                  inputId="confirm-order-details"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(!!event.checked)}
                />
                <label htmlFor="confirm-order-details">Data sudah benar. Saya setuju pesanan dikonfirmasi dan barang ditahan selama 30 menit.</label>
              </div>
            )}
            <button
              className="btn-cta mt-5 w-full text-sm"
              type="button"
              disabled={!quote || !confirmed || busy}
              onClick={() => void confirmOrder()}
            >
              <i
                className={`pi ${busy ? "pi-spin pi-spinner" : "pi-check-circle"} text-sm`}
                aria-hidden="true"
              />
              <span>{busy ? "Mengonfirmasi…" : "Konfirmasi pesanan"}</span>
            </button>
          </section>
        </>
      )}
    </div>
  );
};

export const OrdersPage: React.FC = () => {
  const { token } = useBuyer();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Pesanan saya — Barokahinn";
    if (!token) return;
    let active = true;
    setLoading(true);
    setError(null);
    publicApi
      .getBuyerOrders(token, {
        ...(statusFilter ? { status: statusFilter } : {}),
        per_page: 20,
        page,
      })
      .then((res) => {
        if (!active) return;
        setOrders(res.orders);
        setLastPage(res.pagination.last_page || 1);
      })
      .catch((cause) => {
        if (!active) return;
        if (
          cause instanceof ApiClientError &&
          (cause.status === 401 || cause.code === "OTP_INVALID")
        ) {
          navigate(`/masuk?next=${encodeURIComponent("/pesanan")}`, {
            replace: true,
          });
          return;
        }
        setError(
          cause instanceof Error
            ? cause.message
            : "Status pesanan belum bisa dimuat."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, statusFilter, page, navigate]);

  if (!token) return <Navigate to="/masuk?next=%2Fpesanan" replace />;
  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-tinta">Pesanan saya</h1>
            <p className="mt-1 text-sm text-muted">
              Riwayat pesanan akunmu, tersinkron lintas perangkat.
            </p>
          </div>
          <Link className="secondary-action text-xs" to="/katalog">
            <i className="pi pi-shopping-bag text-xs" aria-hidden="true" />
            <span>Belanja lagi</span>
          </Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Semua", value: "" },
            { label: "Menunggu bayar", value: "menunggu_bayar" },
            { label: "Dibayar", value: "dibayar" },
            { label: "Disiapkan", value: "disiapkan" },
            { label: "Dikirim", value: "dikirim" },
            { label: "Siap diambil", value: "siap_diambil" },
            { label: "Diterima", value: "diterima" },
            { label: "Selesai", value: "selesai" },
            { label: "Dibatalkan", value: "dibatalkan" },
            { label: "Kedaluwarsa", value: "kedaluwarsa" },
          ].map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value || "all"}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`rounded-pil border px-3 py-1 text-xs font-semibold transition-colors ${active
                  ? "border-nila bg-nila text-putih"
                  : "border-garis bg-putih text-tinta hover:border-nila hover:text-nila"
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>
      {loading && <p role="status">Memuat pesanan…</p>}
      {error && <p className="form-alert error" role="alert">{error}</p>}
      {!loading && !orders.length && !error && (
        <div className="form-card space-y-3 text-center py-8">
          <p className="text-sm text-muted">
            {statusFilter
              ? "Belum ada pesanan dengan status ini."
              : "Belum ada pesanan pada akun ini."}
          </p>
          <Link className="btn-cta text-xs" to="/katalog">
            Jelajahi katalog barang
          </Link>
        </div>
      )}
      <ul className="space-y-4">
        {orders.map((order) => {
          const isPendingPay = order.status === "menunggu_bayar";
          const statusMeta = getOrderStatusMeta(order.status);
          const orderItems = order.items || [];
          return (
            <li
              className="form-card space-y-3"
              key={order.uuid}
            >
              {/* Header Kartu Pesanan */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-garis pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {order.store?.nama && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-tinta">
                      <i className="pi pi-shop text-xs text-nila" aria-hidden="true" />
                      <span>{order.store.nama}</span>
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted">
                    {order.kode}
                  </span>
                  {order.created_at && (
                    <span className="text-xs text-muted">
                      · {formatDateId(order.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {order.serah && (
                    <span className="rounded-pil bg-kertas px-2.5 py-0.5 text-[11px] font-medium text-muted">
                      {order.serah === "ambil" ? "Ambil di toko" : "Kirim ke alamat"}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-pil border px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClass}`}
                  >
                    <i
                      className={`${statusMeta.icon} text-[10px]`}
                      aria-hidden="true"
                    />
                    <span>{statusMeta.label}</span>
                  </span>
                  {order.review && (
                    <span className="inline-flex items-center gap-1 rounded-pil bg-teh-muda px-2 py-0.5 text-[10px] font-semibold text-teh-tua">
                      <i className="pi pi-star-fill text-[9px]" aria-hidden="true" />
                      <span>Sudah diulas</span>
                    </span>
                  )}
                  {order.pickup_code && (
                    <span className="inline-flex items-center gap-1 rounded-pil border border-telang bg-telang-muda px-2.5 py-0.5 font-mono text-[11px] font-bold text-telang-tua">
                      <i className="pi pi-key text-[9px]" aria-hidden="true" />
                      <span>Kode Ambil: {order.pickup_code}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Daftar Produk Lengkap */}
              {orderItems.length > 0 ? (
                <ul className="divide-y divide-garis/60">
                  {orderItems.map((item, idx) => (
                    <li
                      key={`${order.uuid}-item-${idx}`}
                      className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {item.cover_url ? (
                          <img
                            src={item.cover_url}
                            alt={item.judul}
                            className="h-12 w-12 shrink-0 rounded-kontrol border border-garis object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-kontrol border border-garis bg-kertas text-muted">
                            <i className="pi pi-box text-sm" aria-hidden="true" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-tinta">
                            {item.judul}
                          </p>
                          {item.jalur_snapshot && (
                            <span
                              className={`mt-0.5 inline-block rounded-pil px-2 py-0.5 text-[10px] font-semibold ${item.jalur_snapshot === "charity"
                                ? "bg-teh-muda text-teh-tua"
                                : "bg-nila-muda text-nila"
                                }`}
                            >
                              {item.jalur_snapshot === "charity"
                                ? "Program Charity"
                                : "Reguler"}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 tabular-nums text-xs font-semibold text-tinta">
                        {formatRupiah(item.price_idr)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted">Detail barang tersedia di halaman pesanan.</p>
              )}

              {/* Info Pengiriman / Hold Ringkas */}
              {(order.fulfillment?.kurir ||
                order.fulfillment?.resi ||
                (isPendingPay && order.hold_expires_at)) && (
                  <div className="flex flex-wrap items-center gap-3 rounded-kontrol bg-kertas px-3 py-2 text-xs text-muted">
                    {order.fulfillment?.kurir && (
                      <span>
                        Kurir: <strong className="text-tinta">{order.fulfillment.kurir}</strong>
                      </span>
                    )}
                    {order.fulfillment?.resi && (
                      <span>
                        Resi: <strong className="font-mono text-tinta">{order.fulfillment.resi}</strong>
                      </span>
                    )}
                    {isPendingPay && order.hold_expires_at && (
                      <span>
                        Batas bayar:{" "}
                        <strong className="text-kunyit-tua">
                          {new Date(order.hold_expires_at).toLocaleString("id-ID")}
                        </strong>
                      </span>
                    )}
                  </div>
                )}

              {/* Footer Kartu: Rincian Harga & Aksi */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-garis pt-3">
                <div className="space-y-0.5 text-xs">
                  {(typeof order.subtotal_idr === "number" ||
                    typeof order.ongkir_idr === "number") && (
                      <p className="text-muted">
                        {typeof order.subtotal_idr === "number" &&
                          `Subtotal ${formatRupiah(order.subtotal_idr)}`}
                        {typeof order.ongkir_idr === "number" &&
                          order.ongkir_idr > 0 &&
                          ` · Ongkir ${formatRupiah(order.ongkir_idr)}`}
                      </p>
                    )}
                  {typeof order.total_idr === "number" && (
                    <p className="tabular-nums text-sm font-bold text-nila">
                      Total: {formatRupiah(order.total_idr)}
                    </p>
                  )}
                </div>
                <Link
                  className={isPendingPay ? "btn-cta text-xs" : "secondary-action text-xs"}
                  to={`/pesanan/${encodeURIComponent(order.kode)}`}
                  state={{ order }}
                >
                  {isPendingPay ? "Bayar sekarang →" : "Lihat detail pesanan"}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
      {lastPage > 1 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            label="Sebelumnya"
            icon="pi pi-chevron-left"
            outlined
            size="small"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          />
          <span className="text-xs font-medium text-muted">
            Halaman {page} dari {lastPage}
          </span>
          <Button
            type="button"
            label="Berikutnya"
            icon="pi pi-chevron-right"
            iconPos="right"
            outlined
            size="small"
            disabled={page >= lastPage || loading}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          />
        </div>
      )}
    </section>
  );
};

export const OrderPage: React.FC = () => {
  const { code = "" } = useParams<{ code: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useBuyer();
  const initialOrder =
    (location.state as { order?: BuyerOrder | CheckoutOrder } | null)?.order ||
    null;
  const [order, setOrder] = useState<BuyerOrder | CheckoutOrder | null>(
    initialOrder
  );
  const [receipt, setReceipt] = useState<ImpactReceipt | null>(null);
  const [pickupInfo, setPickupInfo] = useState<BuyerOrderPickup | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentInstruction["metode"]>("snap");
  const [vaBank, setVaBank] = useState<string>("bca");
  const [payment, setPayment] = useState<PaymentInstruction | null>(null);
  const [pollingPayment, setPollingPayment] = useState(false);
  const [syncingPayment, setSyncingPayment] = useState(false);
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
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(() =>
    Boolean(extractOrderReview(initialOrder, code))
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const loadOrder = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await publicApi.getBuyerOrder(token, code);
      setOrder(data);
      const existingReview = extractOrderReview(data, code);
      if (existingReview) {
        setReviewSubmitted(true);
        saveLocalOrderReview([data.uuid, data.kode, code], existingReview);
      }
      if (data.payments?.[0] && !payment) {
        setPayment(data.payments[0]);
      }
      if (shouldLoadImpactReceipt(data.status)) {
        const orderReceipt = await publicApi.getBuyerImpactReceipt(
          token,
          code
        );
        setReceipt(orderReceipt);
      }
      if (
        data.serah === "ambil" &&
        ["dibayar", "disiapkan", "siap_diambil", "siap_ambil"].includes(
          data.status.toLowerCase()
        )
      ) {
        publicApi
          .getBuyerOrderPickup(token, code)
          .then((info) => setPickupInfo(info))
          .catch(() => {
            // Alamat titik ambil belum tersedia
          });
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
    document.title = `Pesanan ${code} — Barokahinn`;
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
    [
      "menunggu_bayar",
      "menunggu_pembayaran",
      "menunggu pembayaran",
      "pending_payment",
    ].includes(order.status.toLowerCase());
  const hasHold = !!order && "hold_expires_at" in order && !!order.hold_expires_at;
  const holdExpiresAt =
    order && "hold_expires_at" in order ? order.hold_expires_at : undefined;

  const existingPayment =
    payment ||
    (order && "payments" in order ? order.payments?.[0] || null : null);
  const holdExpired = secondsRemaining !== null && secondsRemaining <= 0;

  const startPollingOrder = async () => {
    if (!token) return;
    setPollingPayment(true);
    setNotice("Memverifikasi status pembayaran dengan server…");
    const result = await pollOrderUntilPaid(token, code, 15);
    setPollingPayment(false);
    if (result.order) {
      setOrder(result.order);
    }
    if (result.status === "dibayar") {
      setNotice("Pembayaran berhasil dikonfirmasi! Kuitansi Kebaikan tersedia.");
      await loadOrder();
    } else if (result.status === "kedaluwarsa") {
      setError("Batas waktu bayar habis. Barang kembali tersedia di katalog.");
    } else {
      setNotice(
        "Pembayaran masih menunggu konfirmasi webhook. Tekan 'Cek Status Pembayaran' beberapa saat lagi."
      );
    }
  };

  const syncPaymentStatus = async () => {
    if (!token || !order) return;
    setSyncingPayment(true);
    setError(null);
    setNotice(null);
    try {
      const synced = await publicApi.syncBuyerOrderPayment(token, order.uuid);
      if (synced?.status) {
        setOrder(synced);
      }
      await loadOrder();
      if (synced?.status === "dibayar") {
        setNotice(
          "Pembayaran berhasil dikonfirmasi! Kuitansi Kebaikan tersedia."
        );
      } else {
        setNotice("Status pembayaran sudah disinkronkan dengan server.");
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Gagal memeriksa status pembayaran."
      );
    } finally {
      setSyncingPayment(false);
    }
  };

  const openSnapCheckout = async (instruction: PaymentInstruction) => {
    await payWithMidtrans(instruction, {
      onSettled: () => void startPollingOrder(),
      onPending: () => void startPollingOrder(),
      onClosed: () =>
        setNotice(
          "Popup pembayaran ditutup. Pesanan masih ditahan — klik 'Lanjutkan pembayaran' sebelum batas waktu habis."
        ),
      onError: () =>
        setError("Terjadi kendala saat membuka Midtrans Snap. Coba lagi."),
    });
  };

  const createPayment = async () => {
    if (!order || !("uuid" in order) || holdExpired) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      paymentKey.current ||= createIdempotencyKey();
      const instruction = await publicApi.createBuyerPayment(
        token,
        order.uuid,
        paymentMethod,
        paymentMethod === "va" ? vaBank : undefined,
        paymentKey.current
      );
      setPayment(instruction);
      await openSnapCheckout(instruction);
    } catch (cause) {
      if (
        cause instanceof ApiClientError &&
        (cause.status === 409 || cause.code === "INVALID_ORDER_STATUS")
      ) {
        await loadOrder();
        setError(cause.message);
      } else if (
        cause instanceof ApiClientError &&
        (cause.status === 502 || cause.code === "PAYMENT_GATEWAY_ERROR")
      ) {
        paymentKey.current = null;
        setError(
          "Layanan pembayaran sedang sibuk, silakan coba beberapa saat lagi."
        );
      } else {
        setError(
          cause instanceof Error
            ? cause.message
            : "Instruksi pembayaran gagal dibuat."
        );
      }
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
      const payload = {
        rating: itemRating,
        komentar: reviewText.trim() || undefined,
      };
      await publicApi.createBuyerReview(token, order.uuid, payload);
      saveLocalOrderReview([order.uuid, code], payload);
      setReviewSubmitted(true);
      setNotice("Terima kasih, ulasanmu berhasil dikirim.");
    } catch (cause) {
      if (
        cause instanceof ApiClientError &&
        (cause.status === 409 ||
          cause.message.toLowerCase().includes("sudah"))
      ) {
        saveLocalOrderReview([order.uuid, code], {});
        setReviewSubmitted(true);
        setNotice("Ulasan pesanan ini sudah tercatat.");
      } else {
        setError(
          cause instanceof Error ? cause.message : "Ulasan gagal dikirim."
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="text-sm font-semibold text-nila">Pesanan</p>
        <h1 className="mt-1 text-2xl font-bold text-tinta">{code}</h1>
      </header>
      {error && <p className="form-alert error" role="alert">{error}</p>}
      {notice && <p className="form-alert success" role="status">{notice}</p>}
      {loading && <p role="status">Memuat status pesanan…</p>}
      {order && (
        <>
          {(() => {
            const statusMeta = getOrderStatusMeta(order.status);
            return (
              <div className="form-card">
                <p className="text-sm text-muted">Status pesanan</p>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-2 rounded-pil border px-3 py-1 text-sm font-bold ${statusMeta.badgeClass}`}
                  >
                    <i
                      className={`${statusMeta.icon} text-xs`}
                      aria-hidden="true"
                    />
                    <span>{statusMeta.label}</span>
                  </span>
                </div>
                {hasHold && (
                  <p className="mt-3 text-sm text-muted">
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
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {isPendingPayment ? (
                    <Button
                      type="button"
                      label={
                        syncingPayment
                          ? "Memeriksa…"
                          : "Cek Status Pembayaran"
                      }
                      icon={
                        syncingPayment
                          ? "pi pi-spin pi-spinner"
                          : "pi pi-refresh"
                      }
                      outlined
                      size="small"
                      disabled={syncingPayment || busy || pollingPayment}
                      onClick={() => void syncPaymentStatus()}
                    />
                  ) : (
                    <Button
                      type="button"
                      label="Muat ulang status"
                      icon="pi pi-refresh"
                      outlined
                      size="small"
                      disabled={loading || busy}
                      onClick={() => void loadOrder()}
                    />
                  )}
                </div>
              </div>
            );
          })()}

          {/* Ringkasan Produk & Biaya Pesanan */}
          <div className="form-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-garis pb-3">
              <div>
                <h2 className="text-base font-bold text-tinta">
                  Ringkasan produk &amp; pengiriman
                </h2>
                {"store" in order && order.store?.nama && (
                  <p className="mt-0.5 text-xs text-muted">
                    Toko:{" "}
                    {order.store.slug ? (
                      <Link
                        to={`/toko/${encodeURIComponent(order.store.slug)}`}
                        className="font-semibold text-nila hover:underline"
                      >
                        {order.store.nama}
                      </Link>
                    ) : (
                      <strong className="text-tinta">{order.store.nama}</strong>
                    )}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {order.serah && (
                  <span className="rounded-pil bg-kertas px-2.5 py-0.5 font-medium text-tinta">
                    {order.serah === "ambil"
                      ? "Ambil di titik ambil"
                      : "Kirim ke alamat"}
                  </span>
                )}
                {"zona" in order && order.zona && (
                  <span className="rounded-pil bg-nila-muda px-2.5 py-0.5 font-medium text-nila">
                    Zona: {order.zona.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>

            {order.items && order.items.length > 0 && (
              <ul className="divide-y divide-garis/70">
                {order.items.map((item, idx) => (
                  <li
                    key={`${order.uuid}-detail-item-${idx}`}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {"cover_url" in item && item.cover_url ? (
                        <img
                          src={item.cover_url}
                          alt={item.judul}
                          className="h-12 w-12 shrink-0 rounded-kontrol border border-garis object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-kontrol border border-garis bg-kertas text-muted">
                          <i className="pi pi-box text-sm" aria-hidden="true" />
                        </div>
                      )}
                      <div className="min-w-0">
                        {"slug" in item && item.slug ? (
                          <Link
                            to={`/barang/${encodeURIComponent(item.slug)}`}
                            className="block truncate text-sm font-semibold text-tinta hover:text-nila hover:underline"
                          >
                            {item.judul}
                          </Link>
                        ) : (
                          <p className="truncate text-sm font-semibold text-tinta">
                            {item.judul}
                          </p>
                        )}
                        {"jalur_snapshot" in item && item.jalur_snapshot && (
                          <span
                            className={`mt-0.5 inline-block rounded-pil px-2 py-0.5 text-[10px] font-semibold ${item.jalur_snapshot === "charity"
                              ? "bg-teh-muda text-teh-tua"
                              : "bg-nila-muda text-nila"
                              }`}
                          >
                            {item.jalur_snapshot === "charity"
                              ? "Program Charity"
                              : "Reguler"}
                          </span>
                        )}
                      </div>
                    </div>
                    <strong className="shrink-0 tabular-nums text-sm text-tinta">
                      {formatRupiah(item.price_idr)}
                    </strong>
                  </li>
                ))}
              </ul>
            )}

            <dl className="space-y-1.5 border-t border-garis pt-3 text-xs">
              {"subtotal_idr" in order && typeof order.subtotal_idr === "number" && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Subtotal barang</dt>
                  <dd className="tabular-nums font-semibold text-tinta">
                    {formatRupiah(order.subtotal_idr)}
                  </dd>
                </div>
              )}
              {"ongkir_idr" in order && typeof order.ongkir_idr === "number" && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Ongkos kirim</dt>
                  <dd className="tabular-nums font-semibold text-tinta">
                    {formatRupiah(order.ongkir_idr)}
                  </dd>
                </div>
              )}
              {"packing_fee_idr" in order &&
                typeof order.packing_fee_idr === "number" &&
                order.packing_fee_idr > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Biaya kemas</dt>
                    <dd className="tabular-nums font-semibold text-tinta">
                      {formatRupiah(order.packing_fee_idr)}
                    </dd>
                  </div>
                )}
              {"voucher_discount_idr" in order &&
                typeof order.voucher_discount_idr === "number" &&
                order.voucher_discount_idr > 0 && (
                  <div className="flex justify-between gap-4 text-teh-tua">
                    <dt>Diskon voucher</dt>
                    <dd className="tabular-nums font-semibold">
                      -{formatRupiah(order.voucher_discount_idr)}
                    </dd>
                  </div>
                )}
              {"rounding_donation_idr" in order &&
                typeof order.rounding_donation_idr === "number" &&
                order.rounding_donation_idr > 0 && (
                  <div className="flex justify-between gap-4 text-teh-tua">
                    <dt>Pembulatan Kebaikan</dt>
                    <dd className="tabular-nums font-semibold">
                      {formatRupiah(order.rounding_donation_idr)}
                    </dd>
                  </div>
                )}
              {typeof order.total_idr === "number" && (
                <div className="flex justify-between gap-4 border-t border-garis pt-2 text-sm font-bold text-nila">
                  <dt>Total pembayaran</dt>
                  <dd className="tabular-nums">{formatRupiah(order.total_idr)}</dd>
                </div>
              )}
            </dl>
          </div>

          {isPendingPayment && (
            <div className="form-card space-y-4">
              <h2 className="font-display text-lg font-bold text-tinta">
                Pilih metode pembayaran
              </h2>

              {holdExpired && (
                <p className="rounded-kartu border border-bahaya bg-bahaya-muda p-3 text-xs font-medium text-bahaya">
                  Batas waktu bayar telah habis. Klik &quot;Cek Status Pembayaran&quot;
                  untuk memeriksa status terbaru pesanan.
                </p>
              )}

              {existingPayment?.snap_token && !holdExpired ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={busy || pollingPayment}
                    onClick={() => void openSnapCheckout(existingPayment)}
                    className="btn-cta w-full text-sm"
                  >
                    <i className="pi pi-credit-card text-sm" aria-hidden="true" />
                    <span>
                      {pollingPayment
                        ? "Memverifikasi pembayaran…"
                        : "Lanjutkan pembayaran"}
                    </span>
                  </button>
                </div>
              ) : (
                <>
                  <label className="form-field">
                    <span>Metode</span>
                    <Dropdown
                      className="form-input"
                      value={paymentMethod}
                      options={[
                        { label: "Midtrans Snap (Semua metode)", value: "snap" },
                        { label: "QRIS", value: "qris" },
                        { label: "Transfer virtual account", value: "va" },
                        { label: "E-wallet", value: "ewallet" },
                      ]}
                      onChange={(event) =>
                        setPaymentMethod(
                          event.value as PaymentInstruction["metode"]
                        )
                      }
                    />
                  </label>

                  {paymentMethod === "va" && (
                    <label className="form-field">
                      <span>Pilih bank virtual account</span>
                      <Dropdown
                        className="form-input"
                        value={vaBank}
                        options={[
                          { label: "BCA Virtual Account", value: "bca" },
                          { label: "BNI Virtual Account", value: "bni" },
                          { label: "BRI Virtual Account", value: "bri" },
                          { label: "Permata Virtual Account", value: "permata" },
                          { label: "Mandiri Bill", value: "mandiri" },
                        ]}
                        onChange={(event) => setVaBank(String(event.value))}
                      />
                    </label>
                  )}

                  <button
                    type="button"
                    disabled={busy || holdExpired || pollingPayment}
                    onClick={() => void createPayment()}
                    className="btn-cta w-full text-sm"
                  >
                    <i
                      className={`pi ${busy || pollingPayment
                        ? "pi-spin pi-spinner"
                        : "pi-credit-card"
                        } text-sm`}
                      aria-hidden="true"
                    />
                    <span>
                      {busy
                        ? "Menyiapkan pembayaran…"
                        : pollingPayment
                          ? "Memverifikasi pembayaran…"
                          : "Bayar dengan Midtrans"}
                    </span>
                  </button>
                </>
              )}

              {existingPayment && (
                <div className="space-y-2 rounded-kartu border border-teh bg-teh-muda p-4 text-sm text-tinta">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-teh-tua">
                      Instruksi pembayaran
                    </p>
                    <span className="rounded-pil bg-putih px-2.5 py-0.5 text-xs font-semibold text-teh-tua">
                      {existingPayment.status}
                    </span>
                  </div>
                  <div className="grid gap-1 text-xs sm:grid-cols-2">
                    <p>
                      <span className="text-muted">Metode:</span>{" "}
                      <strong>{existingPayment.metode.toUpperCase()}</strong>
                      {existingPayment.gateway
                        ? ` (${existingPayment.gateway})`
                        : ""}
                    </p>
                    {existingPayment.gateway_ref && (
                      <p>
                        <span className="text-muted">Referensi:</span>{" "}
                        <strong className="font-mono">
                          {existingPayment.gateway_ref}
                        </strong>
                      </p>
                    )}
                    {typeof existingPayment.jumlah_idr === "number" && (
                      <p>
                        <span className="text-muted">Nominal:</span>{" "}
                        <strong className="tabular-nums text-nila">
                          {formatRupiah(existingPayment.jumlah_idr)}
                        </strong>
                      </p>
                    )}
                    {(existingPayment.kedaluwarsa_pada ||
                      existingPayment.expires_at) && (
                        <p>
                          <span className="text-muted">Batas bayar:</span>{" "}
                          <strong>
                            {new Date(
                              existingPayment.kedaluwarsa_pada ||
                              existingPayment.expires_at ||
                              ""
                            ).toLocaleString("id-ID")}
                          </strong>
                        </p>
                      )}
                  </div>
                  {existingPayment.va_number && (
                    <p className="rounded-kontrol bg-putih px-3 py-2 font-mono text-sm font-bold text-nila">
                      Nomor virtual account: {existingPayment.va_number}
                    </p>
                  )}
                  {existingPayment.qris_url && (
                    <img
                      className="mt-2 max-h-64 rounded-kontrol border border-garis bg-putih p-2"
                      src={existingPayment.qris_url}
                      alt="Kode QRIS pembayaran"
                    />
                  )}
                  {existingPayment.instructions?.map((instruction) => (
                    <p className="mt-1 text-xs" key={instruction}>
                      {instruction}
                    </p>
                  ))}
                  {(existingPayment.redirect_url ||
                    existingPayment.payment_url) && (
                      <a
                        className="secondary-action mt-2"
                        href={
                          existingPayment.redirect_url ||
                          existingPayment.payment_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Buka halaman pembayaran Midtrans
                      </a>
                    )}
                </div>
              )}
              <Button
                type="button"
                label="Batalkan sebelum membayar"
                icon="pi pi-times"
                severity="danger"
                outlined
                size="small"
                disabled={busy}
                onClick={() => void cancelOrder()}
              />
            </div>
          )}

          {"fulfillment" in order &&
            order.fulfillment &&
            (order.fulfillment.kurir ||
              order.fulfillment.resi ||
              order.fulfillment.ambil_deadline) && (
              <div className="form-card space-y-2 border-nila bg-nila-muda">
                <h2 className="font-display text-base font-bold text-nila">
                  Informasi pemenuhan pesanan
                </h2>
                {order.fulfillment.kurir && (
                  <p className="text-sm text-tinta">
                    <span className="text-muted">Kurir:</span>{" "}
                    <strong>{order.fulfillment.kurir}</strong>
                  </p>
                )}
                {order.fulfillment.resi && (
                  <p className="text-sm text-tinta">
                    <span className="text-muted">Nomor resi:</span>{" "}
                    <strong className="font-mono">{order.fulfillment.resi}</strong>
                  </p>
                )}
                {order.fulfillment.ambil_deadline && (
                  <p className="text-sm text-tinta">
                    <span className="text-muted">Batas waktu ambil:</span>{" "}
                    <strong>
                      {new Date(order.fulfillment.ambil_deadline).toLocaleString(
                        "id-ID"
                      )}
                    </strong>
                  </p>
                )}
                {order.fulfillment.catatan && (
                  <p className="text-xs text-muted">{order.fulfillment.catatan}</p>
                )}
              </div>
            )}

          {(() => {
            const pickupCode =
              pickupInfo?.pickup_code ||
              ("pickup_code" in order ? order.pickup_code : null);
            const pickupDeadline =
              pickupInfo?.ambil_deadline ||
              ("fulfillment" in order ? order.fulfillment?.ambil_deadline : null);
            if (!pickupInfo && !pickupCode) return null;
            return (
              <div className="form-card space-y-3 border-teh bg-teh-muda">
                <h2 className="font-display text-base font-bold text-teh-tua">
                  Alamat lengkap &amp; kode titik ambil
                </h2>
                {pickupCode && (
                  <div className="rounded-kartu border border-telang bg-putih p-3">
                    <p className="text-xs font-semibold text-muted">
                      Kode ambil (tunjukkan ke Koordinator saat serah terima)
                    </p>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-2xl font-bold tracking-widest text-telang-tua">
                        {pickupCode}
                      </span>
                      <Button
                        type="button"
                        label="Salin kode"
                        icon="pi pi-copy"
                        outlined
                        size="small"
                        onClick={() => {
                          void navigator.clipboard?.writeText(pickupCode);
                          setNotice("Kode ambil disalin.");
                        }}
                      />
                    </div>
                  </div>
                )}
                {pickupDeadline && (
                  <p className="text-sm text-tinta">
                    <span className="text-muted">Batas waktu ambil:</span>{" "}
                    <strong>
                      {new Date(pickupDeadline).toLocaleString("id-ID")}
                    </strong>
                  </p>
                )}
                {pickupInfo?.alamat_lengkap && (
                  <p className="text-sm font-medium text-tinta">
                    {pickupInfo.alamat_lengkap}
                  </p>
                )}
                {pickupInfo?.patokan && (
                  <p className="text-xs text-muted">
                    Patokan: {pickupInfo.patokan}
                  </p>
                )}
                {pickupInfo?.jam_operasional && (
                  <p className="text-xs text-muted">
                    Jam ambil: {pickupInfo.jam_operasional}
                  </p>
                )}
                {pickupInfo?.kontak && (
                  <p className="text-xs text-muted">
                    Kontak: {pickupInfo.kontak}
                  </p>
                )}
              </div>
            );
          })()}

          {order.status.toLowerCase() === "dibayar" &&
            order.serah === "kirim" && (
              <div className="form-card space-y-3">
                <h2 className="text-lg font-bold">Koreksi alamat pengiriman</h2>
                <p className="text-sm text-muted">
                  Alamat hanya dapat diubah selama pesanan memenuhi syarat dan
                  tetap berada di zona ongkir yang sama.
                </p>
                <label className="form-field">
                  <span>Pilih alamat pengganti</span>
                  <Dropdown
                    className="form-input"
                    value={selectedAddressUuid}
                    options={savedAddresses.map((address) => ({
                      label: `${address.penerima} — ${address.jalan_nomor_enc}, ${address.region_nama || address.region_id
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
                  type="button"
                  label="Perbarui alamat"
                  icon="pi pi-map-marker"
                  outlined
                  size="small"
                  disabled={
                    busy ||
                    !selectedAddressUuid ||
                    selectedAddressUuid === order.address_uuid
                  }
                  onClick={() => void updateOrderAddress()}
                />
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
              <section className="mt-5 border-t border-garis pt-4">
                <h2 className="text-lg font-bold text-tinta">
                  Kuitansi Kebaikan
                </h2>
                {receipt.ringkasan_kebaikan ? (
                  <div className="mt-3 space-y-4">
                    {receipt.ringkasan_kebaikan.catatan_transparansi && (
                      <p className="rounded-kartu bg-teh-muda px-3.5 py-2.5 text-sm font-medium text-teh-tua">
                        {receipt.ringkasan_kebaikan.catatan_transparansi}
                      </p>
                    )}

                    {typeof receipt.ringkasan_kebaikan
                      .total_dana_kebaikan_idr === "number" && (
                        <div className="flex items-center justify-between rounded-kartu border border-teh bg-putih px-3.5 py-2.5 text-sm">
                          <span className="font-medium text-muted">
                            Total dana kebaikan tersalurkan
                          </span>
                          <strong className="tabular-nums text-base font-bold text-teh-tua">
                            {formatRupiah(
                              receipt.ringkasan_kebaikan.total_dana_kebaikan_idr
                            )}
                          </strong>
                        </div>
                      )}

                    {!!receipt.ringkasan_kebaikan.alokasi_dana?.length && (
                      <div className="space-y-2.5">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted">
                          Alokasi dana
                        </p>
                        <ul className="space-y-2.5">
                          {receipt.ringkasan_kebaikan.alokasi_dana.map(
                            (pos, index) => (
                              <li
                                key={pos.kode || `${pos.label}-${index}`}
                                className="space-y-1 rounded-kartu border border-garis bg-kertas p-3 text-sm"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-semibold text-tinta">
                                    {pos.label}
                                  </span>
                                  <span className="tabular-nums font-bold text-nila">
                                    {formatRupiah(pos.nominal_idr)}
                                    {typeof pos.persentase === "number"
                                      ? ` (${pos.persentase}%)`
                                      : ""}
                                  </span>
                                </div>
                                {pos.deskripsi && (
                                  <p className="text-xs text-muted">
                                    {pos.deskripsi}
                                  </p>
                                )}
                                {typeof pos.persentase === "number" && (
                                  <div className="h-2 w-full overflow-hidden rounded-pil bg-garis">
                                    <div
                                      className="h-full rounded-pil bg-teh"
                                      style={{
                                        width: `${Math.min(100, Math.max(0, pos.persentase))}%`,
                                      }}
                                    />
                                  </div>
                                )}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {!!receipt.ringkasan_kebaikan.program_tujuan?.length && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted">
                          Program tujuan
                        </p>
                        <ul className="space-y-1.5 text-sm">
                          {receipt.ringkasan_kebaikan.program_tujuan.map(
                            (prog, index) => (
                              <li
                                key={prog.slug || `${prog.judul}-${index}`}
                                className="flex items-center justify-between gap-3 rounded-kontrol border border-garis bg-putih px-3 py-2"
                              >
                                {prog.slug ? (
                                  <Link
                                    to={`/kegiatan/${encodeURIComponent(prog.slug)}`}
                                    className="font-semibold text-nila hover:underline"
                                  >
                                    {prog.judul}
                                  </Link>
                                ) : (
                                  <span className="font-semibold text-tinta">
                                    {prog.judul}
                                  </span>
                                )}
                                <strong className="tabular-nums text-teh-tua">
                                  {formatRupiah(prog.nominal_idr)}
                                </strong>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {!!receipt.ringkasan_kebaikan.barang?.length && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted">
                          Jalur kebaikan barang
                        </p>
                        <ul className="space-y-1.5 text-xs">
                          {receipt.ringkasan_kebaikan.barang.map(
                            (item, index) => (
                              <li
                                key={`${item.judul || "barang"}-${index}`}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-kontrol bg-kertas px-3 py-2"
                              >
                                <span className="font-semibold text-tinta">
                                  {item.judul || "Barang"}
                                </span>
                                <span className="rounded-pil bg-teh-muda px-2.5 py-0.5 font-semibold text-teh-tua">
                                  {item.jalur_label}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : receipt.kuitansi_kebaikan ? (
                  <dl className="mt-3 space-y-2 text-sm">
                    {Object.entries(receipt.kuitansi_kebaikan).map(
                      ([label, amount]) => (
                        <div className="flex justify-between gap-4" key={label}>
                          <dt>{label.replace(/_/g, " ")}</dt>
                          <dd className="font-semibold">
                            {formatRupiah(amount)}
                          </dd>
                        </div>
                      )
                    )}
                  </dl>
                ) : null}
              </section>
            </div>
          )}

          {order.status.toLowerCase().includes("dikirim") && (
            <Button
              type="button"
              label="Konfirmasi barang diterima"
              icon="pi pi-check-circle"
              disabled={busy}
              onClick={() => void confirmReceived()}
            />
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
                  <Button
                    type="submit"
                    label="Kirim komplain"
                    icon="pi pi-flag"
                    severity="warning"
                    outlined
                    size="small"
                    disabled={busy}
                  />
                </form>
                {!reviewSubmitted ? (
                  <form className="form-card space-y-3" onSubmit={submitReview}>
                    <h2 className="text-lg font-bold">Bagikan pengalamanmu</h2>
                    <label className="form-field">
                      <span>Penilaian (1–5)</span>
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
                      <span>Komentar (opsional)</span>
                      <InputTextarea
                        className="form-input min-h-28"
                        value={reviewText}
                        onChange={(event) => setReviewText(event.target.value)}
                      />
                    </label>
                    <Button
                      type="submit"
                      label="Kirim ulasan"
                      icon="pi pi-star"
                      disabled={busy}
                    />
                  </form>
                ) : (
                  (() => {
                    const savedReview = extractOrderReview(order, code);
                    return (
                      <div className="form-alert success space-y-1" role="status">
                        <p className="font-semibold">
                          Ulasan pesanan ini sudah dikirim.
                          {savedReview?.rating ? ` (${savedReview.rating}/5 ★)` : ""}
                        </p>
                        {savedReview?.komentar && (
                          <p className="text-xs">{savedReview.komentar}</p>
                        )}
                      </div>
                    );
                  })()
                )}
              </>
            )}
        </>
      )}
    </section>
  );
};
