import cors from "cors";
import express from "express";
import { env } from "./config/env.config";
import mainRouter from "./routes";

const app = express();
app.use(express.json());

const PORT = env.SERVER_PORT;

const ALLOWED_ORIGINS = ["http://localhost:3000"];

app.use(cors({ 
        origin: ALLOWED_ORIGINS, 
        credentials: true 
    }
));

app.use("/api/v1", mainRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
