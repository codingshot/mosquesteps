export const brandColors = [
  { name: "Primary Teal", token: "--primary", lightHSL: "174 80% 26%", darkHSL: "174 70% 40%", hex: "#0D7377", rgb: "13, 115, 119", usage: "Buttons, links, headers, navigation" },
  { name: "Accent Gold", token: "--accent", lightHSL: "39 95% 55%", darkHSL: "39 90% 50%", hex: "#FABB51", rgb: "250, 187, 81", usage: "Badges, highlights, rewards, CTAs" },
  { name: "Background Cream", token: "--background", lightHSL: "42 100% 97%", darkHSL: "215 30% 8%", hex: "#FFFCF0", rgb: "255, 252, 240", usage: "Page backgrounds" },
  { name: "Foreground", token: "--foreground", lightHSL: "215 30% 15%", darkHSL: "42 100% 95%", hex: "#1B2638", rgb: "27, 38, 56", usage: "Body text, headings" },
  { name: "Gold Light", token: "--gold-light", lightHSL: "39 95% 75%", darkHSL: "39 80% 35%", hex: "#FCD98F", rgb: "252, 217, 143", usage: "Subtle gold highlights" },
  { name: "Gold Dark", token: "--gold-dark", lightHSL: "39 95% 40%", darkHSL: "39 95% 60%", hex: "#C78B08", rgb: "199, 139, 8", usage: "Gold gradients" },
  { name: "Teal Light", token: "--teal-light", lightHSL: "174 40% 92%", darkHSL: "174 30% 15%", hex: "#E0F2F1", rgb: "224, 242, 241", usage: "Secondary backgrounds" },
  { name: "Teal Dark", token: "--teal-dark", lightHSL: "174 80% 18%", darkHSL: "174 70% 50%", hex: "#094D4F", rgb: "9, 77, 79", usage: "Dark gradients" },
  { name: "Muted", token: "--muted", lightHSL: "42 20% 92%", darkHSL: "215 20% 18%", hex: "#ECE9E0", rgb: "236, 233, 224", usage: "Disabled states, borders" },
  { name: "Destructive", token: "--destructive", lightHSL: "0 84% 60%", darkHSL: "0 63% 31%", hex: "#EF4444", rgb: "239, 68, 68", usage: "Errors, delete actions" },
];

export const brandFonts = [
  { name: "Plus Jakarta Sans", weights: ["300 Light", "400 Regular", "500 Medium", "600 SemiBold", "700 Bold", "800 ExtraBold"], usage: "Headings & body text", sample: "Turn every step into a blessing", css: "'Plus Jakarta Sans', system-ui, sans-serif" },
  { name: "Amiri", weights: ["400 Regular", "700 Bold"], usage: "Arabic text & Quranic references", sample: "بسم الله الرحمن الرحيم", css: "'Amiri', serif" },
];

export const brandButtons = [
  { variant: "default", label: "Primary Button", description: "Main actions — start walk, save settings" },
  { variant: "hero", label: "Hero CTA", description: "Landing page call-to-action with gold gradient" },
  { variant: "hero-outline", label: "Hero Outline", description: "Secondary CTA on landing pages" },
  { variant: "outline", label: "Outline", description: "Secondary actions, toggles" },
  { variant: "secondary", label: "Secondary", description: "Less prominent actions" },
  { variant: "ghost", label: "Ghost", description: "Toolbar actions, icon buttons" },
  { variant: "destructive", label: "Destructive", description: "Delete, remove, cancel" },
  { variant: "link", label: "Link", description: "Inline text actions" },
];

export const brandIcons = [
  { name: "Navigation", icons: ["ArrowLeft", "ArrowRight", "ChevronRight", "Home", "Settings2"], usage: "Page navigation, back buttons" },
  { name: "Islamic", icons: ["🕌", "🤲", "📿", "☪️", "🌙"], usage: "Prayer features, mosque markers" },
  { name: "Walking", icons: ["Footprints", "MapPin", "Navigation", "Route", "Play"], usage: "Walk tracking, distance" },
  { name: "Rewards", icons: ["Star", "Trophy", "Flame", "TrendingUp", "Target"], usage: "Badges, streaks, achievements" },
  { name: "Utility", icons: ["Bell", "Clock", "Download", "Settings2", "Info"], usage: "Notifications, time, export" },
];

export const brandPersonas = [
  { name: "Yusuf, 25", emoji: "👨‍💻", description: "Tech-savvy young professional. Wants to build a consistent habit of walking to the mosque. Motivated by gamification and tracking.", needs: ["Quick setup", "Step tracking accuracy", "Streak motivation"] },
  { name: "Fatima, 35", emoji: "👩‍👧", description: "Mother of two. Walks to the local mosque when possible. Values simplicity and privacy.", needs: ["Privacy-first approach", "Simple interface", "Prayer reminders"] },
  { name: "Ahmad, 55", emoji: "👨‍🦳", description: "Retired elder. Walks daily for health and spiritual reward. Needs accessibility and clear text.", needs: ["Large readable text", "Health insights", "Accessible design"] },
  { name: "Khadijah, 20", emoji: "👩‍🎓", description: "University student discovering her practice. Interested in learning about Sunnah and spiritual rewards.", needs: ["Hadith references", "Educational content", "Social sharing"] },
];

