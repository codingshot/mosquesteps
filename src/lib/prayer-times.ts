export interface PrayerTime {
  name: string;
  time: string;
  arabicName: string;
  isPast?: boolean;
}

export interface PrayerTimesData {
  timings: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
  };
  date: {
    readable: string;
    hijri: {
      date: string;
      month: { en: string; ar: string };
      year: string;
    };
  };
}

const PRAYER_ARABIC: Record<string, string> = {
  Fajr: "الفجر",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

// --- Prayer time cache ---
const PRAYER_CACHE_KEY = "mosquesteps_prayer_cache";

interface PrayerCache {
  key: string; // lat|lng|date
  data: { prayers: PrayerTime[]; hijriDate: string; readableDate: string; isNextDay: boolean };
  timestamp: number;
}

/**
 * Get date parts (dd, mm, yyyy) as they are in the given timezone (or device local if none).
 * Ensures API and isPast use the same "day" as the city.
 */
export function getDatePartsInTimezone(date: Date, timezone?: string): { dd: string; mm: string; yyyy: string } {
  if (timezone) {
    try {
      const f = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const s = f.format(date);
      const [yyyy, mm, dd] = s.split("-");
      return { dd: dd!, mm: mm!, yyyy: yyyy! };
    } catch {}
  }
  return {
    dd: String(date.getDate()).padStart(2, "0"),
    mm: String(date.getMonth() + 1).padStart(2, "0"),
    yyyy: String(date.getFullYear()),
  };
}

function getCacheKey(lat: number, lng: number, dd: string, mm: string, yyyy: string, timezone?: string): string {
  const rLat = Math.round(lat * 100) / 100;
  const rLng = Math.round(lng * 100) / 100;
  const tz = timezone || "device";
  return `${rLat}|${rLng}|${dd}-${mm}-${yyyy}|${tz}`;
}

function getPrayerCache(key: string): PrayerCache | null {
  try {
    const stored = localStorage.getItem(PRAYER_CACHE_KEY);
    if (!stored) return null;
    const cache: PrayerCache = JSON.parse(stored);
    // Valid for 6 hours
    if (cache.key === key && Date.now() - cache.timestamp < 6 * 60 * 60 * 1000) {
      return cache;
    }
  } catch {}
  return null;
}

function setPrayerCache(key: string, data: PrayerCache["data"]) {
  try {
    const cache: PrayerCache = { key, data, timestamp: Date.now() };
    localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

// --- IP-based geolocation fallback ---
const IP_GEO_CACHE_KEY = "mosquesteps_ip_geo";

interface IPGeoCache {
  lat: number;
  lng: number;
  city: string;
  timezone: string;
  timestamp: number;
}

export async function getIPGeolocation(): Promise<{ lat: number; lng: number; city: string; timezone: string } | null> {
  // Check cache (valid for 24h)
  try {
    const stored = localStorage.getItem(IP_GEO_CACHE_KEY);
    if (stored) {
      const cache: IPGeoCache = JSON.parse(stored);
      if (Date.now() - cache.timestamp < 24 * 60 * 60 * 1000) {
        return cache;
      }
    }
  } catch {}

  try {
    const ipFetchOpts: RequestInit = {};
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      ipFetchOpts.signal = AbortSignal.timeout(5000);
    }
    const res = await fetch("https://ipapi.co/json/", ipFetchOpts);
    const data = await res.json();
    if (data.latitude && data.longitude) {
      const result = {
        lat: data.latitude,
        lng: data.longitude,
        city: data.city || "Unknown",
        timezone: data.timezone || "",
      };
      // Cache it
      try {
        localStorage.setItem(IP_GEO_CACHE_KEY, JSON.stringify({ ...result, timestamp: Date.now() }));
      } catch {}
      return result;
    }
  } catch {}

  // Fallback to another service
  try {
    const fallbackOpts: RequestInit = {};
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      fallbackOpts.signal = AbortSignal.timeout(5000);
    }
    const res = await fetch("https://ip-api.com/json/?fields=lat,lon,city,timezone", fallbackOpts);
    const data = await res.json();
    if (data.lat && data.lon) {
      const result = {
        lat: data.lat,
        lng: data.lon,
        city: data.city || "Unknown",
        timezone: data.timezone || "",
      };
      try {
        localStorage.setItem(IP_GEO_CACHE_KEY, JSON.stringify({ ...result, timestamp: Date.now() }));
      } catch {}
      return result;
    }
  } catch {}

  return null;
}

/**
 * Get current hours and minutes in a specific timezone.
 * Falls back to system time if timezone is invalid.
 */
export function getNowInTimezone(timezone?: string): { hours: number; minutes: number } {
  if (timezone) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        timeZone: timezone,
      }).formatToParts(new Date());
      const h = parseInt(parts.find(p => p.type === "hour")?.value || "0");
      const m = parseInt(parts.find(p => p.type === "minute")?.value || "0");
      return { hours: h === 24 ? 0 : h, minutes: m };
    } catch {}
  }
  const now = new Date();
  return { hours: now.getHours(), minutes: now.getMinutes() };
}

