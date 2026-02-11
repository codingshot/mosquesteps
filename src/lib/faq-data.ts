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
  },
  {
    q: "Are the hadith references authentic?",
    a: "Yes. Every hadith in the app comes from authenticated collections (Sahih Bukhari, Sahih Muslim, Sunan Abi Dawud, etc.) with proper citations and links to Sunnah.com.",
  },
  {
    q: "Does the app drain my battery?",
    a: "No. MosqueSteps uses efficient GPS queries only when calculating routes. Step estimation is done locally without continuous tracking.",
  },
  {
    q: "Can I add multiple mosques?",
    a: "Yes! You can search for and save multiple mosques, then select which one you're walking to for each prayer.",
  },
];
