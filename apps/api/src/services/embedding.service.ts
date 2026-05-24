import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.config";
import { qdrant, COLLECTION } from "./qdrant.service";

const genai = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
const embeddingModel = genai.getGenerativeModel({ model: "text-embedding-004" });

export async function embedAndStore(
    conversations: Array<{ id: string; fullText: string }>
): Promise<void> {
    const BATCH = 20;
    for (let i = 0; i < conversations.length; i += BATCH) {
        const batch = conversations.slice(i, i + BATCH);
        const embeddings = await Promise.all(
            batch.map((c) => embeddingModel.embedContent(c.fullText))
        );
        await qdrant.upsert(COLLECTION, {
            wait: true,
            points: batch.map((conv, idx) => ({
                id: conv.id,
                vector: embeddings[idx]?.embedding.values ?? [],
                payload: { conversationId: conv.id },
            })),
        });
    }
}

export async function getAllVectors(): Promise<Array<{ id: string; vector: number[] }>> {
    const results: Array<{ id: string; vector: number[] }> = [];
    let offset: string | number | null | undefined = undefined;

    do {
        const response = await qdrant.scroll(COLLECTION, {
            with_vector: true,
            limit: 100,
            ...(offset != null ? { offset } : {}),
        });
        for (const point of response.points) {
            results.push({ id: point.id as string, vector: point.vector as number[] });
        }
        offset = response.next_page_offset as string | number | null | undefined;
    } while (offset != null);

    return results;
}
