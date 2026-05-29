import { Brand, SourceType } from "../types";

export function buildSignalTypePrompt(brand: Brand, sourceType: SourceType, excerpt: string, url: string): string {
  return `You are analyzing a signal (excerpt from a brand's digital product communication) and categorizing it by type.

TYPE A (Primary Signal): Official app update, feature announcement, release note — direct from brand
TYPE B (Contextual Signal): Industry news, architecture, partnership, analyst report
TYPE C (User Signal): Review excerpt, community discussion, Reddit, forums
TYPE D (Question): Raises interesting question but not a concrete signal yet
TYPE E (Rabbit Hole): Interesting but tangential; requires >30 min research

SIGNAL TO CATEGORIZE:
Brand: ${brand}
Source Type: ${sourceType}
Exact Excerpt: "${excerpt}"
Source URL: ${url}

TASK:
1. Determine the signal type (A/B/C/D/E)
2. Provide confidence score (0.0-1.0)
3. Briefly explain why (1-2 sentences)

RESPOND IN JSON only, no markdown:
{"signal_type":"A","confidence":0.95,"reasoning":"Official Mercedes app page announcing real-time status feature; direct from brand source, clearly stated intent."}`;
}

export function buildNarrativeElementPrompt(brand: Brand, excerpt: string): string {
  return `You are analyzing a signal excerpt and identifying which ownership narrative element(s) it touches.

NARRATIVE ELEMENTS:
- Onboarding: How brand introduces app/ownership to new users
- Control: Empowerment, remote action, agency ("I can make things happen")
- Trust: Reliability, transparency, confidence ("I can depend on this")
- Status: Real-time information, visibility ("I know what's happening")
- Support: Service, help, troubleshooting ("Help when I need it")
- Partnership: Third-party services, integrations ("Other brands I love")
- EV/Charging: Electric vehicle support, charging infrastructure
- Personalization: Individual identity, customization ("It's mine")
- Other: Doesn't fit above categories

SIGNAL:
Brand: ${brand}
Excerpt: "${excerpt}"

TASK:
1. Identify primary ownership element (choose one from list above)
2. Identify secondary element (if any; can be null)
3. Explain reasoning (1-2 sentences)

RESPOND IN JSON only, no markdown:
{"primary_element":"Status","secondary_element":"Trust","reasoning":"Excerpt emphasizes 'real-time status updates' (primary: Status), which builds confidence in system reliability (secondary: Trust)."}`;
}

export function buildConfidenceLevelPrompt(sourceType: SourceType, brand: Brand, excerpt: string): string {
  return `You are assessing the confidence level of a research signal based on its source credibility.

CONFIDENCE LEVELS:
- HIGH: Official brand source, clearly stated — Official app page, press release, support docs, official changelog, app store release notes, LinkedIn post from official company account
- MEDIUM: Authoritative but not official — News article, analyst report, LinkedIn post from brand employee or influencer
- LOW: Public signal but not official or highly authoritative — Single user review, community post, Reddit thread

SIGNAL:
Source Type: ${sourceType}
Brand: ${brand}
Excerpt: "${excerpt}"

RESPOND IN JSON only, no markdown:
{"confidence_level":"HIGH","reasoning":"Official app store release notes are direct brand communication."}`;
}

export function buildLimitationPrompt(sourceType: SourceType, brand: Brand, excerpt: string): string {
  return `You are generating an honest limitation statement for a research signal.

Goal: Flag what this signal does NOT prove, to prevent overclaiming.

SIGNAL:
Source Type: ${sourceType}
Excerpt: "${excerpt}"
Brand: ${brand}

INSTRUCTIONS:
- What can't you conclude from this signal?
- What would you need to verify this claim?
- What context is missing?
- Keep it concise (1-2 sentences max)
- Be specific, not generic

Avoid saying: "This doesn't prove internal strategy" or "This isn't 100% certain"
Do say: Specific missing info + how to verify

RESPOND IN JSON only, no markdown:
{"limitation":"Official app description doesn't show actual UX or user experience; need in-app verification to confirm features work as described."}`;
}

