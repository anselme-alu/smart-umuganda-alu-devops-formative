export type UmugandaEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  district: string;
  sector: string;
  date: string;
  startTime: string;
  endTime: string;
  organizer: string;
  attendanceCount: number;
};

export type EventsResponse = {
  events: UmugandaEvent[];
};
