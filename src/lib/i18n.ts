/**
 * Lightweight i18n system for MosqueSteps
 * Supports: English, Arabic, Urdu, Malay, Turkish
 */

export type Locale = "en" | "ar" | "ur" | "ms" | "tr";

export interface Translations {
  // Navigation
  dashboard: string;
  mosques: string;
  rewards: string;
  stats: string;
  settings: string;
  history: string;
  guides: string;
  
  // Common
  steps: string;
  hasanat: string;
  distance: string;
  time: string;
  save: string;
  cancel: string;
  back: string;
  loading: string;
  
  // Dashboard
  todaysJourney: string;
  upcomingPrayers: string;
  tomorrowsPrayers: string;
  leaveBy: string;
  startWalking: string;
  enableReminders: string;
  
  // Prayers
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  
  // Walk
  activeWalk: string;
  readyToWalk: string;
  walkCompleted: string;
  stepsEarned: string;
  hasanatEarned: string;
  
  // Stats
  totalSteps: string;
  totalHasanat: string;
  totalDistance: string;
  currentStreak: string;
  longestStreak: string;
  walkingGoals: string;
  
  // Settings
  appearance: string;
  location: string;
  notifications: string;
  language: string;
  
  // Check-in
  checkIn: string;
  checkedIn: string;
  arrivedAtMosque: string;
  
  // Share
  shareAchievement: string;
  shareCard: string;
}

const en: Translations = {
  dashboard: "Dashboard",
  mosques: "Mosques",
  rewards: "Rewards",
  stats: "Stats",
  settings: "Settings",
  history: "History",
  guides: "Guides",
  steps: "steps",
  hasanat: "hasanat",
  distance: "Distance",
  time: "Time",
  save: "Save",
  cancel: "Cancel",
  back: "Back",
  loading: "Loading…",
  todaysJourney: "Today's Journey",
  upcomingPrayers: "Upcoming Prayers",
  tomorrowsPrayers: "Tomorrow's Prayers",
  leaveBy: "Leave by",
  startWalking: "Start Walking",
  enableReminders: "Enable Prayer Reminders",
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
  activeWalk: "Active Walk",
  readyToWalk: "Ready to Walk?",
  walkCompleted: "Walk Completed!",
  stepsEarned: "steps earned",
  hasanatEarned: "hasanat earned",
  totalSteps: "Total Steps",
  totalHasanat: "Total Hasanat",
  totalDistance: "Total Distance",
  currentStreak: "Current Streak",
  longestStreak: "Longest Streak",
  walkingGoals: "Walking Goals",
  appearance: "Appearance",
  location: "Location",
  notifications: "Notifications",
  language: "Language",
  checkIn: "Check In",
  checkedIn: "Checked In!",
  arrivedAtMosque: "Arrived at Mosque",
  shareAchievement: "Share Achievement",
  shareCard: "Share Card",
};

const ar: Translations = {
  dashboard: "لوحة التحكم",
  mosques: "المساجد",
  rewards: "المكافآت",
  stats: "الإحصائيات",
  settings: "الإعدادات",
  history: "السجل",
  guides: "الأدلة",
  steps: "خطوات",
  hasanat: "حسنات",
  distance: "المسافة",
  time: "الوقت",
  save: "حفظ",
  cancel: "إلغاء",
  back: "رجوع",
  loading: "جاري التحميل...",
  todaysJourney: "رحلة اليوم",
  upcomingPrayers: "الصلوات القادمة",
  tomorrowsPrayers: "صلوات الغد",
  leaveBy: "اخرج قبل",
  startWalking: "ابدأ المشي",
  enableReminders: "تفعيل تذكيرات الصلاة",
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
  activeWalk: "المشي النشط",
  readyToWalk: "هل أنت مستعد للمشي؟",
  walkCompleted: "تم المشي!",
  stepsEarned: "خطوات مكتسبة",
  hasanatEarned: "حسنات مكتسبة",
  totalSteps: "إجمالي الخطوات",
  totalHasanat: "إجمالي الحسنات",
  totalDistance: "إجمالي المسافة",
  currentStreak: "السلسلة الحالية",
  longestStreak: "أطول سلسلة",
  walkingGoals: "أهداف المشي",
  appearance: "المظهر",
  location: "الموقع",
  notifications: "الإشعارات",
  language: "اللغة",
  checkIn: "تسجيل الوصول",
  checkedIn: "تم تسجيل الوصول!",
  arrivedAtMosque: "وصلت إلى المسجد",
  shareAchievement: "مشاركة الإنجاز",
  shareCard: "بطاقة المشاركة",
};

const ur: Translations = {
  dashboard: "ڈیش بورڈ",
  mosques: "مساجد",
  rewards: "انعامات",
  stats: "اعدادوشمار",
  settings: "ترتیبات",
  history: "تاریخ",
  guides: "رہنمائی",
  steps: "قدم",
  hasanat: "حسنات",
  distance: "فاصلہ",
  time: "وقت",
  save: "محفوظ کریں",
  cancel: "منسوخ",
  back: "واپس",
  loading: "لوڈ ہو رہا ہے...",
  todaysJourney: "آج کا سفر",
  upcomingPrayers: "آنے والی نمازیں",
  tomorrowsPrayers: "کل کی نمازیں",
  leaveBy: "نکلنے کا وقت",
  startWalking: "چلنا شروع کریں",
  enableReminders: "نماز یاد دہانی فعال کریں",
  fajr: "فجر",
  dhuhr: "ظہر",
  asr: "عصر",
  maghrib: "مغرب",
  isha: "عشاء",
  activeWalk: "فعال واک",
  readyToWalk: "چلنے کے لیے تیار؟",
  walkCompleted: "واک مکمل!",
  stepsEarned: "قدم حاصل ہوئے",
  hasanatEarned: "حسنات حاصل ہوئیں",
  totalSteps: "کل قدم",
  totalHasanat: "کل حسنات",
  totalDistance: "کل فاصلہ",
  currentStreak: "موجودہ سلسلہ",
  longestStreak: "طویل ترین سلسلہ",
  walkingGoals: "واکنگ اہداف",
  appearance: "ظاہری شکل",
  location: "مقام",
  notifications: "اطلاعات",
  language: "زبان",
  checkIn: "چیک ان",
  checkedIn: "چیک ان ہو گیا!",
  arrivedAtMosque: "مسجد پہنچ گئے",
  shareAchievement: "کامیابی شیئر کریں",
  shareCard: "شیئر کارڈ",
};

