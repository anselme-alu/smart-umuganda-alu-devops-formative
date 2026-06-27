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
  createdAt: string;
  attendanceCount: number;
};

export type CreateUmugandaEventInput = {
  title: string;
  description?: string;
  location: string;
  district?: string;
  sector?: string;
  date: string;
  startTime: string;
  endTime: string;
  organizer?: string;
};

export type AttendanceRecord = {
  id: string;
  eventId: string;
  participantName: string;
  participantPhone?: string;
  checkedInAt: string;
};

export type CreateAttendanceInput = {
  participantName: string;
  participantPhone?: string;
};
