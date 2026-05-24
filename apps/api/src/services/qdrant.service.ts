import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "../config/env.config";

export const COLLECTION = "conversations";
const VECTOR_SIZE = 768;

export const qdrant = new QdrantClient({
    url: env.QDRANT_URL as string,
    apiKey: env.QDRANT_API_KEY,
});

export async function ensureCollection(): Promise<void> {
    const { collections } = await qdrant.getCollections();
    
    if (!collections.find((c) => c.name === COLLECTION)) {
        await qdrant.createCollection(COLLECTION, {
            vectors: { size: VECTOR_SIZE, distance: "Cosine" },
        });
    }
}
