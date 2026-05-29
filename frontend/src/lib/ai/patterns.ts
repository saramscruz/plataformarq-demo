import Anthropic from "@anthropic-ai/sdk";
import { Signal, Pattern, ContentAngle, WeeklyAnalytics } from "../types";
import { buildPatternDetectionPrompt, buildContentAnglesPrompt } from "./prompts";
import { getAllSignals, getCurrentWeek } from "../db/queries";

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function parseJSON<T>(text: string, fallback: T): T {
  try {
    const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

export async function generateWeeklyAnalytics(weekNumber?: number): Promise<WeeklyAnalytics> {
  const week = weekNumber || getCurrentWeek();
  const allSignals = getAllSignals(500);
  const weekSignals = allSignals.filter((s) => s.week === week && s.status === "approved");

  // Count by source, brand, element
  const bySource: Record<string, number> = {};
  const byBrand: Record<string, number> = {};
  const byElement: Record<string, number> = {};
  let duplicateCount = 0;

  for (const s of weekSignals) {
    bySource[s.sourceType] = (bySource[s.sourceType] || 0) + 1;
    byBrand[s.brand] = (byBrand[s.brand] || 0) + 1;
    for (const el of s.ownershipNarrativeElements) {
      byElement[el] = (byElement[el] || 0) + 1;
    }
    if (s.isDuplicate) duplicateCount++;
  }

  const duplicateRate = weekSignals.length > 0 ? duplicateCount / weekSignals.length : 0;

  // Use recent approved signals for pattern detection (last 50)
  const recentSignals = allSignals
    .filter((s) => s.status === "approved")
    .slice(0, 50)
    .map((s) => ({
      brand: s.brand,
      sourceType: s.sourceType,
      excerpt: s.exactExcerpt,
      narrativeElements: s.ownershipNarrativeElements,
      week: s.week,
    }));

  let patternsDetected: string[] = [];
  let contentAngleSuggestions: ContentAngle[] = [];

  const apiKeyAvailable = Boolean(process.env.ANTHROPIC_API_KEY);

  if (apiKeyAvailable && recentSignals.length > 0) {
    try {
      const client = getClient();

      const patternResponse = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: buildPatternDetectionPrompt(recentSignals, week) }],
      });

      const patternText = patternResponse.content[0].type === "text" ? patternResponse.content[0].text : "{}";
      const patternData = parseJSON<{ patterns: Pattern[] }>(patternText, { patterns: [] });
      patternsDetected = patternData.patterns.map((p) => `${p.title}: ${p.description}`);

      const signalSummaries = weekSignals.map((s) => ({
        id: s.id,
        brand: s.brand,
        summary: s.signalSummary,
        narrativeElements: s.ownershipNarrativeElements,
      }));

      if (signalSummaries.length > 0) {
        const angleResponse = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: buildContentAnglesPrompt(signalSummaries, patternsDetected, week) }],
        });

        const angleText = angleResponse.content[0].type === "text" ? angleResponse.content[0].text : "{}";
        const angleData = parseJSON<{ angles: ContentAngle[] }>(angleText, { angles: [] });
        contentAngleSuggestions = angleData.angles;
      }
    } catch (err) {
      console.error("Pattern detection error:", err);
      patternsDetected = getMockPatterns(byBrand, byElement);
      contentAngleSuggestions = getMockContentAngles(week);
    }
  } else {
    patternsDetected = getMockPatterns(byBrand, byElement);
    contentAngleSuggestions = getMockContentAngles(week);
  }

  return {
    week,
    signalCount: weekSignals.length,
    bySource,
    byBrand,
    byOwnershipElement: byElement,
    patternsDetected,
    duplicateRate,
    contentAngleSuggestions,
    generatedAt: new Date().toISOString(),
  };
}

function getMockPatterns(byBrand: Record<string, number>, byElement: Record<string, number>): string[] {
  const patterns: string[] = [];
  const topBrand = Object.entries(byBrand).sort((a, b) => b[1] - a[1])[0];
  const topElement = Object.entries(byElement).sort((a, b) => b[1] - a[1])[0];

  if (topBrand) {
    patterns.push(`${topBrand[0]} Leads Signal Volume: ${topBrand[0]} generated ${topBrand[1]} signals this week, more than any other brand.`);
  }
  if (topElement) {
    patterns.push(`${topElement[0]} Narrative Dominates: ${topElement[0]} is the most common ownership element this week (${topElement[1]} signals), suggesting brands are prioritizing this dimension.`);
  }
  if (byElement["EV/Charging"] && byElement["EV/Charging"] > 1) {
    patterns.push(`EV Momentum Continues: ${byElement["EV/Charging"]} EV/Charging signals collected this week, indicating sustained activity in electric vehicle features.`);
  }
  return patterns;
}

function getMockContentAngles(week: number): ContentAngle[] {
  return [
    {
      title: `Week ${week} Analysis: How Premium Brands Are Competing on Digital Ownership`,
      channel: "LinkedIn",
      wordcount: 300,
      signalsUsed: [],
      story: "Compare this week's signals across brands to identify diverging digital ownership strategies.",
      confidence: "Medium",
    },
    {
      title: `The EV Ownership Gap: Which Brand Is Actually Delivering`,
      channel: "Substack",
      wordcount: 700,
      signalsUsed: [],
      story: "Deep dive into EV-related signals across all five brands to identify who is leading and who is lagging on electric ownership experience.",
      confidence: "Medium",
    },
  ];
}
