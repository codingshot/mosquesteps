// Walking goals stored in localStorage

export interface WalkingGoals {
  dailySteps: number;
  weeklyWalks: number;
  monthlyDistance: number; // km
}

const GOALS_KEY = "mosquesteps_goals";

const DEFAULT_GOALS: WalkingGoals = {
  dailySteps: 5000,
  weeklyWalks: 10,
  monthlyDistance: 20,
};

export function getGoals(): WalkingGoals {
  try {
    const stored = localStorage.getItem(GOALS_KEY);
    return stored ? { ...DEFAULT_GOALS, ...JSON.parse(stored) } : DEFAULT_GOALS;
  } catch {
    return DEFAULT_GOALS;
  }
}

export function saveGoals(goals: Partial<WalkingGoals>) {
  const current = getGoals();
  localStorage.setItem(GOALS_KEY, JSON.stringify({ ...current, ...goals }));
}
