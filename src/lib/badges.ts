/**
 * Badge & gamification system
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  earned: boolean;
  earnedDate?: string;
  category?: string;
}

export interface BadgeProgress {
  badge: Badge;
  current: number;
  target: number;
  percent: number;
}

/** Detect if a given ISO date string falls in Ramadan (approximate via Hijri calendar) */
export function isRamadan(isoDate?: string): boolean {
  try {
    const date = isoDate ? new Date(isoDate) : new Date();
    // Use Intl to get Hijri calendar month
    const hijri = new Intl.DateTimeFormat("en-u-ca-islamic", { month: "numeric" }).format(date);
    return parseInt(hijri) === 9; // Ramadan = month 9
  } catch {
    return false;
  }
}

/** Detect if a given ISO date string is a Friday */
export function isFriday(isoDate?: string): boolean {
  const date = isoDate ? new Date(isoDate) : new Date();
  return date.getDay() === 5;
}

/** Detect if a walk was during Fajr or Isha (darkness prayers) */
export function isDarknessPrayer(prayer: string): boolean {
  return prayer === "Fajr" || prayer === "Isha";
}

const BADGE_DEFINITIONS = [
  // ── Walk count milestones ──────────────────────────────────────────
  { id: "first_steps", category: "milestone", name: "First Steps", description: "Complete your first walk to the mosque", icon: "👣", requirement: "1 walk", target: 1, check: (s: any) => s.totalWalks },
  { id: "ten_walks", category: "milestone", name: "Dedicated Walker", description: "Complete 10 walks to the mosque", icon: "🎯", requirement: "10 walks", target: 10, check: (s: any) => s.totalWalks },
  { id: "fifty_walks", category: "milestone", name: "Committed", description: "Complete 50 walks to the mosque", icon: "💎", requirement: "50 walks", target: 50, check: (s: any) => s.totalWalks },
  { id: "hundred_walks", category: "milestone", name: "Century Walker", description: "Complete 100 walks to the mosque", icon: "💯", requirement: "100 walks", target: 100, check: (s: any) => s.totalWalks },
  { id: "three_hundred", category: "milestone", name: "Unstoppable", description: "Complete 300 walks to the mosque", icon: "🚀", requirement: "300 walks", target: 300, check: (s: any) => s.totalWalks },

  // ── Streak badges ──────────────────────────────────────────────────
  { id: "week_warrior", category: "streak", name: "Week Warrior", description: "Walk to the mosque every day for 7 days", icon: "🔥", requirement: "7-day streak", target: 7, check: (s: any) => s.currentStreak },
  { id: "two_weeks", category: "streak", name: "Fortnight Flame", description: "Maintain a 14-day walking streak", icon: "⚡", requirement: "14-day streak", target: 14, check: (s: any) => s.longestStreak },
  { id: "month_strong", category: "streak", name: "Month Strong", description: "Maintain a 30-day walking streak", icon: "💪", requirement: "30-day streak", target: 30, check: (s: any) => s.longestStreak },
  { id: "three_months", category: "streak", name: "Iron Will", description: "Maintain a 90-day walking streak", icon: "🏔️", requirement: "90-day streak", target: 90, check: (s: any) => s.longestStreak },

  // ── Step milestones ────────────────────────────────────────────────
  { id: "thousand_steps", category: "steps", name: "1K Steps", description: "Accumulate 1,000 total steps to mosques", icon: "🏃", requirement: "1,000 steps", target: 1000, check: (s: any) => s.totalSteps },
  { id: "ten_k", category: "steps", name: "10K Walker", description: "Accumulate 10,000 total steps to mosques", icon: "⭐", requirement: "10,000 steps", target: 10000, check: (s: any) => s.totalSteps },
  { id: "hundred_k", category: "steps", name: "100K Legend", description: "Accumulate 100,000 total steps to mosques", icon: "🏆", requirement: "100,000 steps", target: 100000, check: (s: any) => s.totalSteps },
  { id: "million_steps", category: "steps", name: "Million Steps", description: "Accumulate 1,000,000 total steps to mosques", icon: "🌟", requirement: "1,000,000 steps", target: 1000000, check: (s: any) => s.totalSteps },

  // ── Distance badges ────────────────────────────────────────────────
  { id: "distance_5km", category: "distance", name: "5km Traveler", description: "Walk a total of 5 km to mosques", icon: "🗺️", requirement: "5 km total", target: 5, check: (s: any) => s.totalDistance },
  { id: "distance_marathon", category: "distance", name: "Marathon Walker", description: "Walk a total of 42 km to mosques", icon: "🏅", requirement: "42 km total", target: 42, check: (s: any) => s.totalDistance },
  { id: "distance_100km", category: "distance", name: "Century Pilgrim", description: "Walk a total of 100 km to mosques", icon: "🌍", requirement: "100 km total", target: 100, check: (s: any) => s.totalDistance },

  // ── Prayer-specific badges ─────────────────────────────────────────
  { id: "five_prayers", category: "prayer", name: "Full Day", description: "Walk to all 5 daily prayers in a single day", icon: "🌙", requirement: "5 prayers in one day", target: 5, check: (s: any) => Math.min(Object.keys(s.walksByPrayer || {}).length, 5) },
  { id: "fajr_hero", category: "prayer", name: "Fajr Hero", description: "Walk to Fajr prayer 10 times", icon: "🌅", requirement: "10 Fajr walks", target: 10, check: (s: any) => s.walksByPrayer?.Fajr || 0 },
  { id: "fajr_master", category: "prayer", name: "Dawn Master", description: "Walk to Fajr prayer 30 times — true devotion", icon: "🌄", requirement: "30 Fajr walks", target: 30, check: (s: any) => s.walksByPrayer?.Fajr || 0 },
  { id: "isha_light", category: "prayer", name: "Isha Light", description: "Walk to Isha prayer 10 times — promised perfect light", icon: "🌃", requirement: "10 Isha walks", target: 10, check: (s: any) => s.walksByPrayer?.Isha || 0 },
  { id: "isha_guardian", category: "prayer", name: "Night Guardian", description: "Walk to Isha prayer 30 times", icon: "🌌", requirement: "30 Isha walks", target: 30, check: (s: any) => s.walksByPrayer?.Isha || 0 },
  { id: "jumuah_regular", category: "prayer", name: "Jumuah Regular", description: "Walk to Jumuah prayer 4 times", icon: "🕌", requirement: "4 Jumuah walks", target: 4, check: (s: any) => s.walksByPrayer?.Jumuah || 0 },
  { id: "jumuah_faithful", category: "prayer", name: "Jumuah Faithful", description: "Walk to Jumuah prayer 12 times", icon: "📿", requirement: "12 Jumuah walks", target: 12, check: (s: any) => s.walksByPrayer?.Jumuah || 0 },
  { id: "darkness_walker", category: "prayer", name: "Darkness Walker", description: "Walk in darkness (Fajr or Isha) 20 times — promised complete light", icon: "✨", requirement: "20 Fajr/Isha walks", target: 20, check: (s: any) => (s.walksByPrayer?.Fajr || 0) + (s.walksByPrayer?.Isha || 0) },

  // ── Ramadan badges ─────────────────────────────────────────────────
  { id: "ramadan_walker", category: "ramadan", name: "Ramadan Walker", description: "Walk to the mosque during Ramadan", icon: "🌙", requirement: "1 Ramadan walk", target: 1, check: (s: any) => s.ramadanWalks || 0 },
  { id: "ramadan_devoted", category: "ramadan", name: "Ramadan Devoted", description: "Walk to the mosque 10 times during Ramadan", icon: "☪️", requirement: "10 Ramadan walks", target: 10, check: (s: any) => s.ramadanWalks || 0 },
  { id: "ramadan_champion", category: "ramadan", name: "Ramadan Champion", description: "Walk to the mosque 30 times during Ramadan", icon: "🏆", requirement: "30 Ramadan walks", target: 30, check: (s: any) => s.ramadanWalks || 0 },

  // ── Hasanat badges ─────────────────────────────────────────────────
  { id: "hasanat_10k", category: "hasanat", name: "10K Hasanat", description: "Earn 10,000 hasanat from walking", icon: "✨", requirement: "10,000 hasanat", target: 10000, check: (s: any) => s.totalHasanat },
  { id: "hasanat_100k", category: "hasanat", name: "100K Hasanat", description: "Earn 100,000 hasanat from walking", icon: "💫", requirement: "100,000 hasanat", target: 100000, check: (s: any) => s.totalHasanat },
  { id: "hasanat_million", category: "hasanat", name: "Million Hasanat", description: "Earn 1,000,000 hasanat — SubhanAllah!", icon: "🤲", requirement: "1,000,000 hasanat", target: 1000000, check: (s: any) => s.totalHasanat },

  // ── Special / Social ───────────────────────────────────────────────
  { id: "early_bird", category: "special", name: "Early Bird", description: "Walk to Fajr 5 times in a single week", icon: "🐦", requirement: "5 Fajr walks in a week", target: 5, check: (s: any) => s.fajrThisWeek || 0 },
  { id: "friday_streak", category: "special", name: "Friday Faithful", description: "Walk to Jumuah 4 weeks in a row", icon: "🕋", requirement: "4 consecutive Jumuahs", target: 4, check: (s: any) => s.jumuahStreak || 0 },
];

