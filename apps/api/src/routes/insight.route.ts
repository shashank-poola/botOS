import { Router } from "express";

const insightsRouter = Router();

insightsRouter.get("/");
insightsRouter.get("/:id");

export default insightsRouter