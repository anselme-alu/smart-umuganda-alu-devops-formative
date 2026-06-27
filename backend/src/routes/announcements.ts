import { Router } from "express";
import { z } from "zod";
import { eq, and, desc, not, inArray, count } from "drizzle-orm";
import { db } from "../db";
import { announcements, announcementReads } from "../db/schema";
import { authenticate, staffOnly, adminOnly } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  title: z.string().min(3).max(255),
  content: z.string().min(1),
  locationId: z.string().uuid().optional(),
});

const updateSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  content: z.string().min(1).optional(),
  locationId: z.string().uuid().nullable().optional(),
});

function getStringParam(
  params: Record<string, string | string[]>,
  key: string,
): string | undefined {
  const val = params[key];
  return typeof val === "string" ? val : undefined;
}

router.get("/unread-count", async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const readRows = await db
    .select({ announcementId: announcementReads.announcementId })
    .from(announcementReads)
    .where(eq(announcementReads.userId, userId));

  const readIds = readRows.map((r) => r.announcementId);

  let unreadCount: number;
  if (readIds.length === 0) {
    const [result] = await db.select({ value: count() }).from(announcements);
    unreadCount = result?.value ?? 0;
  } else {
    const [result] = await db
      .select({ value: count() })
      .from(announcements)
      .where(not(inArray(announcements.id, readIds)));
    unreadCount = result?.value ?? 0;
  }

  res.json({ unreadCount });
});

router.get("/", async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt));

  const readRows = await db
    .select({ announcementId: announcementReads.announcementId })
    .from(announcementReads)
    .where(eq(announcementReads.userId, userId));

  const readSet = new Set(readRows.map((r) => r.announcementId));

  const result = rows.map((a) => ({ ...a, isRead: readSet.has(a.id) }));
  res.json(result);
});

router.post("/", staffOnly, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { title, content, locationId } = parsed.data;
  const [announcement] = await db
    .insert(announcements)
    .values({
      title,
      content,
      locationId: locationId ?? null,
      createdBy: userId,
    })
    .returning();

  if (!announcement) {
    res.status(500).json({ error: "Failed to create announcement" });
    return;
  }

  res.status(201).json(announcement);
});

router.get("/:id", async (req: AuthRequest, res) => {
  const id = getStringParam(req.params, "id");
  const userId = req.user?.userId;
  if (!id || !userId) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  const [announcement] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);

  if (!announcement) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  const [readRecord] = await db
    .select()
    .from(announcementReads)
    .where(
      and(
        eq(announcementReads.announcementId, id),
        eq(announcementReads.userId, userId),
      ),
    )
    .limit(1);

  res.json({ ...announcement, isRead: !!readRecord });
});

router.patch("/:id", staffOnly, async (req: AuthRequest, res) => {
  const id = getStringParam(req.params, "id");
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates["title"] = parsed.data.title;
  if (parsed.data.content !== undefined)
    updates["content"] = parsed.data.content;
  if (parsed.data.locationId !== undefined)
    updates["locationId"] = parsed.data.locationId;
  updates["updatedAt"] = new Date();

  if (Object.keys(updates).length === 1) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db
    .update(announcements)
    .set(updates)
    .where(eq(announcements.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  res.json(updated);
});

router.delete("/:id", adminOnly, async (req: AuthRequest, res) => {
  const id = getStringParam(req.params, "id");
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  const [deleted] = await db
    .delete(announcements)
    .where(eq(announcements.id, id))
    .returning({ id: announcements.id });

  if (!deleted) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  res.json({ message: "Announcement deleted" });
});

router.post("/:id/read", async (req: AuthRequest, res) => {
  const id = getStringParam(req.params, "id");
  const userId = req.user?.userId;
  if (!id || !userId) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  const [announcement] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);

  if (!announcement) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(announcementReads)
    .where(
      and(
        eq(announcementReads.announcementId, id),
        eq(announcementReads.userId, userId),
      ),
    )
    .limit(1);

  if (existing) {
    res.json({ message: "Already marked as read" });
    return;
  }

  await db.insert(announcementReads).values({ announcementId: id, userId });
  res.status(201).json({ message: "Marked as read" });
});

router.delete("/:id/read", async (req: AuthRequest, res) => {
  const id = getStringParam(req.params, "id");
  const userId = req.user?.userId;
  if (!id || !userId) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  await db
    .delete(announcementReads)
    .where(
      and(
        eq(announcementReads.announcementId, id),
        eq(announcementReads.userId, userId),
      ),
    );

  res.json({ message: "Marked as unread" });
});

export default router;
