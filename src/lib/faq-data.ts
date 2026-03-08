export interface FAQItem {
  q: string;
  a: string;
  link?: string;
  linkLabel?: string;
}

export const faqs: FAQItem[] = [
  {
    q: "How does MosqueSteps estimate my steps?",
    a: "MosqueSteps calculates the distance between your location and the mosque using GPS coordinates, then estimates steps based on average stride length (~0.75m per step). For more accurate tracking, we use your device's motion sensors when available.",
  },
  {
    q: "How does the app know I'm going to the mosque?",
    a: "The app uses your saved mosque locations combined with prayer times and your proximity. You can also manually start and stop tracking for full control.",
  },
  {
    q: "Is my location data private?",
    a: "Yes. Your location data stays on your device. We don't share it with third parties. GPS is only used to calculate routes and prayer times.",
    link: "/privacy",
    linkLabel: "Read our Privacy Policy",
  },
  {
    q: "Are the hadith references authentic?",
    a: "Yes. Every hadith in the app comes from authenticated collections (Sahih Bukhari, Sahih Muslim, Sunan Abi Dawud, etc.) with proper citations and links to Sunnah.com.",
    link: "/sunnah",
    linkLabel: "View Sunnah & Hadiths",
  },
  {
    q: "Does the app drain my battery?",
    a: "No. MosqueSteps uses efficient GPS queries only when calculating routes. Step estimation is done locally without continuous tracking.",
  },
  {
    q: "Can I add multiple mosques?",
    a: "Yes! You can search for and save multiple mosques, then select which one you're walking to for each prayer.",
    link: "/mosques",
    linkLabel: "Find mosques near you",
  },
  {
    q: "How do I install MosqueSteps on my phone?",
    a: "MosqueSteps is a Progressive Web App (PWA). On Android, open it in Chrome and tap 'Add to Home Screen' from the menu. On iOS, open it in Safari, tap the Share button, then 'Add to Home Screen'. It works offline after installation.",
    link: "/guides/getting-started",
    linkLabel: "Getting Started Guide",
  },
  {
    q: "What are hasanat and how are they calculated?",
    a: "Hasanat are spiritual rewards. Based on authentic hadiths, each step to the mosque erases a sin and raises your rank by one degree. The app estimates hasanat using your step count — the further you walk, the more you earn.",
    link: "/sunnah",
    linkLabel: "Learn about the Sunnah basis",
  },
  {
    q: "Why is my step count different from my fitness tracker?",
    a: "MosqueSteps estimates steps based on GPS distance and average stride length. Hardware fitness trackers use accelerometers for more precise counting. When your device supports motion sensors, MosqueSteps uses them too for better accuracy.",
    link: "/guides/troubleshooting",
    linkLabel: "Troubleshooting Guide",
  },
  {
    q: "Can I use MosqueSteps without GPS?",
    a: "Yes! You can manually enter your mosque's distance or search for a mosque by name. The app will estimate your steps and hasanat based on the distance. GPS just makes it automatic.",
  },
  {
    q: "Does MosqueSteps work offline?",
    a: "Yes. Once installed as a PWA, the app caches prayer times and your saved mosques. You can start walks and track steps offline. Data syncs when you reconnect.",
  },
  {
    q: "How do streaks work?",
    a: "A streak counts consecutive calendar days where you completed at least one walk to the mosque. Miss a day and the streak resets. Your longest streak is always saved so you can try to beat your personal best.",
    link: "/stats",
    linkLabel: "View your stats",
  },
  {
    q: "Is MosqueSteps free?",
    a: "Yes, completely free with no ads, no login required, and no data collection. It's an open-source project built for the Muslim community.",
    link: "/contribute",
    linkLabel: "Contribute to the project",
  },
  {
    q: "How do I get turn-by-turn directions?",
    a: "When you start a walk, MosqueSteps fetches a walking route using OSRM (or Mapbox if configured). You'll see step-by-step directions on the map with voice alerts for upcoming turns.",
    link: "/walk",
    linkLabel: "Start a walk",
  },
];
