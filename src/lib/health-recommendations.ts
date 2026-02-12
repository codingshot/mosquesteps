import type { UserSettings } from "./walking-history";
import { AGE_MIN, AGE_MAX } from "./walking-history";

export interface HealthRecommendation {
  dailySteps: number;
  label: string;
  description: string;
  source: string;
}

/**
 * Clamp age to reasonable range for health recommendations.
 */
export function clampAgeForRecommendation(age: number | undefined): number {
  if (age == null || Number.isNaN(age)) return 30;
  if (age < AGE_MIN) return AGE_MIN;
  if (age > AGE_MAX) return AGE_MAX;
  return Math.round(age);
}

/**
 * Returns recommended daily steps based on age and gender.
 * Based on guidelines from WHO, CDC, and peer-reviewed research:
 * - Tudor-Locke et al. (2011) — step-based recommendations by age/gender
 * - WHO Physical Activity Guidelines (2020)
 * Age is clamped to [AGE_MIN, AGE_MAX].
 */
export function getStepRecommendation(age?: number, gender?: "male" | "female" | ""): HealthRecommendation {
  const a = clampAgeForRecommendation(age ?? 30);
  const g = gender || "male";

  if (a < 18) {
    return {
      dailySteps: 12000,
      label: "Youth (Active Growth)",
      description: "Young people benefit from higher activity levels for healthy development. Aim for 10,000–15,000 steps daily.",
      source: "Tudor-Locke et al., Int J Behav Nutr Phys Act, 2011",
    };
  }

  if (a <= 29) {
    return {
      dailySteps: g === "female" ? 8500 : 10000,
      label: "Young Adult",
      description: `Adults aged 18-29 should aim for ${g === "female" ? "8,500–10,000" : "10,000–12,000"} steps/day for optimal cardiovascular health.`,
      source: "WHO Physical Activity Guidelines, 2020",
    };
  }

  if (a <= 39) {
    return {
      dailySteps: g === "female" ? 8000 : 9500,
      label: "Adult (30s)",
      description: `Adults in their 30s benefit from ${g === "female" ? "8,000–10,000" : "9,500–11,000"} steps/day. Consistency matters more than intensity.`,
      source: "Tudor-Locke & Bassett, Sports Medicine, 2004",
    };
  }

  if (a <= 49) {
    return {
      dailySteps: g === "female" ? 7500 : 9000,
      label: "Adult (40s)",
      description: `In your 40s, aim for ${g === "female" ? "7,500–9,000" : "9,000–10,000"} steps/day. Walking helps prevent metabolic syndrome and maintains bone density.`,
      source: "CDC Physical Activity Guidelines for Americans, 2018",
    };
  }

  if (a <= 59) {
    return {
      dailySteps: g === "female" ? 7000 : 8000,
      label: "Adult (50s)",
      description: `Adults 50-59 should aim for ${g === "female" ? "7,000–8,500" : "8,000–9,500"} steps/day. Regular walking reduces risk of type 2 diabetes by 58%.`,
      source: "Diabetes Prevention Program, NEJM, 2002",
    };
  }

  if (a <= 69) {
    return {
      dailySteps: g === "female" ? 6000 : 7000,
      label: "Senior (60s)",
      description: `Seniors aged 60-69 benefit greatly from ${g === "female" ? "6,000–7,500" : "7,000–8,500"} steps/day. Walking reduces fall risk and maintains cognitive function.`,
      source: "Lee et al., JAMA Internal Medicine, 2019",
    };
  }

  // 70+
  return {
    dailySteps: g === "female" ? 4500 : 5500,
    label: "Senior (70+)",
    description: `For adults 70+, ${g === "female" ? "4,500–6,000" : "5,500–7,000"} steps/day significantly reduces all-cause mortality. Even small increases help.`,
    source: "Lee et al., JAMA Internal Medicine, 2019",
  };
}

/**
 * Get a personalized assessment based on actual average steps vs recommendation
 */
export function getHealthAssessment(
  avgDailySteps: number,
  recommendation: HealthRecommendation
): { level: "excellent" | "good" | "fair" | "needs-improvement"; message: string; emoji: string } {
  const ratio = avgDailySteps / recommendation.dailySteps;

  if (ratio >= 1.2) {
    return {
      level: "excellent",
      emoji: "🌟",
      message: "Excellent! You're exceeding the recommended steps. Your walking habit is exemplary — the Prophet ﷺ encouraged consistent good deeds.",
    };
  }
  if (ratio >= 0.8) {
    return {
      level: "good",
      emoji: "✅",
      message: "Good progress! You're close to or meeting the recommendation. Keep building your walking streak to the mosque.",
    };
  }
  if (ratio >= 0.5) {
    return {
      level: "fair",
      emoji: "📈",
      message: "You're on the right track. Try adding one more prayer walk per day to reach optimal health levels.",
    };
  }
  return {
    level: "needs-improvement",
    emoji: "💪",
    message: "Every step counts! Start with shorter walks to nearby mosques and gradually increase. The best deeds are the most consistent ones.",
  };
}
