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
}

export interface BadgeProgress {
  badge: Badge;
  current: number;
  target: number;
  percent: number;
}

const BADGE_DEFINITIONS = [
  { id: "first_steps", name: "First Steps", description: "Complete your first walk to the mosque", icon: "👣", requirement: "1 walk", target: 1, check: (s: any) => s.totalWalks },
  { id: "week_warrior", name: "Week Warrior", description: "Walk to the mosque every day for 7 days", icon: "🔥", requirement: "7-day streak", target: 7, check: (s: any) => s.currentStreak },
  { id: "month_strong", name: "Month Strong", description: "Maintain a 30-day walking streak", icon: "💪", requirement: "30-day streak", target: 30, check: (s: any) => s.longestStreak },
  { id: "thousand_steps", name: "1K Steps", description: "Accumulate 1,000 total steps to mosques", icon: "🏃", requirement: "1,000 steps", target: 1000, check: (s: any) => s.totalSteps },
  { id: "ten_k", name: "10K Walker", description: "Accumulate 10,000 total steps to mosques", icon: "⭐", requirement: "10,000 steps", target: 10000, check: (s: any) => s.totalSteps },
  { id: "hundred_k", name: "100K Legend", description: "Accumulate 100,000 total steps to mosques", icon: "🏆", requirement: "100,000 steps", target: 100000, check: (s: any) => s.totalSteps },
  { id: "five_prayers", name: "Full Day", description: "Walk to all 5 daily prayers in a single day", icon: "🌙", requirement: "5 prayers in one day", target: 5, check: (s: any) => Math.min(Object.keys(s.walksByPrayer || {}).length, 5) },
  { id: "fajr_hero", name: "Fajr Hero", description: "Walk to Fajr prayer 10 times", icon: "🌅", requirement: "10 Fajr walks", target: 10, check: (s: any) => s.walksByPrayer?.Fajr || 0 },
  { id: "isha_light", name: "Isha Light", description: "Walk to Isha prayer 10 times — promised perfect light", icon: "🌃", requirement: "10 Isha walks", target: 10, check: (s: any) => s.walksByPrayer?.Isha || 0 },
  { id: "jumuah_regular", name: "Jumuah Regular", description: "Walk to Jumuah prayer 4 times", icon: "🕌", requirement: "4 Jumuah walks", target: 4, check: (s: any) => s.walksByPrayer?.Jumuah || 0 },
  { id: "ten_walks", name: "Dedicated Walker", description: "Complete 10 walks to the mosque", icon: "🎯", requirement: "10 walks", target: 10, check: (s: any) => s.totalWalks },
  { id: "fifty_walks", name: "Committed", description: "Complete 50 walks to the mosque", icon: "💎", requirement: "50 walks", target: 50, check: (s: any) => s.totalWalks },
  { id: "hasanat_10k", name: "10K Hasanat", description: "Earn 10,000 hasanat from walking", icon: "✨", requirement: "10,000 hasanat", target: 10000, check: (s: any) => s.totalHasanat },
  { id: "distance_5km", name: "5km Traveler", description: "Walk a total of 5 km to mosques", icon: "🗺️", requirement: "5 km total", target: 5, check: (s: any) => s.totalDistance },
  { id: "distance_marathon", name: "Marathon Walker", description: "Walk a total of 42 km to mosques", icon: "🏅", requirement: "42 km total", target: 42, check: (s: any) => s.totalDistance },
];

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
      },
      current: Math.min(current, def.target),
      target: def.target,
      percent: Math.min(100, (current / def.target) * 100),
    };
  });
}

export function getNewlyEarnedBadges(stats: any): Badge[] {
  const before = getEarnedBadges();
  const badges = getBadges(stats);
  return badges
    .filter((bp) => bp.badge.earned && !before[bp.badge.id])
    .map((bp) => bp.badge);
}

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
