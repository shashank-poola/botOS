# Botos — Architecture

## Request Flow

### Analyze Pipeline (async)

```
Client
POST /api/v1/analyze
└─ 202 Accepted { runId, status: "PENDING" }
```

Background (non-blocking):

```
EMBEDDING
├─ Load conversations from seed JSON
├─ Flatten messages → fullText string
├─ Gemini API → 768-dim vector per conversation
└─ Upsert vectors to Qdrant collection "conversations"

CLUSTERING
├─ Scroll all vectors from Qdrant
├─ Normalize to unit sphere
├─ Spherical K-means (k=6, 50 iterations, cosine distance)
└─ Assign clusterId to each conversation in PostgreSQL

LABELING
├─ For each cluster: fetch member conversations
├─ Build prompt with conversation samples + affectedPercent
├─ Groq (Llama 3.3 70B) → { headline, detail, recommendation, severity, exampleQuotes }
└─ Store Insight record in PostgreSQL

COMPLETE
└─ AnalysisRun.status → COMPLETE, completedAt set
```

### Read Flow

```
Client
GET /api/v1/insights
└─ SELECT insights WHERE runId = latestRun ORDER BY affectedPercent DESC

GET /api/v1/clusters/:id/conversations
└─ SELECT conversations WHERE clusterId = :id LIMIT 10

GET /api/v1/runs/:id/status
└─ SELECT status, clustersFound, silhouetteScore FROM analysis_runs
```

## Data Model

```
AnalysisRun
  id, status (PENDING→EMBEDDING→CLUSTERING→LABELING→COMPLETE→FAILED)
  totalConversations, clustersFound, silhouetteScore
  startedAt, completedAt

Conversation
  id, messages (JSON), fullText (string)
  qdrantPointId, clusterId → Cluster
  messageCount, resolved, sentimentScore
  conversationAt, createdAt

Cluster
  id, runId → AnalysisRun
  label, size, percentage, priorityScore
  trend (NEW/GROWING/STABLE/SHRINKING)

Insight
  id, runId → AnalysisRun, clusterId → Cluster
  headline, detail, recommendation
  severity (CRITICAL/HIGH/MEDIUM/LOW)
  affectedPercent, affectedCount
  exampleQuotes (string[])
  status (NEW→ACKNOWLEDGED→IN_PROGRESS→RESOLVED→DISMISSED)
```

## Service Boundaries

```
apps/api/src/
├── agents/
│   └── insight-agent.ts      orchestrates full pipeline, updates run status
├── services/
│   ├── embedding.service.ts  Gemini API calls, sequential with backoff
│   ├── clustering.service.ts spherical k-means, silhouette scoring
│   ├── labeler.service.ts    Groq prompt + JSON parse + quote extraction
│   ├── qdrant.service.ts     collection init, upsert, scroll
│   └── db.ts                 Prisma client singleton
├── controllers/              thin layer, delegates to agent/services
├── routes/                   Express router, Zod validation
├── middleware/               error handler, request logger
└── config/env.config.ts      validated environment variables
```

## Infrastructure

| Component | Service | Why |
|-----------|---------|-----|
| PostgreSQL | Neon (serverless) | Relational queries, free tier, zero ops |
| Vector DB | Qdrant Cloud | Fast scroll API for clustering, free tier |
| Embeddings | Google AI Studio | Best free-tier quality for English text |
| LLM | Groq | Sub-second inference via LPU hardware |
| Runtime | Node.js + Bun | TypeScript-native, fast cold start |

## Scalability Notes

**Current design (50–5,000 conversations):**
- Sequential embedding with 300ms delay to respect Gemini free tier rate limits
- In-process pipeline via async/await — no queue needed at this scale
- K-means runs in memory — 5,000 × 768 floats = ~30MB

**At 50,000+ conversations:**
- Replace sequential embedding with batched parallel calls (paid tier)
- Move pipeline to BullMQ + Redis job queue for reliability + retries
- Replace K-means with UMAP (768→20 dims) + HDBSCAN for natural cluster discovery
- Add HNSW index to Qdrant collection for fast approximate nearest-neighbor search

## Error Handling

- Gemini 429 (rate limit) → exponential backoff: 2s → 4s → 8s → 16s, max 4 retries
- Groq parse failure → retry once with stricter JSON prompt, then skip cluster
- Pipeline failure at any stage → AnalysisRun.status = FAILED, error stored
- All errors propagate to Express error middleware → structured JSON response
