import { upsertHealthCheck, getAllHealthChecks, getSignalStats, getCurrentWeek, getAllSignals } from "../db/queries";
import { HealthCheck, HealthCheckSummary, SystemHealth } from "../types";

const CHECKS = [
  // Data Collection
  { name: "Google Alerts Arrival", type: "data_collection" as const, schedule: "hourly" },
  { name: "App Store Monitoring", type: "data_collection" as const, schedule: "daily" },
  { name: "LinkedIn Monitoring", type: "data_collection" as const, schedule: "daily" },
  { name: "Official Pages Scraping", type: "data_collection" as const, schedule: "weekly" },
  { name: "Scraper Health", type: "data_collection" as const, schedule: "continuous" },
  // AI Quality
  { name: "Signal Type Accuracy", type: "ai_quality" as const, schedule: "weekly" },
  { name: "Narrative Element Accuracy", type: "ai_quality" as const, schedule: "weekly" },
  { name: "Limitation Quality", type: "ai_quality" as const, schedule: "weekly" },
  { name: "Confidence Calibration", type: "ai_quality" as const, schedule: "continuous" },
  // Data Quality
  { name: "Excerpt Accuracy Sampler", type: "data_quality" as const, schedule: "daily" },
  { name: "URL Validity", type: "data_quality" as const, schedule: "monthly" },
  { name: "Duplication Rate Monitor", type: "data_quality" as const, schedule: "weekly" },
  // Sync & Integration
  { name: "Google Sheets Sync", type: "sync" as const, schedule: "per-signal" },
  // Analytics
  { name: "Analytics Accuracy Validator", type: "analytics" as const, schedule: "weekly" },
  { name: "Pattern Verification", type: "analytics" as const, schedule: "weekly" },
] as const;

export function initializeHealthChecks() {
  const now = new Date().toISOString();
  for (const check of CHECKS) {
    upsertHealthCheck({
      checkName: check.name,
      checkType: check.type,
      status: "unknown",
      lastRun: undefined,
      nextRun: getNextRunTime(check.schedule),
      metrics: { schedule: check.schedule },
    });
  }
}

function getNextRunTime(schedule: string): string {
  const now = new Date();
  switch (schedule) {
    case "hourly": now.setHours(now.getHours() + 1); break;
    case "daily": now.setDate(now.getDate() + 1); now.setHours(8, 0, 0, 0); break;
    case "weekly": now.setDate(now.getDate() + 7); break;
    case "monthly": now.setMonth(now.getMonth() + 1); break;
    default: now.setMinutes(now.getMinutes() + 5);
  }
  return now.toISOString();
}

export function runDataQualityChecks() {
  const stats = getSignalStats();
  const signals = getAllSignals(100);
  const approvedSignals = signals.filter((s) => s.status === "approved");

  // Check duplication rate
  const duplicates = approvedSignals.filter((s) => s.isDuplicate).length;
  const dupRate = approvedSignals.length > 0 ? duplicates / approvedSignals.length : 0;
  const dupStatus = dupRate > 0.15 ? "warning" : dupRate === 0 && approvedSignals.length > 10 ? "warning" : "success";

  upsertHealthCheck({
    checkName: "Duplication Rate Monitor",
    checkType: "data_quality",
    status: dupStatus,
    lastRun: new Date().toISOString(),
    nextRun: getNextRunTime("weekly"),
    metrics: {
      duplicateRate: dupRate,
      duplicateCount: duplicates,
      totalApproved: approvedSignals.length,
      target: "3-5%",
    },
  });

  // Check excerpt accuracy (simple: verify non-empty excerpts)
  const emptyExcerpts = approvedSignals.filter((s) => !s.exactExcerpt || s.exactExcerpt.length < 10).length;
  upsertHealthCheck({
    checkName: "Excerpt Accuracy Sampler",
    checkType: "data_quality",
    status: emptyExcerpts > 0 ? "warning" : "success",
    lastRun: new Date().toISOString(),
    nextRun: getNextRunTime("daily"),
    metrics: {
      sampledCount: Math.min(approvedSignals.length, 30),
      issueCount: emptyExcerpts,
      accuracy: approvedSignals.length > 0 ? (1 - emptyExcerpts / approvedSignals.length) * 100 : 100,
    },
  });
}

export function runAIQualityChecks() {
  const signals = getAllSignals(200);
  const approvedWithSuggestions = signals.filter(
    (s) => s.status === "approved" && s.aiSuggestions
  );

  if (approvedWithSuggestions.length === 0) return;

  // Track how many times users kept AI suggestion vs overrode
  let typeCorrect = 0;
  let narrativeCorrect = 0;
  let confCorrect = 0;

  for (const s of approvedWithSuggestions) {
    const ai = s.aiSuggestions!;
    if (s.signalType === ai.signalType) typeCorrect++;
    if (s.ownershipNarrativeElements.includes(ai.primaryNarrativeElement)) narrativeCorrect++;
    if (s.confidenceLevel === ai.confidenceLevel) confCorrect++;
  }

  const n = approvedWithSuggestions.length;
  const typeAccuracy = typeCorrect / n;
  const narrativeAccuracy = narrativeCorrect / n;
  const confAccuracy = confCorrect / n;

  upsertHealthCheck({
    checkName: "Signal Type Accuracy",
    checkType: "ai_quality",
    status: typeAccuracy >= 0.8 ? "success" : typeAccuracy >= 0.7 ? "warning" : "failed",
    lastRun: new Date().toISOString(),
    nextRun: getNextRunTime("weekly"),
    metrics: { accuracy: typeAccuracy * 100, sampleSize: n, target: "85%+" },
  });

  upsertHealthCheck({
    checkName: "Narrative Element Accuracy",
    checkType: "ai_quality",
    status: narrativeAccuracy >= 0.75 ? "success" : narrativeAccuracy >= 0.65 ? "warning" : "failed",
    lastRun: new Date().toISOString(),
    nextRun: getNextRunTime("weekly"),
    metrics: { accuracy: narrativeAccuracy * 100, sampleSize: n, target: "80%+" },
  });

  upsertHealthCheck({
    checkName: "Confidence Calibration",
    checkType: "ai_quality",
    status: confAccuracy >= 0.85 ? "success" : "warning",
    lastRun: new Date().toISOString(),
    nextRun: getNextRunTime("continuous"),
    metrics: { accuracy: confAccuracy * 100, sampleSize: n },
  });
}

