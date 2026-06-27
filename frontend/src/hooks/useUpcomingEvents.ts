import { useEffect, useState } from "react";
import { fetchUpcomingEvents } from "../services/eventsApi";
import type { UmugandaEvent } from "../types/umugandaEvent";

export function useUpcomingEvents() {
  const [events, setEvents] = useState<UmugandaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadUpcomingEvents = async () => {
      try {
        const upcomingEvents = await fetchUpcomingEvents();
        setEvents(upcomingEvents);
      } catch {
        setErrorMessage("We could not load upcoming Umuganda events. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadUpcomingEvents();
  }, []);

  return { events, errorMessage, isLoading };
}
