import Anthropic from "@anthropic-ai/sdk";
import { Brand, SourceType, AISuggestions, NarrativeElement, SignalType, ConfidenceLevel } from "../types";
import {
  buildSignalTypePrompt,
  buildNarrativeElementPrompt,
  buildConfidenceLevelPrompt,
  buildLimitationPrompt,
  buildSummaryAndAnglePrompt,
} from "./prompts";

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function callClaude(prompt: string): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });
  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text.trim();
}

function parseJSON<T>(text: string, fallback: T): T {
  try {
    // Strip markdown code blocks if present
    const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

export async function categorizeSignal(
  brand: Brand,
  sourceType: SourceType,
  excerpt: string,
  url: string
): Promise<AISuggestions> {
  const apiKeyAvailable = Boolean(process.env.ANTHROPIC_API_KEY);

  if (!apiKeyAvailable) {
    return getMockSuggestions(brand, sourceType, excerpt);
  }

  try {
    const [typeResult, narrativeResult, confidenceResult, limitationResult, summaryResult] =
      await Promise.all([
        callClaude(buildSignalTypePrompt(brand, sourceType, excerpt, url)),
        callClaude(buildNarrativeElementPrompt(brand, excerpt)),
        callClaude(buildConfidenceLevelPrompt(sourceType, brand, excerpt)),
        callClaude(buildLimitationPrompt(sourceType, brand, excerpt)),
        callClaude(buildSummaryAndAnglePrompt(brand, sourceType, excerpt)),
      ]);

    const typeData = parseJSON<{ signal_type: SignalType; confidence: number; reasoning: string }>(typeResult, {
      signal_type: "A",
      confidence: 0.7,
      reasoning: "Could not parse AI response",
    });

    const narrativeData = parseJSON<{ primary_element: NarrativeElement; secondary_element?: NarrativeElement; reasoning: string }>(narrativeResult, {
      primary_element: "Other",
      reasoning: "Could not parse AI response",
    });

    const confidenceData = parseJSON<{ confidence_level: ConfidenceLevel; reasoning: string }>(confidenceResult, {
      confidence_level: "MEDIUM",
      reasoning: "Could not parse AI response",
    });

    const limitationData = parseJSON<{ limitation: string }>(limitationResult, {
      limitation: "Signal source limitations apply; verify claims independently.",
    });

    const summaryData = parseJSON<{ signal_summary: string; product_design_choice: string; possible_post_angle: string }>(
      summaryResult,
      {
        signal_summary: excerpt.slice(0, 80),
        product_design_choice: "Observation not available",
        possible_post_angle: "Content angle not available",
      }
    );

    return {
      signalType: typeData.signal_type,
      signalTypeConfidence: typeData.confidence,
      signalTypeReasoning: typeData.reasoning,
      primaryNarrativeElement: narrativeData.primary_element,
      secondaryNarrativeElement: narrativeData.secondary_element,
      narrativeReasoning: narrativeData.reasoning,
      confidenceLevel: confidenceData.confidence_level,
      confidenceReasoning: confidenceData.reasoning,
      limitation: limitationData.limitation,
      signalSummary: summaryData.signal_summary,
      productDesignChoice: summaryData.product_design_choice,
      possiblePostAngle: summaryData.possible_post_angle,
    };
  } catch (err) {
    console.error("Claude API error:", err);
    return getMockSuggestions(brand, sourceType, excerpt);
  }
}

function getMockSuggestions(brand: Brand, sourceType: SourceType, excerpt: string): AISuggestions {
  const isOfficial = ["Official App Page", "App Store", "Changelog"].includes(sourceType);
  const isUserGenerated = ["Google Alert"].includes(sourceType) && excerpt.toLowerCase().includes("review");
  const hasEV = /\b(ev|electric|charging|battery|range)\b/i.test(excerpt);
  const hasControl = /\b(remote|control|unlock|start|access)\b/i.test(excerpt);
  const hasStatus = /\b(real.time|live|status|track|monitor)\b/i.test(excerpt);
  const hasPartnership = /\b(partner|integrat|connect|ecosystem)\b/i.test(excerpt);

  let signalType: SignalType = "A";
  if (sourceType === "LinkedIn") signalType = "B";
  if (isUserGenerated) signalType = "C";

  let primaryElement: NarrativeElement = "Status";
  if (hasEV) primaryElement = "EV/Charging";
  else if (hasControl) primaryElement = "Control";
  else if (hasPartnership) primaryElement = "Partnership";
  else if (hasStatus) primaryElement = "Status";

  const confidenceLevel: ConfidenceLevel = isOfficial ? "HIGH" : isUserGenerated ? "LOW" : "MEDIUM";

  return {
    signalType,
    signalTypeConfidence: isOfficial ? 0.92 : 0.75,
    signalTypeReasoning: `${sourceType} from ${brand} — classified based on source type heuristics (demo mode, no API key configured).`,
    primaryNarrativeElement: primaryElement,
    secondaryNarrativeElement: hasEV && hasStatus ? "Status" : undefined,
    narrativeReasoning: `Excerpt keywords suggest ${primaryElement} narrative element (demo mode).`,
    confidenceLevel,
    confidenceReasoning: `${sourceType} → ${confidenceLevel} confidence (demo mode heuristic).`,
    limitation: getLimitationForSourceType(sourceType),
    signalSummary: `${brand} ${sourceType.toLowerCase()} signal: ${excerpt.slice(0, 60)}...`,
    productDesignChoice: `${brand} appears to prioritize ${primaryElement.toLowerCase()} as a core ownership feature based on this ${sourceType.toLowerCase()}.`,
    possiblePostAngle: `How ${brand} frames ${primaryElement.toLowerCase()} in their digital ownership narrative`,
  };
}

function getLimitationForSourceType(sourceType: SourceType): string {
  switch (sourceType) {
    case "App Store":
      return "Release notes describe intended features; don't show actual implementation or UX. Need in-app verification to confirm features work as described.";
    case "LinkedIn":
      return "LinkedIn post is official brand communication but may emphasize certain features over others. Compare with app store release notes for complete feature list.";
    case "Official App Page":
      return "Official app description doesn't show actual UX or user experience; may describe ideal features rather than current implementation.";
    case "Sales/Marketing Page":
      return "Sales page language is designed to attract buyers; claims may be aspirational rather than reflecting current app capabilities.";
    case "Google Alert":
      return "Third-party coverage may summarize or interpret brand announcements; verify claims against primary sources.";
    case "Changelog":
      return "Changelog entries describe code-level changes; actual user-facing impact requires in-app verification.";
    default:
      return "Signal source limitations apply; verify claims against primary brand sources before drawing conclusions.";
  }
}
