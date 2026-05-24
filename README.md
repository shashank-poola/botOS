# BotOS - Sentiment analytics engine

Sentiment analytics engine for customer support conversations. Takes raw support data, clusters it automatically, and surfaces what's breaking — in a format a PM can act on.

---

## The Problem

Customer support teams generate hundreds of conversations per day. PMs can't read them all. They need signal, not volume.

**Without Botos:**
```
Conversation 1: "I was charged after I cancelled..."
Conversation 2: "My delivery hasn't arrived..."
Conversation 3: "The app crashes every time I..."
... (hundreds more)
```

**With Botos:**
```
Billing system charges customers post-cancellation  —  CRITICAL  (18%)
Claims processing blocks on undisclosed documents   —  HIGH      (14%)
Delivery ETA failure on time-sensitive orders       —  HIGH      (12%)
```

---

## Architecture

![Architecture Diagram](./architecture.png)

```
POST /api/v1/analyze
    │
    ├─ Seed conversations → PostgreSQL
    ├─ Embed each conversation → Gemini (gemini-embedding-001, 768-dim) → Qdrant
    ├─ Cluster vectors → Spherical K-means (k=6, cosine distance)
    ├─ Label each cluster → Groq (Llama 3.3 70B) → headline + detail + severity + quotes
    └─ Store Cluster + Insight → PostgreSQL

GET /api/v1/insights   →  6 PM-readable cards, ordered by impact
PATCH /api/v1/insights/:id  →  PM updates status (NEW → IN_PROGRESS → RESOLVED)
```

The pipeline is async. `POST /analyze` returns `202 Accepted` with a run ID. Poll `GET /api/v1/runs/:id/status` to track PENDING → EMBEDDING → CLUSTERING → LABELING → COMPLETE.

---

## Stack

| Layer | Tech |
|---|---|
| API | Node.js · Express v5 · TypeScript · Bun |
| Database | PostgreSQL (Neon) · Prisma |
| Vector DB | Qdrant Cloud |
| Embeddings | Google Gemini (`gemini-embedding-001`, 768-dim) |
| LLM | Groq · Llama 3.3 70B |
| Clustering | Spherical K-means (K-means++ init, cosine distance) |
| Frontend | Next.js 16 · Tailwind CSS · Recharts |
| Monorepo | Turborepo · Bun workspaces |

---

## Setup

**Prerequisites:** Bun, a PostgreSQL database (Neon works), Qdrant Cloud account, Google AI Studio API key, Groq API key.

**1. Install dependencies**
```bash
bun install
```

**2. Configure environment**

Create `apps/api/.env`:
```env
SERVER_PORT=8000
SERVER_JWT_SECRET=your_secret

DATABASE_URL=postgresql://...

GEMINI_API_KEY=your_gemini_key

GROQ_API_KEY=your_groq_key

QDRANT_CLUSTER_ID=https://your-cluster-id.qdrant.tech
QDRANT_URL=your_qdrant_api_key
```

Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**3. Set up the database**
```bash
cd packages/database
bunx prisma migrate deploy
bunx prisma generate
```

**4. Run**
```bash
# from root
bun dev
```

API runs on `http://localhost:8000`, web on `http://localhost:3000`.

---

## API Reference

```
POST   /api/v1/analyze                      Trigger analysis pipeline (202 Accepted)
GET    /api/v1/analyze/runs/:id/status      Poll run status

GET    /api/v1/insights                     Get all insights for latest run
GET    /api/v1/insights/:id                 Get single insight
PATCH  /api/v1/insights/:id                 Update insight status

GET    /api/v1/clusters                     Get clusters for latest run
GET    /api/v1/clusters/:id/conversations   Get conversations in a cluster

GET    /api/v1/health                       Health check
```

---

## How the Pipeline Works

**Embedding** — each conversation is flattened to a single string and embedded via Gemini. Rate-limited to sequential calls with exponential backoff on 429s (free tier).

**Clustering** — Spherical K-means (k=6) groups conversations by semantic similarity. K-means++ initialization for stable centroids. Silhouette score is computed and stored so you can tell if the clusters are well-separated.

**Labeling** — Groq labels each cluster with a headline, detail, recommendation, severity, and example quotes. The prompt enforces specificity: no abstract nouns, headline must name the broken system, recommendation must name the specific component to fix.

---

## Project Structure

```
botos/
├── apps/
│   ├── api/                  Express API
│   │   └── src/
│   │       ├── agents/       Pipeline orchestration
│   │       ├── services/     Embedding, clustering, labeling, Qdrant
│   │       ├── controllers/  Route handlers
│   │       └── routes/       Express router
│   └── web/                  Next.js dashboard
│       └── src/
│           ├── components/   Dashboard, InsightCard, InsightDetail, DistributionChart
│           ├── hooks/        useInsights, useRunPoller
│           ├── services/     API client
│           └── lib/          Utilities, severity config
├── packages/
│   └── database/             Prisma schema + generated client
└── data/
    └── conversation.json     50 seed conversations
```
