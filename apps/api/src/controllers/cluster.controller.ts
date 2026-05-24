import type { Request, Response } from "express";
import { db } from "@repo/database";
import { cluster } from "../types/cluster.type";
import { clusterQuerySchema } from "../schema/cluster.schema";

export const getClusters = async (req: Request, res: Response) => {
    try {
        const query = clusterQuerySchema.parse(req.query);

        let runId = query.runId;
        if (!runId) {
            const latestRun = await db.analysisRun.findFirst({
                where: { status: "COMPLETE" },
                orderBy: { startedAt: "desc" },
            });
            if (!latestRun) {
                return res.status(200).json({ success: true, data: [], error: null });
            }
            runId = latestRun.id;
        }

        const clusters = await db.cluster.findMany({
            where: {
                runId,
                ...(query.trend ? { trend: query.trend } : {}),
            },
            orderBy: { priorityScore: "desc" },
        });

        return res.status(200).json({
            success: true,
            data: clusters.map(cluster),
            error: null,
        });
    } catch (err) {
        console.error("Get clusters failed:", err);
        return res.status(500).json({
            success: false,
            message: null,
            error: "FAILED_FETCHING_CLUSTERS",
        });
    }
};

export const getClusterConversations = async (req: Request, res: Response) => {
    try {
        const clusterId = Number(req.params.id);
        if (isNaN(clusterId)) {
            return res.status(400).json({
                success: false,
                message: null,
                error: "INVALID_CLUSTER_ID",
            });
        }

        const conversations = await db.conversation.findMany({
            where: { clusterId },
            take: 10,
            orderBy: { conversationAt: "desc" },
        });

        return res.status(200).json({
            success: true,
            data: conversations,
            error: null,
        });
    } catch (err) {
        console.error("Get cluster conversations failed:", err);
        return res.status(500).json({
            success: false,
            message: null,
            error: "FAILED_FETCHING_CONVERSATIONS",
        });
    }
};
