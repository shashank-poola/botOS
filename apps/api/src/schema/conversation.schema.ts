import { z } from "zod";

export const conversationSchema = z.object({
    messages: z.array(z.record(z.string(), z.unknown())),
    fullText: z.string().min(1),
    qdrantPointId: z.string().optional(),
    messageCount: z.number().int().min(0),
    resolved: z.boolean().optional(),
    sentimentScore: z.number().min(-1).max(1).optional(),
    conversationAt: z.coerce.date().optional(),
});

export const uploadConversationsSchema = z.object({
    conversations: z.array(conversationSchema),
});
