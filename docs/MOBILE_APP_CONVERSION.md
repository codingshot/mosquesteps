# Converting MosqueSteps to a Native Mobile App

This guide covers two paths for turning MosqueSteps into a mobile app: **PWA (recommended)** and **Capacitor (native)**.

---

## Option 1: Progressive Web App (PWA) — Already Built ✅

MosqueSteps is already a fully installable PWA. Users can install it from any mobile browser.

### How Users Install

**Android (Chrome)**
1. Visit [mosquesteps.com](https://mosquesteps.com)
2. Tap the browser menu (⋮)
3. Tap **"Add to Home Screen"** or **"Install App"**
4. Confirm — the app icon appears on your home screen

**iOS (Safari)**
1. Visit [mosquesteps.com](https://mosquesteps.com) in Safari
2. Tap the **Share** button (box with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **Add** — the app icon appears on your home screen

### PWA Features Available
- ✅ Offline support via service worker
- ✅ Home screen icon with splash screen
- ✅ Full-screen mode (no browser chrome)
- ✅ Push notifications (Android, limited on iOS)
- ✅ GPS and device motion sensors
- ✅ Works on all platforms

### PWA Limitations
- ❌ No App Store / Play Store listing
- ❌ Limited background execution on iOS
- ❌ No access to some native APIs (Bluetooth, NFC)

---

## Option 2: Native App with Capacitor

For App Store / Play Store distribution with full native access.

### Prerequisites
- **macOS** with Xcode 15+ (for iOS)
- **Android Studio** (for Android)
- **Node.js 18+** and **npm**

### Step 1: Install Dependencies

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

### Step 2: Initialize Capacitor

```bash
npx cap init "MosqueSteps" "app.mosquesteps.walk" --web-dir dist
```

### Step 3: Configure `capacitor.config.ts`

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.mosquesteps.walk',
  appName: 'MosqueSteps',
  webDir: 'dist',
  server: {
    // For development only — remove for production builds
    // url: 'http://YOUR_LOCAL_IP:5173',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0c1e1f',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0c1e1f',
    },
    Geolocation: {
      // Required for mosque finder and walk tracking
    },
    Motion: {
      // Required for step counting
    },
    LocalNotifications: {
      // Required for prayer reminders
    },
  },
};

export default config;
```

### Step 4: Add Platforms

```bash
npx cap add ios
npx cap add android
```

### Step 5: Build & Sync

```bash
npm run build
npx cap sync
```

### Step 6: Run on Device

```bash
# iOS (requires Mac + Xcode)
npx cap run ios

# Android (requires Android Studio)
npx cap run android
```

### Step 7: Add Native Plugins

For enhanced native features, install these Capacitor plugins:

```bash
# Geolocation (GPS tracking for walks)
npm install @capacitor/geolocation

# Motion sensors (step counting)
npm install @capacitor/motion

# Local notifications (prayer reminders)
npm install @capacitor/local-notifications

# Haptics (turn-by-turn vibration)
npm install @capacitor/haptics

# Status bar styling
npm install @capacitor/status-bar

# Splash screen
npm install @capacitor/splash-screen

# Share (share walk cards)
npm install @capacitor/share

# App (handle deep links)
npm install @capacitor/app
```

After installing plugins:
```bash
npx cap sync
```

### Step 8: iOS-Specific Setup

In Xcode, add these to `Info.plist`:

```xml
<!-- Location (required for mosque finder + walk tracking) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>MosqueSteps needs your location to find nearby mosques and track your walking route.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>MosqueSteps uses background location to track your walk to the mosque accurately.</string>

<!-- Motion (required for step counting) -->
<key>NSMotionUsageDescription</key>
<string>MosqueSteps uses motion sensors to count your steps as you walk to the mosque.</string>
```

### Step 9: Android-Specific Setup

In `android/app/src/main/AndroidManifest.xml`, add:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

### Step 10: Production Build

```bash
# Build the web app
npm run build

# Sync to native projects
npx cap sync

# Open in IDE for final build
npx cap open ios      # Opens Xcode
npx cap open android  # Opens Android Studio
```

Then use Xcode / Android Studio to create signed release builds for the App Store / Play Store.

---

## Option 3: Expo (React Native)

> ⚠️ **Not recommended** — MosqueSteps is built with React (web) + Leaflet maps. Converting to React Native would require rewriting most components. Capacitor wraps the existing web app with zero rewrites.

If you still want Expo:
1. Create a new Expo project: `npx create-expo-app MosqueSteps`
2. Port components from React DOM to React Native equivalents
3. Replace Leaflet with `react-native-maps`
4. Replace `localStorage` with `@react-native-async-storage/async-storage`
5. Use `expo-location` for GPS and `expo-sensors` for step counting

**Estimated effort**: 4-8 weeks vs. 1-2 days with Capacitor.

---

## Recommended Path

| Criteria | PWA | Capacitor | Expo |
|---|---|---|---|
| Setup time | ✅ Already done | 1-2 days | 4-8 weeks |
| Code changes | None | Minimal | Full rewrite |
| App Store listing | ❌ | ✅ | ✅ |
| Offline support | ✅ | ✅ | ✅ |
| GPS/Motion sensors | ✅ | ✅ | ✅ |
| Push notifications | Partial | ✅ | ✅ |
| Background tracking | Limited | ✅ | ✅ |

**For most users**: PWA is the best choice — it's already live and works everywhere.

**For App Store presence**: Use Capacitor — wraps the existing app with native shell in 1-2 days.
