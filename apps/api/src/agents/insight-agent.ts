import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { db } from "@repo/database";
import { embedAndStore, getAllVectors } from "../services/embedding.service";
import { clusterVectors, computeSilhouette } from "../services/clustering.service";
import { labelCluster } from "../services/labeler.service";
import { ensureCollection } from "../services/qdrant.service";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface RawConversation {
    id: number;
    customer_name: string;
    agent_name: string;
    date: string;
    channel: string;
    product: string;
    messages: Array<{ role: string; text: string }>;
}

async function seedIfEmpty(): Promise<void> {
    const count = await db.conversation.count();
    if (count > 0) return;

    const filePath = resolve(__dirname, "../../../../data/conversation.json");
    const raw = readFileSync(filePath, "utf-8");
    const items = JSON.parse(raw) as RawConversation[];

    await db.conversation.createMany({
        data: items.map((c) => {
            const fullText = c.messages
                .map((m) => `${m.role === "customer" ? "Customer" : "Agent"}: ${m.text}`)
                .join("\n");
            return {
                messages: c.messages,
                fullText,
                messageCount: c.messages.length,
                resolved: c.messages.at(-1)?.role === "agent",
                conversationAt: new Date(c.date),
            };
        }),
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

    await db.analysisRun.update({
        where: { id: runId },
        data: { totalConversations: conversations.length },
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
            const line = c.fullText.split("\n").find((l) => l.startsWith("Customer:"));
            return line?.replace("Customer:", "").trim() ?? c.fullText.substring(0, 100);
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
