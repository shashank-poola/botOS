import { z } from "zod";

export const insightQuerySchema = z.object({
    runId: z.coerce.number().int().positive().optional(),
    clusterId: z.coerce.number().int().positive().optional(),
    severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
    status: z
        .enum(["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISMISSED"])
        .optional(),
});

export const updateInsightSchema = z.object({
    status: z.enum(["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISMISSED"]),
});