/** Extended stats including Ramadan and special tracking */
export interface ExtendedStats {
  ramadanWalks: number;
  fridayWalks: number;
  fajrThisWeek: number;
  jumuahStreak: number;
}

export function computeExtendedStats(history: Array<{ date: string; prayer: string }>): ExtendedStats {
  let ramadanWalks = 0;
  let fridayWalks = 0;

  // Fajr walks this week (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  let fajrThisWeek = 0;

  // Jumuah streak: consecutive Fridays with Jumuah walk
  // Find all Friday dates with Jumuah walks, sorted
  const jumuahDates = new Set<string>();

  for (const entry of history) {
    if (isRamadan(entry.date)) ramadanWalks++;
    if (isFriday(entry.date)) fridayWalks++;

    const d = new Date(entry.date);
    if (entry.prayer === "Fajr" && d >= weekAgo) fajrThisWeek++;
    if (entry.prayer === "Jumuah" && isFriday(entry.date)) {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay()); // Sunday of that week
      jumuahDates.add(`${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`);
    }
  }

  // Calculate Jumuah streak: consecutive weeks
  const sortedJumuahWeeks = [...jumuahDates].sort().reverse();
  let jumuahStreak = 0;
  const nowWeek = new Date();
  nowWeek.setDate(nowWeek.getDate() - nowWeek.getDay());
  for (let i = 0; i < sortedJumuahWeeks.length; i++) {
    const expectedWeek = new Date(nowWeek);
    expectedWeek.setDate(nowWeek.getDate() - i * 7);
    const expKey = `${expectedWeek.getFullYear()}-${String(expectedWeek.getMonth() + 1).padStart(2, "0")}-${String(expectedWeek.getDate()).padStart(2, "0")}`;
    if (sortedJumuahWeeks[i] === expKey) {
      jumuahStreak++;
    } else {
      break;
    }
  }

  return { ramadanWalks, fridayWalks, fajrThisWeek, jumuahStreak };
}

