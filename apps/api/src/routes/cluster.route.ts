import { Router } from "express";
import { getClusters, getClusterConversations } from "../controllers/cluster.controller";

const clusterRouter = Router();

clusterRouter.get("/", getClusters);
clusterRouter.get("/:id/conversations", getClusterConversations);

export default clusterRouter;
