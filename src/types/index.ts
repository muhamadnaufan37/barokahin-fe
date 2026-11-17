export type UserRole = "guest" | "user" | "moderator" | "admin";

export type TrustLevel = "L0" | "L1";

export type PriceType = "gratis" | "berbayar";

export type ClaimMode = "siapa_cepat" | "pemberi_memilih";

export type ListingStatus =
  | "draft"
  | "active"
  | "reserved"
  | "completed"
  | "expired"
  | "cancelled"
  | "removed";

export type ClaimStatus =
  | "requested"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired"
  | "completed"
  | "no_show";

export type CategoryKind = "umum" | "makanan_kemasan" | "makanan_siap_saji";

export type TimezoneCode = "WIB" | "WITA" | "WIT";

export interface Region {
  id: string;
  province: string;
  city: string;
  district: string;
  isPilotBandung: boolean;
  timezone: TimezoneCode;
  approxLat: number;
  approxLng: number;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string;
}

export interface User {
  id: string;
  displayName: string;
  avatarInitials: string;
  phoneMasked?: string;
  email?: string;
  regionId: string;
  trustLevel: TrustLevel;
  role: UserRole;
  anonymousMode: boolean;
  muslimCommunityMode: boolean;
  completedHandovers: number;
  noShowCount: number;
  notificationSettings: {
    claims: boolean;
    chat: boolean;
    pickupReminder: boolean;
    urgentFood: boolean;
  };
  verificationStatus: "unverified" | "pending" | "verified";
}

export interface FoodAttributes {
  kind: "makanan_kemasan" | "makanan_siap_saji";
  madeAt?: string; // ISO string for siap saji
  consumeBy?: string; // ISO string (batas konsumsi)
  expiryDate?: string; // ISO string (tanggal kedaluwarsa)
  ingredientsOrAllergens: string;
  halalInfo: "halal_self_declared" | "non_halal" | "tidak_disebutkan";
}

export interface Listing {
  id: string;
  giverId: string;
  giverName: string;
  giverAnonymous: boolean;
  giverTrustLevel: TrustLevel;
  giverCompletedCount: number;
  title: string;
  description: string;
  categoryId: string;
  condition: "Baru" | "Layak Pakai Baik" | "Bekas Terawat" | "Segar / Baru Dimasak";
  stockTotal: number;
  stockAvailable: number;
  claimMode: ClaimMode;
  priceType: PriceType;
  priceRupiah: number | null;
  status: ListingStatus;
  regionId: string;
  distanceKm: number;
  blurredCoords: { x: number; y: number }; // percentage on Bandung map
  exactAddress: string;
  landmark: string;
  pickupStart: string; // ISO
  pickupEnd: string; // ISO
  timezone: TimezoneCode;
  isUrgent: boolean;
  foodAttributes?: FoodAttributes;
  images: string[];
  createdAt: string;
}

export interface Claim {
  id: string;
  listingId: string;
  receiverId: string;
  receiverName: string;
  quantity: number;
  message: string;
  status: ClaimStatus;
  lockedPriceRupiah: number | null;
  handoverCode: string; // 6-digit code
  scheduledPickup?: string;
  decidedAt?: string;
  paymentConfirmedAt?: string;
  completedAt?: string;
  thankYouNote?: string;
  declineOrCancelReason?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  claimId: string;
  senderId: string;
  senderLabel: string;
  text: string;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  targetType: "listing" | "claim" | "chat";
  targetId: string;
  targetTitle: string;
  reason: string;
  details: string;
  status: "open" | "reviewed" | "resolved";
  actionTaken?: string;
  createdAt: string;
}

export interface SponsorSlot {
  id: string;
  sponsorName: string;
  placement: "home_bottom" | "about_page";
  headline: string;
  description: string;
  ctaLabel: string;
  linkUrl: string;
  active: boolean;
  impressions: number;
  clicks: number;
}

export interface SystemConfig {
  maxActiveFreeClaims: number;
  maxActivePaidClaims: number;
  urgentPackagedThresholdDays: number;
  urgentClaimExpiryMinutes: number;
  anonymousPublicLabel: string;
  muslimAnonymousLabel: string;
  enableVerificationUI: boolean;
}