export const brandDos = [
  "Use authentic hadith with source references (e.g., Sahih Muslim 666)",
  "Always include ﷺ after mentioning the Prophet Muhammad",
  "Use 'Allah' rather than 'God' in Islamic contexts",
  "Maintain warm, encouraging tone — never judgmental",
  "Respect all madhabs — avoid controversial positions",
  "Credit OpenStreetMap for map data",
  "Ensure WCAG AA contrast ratios (4.5:1 minimum)",
  "Use semantic HTML and proper heading hierarchy",
  "Support both light and dark modes consistently",
  "Keep data local — respect user privacy",
  "Use 'hasanat' (حسنات) for spiritual rewards",
  "Link to sunnah.com for hadith verification",
];

export const brandDonts = [
  "Don't use unverified or weak hadiths without labeling them",
  "Don't use religious imagery that may be considered disrespectful",
  "Don't collect or transmit user location data to servers",
  "Don't use fear-based messaging — always encourage",
  "Don't promise specific spiritual outcomes — use 'InshaAllah'",
  "Don't use generic stock photos of mosques — use app screenshots",
  "Don't hardcode colors — always use design tokens",
  "Don't skip alt text on images or icons",
  "Don't use Inter, Poppins, or other generic AI fonts",
  "Don't mix purple gradients — stay within teal/gold palette",
  "Don't use 'steps' and 'hasanat' interchangeably — they're different",
  "Don't assume user's gender or level of Islamic practice",
];

export const aiPrompts = [
  { category: "Blog Posts", prompt: "Write a 600-word blog post for MosqueSteps about [TOPIC]. Tone: warm, encouraging, Islamic. Include 1-2 authentic hadith references with source (e.g., Sahih Muslim 666). Use 'the Prophet ﷺ' format. Target audience: Muslim adults who walk to the mosque. End with a practical tip and subtle CTA to try the MosqueSteps app.", example: "Topic: The spiritual rewards of walking to Fajr prayer" },
  { category: "Social Media", prompt: "Write a social media post for MosqueSteps. Platform: [Instagram/Twitter/Facebook]. Tone: inspiring, concise. Include one hadith about walking to the mosque. Use relevant emojis (🕌 🚶‍♂️ ⭐). Add 3-5 hashtags: #MosqueSteps #WalkToMosque #IslamicFitness. Max 280 chars for Twitter, 2200 for Instagram.", example: "Every step to the mosque is a blessing 🕌🚶‍♂️" },
  { category: "App Store Description", prompt: "Write an app store description for MosqueSteps in [language]. Highlight: step tracking, prayer times, mosque finder, spiritual rewards (hasanat), offline & privacy-first, free & open. Max 4000 characters. Include keywords: mosque walking, prayer times, Islamic fitness, hasanat tracker, Muslim app.", example: "MosqueSteps — Track your blessed walk to the mosque" },
  { category: "Email Newsletter", prompt: "Write a weekly email for MosqueSteps subscribers. Subject line under 50 chars. Include: one walking tip, one hadith about walking to the mosque, a feature highlight, and a CTA. Tone: personal, warm, like a friend reminding you. Sign off with 'JazakAllahu Khairan'.", example: "Subject: Your weekly walking summary 🚶‍♂️" },
  { category: "Image Generation", prompt: "Generate a social media graphic for MosqueSteps. Style: clean, modern, teal (#0D7377) and gold (#FABB51) color scheme. Show a peaceful mosque scene with a walking path. Include text overlay: '[YOUR TEXT]'. Aspect ratio: 1:1 for Instagram, 16:9 for Twitter header. No faces or figurative art.", example: "Every step earns a blessing — start walking today" },
];

export const marketingIdeas = [
  { title: "Ramadan Walking Challenge", description: "30-day challenge to walk to every prayer. Daily leaderboard, special Ramadan badges, and community sharing.", channel: "Social + In-App" },
  { title: "Mosque Partnership Program", description: "Partner with local mosques to promote walking. QR codes at mosque entrances linking to the app.", channel: "Local Community" },
  { title: "Jumuah Friday Feature", description: "Weekly Friday social post highlighting walking stats community-wide. 'This Jumuah, our community walked X steps.'", channel: "Instagram + Twitter" },
  { title: "Health x Deen Series", description: "Blog series connecting Islamic walking traditions with modern health research. SEO-optimized for 'walking to mosque benefits'.", channel: "Blog + SEO" },
  { title: "Student Ambassador Program", description: "University MSA partnerships. Student ambassadors promote at campus mosques with exclusive badges.", channel: "Campus + Social" },
  { title: "Fajr Warriors Campaign", description: "Celebrate users who consistently walk to Fajr. Special badge, social sharing card, and featured stories.", channel: "In-App + Social" },
];

export const appRoutes = [
  { path: "/", label: "Landing Page", description: "Marketing homepage" },
  { path: "/dashboard", label: "Dashboard", description: "Prayer times & daily overview" },
  { path: "/walk", label: "Active Walk", description: "GPS walk tracking" },
  { path: "/mosques", label: "Mosque Finder", description: "Find & save mosques" },
  { path: "/rewards", label: "Rewards", description: "Badges & hadiths" },
  { path: "/stats", label: "Stats", description: "Walking analytics" },
  { path: "/history", label: "History", description: "Past walks" },
  { path: "/settings", label: "Settings", description: "Preferences" },
  { path: "/guides", label: "User Guides", description: "How-to guides" },
  { path: "/blogs", label: "Blog", description: "Articles & sunnah" },
  { path: "/sunnah", label: "Sunnah", description: "Walking in Islam" },
  { path: "/faq", label: "FAQ", description: "Common questions" },
  { path: "/brand", label: "Brand", description: "Brand guidelines" },
];
