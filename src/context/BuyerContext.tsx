import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BuyerAuthResult,
  BuyerProfileCompleteness,
  PublicItem,
} from "../types";
import { publicApi } from "../services/publicApi";

const CART_STORAGE_KEY = "barokahiin:cart:v1";
const FAVORITES_STORAGE_KEY = "barokahiin:favorites:v1";
const REGION_STORAGE_KEY = "barokahiin:region:v1";
const TOKEN_STORAGE_KEY = "barokahiin:buyer-token:v1";
const TOKEN_EXPIRES_STORAGE_KEY = "barokahiin:buyer-token-exp:v1";
const BUYER_USER_STORAGE_KEY = "barokahiin:buyer-user:v1";
const ORDERS_STORAGE_KEY = "barokahiin:orders:v1";
const ADDRESS_WARNING_REVIEWS_KEY = "barokahiin:address-warning-reviews:v1";

export interface CartItem {
  uuid: string;
  slug: string;
  judul: string;
  harga_rupiah: number;
  cover_url: string | null;
  toko_nama: string;
  pickup_only?: boolean;
}

interface SelectedRegion {
  id: string;
  nama: string;
  path?: string[];
}

interface AddressWarningReview {
  warnings: string[];
  confirmed: boolean;
}

interface BuyerContextValue {
  token: string | null;
  cart: CartItem[];
  favorites: string[];
  recentOrderCodes: string[];
  addressWarningReviews: Record<string, AddressWarningReview>;
  selectedRegion: SelectedRegion | null;
  addToCart: (item: PublicItem) => Promise<void>;
  removeFromCart: (itemUuid: string) => void;
  clearCart: () => void;
  toggleFavorite: (itemUuid: string) => void;
  recordOrder: (code: string) => void;
  setSelectedRegion: (region: SelectedRegion | null) => void;
  setAddressWarningReview: (
    addressUuid: string,
    warnings: string[],
    confirmed: boolean
  ) => void;
  buyerUser: BuyerAuthResult["user"] | null;
  setBuyerUser: (user: BuyerAuthResult["user"] | null) => void;
  profileCompleteness: BuyerProfileCompleteness | null;
  setProfileCompleteness: (
    completeness: BuyerProfileCompleteness | null
  ) => void;
  verifyOtp: (
    phone: string,
    code: string,
    name?: string
  ) => Promise<void>;
  completeAuth: (
    newToken: string,
    expiresInSeconds?: number,
    completeness?: BuyerProfileCompleteness | null,
    user?: BuyerAuthResult["user"] | null
  ) => Promise<void>;
  signOut: () => void;
}

const BuyerContext = createContext<BuyerContextValue | undefined>(undefined);

function readStorage<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    window.localStorage.removeItem(key);
    console.warn(`Invalid saved storefront data for ${key}`, error);
    return fallback;
  }
}

