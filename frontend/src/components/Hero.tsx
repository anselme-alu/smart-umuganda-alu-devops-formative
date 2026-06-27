type HeroProps = {
  canManageEvents: boolean;
};

export function Hero({ canManageEvents }: HeroProps) {
  return (
    <section className="hero rounded-3xl bg-primary text-primary-content shadow-xl">
      <div className="hero-content w-full items-start justify-between gap-8 px-6 py-10 sm:px-10 lg:flex-row">
        <div className="max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] opacity-80">
            Smart Umuganda
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Upcoming community activities
          </h1>
          <p className="mt-4 max-w-2xl text-primary-content/80">
            View scheduled Umuganda events, locations, and attendance progress
            from your authenticated dashboard.
          </p>
        </div>
        <div className="card w-full max-w-xs bg-primary-content text-primary shadow">
          <div className="card-body gap-3">
            <span className="badge badge-primary badge-outline w-fit">
              Logged-in access
            </span>
            <h2 className="card-title text-lg">Event workspace</h2>
            <p className="text-sm text-primary/70">
              {canManageEvents
                ? "Your role can manage community activities once the event form is connected."
                : "Citizens can follow upcoming activities and attendance progress here."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
