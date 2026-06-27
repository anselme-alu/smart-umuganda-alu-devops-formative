import { Router } from "express";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { issues, issueReplies } from "../db/schema";
import { authenticate, staffOnly } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

const createIssueSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10),
  type: z.enum(["bad_citizen", "umuganda_absence", "other"]),
  locationId: z.string().uuid().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["pending", "reviewed", "reported_to_police", "closed"]),
});

const createReplySchema = z.object({
  message: z.string().min(1),
});

function getStringParam(
  params: Record<string, string | string[]>,
  key: string,
): string | undefined {
  const val = params[key];
  return typeof val === "string" ? val : undefined;
}

router.post("/", async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = createIssueSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { title, description, type, locationId } = parsed.data;
  const [issue] = await db
    .insert(issues)
    .values({
      title,
      description,
      type,
      locationId: locationId ?? null,
      reportedBy: userId,
    })
    .returning();

  if (!issue) {
    res.status(500).json({ error: "Failed to create issue" });
    return;
  }

  res.status(201).json(issue);
});

router.get("/", async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  const role = req.user?.role;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const isStaff = role === "admin" || role === "system_user";
  const rows = isStaff
    ? await db.select().from(issues).orderBy(desc(issues.createdAt))
    : await db
        .select()
        .from(issues)
        .where(eq(issues.reportedBy, userId))
        .orderBy(desc(issues.createdAt));

  res.json(rows);
});

router.get("/:id", async (req: AuthRequest, res) => {
  const id = getStringParam(req.params, "id");
  const userId = req.user?.userId;
  const role = req.user?.role;

  if (!id || !userId) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  const [issue] = await db
    .select()
    .from(issues)
    .where(eq(issues.id, id))
    .limit(1);

  if (!issue) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }

  const isStaff = role === "admin" || role === "system_user";
  if (!isStaff && issue.reportedBy !== userId) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const replies = await db
    .select()
    .from(issueReplies)
    .where(eq(issueReplies.issueId, id))
    .orderBy(issueReplies.createdAt);

  res.json({ ...issue, replies });
});

router.patch("/:id/status", staffOnly, async (req: AuthRequest, res) => {
  const id = getStringParam(req.params, "id");
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const [updated] = await db
    .update(issues)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(issues.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }

  res.json(updated);
});

router.post("/:id/replies", staffOnly, async (req: AuthRequest, res) => {
  const id = getStringParam(req.params, "id");
  const userId = req.user?.userId;

  if (!id || !userId) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  const [issue] = await db
    .select()
    .from(issues)
    .where(eq(issues.id, id))
    .limit(1);

  if (!issue) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }

  const parsed = createReplySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const [reply] = await db
    .insert(issueReplies)
    .values({ issueId: id, userId, message: parsed.data.message })
    .returning();

  if (!reply) {
    res.status(500).json({ error: "Failed to create reply" });
    return;
  }

  res.status(201).json(reply);
});

router.delete("/:id", staffOnly, async (req: AuthRequest, res) => {
  const id = getStringParam(req.params, "id");
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  const [deleted] = await db
    .delete(issues)
    .where(and(eq(issues.id, id)))
    .returning({ id: issues.id });

  if (!deleted) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }

  res.json({ message: "Issue deleted" });
});

export default router;