function createCartItem(item: PublicItem): CartItem {
  return {
    uuid: item.uuid,
    slug: item.slug,
    judul: item.judul,
    harga_rupiah: item.harga_rupiah,
    cover_url: item.cover_url,
    toko_nama: item.toko?.nama || "Barokahinn",
    pickup_only: item.pickup_only ?? false,
  };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidOrderCode(code: string): boolean {
  return Boolean(code) && !UUID_PATTERN.test(code.trim());
}

export const BuyerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>(CART_STORAGE_KEY, [])
  );
  const [favorites, setFavorites] = useState<string[]>(() =>
    readStorage<string[]>(FAVORITES_STORAGE_KEY, [])
  );
  const [recentOrderCodes, setRecentOrderCodes] = useState<string[]>(() =>
    readStorage<string[]>(ORDERS_STORAGE_KEY, []).filter(isValidOrderCode)
  );
  const [addressWarningReviews, setAddressWarningReviews] = useState<
    Record<string, AddressWarningReview>
  >(() => readStorage(ADDRESS_WARNING_REVIEWS_KEY, {}));
  const [selectedRegion, setRegion] = useState<SelectedRegion | null>(() =>
    readStorage<SelectedRegion | null>(REGION_STORAGE_KEY, null)
  );
  const [token, setToken] = useState<string | null>(() => {
    const persisted = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (persisted) return persisted;
    const legacySession = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (legacySession) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, legacySession);
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      return legacySession;
    }
    return null;
  });
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(() => {
    const raw = window.localStorage.getItem(TOKEN_EXPIRES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  });
  const [buyerUser, setBuyerUserState] = useState<
    BuyerAuthResult["user"] | null
  >(() => readStorage<BuyerAuthResult["user"] | null>(BUYER_USER_STORAGE_KEY, null));
  const [profileCompleteness, setProfileCompleteness] =
    useState<BuyerProfileCompleteness | null>(null);

  const setBuyerUser = useCallback((user: BuyerAuthResult["user"] | null) => {
    setBuyerUserState(user);
    if (user) {
      window.localStorage.setItem(BUYER_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(BUYER_USER_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(favorites)
    );
  }, [favorites]);
  useEffect(() => {
    window.localStorage.setItem(
      ORDERS_STORAGE_KEY,
      JSON.stringify(recentOrderCodes)
    );
  }, [recentOrderCodes]);
  useEffect(() => {
    window.localStorage.setItem(
      ADDRESS_WARNING_REVIEWS_KEY,
      JSON.stringify(addressWarningReviews)
    );
  }, [addressWarningReviews]);
  useEffect(() => {
    if (selectedRegion) {
      window.localStorage.setItem(
        REGION_STORAGE_KEY,
        JSON.stringify(selectedRegion)
      );
    } else {
      window.localStorage.removeItem(REGION_STORAGE_KEY);
    }
  }, [selectedRegion]);

  const addToCart = useCallback(
    async (item: PublicItem) => {
      if (item.status !== "terbit") {
        throw new Error("Barang ini tidak tersedia untuk ditambahkan.");
      }
      if (cart.some((entry) => entry.uuid === item.uuid)) return;
      if (cart.length >= 10) {
        throw new Error("Keranjang maksimal berisi 10 barang per pesanan.");
      }
      if (
        cart.length > 0 &&
        cart[0].toko_nama &&
        item.toko?.nama &&
        cart[0].toko_nama !== item.toko.nama
      ) {
        throw new Error(
          `1 pesanan hanya boleh berisi barang dari 1 toko yang sama (${cart[0].toko_nama}).`
        );
      }
      if (token) await publicApi.addBuyerCartItem(token, item.uuid);
      setCart((current) =>
        current.some((entry) => entry.uuid === item.uuid)
          ? current
          : [...current, createCartItem(item)]
      );
    },
    [cart, token]
  );

  const removeFromCart = useCallback((itemUuid: string) => {
    setCart((current) => current.filter((item) => item.uuid !== itemUuid));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleFavorite = useCallback((itemUuid: string) => {
    setFavorites((current) =>
      current.includes(itemUuid)
        ? current.filter((uuid) => uuid !== itemUuid)
        : [...current, itemUuid]
    );
  }, []);

  const recordOrder = useCallback((code: string) => {
    if (!isValidOrderCode(code)) return;
    setRecentOrderCodes((current) =>
      [code, ...current.filter((entry) => entry !== code && isValidOrderCode(entry))].slice(0, 20)
    );
  }, []);

  const setSelectedRegion = useCallback(
    (region: SelectedRegion | null) => setRegion(region),
    []
  );

  const setAddressWarningReview = useCallback(
    (addressUuid: string, warnings: string[], confirmed: boolean) => {
      setAddressWarningReviews((current) => ({
        ...current,
        [addressUuid]: { warnings, confirmed },
      }));
    },
    []
  );

  const persistToken = useCallback(
    (
      newToken: string,
      expiresInSeconds?: number,
      completeness?: BuyerProfileCompleteness | null,
      user?: BuyerAuthResult["user"] | null
    ) => {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(newToken);
      if (expiresInSeconds && expiresInSeconds > 0) {
        const exp = Date.now() + expiresInSeconds * 1000;
        window.localStorage.setItem(TOKEN_EXPIRES_STORAGE_KEY, String(exp));
        setTokenExpiresAt(exp);
      }
      if (completeness !== undefined) {
        setProfileCompleteness(completeness);
      }
      if (user !== undefined) {
        setBuyerUser(user);
      }
    },
    [setBuyerUser]
  );

  const completeAuth = useCallback(
    async (
      newToken: string,
      expiresInSeconds?: number,
      completeness?: BuyerProfileCompleteness | null,
      user?: BuyerAuthResult["user"] | null
    ) => {
      persistToken(newToken, expiresInSeconds, completeness, user);
      for (const item of cart) {
        await publicApi.addBuyerCartItem(newToken, item.uuid);
      }
    },
    [cart, persistToken]
  );

  const verifyOtp = useCallback(
    async (phone: string, code: string, name?: string) => {
      const result = await publicApi.verifyBuyerOtp(phone, code, name);
      await completeAuth(
        result.token,
        result.expires_in_seconds,
        result.profile_completeness,
        result.user
      );
    },
    [completeAuth]
  );

  const signOut = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(TOKEN_EXPIRES_STORAGE_KEY);
    window.localStorage.removeItem(BUYER_USER_STORAGE_KEY);
    window.localStorage.removeItem(REGION_STORAGE_KEY);
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setTokenExpiresAt(null);
    setBuyerUserState(null);
    setProfileCompleteness(null);
    setRegion(null);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    publicApi
      .getBuyerProfileCompleteness(token, "kirim")
      .then(async (comp) => {
        if (cancelled) return;
        setProfileCompleteness(comp);
        if (comp.user) {
          setBuyerUser({
            id: comp.user.id,
            nama_lengkap: comp.user.nama_lengkap || undefined,
            email: comp.user.email || undefined,
            phone: comp.user.phone || undefined,
          });
        }
        const regionCode =
          comp.user?.village_code ||
          comp.user?.wilayah_code ||
          comp.user?.region?.kode_resmi ||
          "";
        const regionName = comp.user?.region?.nama || "";
        if (regionCode && regionName) {
          setRegion({ id: regionCode, nama: regionName });
          return;
        }
        const addresses = await publicApi.getBuyerAddresses(token);
        if (cancelled) return;
        const primary =
          addresses.find((a) => a.utama || a.is_default) || addresses[0];
        if (primary?.region_nama && (primary.village_code || primary.region_id)) {
          setRegion({
            id: String(primary.village_code || primary.region_id),
            nama: primary.region_nama,
          });
        }
      })
      .catch(() => {
        // Abaikan jika gagal sinkronisasi awal
      });
    return () => {
      cancelled = true;
    };
  }, [token, setBuyerUser]);

  useEffect(() => {
    if (!token) return;
    const REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000;
    const shouldRefresh =
      !tokenExpiresAt || tokenExpiresAt - Date.now() < REFRESH_WINDOW_MS;
    if (!shouldRefresh) return;

    let cancelled = false;
    publicApi
      .refreshBuyerAuth(token)
      .then((res) => {
        if (cancelled) return;
        persistToken(
          res.token,
          res.expires_in_seconds,
          res.profile_completeness,
          res.user
        );
      })
      .catch((cause) => {
        if (cancelled) return;
        if (
          cause &&
          typeof cause === "object" &&
          "status" in cause &&
          cause.status === 401
        ) {
          signOut();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, tokenExpiresAt, persistToken, signOut]);

  const value = useMemo(
    () => ({
      token,
      cart,
      favorites,
      recentOrderCodes,
      addressWarningReviews,
      selectedRegion,
      addToCart,
      removeFromCart,
      clearCart,
      toggleFavorite,
      recordOrder,
      setSelectedRegion,
      setAddressWarningReview,
      buyerUser,
      setBuyerUser,
      profileCompleteness,
      setProfileCompleteness,
      verifyOtp,
      completeAuth,
      signOut,
    }),
    [
      token,
      cart,
      favorites,
      recentOrderCodes,
      addressWarningReviews,
      selectedRegion,
      addToCart,
      removeFromCart,
      clearCart,
      toggleFavorite,
      recordOrder,
      setSelectedRegion,
      setAddressWarningReview,
      buyerUser,
      setBuyerUser,
      profileCompleteness,
      verifyOtp,
      completeAuth,
      signOut,
    ]
  );

  return <BuyerContext.Provider value={value}>{children}</BuyerContext.Provider>;
};

export function useBuyer(): BuyerContextValue {
  const context = useContext(BuyerContext);
  if (!context) {
    throw new Error("useBuyer must be used within BuyerProvider");
  }
  return context;
}
