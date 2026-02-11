# MosqueSteps — Improvements Roadmap

## 🔥 High Priority

### 1. Social Walking Features
- **Group walks**: Let friends walk together and see each other's progress in real-time
- **Community leaderboard**: Anonymous or opt-in weekly leaderboard for mosque walking
- **Walking buddies**: Match users walking to the same mosque at the same time
- **Share walk cards**: Generate shareable image cards with walk stats for WhatsApp/Instagram

### 2. Enhanced Prayer Tracking
- **Daily prayer log**: Track all 5 prayers (not just walked ones) to show overall consistency
- **Transport method per prayer**: Walk, drive, prayed at home, missed — full tracking
- **Qada tracking**: Track make-up prayers
- **Jumuah (Friday) special**: Dedicated Friday prayer tracking with Sunnah reminders

### 3. Mosque Community Features
- **Mosque check-in**: NFC or GPS-based check-in at the mosque
- **Mosque events**: Community bulletin for each mosque (classes, events, announcements)
- **Mosque ratings & reviews**: Help users find welcoming mosques
- **Parking info**: Crowdsourced parking availability

### 4. Health & Fitness Integration
- **Apple Health / Google Fit sync**: Import/export step data
- **Heart rate tracking**: For users with wearables
- **Calorie estimation**: Based on weight, speed, and distance
- **Walking plans**: 30-day challenges ("Walk to Fajr every day this month")
- **Post-meal walking reminders**: Islamic + health angle

## 🎯 Medium Priority

### 5. Gamification Enhancements
- **Seasonal challenges**: Ramadan walking challenge, Hajj preparation challenge
- **Community badges**: Unlocked by group participation
- **Badge sharing**: Share earned badges on social media
- **Points shop**: Redeem hasanat points for digital rewards (wallpapers, themes)

### 6. Content & Education
- **Daily hadith**: Rotating hadith about walking, prayer, mosque
- **Sunnah tips**: Contextual tips based on time of day and prayer
- **Audio content**: Listen to Quran recitation during walks
- **Walking meditation**: Guided dhikr during walks

### 7. Accessibility
- **Voice guidance**: Turn-by-turn voice directions to mosque
- **Large text mode**: For elderly users
- **High contrast mode**: Better visibility
- **RTL support**: Full Arabic, Urdu, Farsi interface
- **Multilingual**: Turkish, Malay, Indonesian, French, German

### 8. Offline & Performance
- **Full offline mode**: Cache prayer times for a week ahead
- **Background step counting**: Service Worker-based counting
- **Battery optimization**: Reduce GPS polling when stationary
- **Tile caching**: Pre-cache map tiles for home-to-mosque route

## 💡 Nice to Have

### 9. Analytics & Insights
- **Monthly reports**: PDF/email summary of walking achievements
- **Year in review**: Annual summary with stats and milestones
- **Prayer time trends**: Show how prayer times shift through seasons
- **Walking patterns**: Identify which prayers you're most/least consistent with

### 10. Platform Expansion
- **Apple Watch companion**: Glanceable walk progress
- **Android Wear**: Walking notifications and tracking
- **Widget**: Home screen widget showing next prayer and leave-by time
- **Telegram/WhatsApp bot**: Daily prayer time reminders

### 11. Data & Privacy
- **Cloud sync**: Optional end-to-end encrypted sync across devices
- **Family sharing**: Parents can see children's mosque walking habits
- **Data export**: CSV, JSON, PDF export options
- **Account deletion**: One-click data wipe

### 12. Mosque Discovery
- **Walking distance filter**: Only show mosques within walking distance
- **Accessibility info**: Wheelchair access, elevator, parking
- **Prayer time accuracy**: User-reported adjustments per mosque
- **Photo gallery**: Community-uploaded mosque photos

## 📊 Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Daily active users | 1,000+ | — |
| Avg walks per user/week | 10+ | — |
| 7-day retention | 40%+ | — |
| PWA install rate | 30%+ | — |
| Notification opt-in | 50%+ | — |
| Avg session duration | 3+ min | — |

## 🏗️ Technical Debt

- [ ] Refactor `prayer-times.ts` (256 lines) into smaller modules
- [ ] Add E2E tests with Playwright
- [x] Implement error boundary for app (ErrorBoundary with "Back to home" fallback)
- [ ] Add Sentry or similar error tracking
- [ ] Optimize bundle size (analyze with `vite-bundle-visualizer`)
- [ ] Add proper loading skeletons instead of spinners
- [ ] Implement proper service worker update flow
- [ ] Add rate limiting for API calls (Nominatim, Aladhan)
