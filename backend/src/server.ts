import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import locationsRouter from "./routes/locations";

const app = express();

app.use(
  cors({
    origin: process.env["FRONTEND_URL"] ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/locations", locationsRouter);

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

const PORT = process.env["PORT"] ?? 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
