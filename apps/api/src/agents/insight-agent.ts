import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { db } from "@repo/database";
import { embedAndStore, getAllVectors } from "../services/embedding.service";
import { clusterVectors, computeSilhouette } from "../services/clustering.service";
import { labelCluster } from "../services/labeler.service";
import { ensureCollection } from "../services/qdrant.service";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface ConversationData {
    id: string;
    messages: Array<{ role: string; content: string }>;
    fullText: string;
    messageCount: number;
    resolved: boolean;
    conversationAt: string;
}

async function seedIfEmpty(): Promise<void> {
    const count = await db.conversation.count();
    if (count > 0) return;

    const filePath = resolve(__dirname, "../../../../data/conversations.json");
    const raw = readFileSync(filePath, "utf-8");
    const { conversations } = JSON.parse(raw) as { conversations: ConversationData[] };

    await db.conversation.createMany({
        data: conversations.map((c) => ({
            id: c.id,
            messages: c.messages,
            fullText: c.fullText,
            messageCount: c.messageCount,
            resolved: c.resolved,
            conversationAt: new Date(c.conversationAt),
        })),
        skipDuplicates: true,
    });
}

export async function runPipeline(runId: number): Promise<void> {
    await db.analysisRun.update({ where: { id: runId }, data: { status: "EMBEDDING" } });

    await ensureCollection();
    await seedIfEmpty();

    const conversations = await db.conversation.findMany({
        select: { id: true, fullText: true },
    });

    await embedAndStore(conversations);

    await db.analysisRun.update({ where: { id: runId }, data: { status: "CLUSTERING" } });

    const allVectors = await getAllVectors();
    const clusterResults = clusterVectors(allVectors);

    const noise = clusterResults.filter((r) => r.clusterId === -1);
    const clustered = clusterResults.filter((r) => r.clusterId !== -1);
    const uniqueClusterIds = [...new Set(clustered.map((r) => r.clusterId))];
    const silhouette = computeSilhouette(allVectors, clusterResults);

    await db.analysisRun.update({
        where: { id: runId },
        data: {
            status: "LABELING",
            clustersFound: uniqueClusterIds.length,
            noisePoints: noise.length,
            silhouetteScore: silhouette,
        },
    });

    const severityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

    for (const clusterId of uniqueClusterIds) {
        const memberIds = clusterResults.filter((r) => r.clusterId === clusterId).map((r) => r.id);
        const memberConvos = await db.conversation.findMany({
            where: { id: { in: memberIds } },
        });

        const affectedPercent = (memberIds.length / conversations.length) * 100;
        const label = await labelCluster(memberConvos, affectedPercent);
        const priorityScore = affectedPercent * (severityWeight[label.severity] ?? 1);

        const cluster = await db.cluster.create({
            data: {
                runId,
                label: label.headline,
                size: memberIds.length,
                percentage: affectedPercent,
                priorityScore,
            },
        });

        await db.conversation.updateMany({
            where: { id: { in: memberIds } },
            data: { clusterId: cluster.id },
        });

        const exampleQuotes = memberConvos.slice(0, 3).map((c) => {
            const line = c.fullText.split("\n").find((l) => l.startsWith("User:"));
            return line?.replace("User:", "").trim() ?? c.fullText.substring(0, 100);
        });

        await db.insight.create({
            data: {
                runId,
                clusterId: cluster.id,
                headline: label.headline,
                detail: label.detail,
                recommendation: label.recommendation,
                severity: label.severity,
                affectedPercent,
                affectedCount: memberIds.length,
                exampleQuotes,
            },
        });
    }

    await db.analysisRun.update({
        where: { id: runId },
        data: { status: "COMPLETE", completedAt: new Date() },
    });
}
