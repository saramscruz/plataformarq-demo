export type Brand = "Mercedes-Benz" | "BMW" | "Audi" | "Volvo" | "Porsche";

export type SourceType =
  | "Google Alert"
  | "Official App Page"
  | "Sales/Marketing Page"
  | "App Store"
  | "Changelog"
  | "LinkedIn";

export type SignalType = "A" | "B" | "C" | "D" | "E";

export type NarrativeElement =
  | "Onboarding"
  | "Control"
  | "Trust"
  | "Status"
  | "Support"
  | "Partnership"
  | "EV/Charging"
  | "Personalization"
  | "Other";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type SignalStatus = "pending" | "approved" | "skipped" | "duplicate";

export type HealthStatus = "success" | "warning" | "failed" | "unknown";

export interface Signal {
  id: string;
  dateCollected: string;
  week: number;
  brand: Brand;
  sourceType: SourceType;
  url: string;
  dateSourcePublished?: string;
  market?: string;
  exactExcerpt: string;
  promiseVsDelivery?: string;
  signalSummary?: string;
  signalType?: SignalType;
  signalTypeConfidence?: number;
  ownershipNarrativeElements: NarrativeElement[];
  productDesignChoice?: string;
  confidenceLevel?: ConfidenceLevel;
  limitation?: string;
  connectedToAlert?: string;
  possiblePostAngle?: string;
  usedInPublishedContent?: string;
  notes?: string;
  status: SignalStatus;
  isDuplicate: boolean;
  duplicateOfSignalId?: string;
  createdAt: string;
  updatedAt: string;
  syncedToSheets: boolean;
  sheetsRowNumber?: number;
  // AI suggestion metadata
  aiSuggestions?: AISuggestions;
}

export interface AISuggestions {
  signalType: SignalType;
  signalTypeConfidence: number;
  signalTypeReasoning: string;
  primaryNarrativeElement: NarrativeElement;
  secondaryNarrativeElement?: NarrativeElement;
  narrativeReasoning: string;
  confidenceLevel: ConfidenceLevel;
  confidenceReasoning: string;
  limitation: string;
  signalSummary: string;
  productDesignChoice: string;
  possiblePostAngle: string;
}

export interface HealthCheck {
  id: string;
  checkName: string;
  checkType: "data_collection" | "ai_quality" | "data_quality" | "sync" | "analytics";
  status: HealthStatus;
  lastRun?: string;
  nextRun?: string;
  errorMessage?: string;
  metrics: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SystemHealth {
  overallStatus: "excellent" | "warning" | "critical" | "unknown";
  lastChecked: string;
  checks: HealthCheckSummary[];
}

export interface HealthCheckSummary {
  name: string;
  type: string;
  status: HealthStatus;
  displayValue: string;
  lastRun?: string;
}

export interface WeeklyAnalytics {
  week: number;
  signalCount: number;
  bySource: Record<string, number>;
  byBrand: Record<string, number>;
  byOwnershipElement: Record<string, number>;
  patternsDetected: string[];
  duplicateRate: number;
  contentAngleSuggestions: ContentAngle[];
  generatedAt: string;
}

export interface ContentAngle {
  title: string;
  channel: "LinkedIn" | "Substack";
  wordcount: number;
  signalsUsed: string[];
  story: string;
  confidence: "High" | "Medium" | "Low";
}

export interface Pattern {
  title: string;
  description: string;
  signals: string[];
  trend: "up" | "down" | "hot" | "stable";
}

export interface UserConfig {
  userId: string;
  googleSheetsId?: string;
  googleDriveFolderId?: string;
  emailAlertsAddress?: string;
  brandsToMonitor: Brand[];
}

export const BRANDS: Brand[] = ["Mercedes-Benz", "BMW", "Audi", "Volvo", "Porsche"];

export const SOURCE_TYPES: SourceType[] = [
  "Google Alert",
  "Official App Page",
  "Sales/Marketing Page",
  "App Store",
  "Changelog",
  "LinkedIn",
];

export const NARRATIVE_ELEMENTS: NarrativeElement[] = [
  "Onboarding",
  "Control",
  "Trust",
  "Status",
  "Support",
  "Partnership",
  "EV/Charging",
  "Personalization",
  "Other",
];

export const SIGNAL_TYPE_DESCRIPTIONS: Record<SignalType, string> = {
  A: "Primary Signal — Official app update, feature announcement, release note",
  B: "Contextual Signal — Industry news, architecture, partnership",
  C: "User Signal — Review excerpt, community discussion",
  D: "Question — Raises interesting question but not concrete signal",
  E: "Rabbit Hole — Interesting but tangential, requires >30 min research",
};

export const BRAND_SOURCES: Record<Brand, { appStore: string; linkedin: string; officialPage: string; salesPage: string }> = {
  "Mercedes-Benz": {
    appStore: "https://play.google.com/store/apps/details?id=com.daimler.mm",
    linkedin: "https://www.linkedin.com/company/mercedes-benz/",
    officialPage: "https://www.mercedes-benz.com/en/features/app/",
    salesPage: "https://www.mercedes-benz.com/en/vehicles/c-class/digital-services/",
  },
  BMW: {
    appStore: "https://play.google.com/store/apps/details?id=com.bmw.connected",
    linkedin: "https://www.linkedin.com/company/bmw/",
    officialPage: "https://www.bmw.com/en/topics/discover-bmw/bmw-connected-drive.html",
    salesPage: "https://www.bmw.com/en/topics/discover-bmw/digital-services/",
  },
  Audi: {
    appStore: "https://play.google.com/store/apps/details?id=com.audi.mobileservices",
    linkedin: "https://www.linkedin.com/company/audi/",
    officialPage: "https://www.audi.com/en/brand/en/digital-services/myaudi-app.html",
    salesPage: "https://www.audi.com/en/brand/en/digital-services/",
  },
  Volvo: {
    appStore: "https://play.google.com/store/apps/details?id=com.volvo.cars",
    linkedin: "https://www.linkedin.com/company/volvo-cars/",
    officialPage: "https://www.volvocars.com/en-pt/support/app",
    salesPage: "https://www.volvocars.com/en-pt/vehicles/",
  },
  Porsche: {
    appStore: "https://play.google.com/store/apps/details?id=com.porsche.connect",
    linkedin: "https://www.linkedin.com/company/porsche-ag/",
    officialPage: "https://www.porsche.com/usa/en/connection/porsche-connect/",
    salesPage: "https://www.porsche.com/usa/en/connection/porsche-connect/",
  },
};
