import { Hero } from "../../components/Hero";
import Layout from "../../components/Layout";
import { UpcomingEvents } from "../../components/UpcomingEvents";
import { useAuth } from "../../contexts/AuthContext";
import { useUpcomingEvents } from "../../hooks/useUpcomingEvents";

export default function EventsPage() {
  const { user } = useAuth();
  const { events, errorMessage, isLoading } = useUpcomingEvents();
  const canManageEvents =
    user?.role === "admin" || user?.role === "system_user";

  return (
    <Layout>
      <div className="space-y-8">
        <Hero canManageEvents={canManageEvents} />
        <UpcomingEvents
          canManageEvents={canManageEvents}
          events={events}
          errorMessage={errorMessage}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  );
}
