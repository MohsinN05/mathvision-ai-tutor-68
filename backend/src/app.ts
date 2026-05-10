import "dotenv/config";
import { config } from "dotenv";
import { join } from "node:path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { router } from "./routes";
import { authRouter } from "./routes/auth";
import { errorHandler } from "./middleware/error";
import { connectMongo } from "./database/mongo";

const backendEnvPath = join(__dirname, "../.env");
const loaded = config({ path: backendEnvPath });
if (loaded.parsed) {
  console.log(`Loaded backend .env from ${backendEnvPath}`);
}
console.log(
  JSON.stringify({
    service: "mathvision-backend",
    cwd: process.cwd(),
    env: {
      WOLFRAM_APP_ID: Boolean(process.env.WOLFRAM_APP_ID),
      PYTHON_SOLVER_URL: process.env.PYTHON_SOLVER_URL || null,
      PORT: process.env.PORT || 4000,
    },
  }),
);

const app = express();

const origins = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origins.includes("*") || origins.includes(origin)) {
        return callback(null, true);
      }
      const isLocalhost =
        /^https?:\/\/localhost(?::\d+)?$/i.test(origin) ||
        /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i.test(origin);
      if (isLocalhost) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));

app.get("/health", (_req, res) => res.json({ ok: true, service: "mathvision-backend" }));

app.use("/auth", authRouter);
app.use("/api", router);

app.use(errorHandler);

connectMongo().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to connect to MongoDB:", error);
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`MathVision backend listening on :${port}`);
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      event: "backend-start",
      port,
      env: {
        pythonSolverUrl: Boolean(process.env.PYTHON_SOLVER_URL),
        wolframAppId: Boolean(process.env.WOLFRAM_APP_ID),
      },
    }),
  );
});

export default app;
