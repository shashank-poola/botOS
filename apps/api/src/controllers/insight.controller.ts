import type { Request, Response } from "express";
import { db } from "@repo/database";
import { insight } from "../types/insight.type";
import { insightQuerySchema, updateInsightSchema } from "../schema/insight.schema";

export const getInsights = async (req: Request, res: Response) => {
    try {
        const query = insightQuerySchema.parse(req.query);

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

        const insights = await db.insight.findMany({
            where: {
                runId,
                ...(query.clusterId ? { clusterId: query.clusterId } : {}),
                ...(query.severity ? { severity: query.severity } : {}),
                ...(query.status ? { status: query.status } : {}),
            },
            orderBy: { affectedPercent: "desc" },
        });

        return res.status(200).json({
            success: true,
            data: insights.map(insight),
            error: null,
        });
    } catch (err) {
        console.error("Get insights failed:", err);
        return res.status(500).json({
            success: false,
            message: null,
            error: "FAILED_FETCHING_INSIGHTS",
        });
    }
};

export const getInsightById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const found = await db.insight.findUnique({ where: { id } });
        if (!found) {
            return res.status(404).json({
                success: false,
                message: null,
                error: "INSIGHT_NOT_FOUND",
            });
        }

        return res.status(200).json({
            success: true,
            data: insight(found),
            error: null,
        });
    } catch (err) {
        console.error("Get insight failed:", err);
        return res.status(500).json({
            success: false,
            message: null,
            error: "FAILED_FETCHING_INSIGHT",
        });
    }
};

export const updateInsightStatus = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const body = updateInsightSchema.parse(req.body);

        const found = await db.insight.findUnique({ where: { id } });
        if (!found) {
            return res.status(404).json({
                success: false,
                message: null,
                error: "INSIGHT_NOT_FOUND",
            });
        }

        const updated = await db.insight.update({
            where: { id },
            data: { status: body.status },
        });

        return res.status(200).json({
            success: true,
            data: insight(updated),
            error: null,
        });
    } catch (err) {
        console.error("Update insight status failed:", err);
        return res.status(500).json({
            success: false,
            message: null,
            error: "FAILED_UPDATING_INSIGHT",
        });
    }
};
