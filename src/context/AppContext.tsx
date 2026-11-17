import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import {
  CATEGORIES,
  INITIAL_CLAIMS,
  INITIAL_CONFIG,
  INITIAL_LISTINGS,
  INITIAL_MESSAGES,
  INITIAL_REPORTS,
  INITIAL_SPONSORS,
  INITIAL_USERS,
  REGIONS,
} from "../data/mockData";
import {
  ChatMessage,
  Claim,
  Listing,
  Region,
  ReportItem,
  SponsorSlot,
  SystemConfig,
  User,
} from "../types";

interface AppContextType {
  currentUser: User | null;
  selectedRegion: Region;
  setSelectedRegionId: (id: string) => void;
  listings: Listing[];
  claims: Claim[];
  messages: ChatMessage[];
  reports: ReportItem[];
  sponsors: SponsorSlot[];
  config: SystemConfig;
  isOffline: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  loginWithDemoRole: (role: "guest" | "user" | "admin") => void;
  loginWithPhoneOrGoogle: (displayName: string, phoneOrEmail: string) => void;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
  createListing: (
    data: Omit<
      Listing,
      | "id"
      | "giverId"
      | "giverName"
      | "giverAnonymous"
      | "giverTrustLevel"
      | "giverCompletedCount"
      | "status"
      | "distanceKm"
      | "blurredCoords"
      | "isUrgent"
      | "createdAt"
    >
  ) => Listing | null;
  closeListing: (listingId: string) => void;
  duplicateListing: (listingId: string) => void;
  requestClaim: (
    listingId: string,
    quantity: number,
    message: string
  ) => { ok: boolean; error?: string; claim?: Claim };
  acceptClaim: (claimId: string) => void;
  declineClaim: (claimId: string, reason: string) => void;
  cancelClaim: (claimId: string, reason: string) => void;
  markNoShow: (claimId: string) => void;
  confirmHandover: (
    claimId: string,
    code: string,
    paymentConfirmed: boolean,
    thankYouNote?: string
  ) => { ok: boolean; error?: string };
  sendMessage: (claimId: string, text: string) => void;
  submitReport: (
    targetType: "listing" | "claim" | "chat",
    targetId: string,
    targetTitle: string,
    reason: string,
    details: string
  ) => void;
  resolveReport: (reportId: string, actionTaken: string, removeTargetListing?: boolean) => void;
  updateConfig: (patch: Partial<SystemConfig>) => void;
  trackSponsorClick: (sponsorId: string) => void;
  notify: (severity: "success" | "info" | "warn" | "error", summary: string, detail?: string) => void;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "barokahiin_state_v1";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toastRef = useRef<Toast>(null);

