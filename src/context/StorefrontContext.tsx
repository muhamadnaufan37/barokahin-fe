import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { publicApi } from "../services/publicApi";
import { PublicCategory, PublicImpact, PublicSettings } from "../types";

interface StorefrontContextValue {
  settings: PublicSettings | null;
  categories: PublicCategory[];
  impact: PublicImpact | null;
  loadingShared: boolean;
  sharedError: string | null;
  refreshShared: () => Promise<void>;
}

const StorefrontContext = createContext<StorefrontContextValue | undefined>(
  undefined
);

export const StorefrontProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [impact, setImpact] = useState<PublicImpact | null>(null);
  const [loadingShared, setLoadingShared] = useState<boolean>(true);
  const [sharedError, setSharedError] = useState<string | null>(null);

  const refreshShared = useCallback(async () => {
    setLoadingShared(true);
    setSharedError(null);
    const [settingsRes, categoriesRes, impactRes] = await Promise.allSettled([
      publicApi.getSettings(),
      publicApi.getCategories(),
      publicApi.getImpact(),
    ]);

    if (settingsRes.status === "fulfilled") {
      setSettings(settingsRes.value);
    }
    if (categoriesRes.status === "fulfilled") {
      const sorted = [...categoriesRes.value].sort(
        (a, b) => (a.urutan ?? 0) - (b.urutan ?? 0)
      );
      setCategories(sorted);
    }
    if (impactRes.status === "fulfilled") {
      setImpact(impactRes.value);
    }

    if (
      settingsRes.status === "rejected" &&
      categoriesRes.status === "rejected" &&
      impactRes.status === "rejected"
    ) {
      setSharedError(
        settingsRes.reason instanceof Error
          ? settingsRes.reason.message
          : "Gagal memuat data awal Barokahinn."
      );
    }

    setLoadingShared(false);
  }, []);

  useEffect(() => {
    void refreshShared();
  }, [refreshShared]);

  return (
    <StorefrontContext.Provider
      value={{
        settings,
        categories,
        impact,
        loadingShared,
        sharedError,
        refreshShared,
      }}
    >
      {children}
    </StorefrontContext.Provider>
  );
};

export function useStorefront(): StorefrontContextValue {
  const ctx = useContext(StorefrontContext);
  if (!ctx) {
    throw new Error("useStorefront must be used within StorefrontProvider");
  }
  return ctx;
}