export function getBadges(stats: any): BadgeProgress[] {
  const stored = getEarnedBadges();

  return BADGE_DEFINITIONS.map((def) => {
    const current = def.check(stats);
    const earned = current >= def.target;
    const alreadyEarned = stored[def.id];

    // Store newly earned badges
    if (earned && !alreadyEarned) {
      stored[def.id] = new Date().toISOString();
      saveEarnedBadges(stored);
    }

    return {
      badge: {
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        requirement: def.requirement,
        earned,
        earnedDate: stored[def.id],
        category: def.category,
      },
      current: Math.min(current, def.target),
      target: def.target,
      percent: Math.min(100, (current / def.target) * 100),
    };
  });
}

export function getNewlyEarnedBadges(stats: any): Badge[] {
  const before = getEarnedBadges();
  // Check which badges would be earned without saving yet
  return BADGE_DEFINITIONS
    .filter((def) => {
      const current = def.check(stats);
      return current >= def.target && !before[def.id];
    })
    .map((def) => ({
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      requirement: def.requirement,
      earned: true,
      category: def.category,
    }));
}

export const BADGE_CATEGORIES: Record<string, { label: string; emoji: string }> = {
  milestone: { label: "Milestones", emoji: "🎯" },
  streak: { label: "Streaks", emoji: "🔥" },
  steps: { label: "Steps", emoji: "👣" },
  distance: { label: "Distance", emoji: "🗺️" },
  prayer: { label: "Prayer", emoji: "🕌" },
  ramadan: { label: "Ramadan", emoji: "🌙" },
  hasanat: { label: "Hasanat", emoji: "✨" },
  special: { label: "Special", emoji: "⭐" },
};

const BADGES_KEY = "mosquesteps_badges";

function getEarnedBadges(): Record<string, string> {
  try {
    const stored = localStorage.getItem(BADGES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveEarnedBadges(badges: Record<string, string>) {
  localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
}
