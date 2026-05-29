import { createSignal, upsertHealthCheck, upsertAnalytics, upsertUserConfig, getCurrentWeek } from "./queries";
import { initializeHealthChecks } from "../health/checks";
import { AISuggestions, Brand, SourceType, NarrativeElement, SignalType, ConfidenceLevel } from "../types";
import { v4 as uuidv4 } from "uuid";

const SEED_SIGNALS: Array<{
  brand: Brand;
  sourceType: SourceType;
  url: string;
  excerpt: string;
  signalType: SignalType;
  narrativeElements: NarrativeElement[];
  confidenceLevel: ConfidenceLevel;
  limitation: string;
  signalSummary: string;
  productDesignChoice: string;
  possiblePostAngle: string;
  status: "pending" | "approved";
  week: number;
  daysAgo: number;
}> = [
  {
    brand: "Volvo",
    sourceType: "App Store",
    url: "https://play.google.com/store/apps/details?id=com.volvo.cars",
    excerpt: "v3.5.0 — NEW: Real-time charging status with predictive range. IMPROVED: EV charging network integration (50+ networks supported). FIXED: Battery health monitoring accuracy. Performance optimizations for iOS 17.",
    signalType: "A",
    narrativeElements: ["EV/Charging", "Status"],
    confidenceLevel: "HIGH",
    limitation: "Release notes describe intended features; don't show actual implementation or UX. Need in-app verification to confirm features work as described.",
    signalSummary: "Volvo adds real-time charging tracking + range prediction to app",
    productDesignChoice: "Volvo positions real-time charging + range prediction as central ownership feature, suggesting they believe EV owners want active charging management, not passive updates.",
    possiblePostAngle: "How Volvo is making EV ownership more active: Real-time charging + predictive range as control features",
    status: "approved",
    week: getCurrentWeek(),
    daysAgo: 1,
  },
  {
    brand: "Mercedes-Benz",
    sourceType: "Official App Page",
    url: "https://www.mercedes-benz.com/en/features/app/",
    excerpt: "The Mercedes me app connects you to your vehicle with real-time status updates and remote services. Monitor your vehicle's location, fuel level, tyre pressure, and service requirements from anywhere in the world. Available for all Mercedes-Benz vehicles from model year 2016 onwards.",
    signalType: "A",
    narrativeElements: ["Status", "Control"],
    confidenceLevel: "HIGH",
    limitation: "Official app description doesn't show actual UX or user experience; may describe ideal features rather than current implementation. 'Available from 2016 onwards' may have feature restrictions for older models.",
    signalSummary: "Mercedes positions app as real-time vehicle connection hub for 2016+ models",
    productDesignChoice: "Mercedes highlights status visibility and remote access as core ownership features, suggesting the brand prioritizes transparency and immediate information access over other ownership dimensions.",
    possiblePostAngle: "How brands frame vehicle status as trust-building: Mercedes real-time push explained",
    status: "approved",
    week: getCurrentWeek(),
    daysAgo: 2,
  },
  {
    brand: "Volvo",
    sourceType: "LinkedIn",
    url: "https://www.linkedin.com/company/volvo-cars/posts/",
    excerpt: "Expanding the future of EV ownership. We're thrilled to announce a major expansion of our charging partnerships across North America and Europe. Volvo Cars owners now have access to 50+ charging networks directly through the Volvo Cars app. Real-time range prediction. Integrated payment. Network selection made simple. This is what ownership looks like when we prioritize what drivers need.",
    signalType: "B",
    narrativeElements: ["Partnership", "EV/Charging"],
    confidenceLevel: "HIGH",
    limitation: "LinkedIn post is strategic messaging/brand communication. Describes positioning and partnerships; doesn't show actual user experience or payment integration quality. Marketing language may overstate seamlessness.",
    signalSummary: "Volvo announces 50+ charging network partnerships; frames as ownership value",
    productDesignChoice: "Volvo frames charging network access + app integration as core ownership benefit, suggesting they believe premium EV owners value ecosystem convenience over just car features.",
    possiblePostAngle: "The Partnership Play: How Volvo is defining EV ownership through ecosystem access, not just features",
    status: "approved",
    week: getCurrentWeek(),
    daysAgo: 2,
  },
  {
    brand: "BMW",
    sourceType: "Google Alert",
    url: "https://techcrunch.com/2026/05/28/bmw-ai-route-optimization",
    excerpt: "BMW launches AI-powered route optimization in MyBMW app, using real-time traffic data and driver behavior patterns to suggest optimal routes and charging stops for EV models. The feature, rolling out to North American users first, learns from daily commuting patterns within 2 weeks of use.",
    signalType: "A",
    narrativeElements: ["Control", "Personalization"],
    confidenceLevel: "MEDIUM",
    limitation: "Press article describes AI feature; unclear if real-time optimization or route suggestions. 'Learns within 2 weeks' is a specific claim that needs in-app verification to confirm accuracy timeline.",
    signalSummary: "BMW adds AI route optimization to MyBMW app for EV models",
    productDesignChoice: "BMW frames AI personalization as ownership empowerment, positioning the app as a learning companion rather than a static tool.",
    possiblePostAngle: "How AI is becoming the new 'ownership personalization' lever for premium brands: BMW's route intelligence explained",
    status: "approved",
    week: getCurrentWeek(),
    daysAgo: 1,
  },
  {
    brand: "Audi",
    sourceType: "App Store",
    url: "https://play.google.com/store/apps/details?id=com.audi.mobileservices",
    excerpt: "v4.2.1 — IMPROVED: Charging session management stability for e-tron models. FIXED: App crash when switching between multiple vehicles. FIXED: Push notification delay for remote services. Bug fixes and performance improvements.",
    signalType: "A",
    narrativeElements: ["Trust", "Support"],
    confidenceLevel: "HIGH",
    limitation: "App store release notes describe bugfixes; actual fix effectiveness requires user testing. High bug count in a single release may indicate technical debt.",
    signalSummary: "Audi myAudi v4.2.1 focuses on stability fixes for e-tron and multi-vehicle users",
    productDesignChoice: "Heavy bugfix focus (4/5 items are fixes) suggests Audi is in maintenance mode rather than feature expansion — trust-building through reliability rather than new capabilities.",
    possiblePostAngle: "Bug fixes as brand signals: What Audi's maintenance-heavy update reveals about their app maturity",
    status: "approved",
    week: getCurrentWeek(),
    daysAgo: 3,
  },
  {
    brand: "Porsche",
    sourceType: "App Store",
    url: "https://play.google.com/store/apps/details?id=com.porsche.connect",
    excerpt: "Porsche Connect v5.1.0 — NEW: Integrated IONITY charging network access for Taycan models. IMPROVED: Sports Chrono lap timer now syncs with in-car display in real time. IMPROVED: Remote Park Assist via app now available in all markets. Performance and stability improvements.",
    signalType: "A",
    narrativeElements: ["EV/Charging", "Control"],
    confidenceLevel: "HIGH",
    limitation: "Release notes describe feature additions; Remote Park Assist 'available in all markets' claim needs verification as regulatory restrictions may apply in some regions.",
    signalSummary: "Porsche Connect adds IONITY charging access and remote park assist globally",
    productDesignChoice: "Porsche bundles premium charging network access with performance features (Chrono timer), suggesting they position digital ownership as performance enhancement, not just utility.",
    possiblePostAngle: "Porsche's dual narrative: EV charging meets performance tracking — how Connect bridges two ownership worlds",
    status: "approved",
    week: getCurrentWeek() - 1,
    daysAgo: 5,
  },
  {
    brand: "Mercedes-Benz",
    sourceType: "LinkedIn",
    url: "https://www.linkedin.com/company/mercedes-benz/posts/",
    excerpt: "Real-time vehicle intelligence. Now available to all Mercedes me users. Our latest update brings live monitoring of 47 vehicle parameters directly to your smartphone. From battery health to tyre wear prediction — because owning a Mercedes means staying ahead.",
    signalType: "B",
    narrativeElements: ["Status", "Trust"],
    confidenceLevel: "HIGH",
    limitation: "LinkedIn marketing post; '47 vehicle parameters' is a specific claim that needs verification against app store release notes. 'All Mercedes me users' may have vehicle compatibility restrictions.",
    signalSummary: "Mercedes announces real-time monitoring of 47 vehicle parameters via app",
    productDesignChoice: "Mercedes uses specific data point ('47 parameters') to signal technological depth, positioning data transparency as a luxury differentiator rather than just a utility.",
    possiblePostAngle: "The quantification of ownership: Why Mercedes is counting parameters and what it signals about premium brand competition",
    status: "pending",
    week: getCurrentWeek(),
    daysAgo: 0,
  },
  {
    brand: "BMW",
    sourceType: "Official App Page",
    url: "https://www.bmw.com/en/topics/discover-bmw/bmw-connected-drive.html",
    excerpt: "BMW ConnectedDrive transforms your BMW into an intelligent digital companion. With the My BMW App, you control your vehicle remotely, receive real-time traffic information and stay connected on the go. Discover a new dimension of mobility with over 30 available digital services.",
    signalType: "A",
    narrativeElements: ["Control", "Status"],
    confidenceLevel: "HIGH",
    limitation: "Official page language is evergreen marketing copy; '30+ digital services' count may not reflect current availability in all markets. Real-time traffic depends on data subscription status.",
    signalSummary: "BMW positions ConnectedDrive as 'intelligent companion' with 30+ digital services",
    productDesignChoice: "BMW frames digital services as a 'dimension of mobility' rather than features, suggesting they position the app as transformative rather than supplementary to the driving experience.",
    possiblePostAngle: "Companion vs. tool: How BMW and Mercedes frame the app-car relationship differently",
    status: "pending",
    week: getCurrentWeek(),
    daysAgo: 0,
  },
  {
    brand: "Audi",
    sourceType: "LinkedIn",
    url: "https://www.linkedin.com/company/audi/posts/",
    excerpt: "The future of mobility is connected. Audi is partnering with HERE Technologies to bring next-generation predictive navigation to the myAudi app. Arriving Q3 2026. #ProgressiveLuxury #AudiConnect #Mobility",
    signalType: "B",
    narrativeElements: ["Partnership", "Control"],
    confidenceLevel: "HIGH",
    limitation: "LinkedIn announcement of future partnership; Q3 2026 timeline means feature not yet available. HERE Technologies integration scope is undefined — could be navigation-only or broader.",
    signalSummary: "Audi announces HERE Technologies partnership for predictive navigation in Q3 2026",
    productDesignChoice: "Audi signals upcoming navigation capability through a partnership announcement, suggesting they are building through integration rather than proprietary development.",
    possiblePostAngle: "The partnership gap: Audi's LinkedIn announces Q3 features while app store shows only bug fixes — what this timing gap reveals",
    status: "pending",
    week: getCurrentWeek(),
    daysAgo: 0,
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Initialize health checks
  initializeHealthChecks();

  // Seed default user config
  upsertUserConfig({
    userId: "demo-user",
    emailAlertsAddress: "saramscruz@gmail.com",
    brandsToMonitor: ["Mercedes-Benz", "BMW", "Audi", "Volvo", "Porsche"],
  });

  // Seed signals
  let created = 0;
  for (const s of SEED_SIGNALS) {
    const dateCollected = new Date();
    dateCollected.setDate(dateCollected.getDate() - s.daysAgo);

    const aiSuggestions: AISuggestions = {
      signalType: s.signalType,
      signalTypeConfidence: s.confidenceLevel === "HIGH" ? 0.92 : 0.75,
      signalTypeReasoning: `${s.sourceType} from ${s.brand} — seed data`,
      primaryNarrativeElement: s.narrativeElements[0],
      secondaryNarrativeElement: s.narrativeElements[1],
      narrativeReasoning: `Excerpt keywords suggest ${s.narrativeElements[0]} narrative element`,
      confidenceLevel: s.confidenceLevel,
      confidenceReasoning: `${s.sourceType} → ${s.confidenceLevel} confidence`,
      limitation: s.limitation,
      signalSummary: s.signalSummary,
      productDesignChoice: s.productDesignChoice,
      possiblePostAngle: s.possiblePostAngle,
    };

    createSignal({
      brand: s.brand,
      sourceType: s.sourceType,
      url: s.url,
      exactExcerpt: s.excerpt,
      dateCollected: dateCollected.toISOString().slice(0, 10),
      week: s.week,
      signalType: s.signalType,
      signalTypeConfidence: aiSuggestions.signalTypeConfidence,
      ownershipNarrativeElements: s.narrativeElements,
      confidenceLevel: s.confidenceLevel,
      limitation: s.limitation,
      signalSummary: s.signalSummary,
      productDesignChoice: s.productDesignChoice,
      possiblePostAngle: s.possiblePostAngle,
      status: s.status,
      isDuplicate: false,
      aiSuggestions,
      syncedToSheets: s.status === "approved",
    });
    created++;
  }
  console.log(`✅ Created ${created} signals`);

  // Seed health checks with realistic demo values
  const healthUpdates = [
    { checkName: "Google Alerts Arrival", checkType: "data_collection" as const, status: "success" as const, metrics: { alertsReceived: 8, lastAlertMinutesAgo: 23, expectedPerHour: 1.5 } },
    { checkName: "App Store Monitoring", checkType: "data_collection" as const, status: "success" as const, metrics: { brandsChecked: 5, newReleases: 2, lastChecked: "today" } },
    { checkName: "LinkedIn Monitoring", checkType: "data_collection" as const, status: "success" as const, metrics: { brandsChecked: 5, postsFound: 3, lastChecked: "today" } },
    { checkName: "Official Pages Scraping", checkType: "data_collection" as const, status: "success" as const, metrics: { brandsChecked: 5, changesDetected: 1, lastChecked: "2 days ago" } },
    { checkName: "Scraper Health", checkType: "data_collection" as const, status: "success" as const, metrics: { successRate: 100, totalRuns: 47, failures: 0 } },
    { checkName: "Signal Type Accuracy", checkType: "ai_quality" as const, status: "success" as const, metrics: { accuracy: 88, sampleSize: 42, target: "85%+" } },
    { checkName: "Narrative Element Accuracy", checkType: "ai_quality" as const, status: "success" as const, metrics: { accuracy: 79, sampleSize: 42, target: "80%+" } },
    { checkName: "Limitation Quality", checkType: "ai_quality" as const, status: "success" as const, metrics: { usedAsIs: 73, sampleSize: 42, target: "70%+" } },
    { checkName: "Confidence Calibration", checkType: "ai_quality" as const, status: "success" as const, metrics: { accuracy: 95, sampleSize: 42 } },
    { checkName: "Excerpt Accuracy Sampler", checkType: "data_quality" as const, status: "success" as const, metrics: { sampledCount: 30, issueCount: 0, accuracy: 100 } },
    { checkName: "URL Validity", checkType: "data_quality" as const, status: "success" as const, metrics: { validRate: 100, sampledCount: 25, brokenLinks: 0 } },
    { checkName: "Duplication Rate Monitor", checkType: "data_quality" as const, status: "success" as const, metrics: { duplicateRate: 0.042, duplicateCount: 2, totalApproved: 47, target: "3-5%" } },
    { checkName: "Google Sheets Sync", checkType: "sync" as const, status: "success" as const, metrics: { totalSynced: 47, totalFailed: 0, successRate: 100, avgLatencyMs: 3200 } },
    { checkName: "Analytics Accuracy Validator", checkType: "analytics" as const, status: "success" as const, metrics: { accurate: true, signalLogCount: 47, summaryCount: 47 } },
    { checkName: "Pattern Verification", checkType: "analytics" as const, status: "success" as const, metrics: { verified: 12, total: 12 } },
  ];

  for (const h of healthUpdates) {
    upsertHealthCheck({
      ...h,
      lastRun: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      nextRun: new Date(Date.now() + 3600000).toISOString(),
    });
  }
  console.log("✅ Health checks initialized");

  // Seed analytics
  const currentWeek = getCurrentWeek();
  upsertAnalytics({
    week: currentWeek,
    signalCount: 8,
    bySource: { "App Store": 3, "LinkedIn": 2, "Official App Page": 2, "Google Alert": 1 },
    byBrand: { "Volvo": 2, "Mercedes-Benz": 2, "BMW": 2, "Audi": 1, "Porsche": 1 },
    byOwnershipElement: { "EV/Charging": 3, "Status": 3, "Control": 2, "Partnership": 2, "Trust": 1, "Personalization": 1 },
    patternsDetected: [
      "EV Momentum: Volvo released 2 EV-related features vs. BMW: 1, Mercedes: 0, Audi: 0, Porsche: 1. Volvo's LinkedIn EV post got 520 likes — highest engagement this week.",
      "Status/Information Rising: 3 signals this week emphasize real-time vehicle monitoring. Both Mercedes (47 parameters) and Volvo (live charging) are investing here simultaneously.",
      "LinkedIn-App Misalignment: Audi's LinkedIn announces Q3 2026 navigation feature while app store only shows bugfixes — different teams, different timelines.",
      "Update Velocity: Volvo (weekly cadence) vs. Audi (maintenance-only) vs. Porsche (bi-weekly features) signals different product philosophies.",
    ],
    duplicateRate: 0.042,
    contentAngleSuggestions: [
      {
        title: "Real-Time Status As Trust Signal: Why Mercedes & Volvo Are Making Visibility Central to Ownership",
        channel: "LinkedIn",
        wordcount: 300,
        signalsUsed: ["Mercedes Official App Page", "Volvo App Store v3.5.0"],
        story: "Both brands emphasized real-time updates in the same week — Mercedes with 47 parameters, Volvo with charging status. What does this convergence reveal about where premium ownership is heading?",
        confidence: "High",
      },
      {
        title: "The EV Narrative Gap: Volvo & Porsche Release New Charging Features, Mercedes & BMW Go Quiet",
        channel: "LinkedIn",
        wordcount: 300,
        signalsUsed: ["Volvo App Store v3.5.0", "Porsche Connect v5.1.0"],
        story: "Two brands pushed EV charging updates this week; two didn't. The divergence isn't accidental — it reflects different bets on what premium EV owners want.",
        confidence: "Medium",
      },
      {
        title: "The Five Brands' Diverging Strategies: Week Analysis",
        channel: "Substack",
        wordcount: 800,
        signalsUsed: ["All 8 this-week signals"],
        story: "Synthesize the weekly patterns: Volvo iterating fast on EV, BMW on personalization, Audi building through partnerships, Porsche bridging performance and utility, Mercedes quantifying transparency.",
        confidence: "High",
      },
    ],
    generatedAt: new Date().toISOString(),
  });
  console.log("✅ Analytics seeded");
  console.log("🎉 Seed complete!");
}

// Run when called directly
seed().catch(console.error);
