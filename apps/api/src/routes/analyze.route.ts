import { Router } from "express";

const analyzeRouter = Router();

analyzeRouter.post("/");
analyzeRouter.get("/runs/:runId/status");

export default analyzeRouter;