  const loadStored = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore corrupted storage
    }
    return null;
  };

  const stored = loadStored();

  const [currentUser, setCurrentUser] = useState<User | null>(
    stored?.currentUser !== undefined ? stored.currentUser : INITIAL_USERS[0]
  );
  const [selectedRegionId, setSelectedRegionId] = useState<string>(
    stored?.selectedRegionId || "bdg-coblong"
  );
  const [listings, setListings] = useState<Listing[]>(stored?.listings || INITIAL_LISTINGS);
  const [claims, setClaims] = useState<Claim[]>(stored?.claims || INITIAL_CLAIMS);
  const [messages, setMessages] = useState<ChatMessage[]>(stored?.messages || INITIAL_MESSAGES);
  const [reports, setReports] = useState<ReportItem[]>(stored?.reports || INITIAL_REPORTS);
  const [sponsors, setSponsors] = useState<SponsorSlot[]>(stored?.sponsors || INITIAL_SPONSORS);
  const [config, setConfig] = useState<SystemConfig>(stored?.config || INITIAL_CONFIG);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentUser,
          selectedRegionId,
          listings,
          claims,
          messages,
          reports,
          sponsors,
          config,
        })
      );
    } catch {
      // ignore quota exceeded
    }
  }, [currentUser, selectedRegionId, listings, claims, messages, reports, sponsors, config]);

  const selectedRegion = REGIONS.find((r) => r.id === selectedRegionId) || REGIONS[0];

  const notify = (
    severity: "success" | "info" | "warn" | "error",
    summary: string,
    detail?: string
  ) => {
    toastRef.current?.show({ severity, summary, detail, life: 3500 });
  };

  const loginWithDemoRole = (role: "guest" | "user" | "admin") => {
    if (role === "guest") {
      setCurrentUser(null);
      notify("info", "Mode Tamu (L0)", "Kamu hanya dapat melihat daftar & detail terbatas.");
    } else if (role === "admin") {
      setCurrentUser(INITIAL_USERS[1]);
      notify("success", "Masuk sebagai Admin/Moderator", "Akses penuh termasuk Panel Admin.");
    } else {
      setCurrentUser(INITIAL_USERS[0]);
      notify("success", "Masuk sebagai Teh Rina (L1)", "Siap berbagi dan mengklaim barang.");
    }
    setAuthModalOpen(false);
  };

  const loginWithPhoneOrGoogle = (displayName: string, phoneOrEmail: string) => {
    const cleanName = displayName.trim() || "Warga Bandung";
    const initials = cleanName
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const newUser: User = {
      id: `user-${Date.now()}`,
      displayName: cleanName,
      avatarInitials: initials || "WB",
      phoneMasked: phoneOrEmail.includes("@") ? undefined : "08**-****-****",
      email: phoneOrEmail.includes("@") ? phoneOrEmail : undefined,
      regionId: selectedRegionId,
      trustLevel: "L1",
      role: "user",
      anonymousMode: false,
      muslimCommunityMode: false,
      completedHandovers: 0,
      noShowCount: 0,
      notificationSettings: {
        claims: true,
        chat: true,
        pickupReminder: true,
        urgentFood: true,
      },
      verificationStatus: "unverified",
    };
    setCurrentUser(newUser);
    setAuthModalOpen(false);
    notify("success", "Berhasil masuk", `Selamat datang, ${newUser.displayName}!`);
  };

  const logout = () => {
    setCurrentUser(null);
    notify("info", "Keluar", "Sekarang kamu berada dalam mode Tamu (L0).");
  };

  const updateProfile = (patch: Partial<User>) => {
    if (!currentUser) return;
    setCurrentUser({ ...currentUser, ...patch });
    notify("success", "Profil diperbarui");
  };

  const computeIsUrgent = (
    categoryId: string,
    foodAttributes?: Listing["foodAttributes"]
  ): boolean => {
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    if (!cat) return false;
    if (cat.kind === "makanan_siap_saji") return true;
    if (cat.kind === "makanan_kemasan" && foodAttributes?.expiryDate) {
      const diffDays =
        (new Date(foodAttributes.expiryDate).getTime() - Date.now()) / (24 * 3600 * 1000);
      return diffDays <= config.urgentPackagedThresholdDays;
    }
    return false;
  };

  const createListing: AppContextType["createListing"] = (data) => {
    if (!currentUser || currentUser.trustLevel !== "L1") {
      setAuthModalOpen(true);
      return null;
    }
    const isUrgent = computeIsUrgent(data.categoryId, data.foodAttributes);
    const anonLabel = currentUser.muslimCommunityMode
      ? config.muslimAnonymousLabel
      : config.anonymousPublicLabel;

    const newListing: Listing = {
      ...data,
      id: `lst-${Date.now()}`,
      giverId: currentUser.id,
      giverName: currentUser.anonymousMode ? anonLabel : currentUser.displayName,
      giverAnonymous: currentUser.anonymousMode,
      giverTrustLevel: currentUser.trustLevel,
      giverCompletedCount: currentUser.completedHandovers,
      status: "active",
      distanceKm: 0.3,
      blurredCoords: {
        x: 30 + Math.floor(Math.random() * 40),
        y: 30 + Math.floor(Math.random() * 40),
      },
      isUrgent,
      createdAt: new Date().toISOString(),
    };
    setListings((prev) => [newListing, ...prev]);
    notify(
      "success",
      "Barokah dipublikasikan!",
      isUrgent ? "Masuk ke Jalur Segera karena batas konsumsi/kedaluwarsa dekat." : undefined
    );
    return newListing;
  };

  const closeListing = (listingId: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: "cancelled" } : l))
    );
    notify("info", "Listing ditutup");
  };

  const duplicateListing = (listingId: string) => {
    const src = listings.find((l) => l.id === listingId);
    if (!src) return;
    const copy: Listing = {
      ...src,
      id: `lst-${Date.now()}`,
      title: `${src.title} (Salinan)`,
      status: "active",
      stockAvailable: src.stockTotal,
      createdAt: new Date().toISOString(),
    };
    setListings((prev) => [copy, ...prev]);
    notify("success", "Listing diduplikasi", "Listing baru siap menerima klaim.");
  };

  const requestClaim: AppContextType["requestClaim"] = (listingId, quantity, message) => {
    if (!currentUser || currentUser.trustLevel !== "L1") {
      setAuthModalOpen(true);
      return { ok: false, error: "Silakan masuk terlebih dahulu untuk mengajukan klaim." };
    }

    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return { ok: false, error: "Barang tidak ditemukan." };
    if (listing.giverId === currentUser.id) {
      return { ok: false, error: "Kamu tidak dapat mengklaim barang milik sendiri." };
    }
    if (listing.status !== "active" || listing.stockAvailable < quantity) {
      return { ok: false, error: "Maaf, stok barang sudah habis atau tidak mencukupi." };
    }

    const duplicate = claims.find(
      (c) =>
        c.listingId === listingId &&
        c.receiverId === currentUser.id &&
        ["requested", "accepted"].includes(c.status)
    );
    if (duplicate) {
      return { ok: false, error: "Kamu sudah memiliki klaim aktif pada barang ini." };
    }

    // CLM-02 active claim limits separated for free vs paid
    const myActiveClaims = claims.filter(
      (c) => c.receiverId === currentUser.id && ["requested", "accepted"].includes(c.status)
    );
    const activeFreeCount = myActiveClaims.filter((c) => {
      const l = listings.find((item) => item.id === c.listingId);
      return l?.priceType === "gratis";
    }).length;
    const activePaidCount = myActiveClaims.filter((c) => {
      const l = listings.find((item) => item.id === c.listingId);
      return l?.priceType === "berbayar";
    }).length;

    if (listing.priceType === "gratis" && activeFreeCount >= config.maxActiveFreeClaims) {
      return {
        ok: false,
        error: `Batas klaim aktif barang gratis (${config.maxActiveFreeClaims}) tercapai. Selesaikan atau batalkan klaim sebelumnya.`,
      };
    }
    if (listing.priceType === "berbayar" && activePaidCount >= config.maxActivePaidClaims) {
      return {
        ok: false,
        error: `Batas klaim aktif barang berbayar (${config.maxActivePaidClaims}) tercapai.`,
      };
    }

    const isAutoAccept = listing.claimMode === "siapa_cepat";
    const handoverCode = String(Math.floor(100000 + Math.random() * 900000));

    const newClaim: Claim = {
      id: `clm-${Date.now()}`,
      listingId,
      receiverId: currentUser.id,
      receiverName: currentUser.displayName,
      quantity,
      message,
      status: isAutoAccept ? "accepted" : "requested",
      lockedPriceRupiah: listing.priceType === "berbayar" ? listing.priceRupiah : null,
      handoverCode,
      decidedAt: isAutoAccept ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };

    setClaims((prev) => [newClaim, ...prev]);

    if (isAutoAccept) {
      setListings((prev) =>
        prev.map((l) => {
          if (l.id !== listingId) return l;
          const nextStock = Math.max(0, l.stockAvailable - quantity);
          return {
            ...l,
            stockAvailable: nextStock,
            status: nextStock === 0 ? "reserved" : "active",
          };
        })
      );
      notify(
        "success",
        "Klaim langsung diterima!",
        "Alamat tepat & kode serah terima sudah tersedia."
      );
    } else {
      notify(
        "info",
        "Permintaan terkirim",
        "Menunggu persetujuan Pemberi. Kamu akan diberi tahu saat diterima."
      );
    }

    return { ok: true, claim: newClaim };
  };

  const acceptClaim = (claimId: string) => {
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return;
    const listing = listings.find((l) => l.id === claim.listingId);
    if (!listing || listing.stockAvailable < claim.quantity) {
      notify("error", "Stok tidak cukup", "Stok barang sudah habis.");
      return;
    }

    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status: "accepted",
              lockedPriceRupiah: listing.priceType === "berbayar" ? listing.priceRupiah : null,
              decidedAt: new Date().toISOString(),
            }
          : c
      )
    );

    setListings((prev) =>
      prev.map((l) => {
        if (l.id !== listing.id) return l;
        const nextStock = Math.max(0, l.stockAvailable - claim.quantity);
        return {
          ...l,
          stockAvailable: nextStock,
          status: nextStock === 0 ? "reserved" : "active",
        };
      })
    );

    notify("success", "Klaim diterima", "Harga terkunci & lokasi tepat dibuka untuk Penerima.");
  };

  const declineClaim = (claimId: string, reason: string) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status: "declined",
              declineOrCancelReason: reason,
              decidedAt: new Date().toISOString(),
            }
          : c
      )
    );
    notify("info", "Permintaan ditolak");
  };

  const cancelClaim = (claimId: string, reason: string) => {
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return;
    const wasAccepted = claim.status === "accepted";

    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? { ...c, status: "cancelled", declineOrCancelReason: reason }
          : c
      )
    );

    if (wasAccepted) {
      setListings((prev) =>
        prev.map((l) => {
          if (l.id !== claim.listingId) return l;
          const nextStock = Math.min(l.stockTotal, l.stockAvailable + claim.quantity);
          return {
            ...l,
            stockAvailable: nextStock,
            status: nextStock > 0 ? "active" : l.status,
          };
        })
      );
    }
    notify("info", "Klaim dibatalkan", wasAccepted ? "Stok dikembalikan ke daftar." : undefined);
  };

  const markNoShow = (claimId: string) => {
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return;
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: "no_show" } : c))
    );
    setListings((prev) =>
      prev.map((l) => {
        if (l.id !== claim.listingId) return l;
        const nextStock = Math.min(l.stockTotal, l.stockAvailable + claim.quantity);
        return {
          ...l,
          stockAvailable: nextStock,
          status: nextStock > 0 ? "active" : l.status,
        };
      })
    );
    notify("warn", "Ditandai No-Show", "Stok dikembalikan ke listing.");
  };

  const confirmHandover: AppContextType["confirmHandover"] = (
    claimId,
    code,
    paymentConfirmed,
    thankYouNote
  ) => {
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return { ok: false, error: "Klaim tidak ditemukan." };
    const listing = listings.find((l) => l.id === claim.listingId);
    if (!listing) return { ok: false, error: "Barang tidak ditemukan." };

    if (code.trim() !== claim.handoverCode) {
      return { ok: false, error: "Kode serah terima 6 digit tidak cocok. Periksa kembali." };
    }
    if (listing.priceType === "berbayar" && !paymentConfirmed) {
      return {
        ok: false,
        error: "Centang konfirmasi bahwa pembayaran langsung sudah diterima.",
      };
    }

    const nowIso = new Date().toISOString();
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status: "completed",
              paymentConfirmedAt: listing.priceType === "berbayar" ? nowIso : undefined,
              completedAt: nowIso,
              thankYouNote,
            }
          : c
      )
    );

    setListings((prev) =>
      prev.map((l) => {
        if (l.id !== listing.id) return l;
        return l.stockAvailable === 0 ? { ...l, status: "completed" } : l;
      })
    );

    notify("success", "Serah terima selesai!", "Terima kasih telah berbagi kebaikan.");
    return { ok: true };
  };

  const sendMessage = (claimId: string, text: string) => {
    if (!currentUser || !text.trim()) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      claimId,
      senderId: currentUser.id,
      senderLabel: currentUser.displayName,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  const submitReport: AppContextType["submitReport"] = (
    targetType,
    targetId,
    targetTitle,
    reason,
    details
  ) => {
    const newRep: ReportItem = {
      id: `rep-${Date.now()}`,
      reporterId: currentUser?.id || "anon",
      targetType,
      targetId,
      targetTitle,
      reason,
      details,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [newRep, ...prev]);
    notify(
      "success",
      "Laporan diterima",
      "Tim moderasi akan meninjau laporanmu. Identitas pelapor dirahasiakan."
    );
  };

  const resolveReport = (
    reportId: string,
    actionTaken: string,
    removeTargetListing?: boolean
  ) => {
    const rep = reports.find((r) => r.id === reportId);
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: "resolved", actionTaken } : r
      )
    );
    if (removeTargetListing && rep?.targetType === "listing") {
      setListings((prev) =>
        prev.map((l) => (l.id === rep.targetId ? { ...l, status: "removed" } : l))
      );
    }
    notify("success", "Tindakan moderasi dicatat");
  };

  const updateConfig = (patch: Partial<SystemConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    notify("success", "Konfigurasi sistem disimpan");
  };

  const trackSponsorClick = (sponsorId: string) => {
    setSponsors((prev) =>
      prev.map((s) => (s.id === sponsorId ? { ...s, clicks: s.clicks + 1 } : s))
    );
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(INITIAL_USERS[0]);
    setSelectedRegionId("bdg-coblong");
    setListings(INITIAL_LISTINGS);
    setClaims(INITIAL_CLAIMS);
    setMessages(INITIAL_MESSAGES);
    setReports(INITIAL_REPORTS);
    setSponsors(INITIAL_SPONSORS);
    setConfig(INITIAL_CONFIG);
    notify("info", "Data demo direset ke kondisi awal");
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        selectedRegion,
        setSelectedRegionId,
        listings,
        claims,
        messages,
        reports,
        sponsors,
        config,
        isOffline,
        authModalOpen,
        setAuthModalOpen,
        loginWithDemoRole,
        loginWithPhoneOrGoogle,
        logout,
        updateProfile,
        createListing,
        closeListing,
        duplicateListing,
        requestClaim,
        acceptClaim,
        declineClaim,
        cancelClaim,
        markNoShow,
        confirmHandover,
        sendMessage,
        submitReport,
        resolveReport,
        updateConfig,
        trackSponsorClick,
        notify,
        resetDemoData,
      }}
    >
      <Toast ref={toastRef} position="top-right" />
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
