import cors from "cors";
import "dotenv/config";
import express from "express";

const app = express();
app.use(express.json());

const PORT = process.env.SERVER_PORT;

const ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
app.use(
    cors({
        origin: ALLOWED_ORIGINS,
        credentials: true,
    }),
);

app.use("/api/v1", routes);

server.listen(SERVER_PORT, () => {
    console.log("Server is running port : 8000")
});