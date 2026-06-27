import type { UmugandaEvent } from "../types/umugandaEvent";

type EventCardProps = {
  event: UmugandaEvent;
};

const formatEventDate = (date: string) =>
  new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

export function EventCard({ event }: EventCardProps) {
  const area = [event.sector, event.district].filter(Boolean).join(", ") || "To be confirmed";

  return (
    <article className="card bg-base-100 shadow">
      <div className="card-body gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="badge badge-outline">{formatEventDate(event.date)}</span>
          <strong className="text-base-content">
            {event.startTime} - {event.endTime}
          </strong>
        </div>
        <div>
          <h3 className="card-title">{event.title}</h3>
          <p className="mt-2 text-sm leading-6 text-base-content/70">
            {event.description || "More details will be shared by the community leader."}
          </p>
        </div>
        <dl className="mt-auto divide-y divide-base-200 text-sm">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-base-content/60">Location</dt>
            <dd className="text-right font-semibold">{event.location}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-base-content/60">Area</dt>
            <dd className="text-right font-semibold">{area}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-base-content/60">Organizer</dt>
            <dd className="text-right font-semibold">{event.organizer}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-base-content/60">Attendance</dt>
            <dd className="text-right font-semibold">{event.attendanceCount} recorded</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
