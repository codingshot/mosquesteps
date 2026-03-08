/**
 * Map tile providers with automatic dark mode support.
 */

export interface TileConfig {
  url: string;
  attribution: string;
  maxZoom: number;
}

const OSM_LIGHT: TileConfig = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
};

const CARTO_DARK: TileConfig = {
  url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
  maxZoom: 20,
};

const CARTO_VOYAGER: TileConfig = {
  url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
  maxZoom: 20,
};

/** Get whether dark mode is currently active */
export function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

/** Get the appropriate tile config based on current theme */
export function getTileConfig(preferVoyager = true): TileConfig {
  if (isDarkMode()) return CARTO_DARK;
  return preferVoyager ? CARTO_VOYAGER : OSM_LIGHT;
}

/** All available tile configs for manual selection */
export const TILE_PROVIDERS = {
  osm: OSM_LIGHT,
  cartoDark: CARTO_DARK,
  cartoVoyager: CARTO_VOYAGER,
} as const;
