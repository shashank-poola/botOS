import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
})

const envSchema = z.object({
    SERVER_PORT: z.string().default("8000").transform(Number),
    SERVER_JWT_SECRET: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    GEMINI_API_KEY: z.string().min(1),
    GROQ_API_KEY: z.string().min(1),
    QDRANT_CLUSTER_ID: z.string().min(1),
    QDRANT_URL: z.string().min(1),
    OPENAI_EMBED_MODEL: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
  });

export const env = envSchema.parse(process.env);