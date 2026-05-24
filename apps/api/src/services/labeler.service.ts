import Groq from "groq-sdk";
import { env } from "../config/env.config";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export interface ClusterLabel {
    headline: string;
    detail: string;
    recommendation: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    exampleQuotes: string[];
}

export async function labelCluster(
    conversations: Array<{ fullText: string }>,
    affectedPercent: number
): Promise<ClusterLabel> {
    const sample = conversations
        .slice(0, 6)
        .map((c, i) => `--- Conversation ${i + 1} ---\n${c.fullText}`)
        .join("\n\n");

    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system",
                content: `You are a principal product analyst reporting directly to a VP of Product at a high-growth startup. You specialize in converting raw customer support data into actionable product intelligence.

Your output will be read by engineers and PMs who need to prioritize their sprint. Every word must earn its place.

Output standards:
- HEADLINE: Name the exact broken system + failure mode + user impact. Format: "[System] [fails in specific way] — [concrete consequence]". Example: "Payment gateway silently retries failed charges — users charged 2-3x without notification". Never use abstract nouns like "experience", "journey", "satisfaction".
- DETAIL: Three sentences max. Sentence 1: what exactly is failing and where in the product. Sentence 2: what the user experiences as a result, with specifics from the conversations. Sentence 3: business risk — churn signal, revenue leak, legal exposure, or support cost.
- RECOMMENDATION: One engineering or product action. Start with a verb. Name the specific system, API, or UI component. Example: "Add idempotency key to payment retry logic and send SMS confirmation after each charge attempt". Never recommend "improving communication" or "better training".
- SEVERITY rules: CRITICAL = payment errors / data loss / security / service outage. HIGH = directly causes cancellations or prevents core task completion. MEDIUM = recurring friction that degrades retention over time. LOW = minor inconvenience with workaround available.

Never use: "empathy", "customer-centric", "satisfaction", "journey", "experience", "seamless", "proactive", "leverage".`,
            },
            {
                role: "user",
                content: `You are analyzing a cluster of ${conversations.length} customer support conversations representing ${affectedPercent.toFixed(1)}% of all support volume.

CONVERSATIONS:
${sample}

TASK:
1. Identify the single most specific, recurring product or process failure across these conversations.
2. Ignore one-off complaints. Focus on the pattern that appears in at least 2 conversations.
3. If multiple failures exist, pick the one with highest business impact.
4. Ground every claim in specific evidence from the conversations above.

Respond with valid JSON only. No markdown, no explanation, no preamble:
{
  "headline": "Exact system + failure mode + impact. Max 90 chars. Must name a specific product area.",
  "detail": "Three sentences: what is broken → what user experiences with specific examples → business risk with estimated impact.",
  "recommendation": "Single verb-first engineering action naming the specific system or component. Max 120 chars.",
  "severity": "CRITICAL | HIGH | MEDIUM | LOW",
  "exampleQuotes": ["Verbatim customer sentence from Conversation X that best illustrates the identified failure", "Second most illustrative verbatim customer sentence", "Third verbatim customer sentence — must be from a DIFFERENT conversation than the first two. All three must directly relate to the headline pattern."]
}`,
            },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from Groq");

    return JSON.parse(content) as ClusterLabel;
}
