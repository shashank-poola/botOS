import { Router } from "express";
import { triggerAnalysis, getRunStatus } from "../controllers/analyze.controller";

const analyzeRouter = Router();

analyzeRouter.post("/", triggerAnalysis);
analyzeRouter.get("/runs/:runId/status", getRunStatus);

export default analyzeRouter;
