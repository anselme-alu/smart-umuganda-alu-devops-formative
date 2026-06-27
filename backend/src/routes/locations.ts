import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index";
import { locations } from "../db/schema/index";
import { authenticate, adminOnly } from "../middleware/auth";

const router = Router();

const locationTypes = [
  "province",
  "district",
  "sector",
  "cell",
  "village",
] as const;
type LocationType = (typeof locationTypes)[number];

const parentTypeMap: Record<LocationType, LocationType | null> = {
  province: null,
  district: "province",
  sector: "district",
  cell: "sector",
  village: "cell",
};

const createLocationSchema = z.object({
  name: z.string().min(2).max(255),
  type: z.enum(locationTypes),
  parentId: z.string().uuid().optional(),
});

const updateLocationSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  parentId: z.string().uuid().nullable().optional(),
});

function getStringParam(
  params: Record<string, string | string[]>,
  key: string,
): string | undefined {
  const val = params[key];
  return typeof val === "string" ? val : undefined;
}

function getStringQuery(
  query: Record<string, unknown>,
  key: string,
): string | undefined {
  const val = query[key];
  return typeof val === "string" ? val : undefined;
}

router.get("/", async (req, res) => {
  const typeFilter = getStringQuery(req.query, "type");
  const parentFilter = getStringQuery(req.query, "parentId");

  if (typeFilter && locationTypes.includes(typeFilter as LocationType)) {
    if (parentFilter) {
      const results = await db
        .select()
        .from(locations)
        .where(
          and(
            eq(locations.type, typeFilter as LocationType),
            eq(locations.parentId, parentFilter),
          ),
        );
      res.json(results);
      return;
    }
    const results = await db
      .select()
      .from(locations)
      .where(eq(locations.type, typeFilter as LocationType));
    res.json(results);
    return;
  }

  const all = await db.select().from(locations);
  res.json(all);
});

router.get("/:id", authenticate, async (req, res) => {
  const id = getStringParam(req.params, "id");
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  const [location] = await db
    .select()
    .from(locations)
    .where(eq(locations.id, id))
    .limit(1);
  if (!location) {
    res.status(404).json({ error: "Location not found" });
    return;
  }
  res.json(location);
});

router.post("/", authenticate, adminOnly, async (req, res) => {
  const parsed = createLocationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { name, type, parentId } = parsed.data;
  const requiredParentType = parentTypeMap[type];

  if (requiredParentType === null && parentId) {
    res.status(400).json({ error: "Province cannot have a parent location" });
    return;
  }

  if (requiredParentType !== null && !parentId) {
    res
      .status(400)
      .json({ error: `${type} requires a parent ${requiredParentType}` });
    return;
  }

  if (parentId && requiredParentType) {
    const [parent] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, parentId))
      .limit(1);

    if (!parent) {
      res.status(404).json({ error: "Parent location not found" });
      return;
    }

    if (parent.type !== requiredParentType) {
      res.status(400).json({
        error: `Parent of a ${type} must be a ${requiredParentType}, got ${parent.type}`,
      });
      return;
    }
  }

  const [location] = await db
    .insert(locations)
    .values({ name, type, parentId: parentId ?? null })
    .returning();

  res.status(201).json(location);
});

router.patch("/:id", authenticate, adminOnly, async (req, res) => {
  const id = getStringParam(req.params, "id");
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  const parsed = updateLocationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates["name"] = parsed.data.name;
  if (parsed.data.parentId !== undefined)
    updates["parentId"] = parsed.data.parentId;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db
    .update(locations)
    .set(updates)
    .where(eq(locations.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Location not found" });
    return;
  }
  res.json(updated);
});

router.delete("/:id", authenticate, adminOnly, async (req, res) => {
  const id = getStringParam(req.params, "id");
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }

  const [deleted] = await db
    .delete(locations)
    .where(eq(locations.id, id))
    .returning({ id: locations.id });

  if (!deleted) {
    res.status(404).json({ error: "Location not found" });
    return;
  }
  res.json({ message: "Location deleted" });
});

export default router;
