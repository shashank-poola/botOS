import { z } from "zod";

export const clusterQuerySchema = z.object({
    runId: z.coerce.number().int().positive().optional(),
    trend: z.enum(["NEW", "GROWING", "STABLE", "SHRINKING"]).optional(),
});
