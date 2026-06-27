import api from "../api/client";
import type { EventsResponse } from "../types/umugandaEvent";

export async function fetchUpcomingEvents() {
  const response = await api.get<EventsResponse>("/events/upcoming");

  return response.data.events;
}
