import { Router } from "express";

const clusterRouter = Router();

clusterRouter.get("/");
clusterRouter.get("/:id/conversation")

export default clusterRouter