export function runSyncCheck(signalId: string, success: boolean, latencyMs?: number) {
  const checks = getAllHealthChecks();
  const existing = checks.find((c) => c.checkName === "Google Sheets Sync");
  const prevMetrics = existing?.metrics as Record<string, number> || {};
  const prevTotal = (prevMetrics.totalSynced || 0) + (prevMetrics.totalFailed || 0);
  const newTotal = prevTotal + 1;
  const newFailed = (prevMetrics.totalFailed || 0) + (success ? 0 : 1);
  const newSynced = (prevMetrics.totalSynced || 0) + (success ? 1 : 0);
  const avgLatency = latencyMs
    ? ((prevMetrics.avgLatencyMs || 0) * prevTotal + latencyMs) / newTotal
    : prevMetrics.avgLatencyMs || 0;

  upsertHealthCheck({
    checkName: "Google Sheets Sync",
    checkType: "sync",
    status: newFailed / Math.max(newTotal, 1) < 0.01 ? "success" : "warning",
    lastRun: new Date().toISOString(),
    nextRun: getNextRunTime("per-signal"),
    errorMessage: success ? undefined : `Sync failed for signal ${signalId}`,
    metrics: {
      totalSynced: newSynced,
      totalFailed: newFailed,
      successRate: (newSynced / Math.max(newTotal, 1)) * 100,
      avgLatencyMs: Math.round(avgLatency),
    },
  });
}

export function getSystemHealth(): SystemHealth {
  const checks = getAllHealthChecks();

  const summaries: HealthCheckSummary[] = checks.map((c) => ({
    name: c.checkName,
    type: c.checkType,
    status: c.status,
    displayValue: getDisplayValue(c),
    lastRun: c.lastRun,
  }));

  const failed = checks.filter((c) => c.status === "failed").length;
  const warnings = checks.filter((c) => c.status === "warning").length;
  const unknown = checks.filter((c) => c.status === "unknown").length;

  let overallStatus: SystemHealth["overallStatus"] = "excellent";
  if (failed > 0) overallStatus = "critical";
  else if (warnings > 2) overallStatus = "warning";
  else if (unknown > 10) overallStatus = "unknown";

  return {
    overallStatus,
    lastChecked: new Date().toISOString(),
    checks: summaries,
  };
}

function getDisplayValue(check: HealthCheck): string {
  const m = check.metrics as Record<string, unknown>;
  switch (check.checkName) {
    case "Google Alerts Arrival":
      return m.lastAlertMinutesAgo !== undefined
        ? `Last: ${m.lastAlertMinutesAgo} min ago`
        : "Not yet monitored";
    case "App Store Monitoring":
    case "LinkedIn Monitoring":
    case "Official Pages Scraping":
      return m.lastChecked ? `Last: ${m.lastChecked}` : "Not yet run";
    case "Scraper Health":
      return m.successRate !== undefined ? `Success rate: ${m.successRate}%` : "No data";
    case "Signal Type Accuracy":
    case "Narrative Element Accuracy":
      return m.accuracy !== undefined ? `${Math.round(m.accuracy as number)}% accurate` : "No data";
    case "Limitation Quality":
      return m.usedAsIs !== undefined ? `${Math.round(m.usedAsIs as number)}% used as-is` : "No data";
    case "Confidence Calibration":
      return m.accuracy !== undefined ? `${Math.round(m.accuracy as number)}% calibrated` : "No data";
    case "Excerpt Accuracy Sampler":
      return m.accuracy !== undefined ? `${Math.round(m.accuracy as number)}% accurate` : "No data";
    case "URL Validity":
      return m.validRate !== undefined ? `${Math.round(m.validRate as number)}% valid` : "Not yet run";
    case "Duplication Rate Monitor":
      return m.duplicateRate !== undefined
        ? `${(Number(m.duplicateRate) * 100).toFixed(1)}% dedup rate`
        : "No data";
    case "Google Sheets Sync":
      return m.successRate !== undefined ? `${Math.round(m.successRate as number)}% success` : "No syncs yet";
    case "Analytics Accuracy Validator":
      return m.accurate !== undefined ? (m.accurate ? "Numbers match" : "Mismatch detected") : "Not yet run";
    case "Pattern Verification":
      return m.verified !== undefined ? `${m.verified}/${m.total} patterns verified` : "Not yet run";
    default:
      return check.status;
  }
}

export function updateCollectorStatus(
  checkName: string,
  success: boolean,
  details: Record<string, unknown>
) {
  upsertHealthCheck({
    checkName,
    checkType: "data_collection",
    status: success ? "success" : "failed",
    lastRun: new Date().toISOString(),
    nextRun: getNextRunTime("daily"),
    errorMessage: success ? undefined : (details.error as string),
    metrics: details,
  });
}
