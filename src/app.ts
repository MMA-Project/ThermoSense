import cors from "cors";
import express from "express";

import { apiRouter } from "./routes/api.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", apiRouter);

export { app };
