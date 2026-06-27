import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { authenticate, adminOnly } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authenticate, adminOnly);

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.email().optional(),
  role: z.enum(["admin", "user", "system_user"]).optional(),
  locationId: z.uuid().nullable().optional(),
});

const safeColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  locationId: users.locationId,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

function getStringParam(
  params: Record<string, string | string[]>,
  key: string,
): string | undefined {
  const val = params[key];
  return typeof val === "string" ? val : undefined;
}

router.get("/", async (_req, res) => {
  const allUsers = await db.select(safeColumns).from(users);
  res.json(allUsers);
});

router.get("/:id", async (req: AuthRequest, res) => {
  const id = getStringParam(req.params, "id");
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  const [user] = await db
    .select(safeColumns)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const id = getStringParam(req.params, "id");
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates["name"] = parsed.data.name;
  if (parsed.data.email !== undefined) updates["email"] = parsed.data.email;
  if (parsed.data.role !== undefined) updates["role"] = parsed.data.role;
  if (parsed.data.locationId !== undefined)
    updates["locationId"] = parsed.data.locationId;
  updates["updatedAt"] = new Date();

  if (Object.keys(updates).length === 1) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, id))
    .returning(safeColumns);

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(updated);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const id = getStringParam(req.params, "id");
  const currentUserId = req.user?.userId;

  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  if (id === currentUserId) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }

  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });

  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ message: "User deleted" });
});

router.post("/:id/make-system-user", async (req: AuthRequest, res) => {
  const id = getStringParam(req.params, "id");
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  const [user] = await db
    .select(safeColumns)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.role === "admin") {
    res.status(400).json({ error: "Cannot change an admin to a system user" });
    return;
  }

  const [updated] = await db
    .update(users)
    .set({ role: "system_user", updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning(safeColumns);

  res.json(updated);
});

export default router;
