import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { imagetools } from "vite-imagetools";

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
    imagetools(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "inline",
      includeAssets: ["favicon.png", "favicon.ico", "robots.txt"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
        navigateFallbackDenylist: [/^\/~oauth/],
        cleanupOutdatedCaches: true,
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
          {
            urlPattern: /^https:\/\/timeapi\.io\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "timezone-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 86400 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts-cache",
              expiration: { maxEntries: 30, maxAgeSeconds: 86400 * 365 },
            },
          },
        ],
      },
      manifest: {
        id: "/",
        name: "MosqueSteps — Track Your Blessed Walk",
        short_name: "MosqueSteps",
        description: "Track your walking journey to the mosque, view prayer times, and discover spiritual rewards. Every step is a blessing.",
        theme_color: "#0D7377",
        background_color: "#FFFCF0",
        display: "standalone",
        display_override: ["standalone", "browser"],
        orientation: "portrait",
        scope: "/",
        start_url: "/dashboard",
        categories: ["lifestyle", "health", "education"],
        prefer_related_applications: false,
        shortcuts: [
          { name: "Start Walk", short_name: "Walk", url: "/walk", icons: [{ src: "/favicon.png", sizes: "192x192" }] },
          { name: "Mosque Finder", short_name: "Mosques", url: "/mosques", icons: [{ src: "/favicon.png", sizes: "192x192" }] },
          { name: "Dashboard", short_name: "Home", url: "/dashboard", icons: [{ src: "/favicon.png", sizes: "192x192" }] },
        ],
        icons: [
          { src: "/favicon.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/favicon.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/favicon.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/favicon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-router": ["react-router-dom"],
          "vendor-ui": ["framer-motion", "lucide-react"],
          "vendor-leaflet": ["leaflet"],
        },
      },
    },
    cssCodeSplit: true,
  },
}));
