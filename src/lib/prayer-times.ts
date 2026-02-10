export interface PrayerTime {
  name: string;
  time: string;
  arabicName: string;
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

export async function fetchPrayerTimes(
  latitude: number,
  longitude: number
): Promise<{ prayers: PrayerTime[]; hijriDate: string; readableDate: string }> {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  const res = await fetch(
    `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${latitude}&longitude=${longitude}&method=2`
  );
  const data = await res.json();
  const d: PrayerTimesData = data.data;

  const prayers: PrayerTime[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map(
    (name) => ({
      name,
      time: d.timings[name as keyof typeof d.timings],
      arabicName: PRAYER_ARABIC[name],
    })
  );

  return {
    prayers,
    hijriDate: `${d.date.hijri.date} ${d.date.hijri.month.en} ${d.date.hijri.year}`,
    readableDate: d.date.readable,
  };
}

export function calculateLeaveByTime(
  prayerTime: string,
  walkingMinutes: number
): string {
  const [hours, minutes] = prayerTime.split(":").map(Number);
  let totalMinutes = hours * 60 + minutes - walkingMinutes - 5; // 5 min buffer
  if (totalMinutes < 0) totalMinutes += 24 * 60; // wrap past midnight
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m < 0 ? m + 60 : m).padStart(2, "0")}`;
}

export function estimateSteps(distanceKm: number): number {
  // Average stride length ~0.75m, so ~1333 steps per km
  return Math.round(distanceKm * 1333);
}

export function estimateWalkingTime(distanceKm: number, speedKmh: number = 5): number {
  return Math.round((distanceKm / speedKmh) * 60);
}

export function calculateHasanat(steps: number): number {
  // Each step to the mosque: one sin erased + one degree raised = 2 hasanat per step
  return steps * 2;
}
