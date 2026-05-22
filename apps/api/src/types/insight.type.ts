export const insight = (i: {
    id: string;
    runId: number;
    clusterId: number;
    headline: string;
    detail: string;
    recommendation: string | null;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    affectedPercent: number;
    affectedCount: number;
    exampleQuotes: string[];
    status: "NEW" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";
    createdAt: Date;
}) => ({
    ...i,
});
