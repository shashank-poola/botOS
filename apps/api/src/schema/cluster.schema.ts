import { z } from "zod";

export const clusterQuerySchema = z.object({
    runId: z.coerce.number().int().positive(),
    trend: z.enum(["NEW", "GROWING", "STABLE", "SHRINKING"]).optional(),
});
