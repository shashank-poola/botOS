import { z } from "zod";

export const analyzeQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z
        .enum(["PENDING", "EMBEDDING", "CLUSTERING", "LABELING", "COMPLETE", "FAILED"])
        .optional(),
});
