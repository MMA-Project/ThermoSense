import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

import { apiRouter } from "./routes/api.routes";
import { getOrCreateCorrelationId } from "./lib/security-logger";

const app = express();
const openApiPath = path.resolve(__dirname, "..", "openapi.yml");
const openApiContent = fs.readFileSync(openApiPath, "utf8");
const openApiDocument = YAML.parse(openApiContent);

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  const correlationId = getOrCreateCorrelationId(req);
  res.setHeader("x-correlation-id", correlationId);
  next();
});
app.use("/api", apiRouter);
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get("/swagger.json", (_req, res) => {
  res.json(openApiDocument);
});
app.get("/openapi.yml", (_req, res) => {
  res.type("application/yaml").send(openApiContent);
});

export { app };
