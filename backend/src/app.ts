import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import cors from "cors";
import express from "express";
import authRouter from "./routes/auth";
import { eventsRouter } from "./routes/events";
import locationsRouter from "./routes/locations";
import usersRouter from "./routes/users";
import issuesRouter from "./routes/issues";
import announcementsRouter from "./routes/announcements";

const packageRoot = join(__dirname, "..");
const serviceVersion = (() => {
  try {
    const pkg = JSON.parse(
      readFileSync(join(packageRoot, "package.json"), "utf8"),
    ) as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
})();
const startedAt = Date.now();

export const app = express();

app.use(
  cors({
    origin: process.env["FRONTEND_URL"] ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "smart-umuganda-api",
    version: serviceVersion,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/events", eventsRouter);
app.use("/api/users", usersRouter);
app.use("/api/locations", locationsRouter);
app.use("/api/issues", issuesRouter);
app.use("/api/announcements", announcementsRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);
