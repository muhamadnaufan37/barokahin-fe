export const i18n = {
  appName: "Barokahiin",
  tagline: "Berbagi yang barokah, dekat dari rumahmu.",
  nav: {
    radar: "Radar",
    urgent: "Segera",
    share: "Bagikan",
    claims: "Klaim",
    manage: "Kelola",
    profile: "Profil",
    help: "Bantuan",
    about: "Tentang",
    admin: "Admin",
  },
  pilot: {
    outOfPilotTitle: "Barokahiin belum ramai di wilayahmu",
    outOfPilotDesc:
      "Saat ini fokus uji coba di Bandung dan sekitarnya. Kamu tetap bisa melihat contoh atau jadilah yang pertama berbagi di wilayahmu!",
  },
  price: {
    free: "Gratis",
    paid: "Berbayar",
    payOnSiteNotice:
      "Bayar langsung di tempat saat serah terima. Aplikasi tidak memproses uang. Periksa barang sebelum membayar.",
    lockedPriceNote: "Harga terkunci saat klaim diterima.",
    antiResaleNotice: "Barang gratis dilarang diperjualbelikan kembali.",
  },
  food: {
    safetyWarning:
      "Peringatan Keamanan Pangan: Periksa aroma, warna, kemasan, dan batas konsumsi sebelum menerima atau mengonsumsi makanan. Kondisi makanan adalah tanggung jawab Pemberi.",
    halalDisclaimer: "Diisi Pemberi, tidak diverifikasi sistem",
  },
  privacy: {
    blurredLocation:
      "Lokasi disamarkan untuk menjaga privasi. Alamat tepat & patokan dibuka setelah klaim diterima.",
    chatSafety:
      "Demi keamanan, hindari membagikan nomor HP/WhatsApp terlalu dini atau mentransfer uang di muka. Semua pembayaran dilakukan langsung saat serah terima.",
  },
  verification: {
    mvpDisabledNote:
      "Kerangka verifikasi identitas disiapkan untuk fase berikutnya dan saat ini tidak diwajibkan.",
  },
};

export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || amount === 0) {
    return "Gratis";
  }
  return (
    "Rp " +
    new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(amount)
  );
}

export function formatDateTimeID(iso: string, tz = "WIB"): string {
  try {
    const d = new Date(iso);
    const formatted = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
    return `${formatted} ${tz}`;
  } catch {
    return iso;
  }
}

export function formatTimeRange(startIso: string, endIso: string, tz = "WIB"): string {
  try {
    const s = new Date(startIso);
    const e = new Date(endIso);
    const dayStr = new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(s);
    const tFmt = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dayStr}, ${tFmt.format(s)}–${tFmt.format(e)} ${tz}`;
  } catch {
    return "-";
  }
}
