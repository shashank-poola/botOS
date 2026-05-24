import Groq from "groq-sdk";
import { env } from "../config/env.config";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export interface ClusterLabel {
    headline: string;
    detail: string;
    recommendation: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export async function labelCluster(
    conversations: Array<{ fullText: string }>,
    affectedPercent: number
): Promise<ClusterLabel> {
    const sample = conversations
        .slice(0, 5)
        .map((c) => c.fullText)
        .join("\n---\n");

    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "user",
                content: `You are a product analytics expert. Analyze these customer service conversations and produce a PM-readable insight.

Affected users: ${conversations.length} (${affectedPercent.toFixed(1)}% of total)

Sample conversations:
${sample}

Respond with valid JSON only:
{
  "headline": "Short actionable insight under 80 characters",
  "detail": "2-3 sentence explanation of the pattern and its business impact",
  "recommendation": "Specific actionable recommendation for the product team",
  "severity": "CRITICAL or HIGH or MEDIUM or LOW"
}

Severity: CRITICAL=product blocker, HIGH=major friction, MEDIUM=notable issue, LOW=minor.`,
            },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from Groq");

    return JSON.parse(content) as ClusterLabel;
}
