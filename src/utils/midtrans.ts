import { publicApi } from "../services/publicApi";
import { BuyerOrder, PaymentInstruction } from "../types";

export interface MidtransSnap {
  pay: (
    snapToken: string,
    callbacks: {
      onSuccess?: (result?: unknown) => void;
      onPending?: (result?: unknown) => void;
      onError?: (result?: unknown) => void;
      onClose?: () => void;
    }
  ) => void;
}

declare global {
  interface Window {
    snap?: MidtransSnap;
  }
}

export function loadMidtransSnap(
  snapJsUrl: string,
  clientKey?: string
): Promise<MidtransSnap> {
  return new Promise((resolve, reject) => {
    if (window.snap) {
      resolve(window.snap);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-midtrans-snap="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.snap) resolve(window.snap);
        else reject(new Error("Midtrans Snap belum tersedia."));
      });
      existing.addEventListener("error", () =>
        reject(new Error("Gagal memuat Midtrans Snap.js"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = snapJsUrl;
    script.setAttribute("data-client-key", clientKey || "");
    script.setAttribute("data-midtrans-snap", "true");
    script.async = true;
    script.onload = () => {
      if (window.snap) resolve(window.snap);
      else reject(new Error("Midtrans Snap belum tersedia."));
    };
    script.onerror = () =>
      reject(new Error("Gagal memuat Midtrans Snap.js"));
    document.body.appendChild(script);
  });
}

export async function payWithMidtrans(
  paymentData: PaymentInstruction,
  callbacks: {
    onSettled?: () => void;
    onPending?: () => void;
    onClosed?: () => void;
    onError?: (cause: unknown) => void;
  }
): Promise<void> {
  const snapJsUrl =
    paymentData.payment_instructions?.snap_js_url ||
    (paymentData.is_production
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js");

  if (
    paymentData.is_mock ||
    !paymentData.snap_token ||
    !snapJsUrl ||
    !paymentData.client_key
  ) {
    const targetUrl = paymentData.redirect_url || paymentData.payment_url;
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
    callbacks.onPending?.();
    return;
  }

  try {
    const snap = await loadMidtransSnap(snapJsUrl, paymentData.client_key);
    snap.pay(paymentData.snap_token, {
      onSuccess: () => callbacks.onSettled?.(),
      onPending: () => callbacks.onPending?.(),
      onError: (err) => {
        callbacks.onError?.(err);
        callbacks.onPending?.();
      },
      onClose: () => callbacks.onClosed?.(),
    });
  } catch (err) {
    callbacks.onError?.(err);
    const targetUrl = paymentData.redirect_url || paymentData.payment_url;
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  }
}

export async function pollOrderUntilPaid(
  token: string,
  orderKode: string,
  maxAttempts = 15
): Promise<{ status: string; order?: BuyerOrder }> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const order = await publicApi.getBuyerOrder(token, orderKode);
      const status = order.status.toLowerCase();
      if (
        status === "dibayar" ||
        status === "kedaluwarsa" ||
        status === "dibatalkan"
      ) {
        return { status, order };
      }
    } catch {
      // Lanjutkan polling bila ada gangguan jaringan sesaat
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  return { status: "menunggu_bayar" };
}
