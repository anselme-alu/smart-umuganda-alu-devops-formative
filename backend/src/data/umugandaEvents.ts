import type {
  AttendanceRecord,
  CreateAttendanceInput,
  CreateUmugandaEventInput,
  UmugandaEvent,
} from "../models/umugandaEvent";

const today = new Date();
const nextSaturday = new Date(today);
nextSaturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

const initialEvents: UmugandaEvent[] = [
  {
    id: "event-1",
    title: "Community road cleaning",
    description:
      "Residents will clean drainage channels and remove litter along the main road.",
    location: "Kimironko market road",
    district: "Gasabo",
    sector: "Kimironko",
    date: toDateOnly(nextSaturday),
    startTime: "08:00",
    endTime: "11:00",
    organizer: "Kimironko Sector Office",
    createdAt: new Date().toISOString(),
    attendanceCount: 0,
  },
  {
    id: "event-2",
    title: "Tree planting activity",
    description:
      "Community members will plant trees around the public playground.",
    location: "Remera community playground",
    district: "Gasabo",
    sector: "Remera",
    date: toDateOnly(
      new Date(nextSaturday.getTime() + 7 * 24 * 60 * 60 * 1000),
    ),
    startTime: "07:30",
    endTime: "10:30",
    organizer: "Remera Sector Office",
    createdAt: new Date().toISOString(),
    attendanceCount: 0,
  },
];

let events = [...initialEvents];
let attendanceRecords: AttendanceRecord[] = [];

const normalize = (value: string) => value.trim().toLowerCase();

const hasText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function listUpcomingEvents(now = new Date()) {
  const todayDate = toDateOnly(now);

  return events
    .filter((event) => event.date >= todayDate)
    .sort((first, second) =>
      `${first.date}T${first.startTime}`.localeCompare(
        `${second.date}T${second.startTime}`,
      ),
    );
}

export function getEventById(eventId: string) {
  return events.find((event) => event.id === eventId);
}

export function createUmugandaEvent(input: CreateUmugandaEventInput) {
  const event: UmugandaEvent = {
    id: `event-${Date.now()}`,
    title: input.title.trim(),
    description: input.description?.trim() || "",
    location: input.location.trim(),
    district: input.district?.trim() || "",
    sector: input.sector?.trim() || "",
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    organizer: input.organizer?.trim() || "Community leader",
    createdAt: new Date().toISOString(),
    attendanceCount: 0,
  };

  events = [event, ...events];
  return event;
}

export function validateEventInput(input: Partial<CreateUmugandaEventInput>) {
  const requiredFields: Array<keyof CreateUmugandaEventInput> = [
    "title",
    "location",
    "date",
    "startTime",
    "endTime",
  ];
  const missingFields = requiredFields.filter(
    (field) => !hasText(input[field]),
  );

  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(", ")}`;
  }

  if (Number.isNaN(Date.parse(input.date as string))) {
    return "Event date must be a valid date";
  }

  return null;
}

export function markAttendance(eventId: string, input: CreateAttendanceInput) {
  const event = getEventById(eventId);

  if (!event) {
    return { error: "Event not found" as const };
  }

  if (!hasText(input.participantName)) {
    return { error: "Participant name is required" as const };
  }

  const participantName = input.participantName.trim();
  const participantPhone = input.participantPhone?.trim();
  const duplicateRecord = attendanceRecords.find((record) => {
    if (record.eventId !== eventId) {
      return false;
    }

    if (participantPhone && record.participantPhone) {
      return normalize(record.participantPhone) === normalize(participantPhone);
    }

    return normalize(record.participantName) === normalize(participantName);
  });

  if (duplicateRecord) {
    return {
      error: "Attendance already recorded for this participant" as const,
    };
  }

  const attendance: AttendanceRecord = {
    id: `attendance-${Date.now()}`,
    eventId,
    participantName,
    ...(participantPhone ? { participantPhone } : {}),
    checkedInAt: new Date().toISOString(),
  };

  attendanceRecords = [attendance, ...attendanceRecords];
  event.attendanceCount += 1;

  return { attendance };
}

export function listAttendanceForEvent(eventId: string) {
  return attendanceRecords.filter((record) => record.eventId === eventId);
}

export function resetUmugandaEventStore() {
  events = [...initialEvents];
  attendanceRecords = [];
}
