# BotOS(Reasoning) - Sentiment analytics engine

## The Problem

Customer support teams generate hundreds of conversations per day. PMs can't read them all. They need signal, not volume - what's breaking, how often, and what to fix.

The output should look like this:

```
Billing system charges customers post-cancellation - CRITICAL (18%)
Claims processing silently blocks on undisclosed document requirements - HIGH (14%)
Delivery ETA failure on time-sensitive orders - HIGH (12%)
```

Not this:

```
Conversation 1: "I cancelled and got charged..."
Conversation 2: "My package is late..."
... (10,000 more)
```

**Stack:** Node.js + Express + TypeScript · PostgreSQL + Prisma · Qdrant · Gemini embeddings (gemini-embedding-001) · Groq Llama 3.3 70B · Spherical K-means (k=6)

---

## Database: PostgreSQL + Prisma

PostgreSQL because the data is relational - conversations belong to clusters, clusters belong to runs, insights reference both. Filtering by runId + severity + status is a simple WHERE clause.

Prisma for type-safe queries. Schema mismatches surface at compile time.

Schema notes:
- `AnalysisRun` is a state machine: PENDING → EMBEDDING → CLUSTERING → LABELING → COMPLETE / FAILED. Frontend polls this to show progress.
- `Cluster.priorityScore = affectedPercent × severityWeight`. One number to sort the dashboard by impact.
- `Insight` has a status workflow (NEW → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → DISMISSED) so PMs can track issues like tickets.
- `Conversation.fullText` pre-flattens all messages into a single string for embedding. Avoids re-serializing the JSON on every call.

**Not MongoDB:** no multi-document transactions. Writing to Conversation, Cluster, and Insight per cluster needs atomicity.

**Not DynamoDB:** filtering by runId + severity + status is a GSI design problem there. It's a WHERE clause here.

---

## Vector Database: Qdrant

- Fast scroll API — needed to pull all vectors back for clustering
- Cloud-hosted, free tier, zero config
- UUID point IDs map directly to Prisma IDs - no translation layer

**Not pgvector:** same Postgres instance means resource contention during embedding. Also, full-table cosine scans are slow past 10k vectors without an HNSW index.

**Not Pinecone:** more expensive free tier, less control over collection config.

---

## Embedding Model: Gemini (gemini-embedding-001)

- 768-dim vectors with `outputDimensionality` cap - keeps Qdrant storage and clustering cheap
- Best free-tier quality for English support text
- `@google/genai` SDK has clean TypeScript types

Free tier rate limits hit with concurrent requests. Fixed with sequential embedding (300ms between calls) and exponential backoff on 429 (2s → 4s → 8s → 16s). At scale, switch to paid tier and batch.

**Not OpenAI text-embedding-3-small:** no free tier, requires billing setup before demo.

---

## Clustering: Spherical K-means (k=6)

First tried BFS cosine threshold (threshold=0.78): draw edges between conversations with cosine similarity above the threshold, find connected components. Didn't work — all support conversations share the same "complaint → resolution" structure. The embeddings reflect this. Result was one cluster containing 54% of conversations and 23 noise points.

Lowering the threshold made it worse, not better.

Switched to K-means with k=6. Fixed k means exactly 6 insight cards — the number a PM can actually act on in a sprint. Spherical variant (cosine distance, normalized centroids) fits high-dimensional embedding vectors better than Euclidean K-means.

K-means++ initialization for better starting centroids. 50 iterations is enough for 50–500 conversations.

**Not HDBSCAN:**
- No production JS/TS library for it
- Classifies 30–40% of points as noise - those conversations get no insight card
- Needs per-dataset tuning of `minClusterSize` and `minSamples`. K-means only needs `k`, which maps directly to "how many cards do you want"
- At 50k+ conversations: UMAP (768→20 dims) + HDBSCAN makes more sense. K-means spherical assumption breaks at that scale. For 50–5k, K-means is simpler and faster.

Silhouette score computed post-clustering to measure separation quality (range: -1 to 1). Above 0.3 is good. Below 0.1 means k is wrong for the data. Exposed in run status.

---

## LLM Labeling: Groq + Llama 3.3 70B

Groq because it's fast - labeling 6 clusters takes ~3–4 seconds total via LPU hardware. Same work on a standard GPU endpoint takes 20–30 seconds.

Llama 3.3 70B follows structured JSON instructions reliably. `response_format: { type: "json_object" }` ensures parseable output. Temperature 0.1 for consistent results.

Without prompt constraints, the output defaults to corporate generalities. The system prompt:
- Bans abstract nouns: "experience", "journey", "satisfaction", "seamless"
- Requires the headline to name a specific broken system or component
- Requires the recommendation to name a specific engineering action
- Defines severity in concrete terms (CRITICAL = payment error / data loss / outage)
- Requires example quotes to be verbatim customer sentences that show the failure

---

## API Design

REST over GraphQL - the query surface is small and predictable. Four endpoints don't need resolver infrastructure.

`POST /analyze` returns 202 Accepted with a run ID. The pipeline takes 30–120 seconds. Polling `/runs/:id/status` is the correct pattern for async work — the client never times out.

Zod validation at every boundary. ZodError caught by error middleware, returned as structured 400 with field-level messages.

---

## What I'd Do With More Time

1. **Real-time ingestion** - webhook endpoints for Intercom, Zendesk, Freshdesk. Run pipeline on a rolling window instead of seeding from JSON.
2. **Trend detection** - compare cluster composition between runs. Flag clusters that are GROWING before they become crises.
3. **Semantic search** - `POST /search` that embeds a query and returns nearest-neighbor conversations via Qdrant.
4. **Auto-severity calibration** - learn from PM status updates. If PMs keep escalating MEDIUM to CRITICAL, adjust the scoring weights.
5. **Slack / Linear push** - CRITICAL insights notify the PM channel automatically.
6. **Multi-tenant isolation** - separate Qdrant collection and PostgreSQL schema per customer.
7. **Better clustering at scale** - UMAP (768→20) + HDBSCAN for 10k+ conversations. Keep K-means for <5k.

---

## What I'd Do Differently

**Embed customer messages only.** Currently embedding the full conversation including agent responses. Agent text is formulaic and adds noise. Customer lines alone would produce tighter clusters.

**Dynamic k selection.** Run K-means for k=4,6,8,10, pick the k with the best silhouette score. More upfront compute, better cluster quality across different datasets.

**Job queue for the pipeline.** Currently runs in-process as a fire-and-forget async call. In production this should be BullMQ + Redis - survives server restarts, supports retries, can scale across workers.
