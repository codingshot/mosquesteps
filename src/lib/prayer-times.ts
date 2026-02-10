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

function getCacheKey(lat: number, lng: number, date: Date): string {
  // Round coords to 2 decimals (~1km precision) to increase cache hits
  const rLat = Math.round(lat * 100) / 100;
  const rLng = Math.round(lng * 100) / 100;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${rLat}|${rLng}|${dd}-${mm}-${date.getFullYear()}`;
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
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
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
    const res = await fetch("https://ip-api.com/json/?fields=lat,lon,city,timezone", { signal: AbortSignal.timeout(5000) });
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

export async function fetchPrayerTimes(
  latitude: number,
  longitude: number,
  dateOverride?: Date
): Promise<{ prayers: PrayerTime[]; hijriDate: string; readableDate: string; isNextDay: boolean }> {
  const target = dateOverride || new Date();
  const cacheKey = getCacheKey(latitude, longitude, target);

  // Check cache first
  const cached = getPrayerCache(cacheKey);
  if (cached) {
    // Re-calculate isPast for cached data since time has changed
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isToday = !dateOverride || target.toDateString() === now.toDateString();
    const prayers = cached.data.prayers.map((p) => {
      const [h, m] = p.time.split(":").map(Number);
      return { ...p, isPast: isToday ? h * 60 + m <= currentMinutes : false };
    });
    const allPast = isToday && prayers.every((p) => p.isPast);
    return { ...cached.data, prayers, isNextDay: allPast };
  }

  const dd = String(target.getDate()).padStart(2, "0");
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  const yyyy = target.getFullYear();

  const res = await fetch(
    `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${latitude}&longitude=${longitude}&method=2`
  );
  const data = await res.json();
  const d: PrayerTimesData = data.data;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = !dateOverride || target.toDateString() === now.toDateString();

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

export function minutesUntilLeave(prayerTime: string, walkingMinutes: number): number {
  const leaveBy = calculateLeaveByTime(prayerTime, walkingMinutes);
  const [lh, lm] = leaveBy.split(":").map(Number);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
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
