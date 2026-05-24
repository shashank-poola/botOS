import type { Request, Response } from "express";
import { db } from "@repo/database";
import { analysisRun } from "../types/analyze.type";
import { runPipeline } from "../agents/insight-agent";

export const triggerAnalysis = async (_req: Request, res: Response) => {
    try {
        const count = await db.conversation.count();

        const run = await db.analysisRun.create({
            data: {
                status: "PENDING",
                totalConversations: count,
            },
        });

        runPipeline(run.id).catch(async (err: unknown) => {
            console.error("Pipeline failed:", err);
            await db.analysisRun.update({
                where: { id: run.id },
                data: { status: "FAILED" },
            });
        });

        return res.status(202).json({
            success: true,
            message: "Analysis queued",
            data: analysisRun(run),
            error: null,
        });
    } catch (err) {
        console.error("Trigger analysis failed:", err);
        return res.status(500).json({
            success: false,
            message: null,
            error: "ANALYSIS_TRIGGER_FAILED",
        });
    }
};

export const getRunStatus = async (req: Request, res: Response) => {
    try {
        const runId = Number(req.params.runId);
        if (isNaN(runId)) {
            return res.status(400).json({
                success: false,
                message: null,
                error: "INVALID_RUN_ID",
            });
        }

        const run = await db.analysisRun.findUnique({ where: { id: runId } });
        if (!run) {
            return res.status(404).json({
                success: false,
                message: null,
                error: "RUN_NOT_FOUND",
            });
        }

        return res.status(200).json({
            success: true,
            data: analysisRun(run),
            error: null,
        });
    } catch (err) {
        console.error("Get run status failed:", err);
        return res.status(500).json({
            success: false,
            message: null,
            error: "FAILED_FETCHING_RUN",
        });
    }
};
