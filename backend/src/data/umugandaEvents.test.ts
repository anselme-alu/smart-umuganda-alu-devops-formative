import { afterEach, describe, expect, it } from "vitest";
import {
  createUmugandaEvent,
  listUpcomingEvents,
  markAttendance,
  resetUmugandaEventStore,
  validateEventInput,
} from "./umugandaEvents";

describe("umuganda event store", () => {
  afterEach(() => {
    resetUmugandaEventStore();
  });

  it("creates and lists upcoming events by date", () => {
    const event = createUmugandaEvent({
      title: "Clean community gardens",
      location: "Kacyiru gardens",
      date: "2099-06-26",
      startTime: "08:00",
      endTime: "11:00",
    });

    const upcomingEvents = listUpcomingEvents(new Date("2099-06-01"));

    expect(upcomingEvents[0]).toMatchObject({
      id: event.id,
      title: "Clean community gardens",
      attendanceCount: 0,
    });
  });

  it("validates required event fields", () => {
    expect(validateEventInput({ title: "Missing details" })).toBe(
      "Missing required fields: location, date, startTime, endTime",
    );
  });

  it("records attendance once per participant", () => {
    const event = createUmugandaEvent({
      title: "Tree planting",
      location: "Nyamirambo playground",
      date: "2099-07-24",
      startTime: "07:30",
      endTime: "10:30",
    });

    const firstAttendance = markAttendance(event.id, {
      participantName: "Nshimiyandinze Fiston",
      participantPhone: "0788000000",
    });
    const duplicateAttendance = markAttendance(event.id, {
      participantName: "Nshimiyandinze Fiston",
      participantPhone: "0788000000",
    });

    expect(firstAttendance).toHaveProperty("attendance");
    expect(duplicateAttendance).toEqual({
      error: "Attendance already recorded for this participant",
    });
    expect(event.attendanceCount).toBe(1);
  });
});