const ms: Translations = {
  dashboard: "Papan Pemuka",
  mosques: "Masjid",
  rewards: "Ganjaran",
  stats: "Statistik",
  settings: "Tetapan",
  history: "Sejarah",
  guides: "Panduan",
  steps: "langkah",
  hasanat: "hasanat",
  distance: "Jarak",
  time: "Masa",
  save: "Simpan",
  cancel: "Batal",
  back: "Kembali",
  loading: "Memuatkan...",
  todaysJourney: "Perjalanan Hari Ini",
  upcomingPrayers: "Solat Akan Datang",
  tomorrowsPrayers: "Solat Esok",
  leaveBy: "Bertolak sebelum",
  startWalking: "Mula Berjalan",
  enableReminders: "Aktifkan Peringatan Solat",
  fajr: "Subuh",
  dhuhr: "Zohor",
  asr: "Asar",
  maghrib: "Maghrib",
  isha: "Isyak",
  activeWalk: "Perjalanan Aktif",
  readyToWalk: "Sedia Berjalan?",
  walkCompleted: "Perjalanan Selesai!",
  stepsEarned: "langkah diperoleh",
  hasanatEarned: "hasanat diperoleh",
  totalSteps: "Jumlah Langkah",
  totalHasanat: "Jumlah Hasanat",
  totalDistance: "Jumlah Jarak",
  currentStreak: "Rentak Semasa",
  longestStreak: "Rentak Terpanjang",
  walkingGoals: "Matlamat Berjalan",
  appearance: "Penampilan",
  location: "Lokasi",
  notifications: "Pemberitahuan",
  language: "Bahasa",
  checkIn: "Daftar Masuk",
  checkedIn: "Telah Daftar Masuk!",
  arrivedAtMosque: "Tiba di Masjid",
  shareAchievement: "Kongsi Pencapaian",
  shareCard: "Kad Kongsi",
};

const tr: Translations = {
  dashboard: "Panel",
  mosques: "Camiler",
  rewards: "Ödüller",
  stats: "İstatistikler",
  settings: "Ayarlar",
  history: "Geçmiş",
  guides: "Rehber",
  steps: "adım",
  hasanat: "hasanat",
  distance: "Mesafe",
  time: "Zaman",
  save: "Kaydet",
  cancel: "İptal",
  back: "Geri",
  loading: "Yükleniyor...",
  todaysJourney: "Bugünün Yolculuğu",
  upcomingPrayers: "Yaklaşan Namazlar",
  tomorrowsPrayers: "Yarının Namazları",
  leaveBy: "Çıkış zamanı",
  startWalking: "Yürümeye Başla",
  enableReminders: "Namaz Hatırlatıcılarını Etkinleştir",
  fajr: "Sabah",
  dhuhr: "Öğle",
  asr: "İkindi",
  maghrib: "Akşam",
  isha: "Yatsı",
  activeWalk: "Aktif Yürüyüş",
  readyToWalk: "Yürümeye Hazır mısın?",
  walkCompleted: "Yürüyüş Tamamlandı!",
  stepsEarned: "adım kazanıldı",
  hasanatEarned: "hasanat kazanıldı",
  totalSteps: "Toplam Adım",
  totalHasanat: "Toplam Hasanat",
  totalDistance: "Toplam Mesafe",
  currentStreak: "Mevcut Seri",
  longestStreak: "En Uzun Seri",
  walkingGoals: "Yürüyüş Hedefleri",
  appearance: "Görünüm",
  location: "Konum",
  notifications: "Bildirimler",
  language: "Dil",
  checkIn: "Giriş Yap",
  checkedIn: "Giriş Yapıldı!",
  arrivedAtMosque: "Camiye Vardı",
  shareAchievement: "Başarıyı Paylaş",
  shareCard: "Paylaşım Kartı",
};

const translations: Record<Locale, Translations> = { en, ar, ur, ms, tr };

const LOCALE_KEY = "mosquesteps_locale";

export function getLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored && stored in translations) return stored as Locale;
  } catch {}
  // Auto-detect from browser
  const browserLang = navigator.language.split("-")[0];
  if (browserLang in translations) return browserLang as Locale;
  return "en";
}

export function setLocale(locale: Locale) {
  localStorage.setItem(LOCALE_KEY, locale);
  // Set dir attribute for RTL languages
  document.documentElement.dir = isRTL(locale) ? "rtl" : "ltr";
  document.documentElement.lang = locale;
}

export function isRTL(locale?: Locale): boolean {
  const l = locale || getLocale();
  return l === "ar" || l === "ur";
}

export function t(key: keyof Translations, locale?: Locale): string {
  const l = locale || getLocale();
  return translations[l]?.[key] || translations.en[key] || key;
}

export function getAvailableLocales(): { code: Locale; name: string; nativeName: string; flag: string }[] {
  return [
    { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
    { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
    { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
    { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  ];
}
