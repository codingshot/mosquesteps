/**
 * Export walking stats and reports in various formats.
 */

import type { WalkEntry } from "./walking-history";
import type { WalkingStats } from "./walking-history";

export interface ExportReport {
  generatedAt: string;
  summary: {
    totalWalks: number;
    totalSteps: number;
    totalDistanceKm: number;
    totalHasanat: number;
    totalTimeMin: number;
    currentStreak: number;
    longestStreak: number;
  };
  walksByPrayer: Record<string, number>;
  walksByDayOfWeek: Record<string, number>;
  walksByMosque: Record<string, { count: number; steps: number; distanceKm: number; hasanat: number }>;
  walksByMonth: Record<string, { count: number; steps: number; distanceKm: number; hasanat: number }>;
  recentWalks: WalkEntry[];
}

export function buildExportReport(
  history: WalkEntry[],
  stats: WalkingStats,
  options?: { limit?: number }
): ExportReport {
  const limit = options?.limit ?? history.length;
  const recentWalks = history.slice(0, limit);

  const walksByDayOfWeek: Record<string, number> = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const walksByMosque: Record<string, { count: number; steps: number; distanceKm: number; hasanat: number }> = {};
  const walksByMonth: Record<string, { count: number; steps: number; distanceKm: number; hasanat: number }> = {};

  for (const e of history) {
    const d = new Date(e.date);
    const dayName = DAYS[d.getDay()];
    walksByDayOfWeek[dayName] = (walksByDayOfWeek[dayName] || 0) + 1;

    const mosque = e.mosqueName || "Unknown";
    if (!walksByMosque[mosque]) walksByMosque[mosque] = { count: 0, steps: 0, distanceKm: 0, hasanat: 0 };
    walksByMosque[mosque].count++;
    walksByMosque[mosque].steps += e.steps;
    walksByMosque[mosque].distanceKm += e.distanceKm;
    walksByMosque[mosque].hasanat += e.hasanat;

    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!walksByMonth[monthKey]) walksByMonth[monthKey] = { count: 0, steps: 0, distanceKm: 0, hasanat: 0 };
    walksByMonth[monthKey].count++;
    walksByMonth[monthKey].steps += e.steps;
    walksByMonth[monthKey].distanceKm += e.distanceKm;
    walksByMonth[monthKey].hasanat += e.hasanat;
  }

  const totalTimeMin = history.reduce((s, e) => s + e.walkingTimeMin, 0);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalWalks: stats.totalWalks,
      totalSteps: stats.totalSteps,
      totalDistanceKm: stats.totalDistance,
      totalHasanat: stats.totalHasanat,
      totalTimeMin,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
    },
    walksByPrayer: stats.walksByPrayer,
    walksByDayOfWeek,
    walksByMosque,
    walksByMonth,
    recentWalks,
  };
}

export function exportAsJSON(report: ExportReport): string {
  return JSON.stringify(report, null, 2);
}

export function exportAsCSV(history: WalkEntry[], report: ExportReport): string {
  const headers = ["Date", "Prayer", "Mosque", "Steps", "Distance (km)", "Time (min)", "Hasanat"];
  const rows = history.map((e) => [
    e.date,
    e.prayer,
    `"${(e.mosqueName || "").replace(/"/g, '""')}"`,
    e.steps,
    e.distanceKm.toFixed(2),
    e.walkingTimeMin,
    e.hasanat,
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function exportAsMarkdown(report: ExportReport, formatDist: (km: number) => string): string {
  const lines: string[] = [];
  lines.push("# MosqueSteps Walking Report");
  lines.push(`\n*Generated: ${new Date(report.generatedAt).toLocaleString()}*\n`);
  lines.push("## Summary");
  lines.push(`- **Total walks:** ${report.summary.totalWalks}`);
  lines.push(`- **Total steps:** ${report.summary.totalSteps.toLocaleString()}`);
  lines.push(`- **Total distance:** ${formatDist(report.summary.totalDistanceKm)}`);
  lines.push(`- **Total hasanat:** ${report.summary.totalHasanat.toLocaleString()}`);
  lines.push(`- **Current streak:** ${report.summary.currentStreak} days`);
  lines.push(`- **Best streak:** ${report.summary.longestStreak} days\n`);

  lines.push("## Most Walked Prayers");
  const prayers = Object.entries(report.walksByPrayer).sort((a, b) => b[1] - a[1]);
  prayers.forEach(([prayer, count]) => {
    const pct = report.summary.totalWalks > 0 ? Math.round((count / report.summary.totalWalks) * 100) : 0;
    lines.push(`- ${prayer}: ${count} walks (${pct}%)`);
  });
  lines.push("");

  lines.push("## Walks by Day of Week");
  const days = Object.entries(report.walksByDayOfWeek).sort((a, b) => b[1] - a[1]);
  days.forEach(([day, count]) => lines.push(`- ${day}: ${count} walks`));
  lines.push("");

  lines.push("## Walks by Mosque");
  const mosques = Object.entries(report.walksByMosque).sort((a, b) => b[1].count - a[1].count);
  mosques.forEach(([name, data]) => {
    lines.push(`- **${name}**: ${data.count} walks, ${data.steps.toLocaleString()} steps, ${formatDist(data.distanceKm)}, ${data.hasanat.toLocaleString()} hasanat`);
  });
  lines.push("");

  lines.push("## Recent Walks");
  report.recentWalks.slice(0, 20).forEach((w) => {
    lines.push(`- ${w.date} — ${w.prayer} @ ${w.mosqueName} — ${w.steps.toLocaleString()} steps`);
  });

  return lines.join("\n");
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
