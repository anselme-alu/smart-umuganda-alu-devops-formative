import type { Request, Response } from "express";
import {
  createUmugandaEvent,
  getEventById,
  listAttendanceForEvent,
  listUpcomingEvents,
  markAttendance,
  validateEventInput,
} from "../data/umugandaEvents";
import type { CreateAttendanceInput, CreateUmugandaEventInput } from "../models/umugandaEvent";

type EventParams = {
  eventId: string;
};

export function getUpcomingEvents(_req: Request, res: Response) {
  res.json({ events: listUpcomingEvents() });
}

export function getEvent(req: Request<EventParams>, res: Response) {
  const event = getEventById(req.params.eventId);

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  return res.json({ event });
}

export function createEvent(req: Request, res: Response) {
  const input = req.body as Partial<CreateUmugandaEventInput>;
  const validationError = validateEventInput(input);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const event = createUmugandaEvent(input as CreateUmugandaEventInput);

  return res.status(201).json({ event });
}

export function getEventAttendance(req: Request<EventParams>, res: Response) {
  const event = getEventById(req.params.eventId);

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  return res.json({ attendance: listAttendanceForEvent(req.params.eventId) });
}

export function createEventAttendance(req: Request<EventParams>, res: Response) {
  const result = markAttendance(req.params.eventId, req.body as CreateAttendanceInput);

  if ("error" in result) {
    const status = result.error === "Event not found" ? 404 : result.error.includes("already") ? 409 : 400;
    return res.status(status).json({ message: result.error });
  }

  return res.status(201).json({ attendance: result.attendance });
}
