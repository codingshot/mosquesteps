/** Fetch current weather from Open-Meteo (no API key required). */

export interface WeatherCondition {
  temperatureC: number;
  windspeedKmh: number;
  weatherCode: number; // WMO code
  description: string;
  emoji: string;
  /** Speed adjustment factor: 1.0 = normal, <1 = slower due to weather */
  speedFactor: number;
  /** Human-readable walking advice */
  advice: string;
}

// WMO weather interpretation codes → label + emoji
function interpretCode(code: number): { description: string; emoji: string } {
  if (code === 0) return { description: "Clear sky", emoji: "☀️" };
  if (code <= 2) return { description: "Partly cloudy", emoji: "⛅" };
  if (code === 3) return { description: "Overcast", emoji: "☁️" };
  if (code <= 49) return { description: "Foggy", emoji: "🌫️" };
  if (code <= 57) return { description: "Drizzle", emoji: "🌦️" };
  if (code <= 67) return { description: "Rainy", emoji: "🌧️" };
  if (code <= 77) return { description: "Snowy", emoji: "❄️" };
  if (code <= 82) return { description: "Rain showers", emoji: "🌧️" };
  if (code <= 86) return { description: "Snow showers", emoji: "🌨️" };
  if (code <= 99) return { description: "Thunderstorm", emoji: "⛈️" };
  return { description: "Unknown", emoji: "🌡️" };
}

function computeSpeedFactor(code: number, windspeedKmh: number, tempC: number): number {
  let factor = 1.0;
  // Rain / snow / thunderstorm → slower
  if (code >= 51 && code <= 67) factor *= 0.90; // drizzle/rain
  if (code >= 71 && code <= 77) factor *= 0.80; // snow
  if (code >= 80 && code <= 82) factor *= 0.88; // showers
  if (code >= 95) factor *= 0.85; // thunderstorm
  // Strong wind
  if (windspeedKmh > 40) factor *= 0.90;
  if (windspeedKmh > 60) factor *= 0.82;
  // Extreme heat or cold
  if (tempC > 38) factor *= 0.90;
  if (tempC < 0) factor *= 0.88;
  return Math.max(0.6, Math.min(1.0, factor));
}

function buildAdvice(code: number, windspeedKmh: number, tempC: number): string {
  const tips: string[] = [];
  if (code >= 51 && code <= 82) tips.push("Bring an umbrella ☂️");
  if (code >= 71 && code <= 77) tips.push("Dress warmly for snow");
  if (code >= 95) tips.push("Consider delaying your walk ⚠️");
  if (windspeedKmh > 40) tips.push("Strong winds — allow extra time");
  if (tempC > 35) tips.push("Stay hydrated in the heat 💧");
  if (tempC < 5) tips.push("Dress warmly 🧥");
  return tips.length ? tips.join(" · ") : "Good conditions for walking 👍";
}

const WEATHER_CACHE_KEY = "mosquesteps_weather";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CachedWeather {
  lat: number;
  lng: number;
  data: WeatherCondition;
  ts: number;
}

function getCached(lat: number, lng: number): WeatherCondition | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const c: CachedWeather = JSON.parse(raw);
    if (Date.now() - c.ts > CACHE_TTL_MS) return null;
    if (Math.abs(c.lat - lat) > 0.05 || Math.abs(c.lng - lng) > 0.05) return null;
    return c.data;
  } catch { return null; }
}

function setCached(lat: number, lng: number, data: WeatherCondition) {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ lat, lng, data, ts: Date.now() }));
  } catch {}
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherCondition | null> {
  const cached = getCached(lat, lng);
  if (cached) return cached;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current_weather=true&wind_speed_unit=kmh`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const cw = json?.current_weather;
    if (!cw) return null;

    const code = Number(cw.weathercode ?? 0);
    const windspeedKmh = Number(cw.windspeed ?? 0);
    const temperatureC = Number(cw.temperature ?? 20);
    const { description, emoji } = interpretCode(code);
    const speedFactor = computeSpeedFactor(code, windspeedKmh, temperatureC);
    const advice = buildAdvice(code, windspeedKmh, temperatureC);

    const result: WeatherCondition = { temperatureC, windspeedKmh, weatherCode: code, description, emoji, speedFactor, advice };
    setCached(lat, lng, result);
    return result;
  } catch {
    return null;
  }
}
