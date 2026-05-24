import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "../config/env.config";

export const COLLECTION = "conversations";
const VECTOR_SIZE = 768;

export const qdrant = new QdrantClient({
    url: env.QDRANT_CLUSTER_ID,
    apiKey: env.QDRANT_URL,
});

export async function ensureCollection(): Promise<void> {
    const { collections } = await qdrant.getCollections();
    
    if (!collections.find((c) => c.name === COLLECTION)) {
        await qdrant.createCollection(COLLECTION, {
            vectors: { size: VECTOR_SIZE, distance: "Cosine" },
        });
    }
}
