import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PublicItem } from "../types";
import { publicApi } from "../services/publicApi";

const CART_STORAGE_KEY = "barokahiin:cart:v1";
const FAVORITES_STORAGE_KEY = "barokahiin:favorites:v1";
const REGION_STORAGE_KEY = "barokahiin:region:v1";
const TOKEN_STORAGE_KEY = "barokahiin:buyer-token:v1";
const ORDERS_STORAGE_KEY = "barokahiin:orders:v1";
const ADDRESS_WARNING_REVIEWS_KEY = "barokahiin:address-warning-reviews:v1";

export interface CartItem {
  uuid: string;
  slug: string;
  judul: string;
  harga_rupiah: number;
  cover_url: string | null;
  toko_nama: string;
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
  verifyOtp: (
    phone: string,
    code: string,
    name: string
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
    toko_nama: item.toko?.nama || "Barokahiin",
  };
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
    readStorage<string[]>(ORDERS_STORAGE_KEY, [])
  );
  const [addressWarningReviews, setAddressWarningReviews] = useState<
    Record<string, AddressWarningReview>
  >(() => readStorage(ADDRESS_WARNING_REVIEWS_KEY, {}));
  const [selectedRegion, setRegion] = useState<SelectedRegion | null>(() =>
    readStorage<SelectedRegion | null>(REGION_STORAGE_KEY, null)
  );
  const [token, setToken] = useState<string | null>(() =>
    window.sessionStorage.getItem(TOKEN_STORAGE_KEY)
  );

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
    setRecentOrderCodes((current) =>
      [code, ...current.filter((entry) => entry !== code)].slice(0, 20)
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

  const verifyOtp = useCallback(
    async (phone: string, code: string, name: string) => {
      const result = await publicApi.verifyBuyerOtp(phone, code, name);
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      setToken(result.token);
      for (const item of cart) {
        await publicApi.addBuyerCartItem(result.token, item.uuid);
      }
    },
    [cart]
  );

  const signOut = useCallback(() => {
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
  }, []);

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
      verifyOtp,
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
      verifyOtp,
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