export function buildSummaryAndAnglePrompt(brand: Brand, sourceType: SourceType, excerpt: string): string {
  return `You are summarizing a research signal and generating a content angle for a research analyst writing about premium automotive digital ownership.

SIGNAL:
Brand: ${brand}
Source Type: ${sourceType}
Excerpt: "${excerpt}"

TASK:
1. Write a one-liner signal summary (max 15 words, factual, no opinion)
2. Write a product design choice observation (what does this signal reveal about the brand's product strategy? 1-2 sentences)
3. Suggest a possible LinkedIn/Substack post angle (specific, interesting, grounded in this signal)

RESPOND IN JSON only, no markdown:
{"signal_summary":"Mercedes positions app as real-time vehicle connection hub","product_design_choice":"Mercedes highlights status visibility as core ownership feature, suggesting the brand prioritizes transparency and immediate information access.","possible_post_angle":"How brands frame vehicle status as trust-building: Mercedes and Volvo's real-time push explained"}`;
}

export function buildPatternDetectionPrompt(
  signals: Array<{ brand: string; sourceType: string; excerpt: string; narrativeElements: string[]; week: number }>,
  weekNumber: number
): string {
  const signalList = signals
    .map((s, i) => `Signal ${i + 1}: ${s.brand} | ${s.sourceType} | Elements: ${s.narrativeElements.join(", ")}\nExcerpt: "${s.excerpt.slice(0, 150)}..."`)
    .join("\n\n");

  return `You are analyzing signals from a research project tracking how premium automotive brands narrate digital ownership.

Project context: Analyzing Mercedes-Benz, BMW, Audi, Volvo, Porsche across 12 weeks. Looking for patterns in app updates, LinkedIn posts, official pages.

SIGNALS FROM WEEK ${weekNumber}:
${signalList}

TASK: Identify 2-4 meaningful patterns. For each pattern:
1. Give it a short title
2. Describe what it shows (2-3 sentences)
3. Reference specific signals (by number)
4. Assign a trend: "up" (increasing), "down" (declining), "hot" (significant this week), "stable"

Only include patterns that are genuinely supported by the data. Do not hallucinate patterns.

RESPOND IN JSON only, no markdown:
{"patterns":[{"title":"EV Momentum Shift","description":"Volvo released 2 EV-related features while Mercedes released 0. This continues a 3-week pattern of Volvo leading on EV narrative.","signals":[1,3],"trend":"hot"}]}`;
}

export function buildContentAnglesPrompt(
  signals: Array<{ id: string; brand: string; summary?: string; narrativeElements: string[] }>,
  patterns: string[],
  weekNumber: number
): string {
  const signalList = signals
    .map((s) => `- ${s.brand}: ${s.summary || "Signal"} (${s.narrativeElements.join(", ")})`)
    .join("\n");

  return `You are suggesting blog post angles for a researcher writing about premium automotive digital ownership on LinkedIn and Substack.

Project: 12-week analysis of Mercedes-Benz, BMW, Audi, Volvo, Porsche digital product strategies.
Week: ${weekNumber}

SIGNALS THIS WEEK:
${signalList}

DETECTED PATTERNS:
${patterns.join("\n")}

TASK: Suggest 2-3 distinct blog post angles that:
1. Are grounded in specific signals (not opinions)
2. Tell a clear story about brand strategy
3. Are publishable on LinkedIn (250-400 words) or Substack (600-800 words)
4. Are interesting to automotive industry / digital product readers

RESPOND IN JSON only, no markdown:
{"angles":[{"title":"Real-Time Status As Trust Signal","channel":"LinkedIn","wordcount":300,"signals_used":["signal id or description"],"story":"Both Mercedes and Volvo emphasized real-time updates this week. What does this reveal about how brands compete on ownership transparency?","confidence":"High"}]}`;
}