/** Validate latitude/longitude are finite numbers within range */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export async function fetchPrayerTimes(
  latitude: number,
  longitude: number,
  dateOverride?: Date,
  timezone?: string
): Promise<{ prayers: PrayerTime[]; hijriDate: string; readableDate: string; isNextDay: boolean }> {
  if (!isValidCoordinate(latitude, longitude)) {
    throw new Error("Invalid coordinates for prayer times");
  }

  const now = new Date();
  const dateToFetch = dateOverride ?? now;
  const { dd, mm, yyyy } = getDatePartsInTimezone(dateToFetch, timezone);
  const cacheKey = getCacheKey(latitude, longitude, dd, mm, yyyy, timezone);

  const { hours: nowH, minutes: nowM } = getNowInTimezone(timezone);
  const currentMinutes = nowH * 60 + nowM;

  const todayParts = getDatePartsInTimezone(now, timezone);
  const isToday = dd === todayParts.dd && mm === todayParts.mm && yyyy === todayParts.yyyy;

  // Check cache first
  const cached = getPrayerCache(cacheKey);
  if (cached) {
    const prayers = cached.data.prayers.map((p) => {
      const [h, m] = p.time.split(":").map(Number);
      return { ...p, isPast: isToday ? h * 60 + m <= currentMinutes : false };
    });
    const allPast = isToday && prayers.every((p) => p.isPast);
    return { ...cached.data, prayers, isNextDay: allPast };
  }

  const res = await fetch(
    `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${latitude}&longitude=${longitude}&method=2`
  );
  const data = await res.json();
  const d: PrayerTimesData = data.data;

  const prayers: PrayerTime[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map(
    (name) => {
      const time = d.timings[name as keyof typeof d.timings];
      const [h, m] = time.split(":").map(Number);
      const prayerMinutes = h * 60 + m;
      return {
        name,
        time,
        arabicName: PRAYER_ARABIC[name],
        isPast: isToday ? prayerMinutes <= currentMinutes : false,
      };
    }
  );

  const allPast = isToday && prayers.every((p) => p.isPast);

  const result = {
    prayers,
    hijriDate: `${d.date.hijri.date} ${d.date.hijri.month.en} ${d.date.hijri.year}`,
    readableDate: d.date.readable,
    isNextDay: allPast,
  };

  // Cache the result
  setPrayerCache(cacheKey, result);

  return result;
}

export function calculateLeaveByTime(
  prayerTime: string,
  walkingMinutes: number
): string {
  const [hours, minutes] = prayerTime.split(":").map(Number);
  let totalMinutes = hours * 60 + minutes - walkingMinutes - 5;
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m < 0 ? m + 60 : m).padStart(2, "0")}`;
}

export function minutesUntilLeave(prayerTime: string, walkingMinutes: number, timezone?: string): number {
  const leaveBy = calculateLeaveByTime(prayerTime, walkingMinutes);
  const [lh, lm] = leaveBy.split(":").map(Number);
  const { hours, minutes } = getNowInTimezone(timezone);
  const nowMin = hours * 60 + minutes;
  let leaveMin = lh * 60 + lm;
  if (leaveMin < nowMin) leaveMin += 24 * 60;
  return leaveMin - nowMin;
}

export function estimateSteps(distanceKm: number): number {
  return Math.round(distanceKm * 1333);
}

export function estimateWalkingTime(distanceKm: number, speedKmh: number = 5): number {
  return Math.round((distanceKm / speedKmh) * 60);
}

export function calculateHasanat(steps: number): number {
  return steps * 2;
}
