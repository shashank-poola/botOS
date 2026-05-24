import { Router } from "express";
import { loggerMiddleware, errorMiddleware } from "../middleware/middleware";
import analyzeRouter from "./analyze.route";
import clusterRouter from "./cluster.route";
import insightsRouter from "./insight.route";
import healthRouter from "./health.route";

const mainRouter = Router();

mainRouter.use(loggerMiddleware);

mainRouter.use("/health", healthRouter);
mainRouter.use("/analyze", analyzeRouter);
mainRouter.use("/clusters", clusterRouter);
mainRouter.use("/insights", insightsRouter);

mainRouter.use(errorMiddleware);

export default mainRouter;
