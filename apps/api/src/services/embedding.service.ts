import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.config";
import { qdrant, COLLECTION } from "./qdrant.service";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getEmbedding(text: string, attempt = 0): Promise<number[]> {
    try {
        const response = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: text,
            config: { outputDimensionality: 768 },
        });
        return response.embeddings?.[0]?.values ?? [];
    } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 429 && attempt < 4) {
            const backoff = Math.pow(2, attempt) * 2000;
            console.log(`Rate limited. Retrying in ${backoff / 1000}s (attempt ${attempt + 1})`);
            await sleep(backoff);
            return getEmbedding(text, attempt + 1);
        }
        throw err;
    }
}

export async function embedAndStore(
    conversations: Array<{ id: string; fullText: string }>
): Promise<void> {
    const UPSERT_BATCH = 10;
    const points: Array<{ id: string; vector: number[]; payload: { conversationId: string } }> = [];

    for (let i = 0; i < conversations.length; i++) {
        const conv = conversations[i]!;
        console.log(`Embedding ${i + 1}/${conversations.length}: ${conv.id}`);
        const vector = await getEmbedding(conv.fullText);
        points.push({ id: conv.id, vector, payload: { conversationId: conv.id } });

        if (points.length === UPSERT_BATCH || i === conversations.length - 1) {
            await qdrant.upsert(COLLECTION, { wait: true, points: [...points] });
            points.length = 0;
        }

        await sleep(300);
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
