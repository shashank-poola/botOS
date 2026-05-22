-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('PENDING', 'EMBEDDING', 'CLUSTERING', 'LABELING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "Trend" AS ENUM ('NEW', 'GROWING', 'STABLE', 'SHRINKING');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "fullText" TEXT NOT NULL,
    "qdrantPointId" TEXT,
    "messageCount" INTEGER NOT NULL,
    "resolved" BOOLEAN,
    "sentimentScore" DOUBLE PRECISION,
    "clusterId" INTEGER,
    "conversationAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisRun" (
    "id" SERIAL NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'PENDING',
    "totalConversations" INTEGER NOT NULL,
    "clustersFound" INTEGER,
    "noisePoints" INTEGER,
    "silhouetteScore" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AnalysisRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cluster" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "priorityScore" DOUBLE PRECISION,
    "trend" "Trend",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "runId" INTEGER NOT NULL,
    "clusterId" INTEGER NOT NULL,
    "headline" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "recommendation" TEXT,
    "severity" "Severity" NOT NULL,
    "affectedPercent" DOUBLE PRECISION NOT NULL,
    "affectedCount" INTEGER NOT NULL,
    "exampleQuotes" TEXT[],
    "status" "InsightStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_qdrantPointId_key" ON "Conversation"("qdrantPointId");

-- CreateIndex
CREATE INDEX "Conversation_clusterId_idx" ON "Conversation"("clusterId");

-- CreateIndex
CREATE INDEX "Cluster_runId_idx" ON "Cluster"("runId");

-- CreateIndex
CREATE INDEX "Insight_runId_idx" ON "Insight"("runId");

-- CreateIndex
CREATE INDEX "Insight_severity_idx" ON "Insight"("severity");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cluster" ADD CONSTRAINT "Cluster_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AnalysisRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AnalysisRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
