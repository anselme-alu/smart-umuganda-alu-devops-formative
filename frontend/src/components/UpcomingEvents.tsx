import { EventCard } from "./EventCard";
import type { UmugandaEvent } from "../types/umugandaEvent";

type UpcomingEventsProps = {
  events: UmugandaEvent[];
  errorMessage: string;
  isLoading: boolean;
  canManageEvents?: boolean;
};

export function UpcomingEvents({
  canManageEvents = false,
  events,
  errorMessage,
  isLoading,
}: UpcomingEventsProps) {
  const hasNoEvents = !isLoading && !errorMessage && events.length === 0;

  return (
    <section className="space-y-6" aria-labelledby="upcoming-events-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Events
          </p>
          <h2 id="upcoming-events-heading" className="mt-2 text-3xl font-bold">
            Upcoming Umuganda events
          </h2>
        </div>
        {canManageEvents && (
          <button className="btn btn-primary" type="button" disabled>
            Create event
          </button>
        )}
      </div>

      {isLoading && (
        <div className="alert">
          <span className="loading loading-spinner loading-sm" />
          <span>Loading upcoming events...</span>
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-error">
          <span>{errorMessage}</span>
        </div>
      )}
      {hasNoEvents && (
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center">
            <h3 className="card-title">No events scheduled</h3>
            <p className="text-sm text-base-content/60">
              No upcoming Umuganda events have been scheduled yet.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <EventCard event={event} key={event.id} />
        ))}
      </div>
    </section>
  );
}
