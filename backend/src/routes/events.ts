import { Router } from "express";
import {
  createEvent,
  createEventAttendance,
  getEvent,
  getEventAttendance,
  getUpcomingEvents,
} from "../controllers/eventsController";

export const eventsRouter = Router();

eventsRouter.get("/upcoming", getUpcomingEvents);
eventsRouter.post("/", createEvent);
eventsRouter.get("/:eventId", getEvent);
eventsRouter.get("/:eventId/attendance", getEventAttendance);
eventsRouter.post("/:eventId/attendance", createEventAttendance);
