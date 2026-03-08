# Converting MosqueSteps to a Native Mobile App

This guide covers three paths for turning MosqueSteps into a mobile app: **PWA (recommended)**, **Capacitor (native)**, and **Expo (not recommended)**.

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

## Option 2: Native App with Capacitor (Recommended for App Stores)

For App Store / Play Store distribution with full native access.

### Prerequisites
- **macOS** with Xcode 15+ (for iOS)
- **Android Studio** (for Android)
- **Node.js 18+** and **npm**

### Step 1: Install Dependencies

```bash
npm install @capacitor/core
npm install -D @capacitor/cli
npm install @capacitor/ios @capacitor/android
```

### Step 2: Initialize Capacitor

```bash
npx cap init "MosqueSteps" "app.lovable.f8fb1d314163447a833c9a27d2c185ac" --web-dir dist
```

### Step 3: Configure `capacitor.config.ts`

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f8fb1d314163447a833c9a27d2c185ac',
  appName: 'MosqueSteps',
  webDir: 'dist',
  server: {
    // Hot-reload from the Lovable sandbox preview during development
    url: 'https://f8fb1d31-4163-447a-833c-9a27d2c185ac.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
```

> **Note:** Remove the `server` block for production builds so the app uses the bundled `dist/` folder.

### Step 4: Add Platforms

```bash
npx cap add ios
npx cap add android
```

### Step 5: Install Native Plugins

```bash
# Essential plugins for MosqueSteps
npm install @capacitor/geolocation    # GPS tracking for walks
npm install @capacitor/motion         # Accelerometer for step counting
npm install @capacitor/local-notifications  # Prayer departure reminders
npm install @capacitor/haptics        # Turn-by-turn vibration alerts
npm install @capacitor/share          # Share walk cards with friends
npm install @capacitor/preferences    # Native key-value storage
npm install @capacitor/status-bar     # Status bar control
npm install @capacitor/splash-screen  # Launch screen
```

### Step 6: iOS Configuration

Add to `ios/App/App/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>MosqueSteps needs your location to find nearby mosques and track your walk.</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>MosqueSteps tracks your walk to the mosque in the background.</string>
<key>NSMotionUsageDescription</key>
<string>MosqueSteps uses motion sensors to count your steps accurately.</string>
```

### Step 7: Android Configuration

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

### Step 8: Build and Run

```bash
# Build the web app
npm run build

# Sync web assets to native projects
npx cap sync

# Run on device/emulator
npx cap run ios       # Requires Mac + Xcode
npx cap run android   # Requires Android Studio

# Or open in IDE
npx cap open ios
npx cap open android
```

### Step 9: Production Release

1. Remove the `server` block from `capacitor.config.ts`
2. Run `npm run build`
3. Run `npx cap sync`
4. Open Xcode / Android Studio
5. Configure signing certificates (Apple Developer Account / Google Play Console)
6. Archive and submit to App Store / Play Store

### Development Workflow

After making changes in Lovable:
1. Export to GitHub and `git pull`
2. Run `npm install` (if dependencies changed)
3. Run `npm run build`
4. Run `npx cap sync`
5. Run `npx cap run ios` or `npx cap run android`

With the `server.url` set to the Lovable preview, changes appear live on your device without rebuilding.

---

## Option 3: Expo / React Native — NOT Recommended ❌

Expo requires React Native components. You'd need to rewrite **every component** from React DOM to React Native:
- All Leaflet maps → react-native-maps
- All Tailwind CSS → StyleSheet or NativeWind
- All HTML elements → React Native primitives
- All browser APIs → React Native equivalents

**Estimated effort:** 3-6 months of full rewrite vs. 1-2 days with Capacitor.

Only consider Expo if you need features that Capacitor absolutely cannot provide (which is rare for this app).

---

## Comparison Table

| Feature | PWA | Capacitor | Expo |
|---|---|---|---|
| Setup time | Already done | 1-2 days | 3-6 months |
| App Store listing | ❌ | ✅ | ✅ |
| Code rewrite needed | None | None | Complete |
| Offline support | ✅ | ✅ | ✅ |
| GPS tracking | ✅ | ✅ (better) | ✅ |
| Step counting | ✅ (Web API) | ✅ (native) | ✅ (native) |
| Push notifications | Partial (iOS) | ✅ | ✅ |
| Background execution | Limited | ✅ | ✅ |
| Map library | Leaflet | Leaflet (same) | react-native-maps |

---

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Lovable Mobile App Blog Post](https://lovable.dev/blog/lovable-mobile-app)
- [Apple Developer Program](https://developer.apple.com/programs/)
- [Google Play Console](https://play.google.com/console/)
