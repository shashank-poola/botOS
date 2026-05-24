import { Router } from "express";
import { getInsights, getInsightById, updateInsightStatus } from "../controllers/insight.controller";

const insightsRouter = Router();

insightsRouter.get("/", getInsights);
insightsRouter.get("/:id", getInsightById);
insightsRouter.patch("/:id", updateInsightStatus);

export default insightsRouter;
