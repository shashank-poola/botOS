import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({
    path: path.resolve(process.cwd(), "../../.env"),
})

const envSchema = z.object({
    SERVER_PORT: z.string().default("8000").transform(Number),
    SERVER_JWT_SECRET: z.string().min(1),
    DATABASE_URL: z.url(),
    OPENAI_EMBED_MODEL: z.string().optional(),
    QDRANT_URL: z.url().optional(),
    QDRANT_CLUSTER_ID: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_API_URL: z.string().optional(),
  });
  
export const env = envSchema.parse(process.env);