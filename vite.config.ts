import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "favicon.ico", "robots.txt"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.aladhan\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "prayer-times-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 3600 },
            },
          },
          {
            urlPattern: /^https:\/\/overpass-api\.de\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "mosque-search-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "geocoding-cache",
              expiration: { maxEntries: 30, maxAgeSeconds: 86400 * 7 },
            },
          },
          {
            urlPattern: /^https:\/\/.*tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 86400 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/router\.project-osrm\.org\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "osrm-routes-cache",
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 30, maxAgeSeconds: 86400 * 7 },
            },
          },
        ],
      },
      manifest: {
        name: "MosqueSteps — Track Your Blessed Walk",
        short_name: "MosqueSteps",
        description: "Track your walking journey to the mosque, view prayer times, and discover spiritual rewards. Every step is a blessing.",
        theme_color: "#0D7377",
        background_color: "#FFFCF0",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/dashboard",
        categories: ["lifestyle", "health", "education"],
        icons: [
          { src: "/favicon.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/favicon.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/favicon.png", sizes: "512x512", type: "image/png", purpose: "any" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
