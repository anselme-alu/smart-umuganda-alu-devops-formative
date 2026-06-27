import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UpcomingEvents } from "./UpcomingEvents";

describe("UpcomingEvents", () => {
  it("renders an empty state", () => {
    render(<UpcomingEvents events={[]} errorMessage="" isLoading={false} />);

    expect(screen.getByText("No upcoming Umuganda events have been scheduled yet.")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    render(<UpcomingEvents events={[]} errorMessage="" isLoading />);

    expect(screen.getByText("Loading upcoming events...")).toBeInTheDocument();
  });

  it("shows management action only when allowed", () => {
    render(<UpcomingEvents canManageEvents events={[]} errorMessage="" isLoading={false} />);

    expect(screen.getByRole("button", { name: "Create event" })).toBeDisabled();
  });

  it("renders upcoming events", () => {
    render(
      <UpcomingEvents
        events={[
          {
            id: "event-1",
            title: "Community road cleaning",
            description: "Clean drainage channels near the main road.",
            location: "Kimironko market road",
            district: "Gasabo",
            sector: "Kimironko",
            date: "2099-06-26",
            startTime: "08:00",
            endTime: "11:00",
            organizer: "Kimironko Sector Office",
            attendanceCount: 3,
          },
        ]}
        errorMessage=""
        isLoading={false}
      />,
    );

    expect(screen.getByText("Community road cleaning")).toBeInTheDocument();
    expect(screen.getByText("Kimironko market road")).toBeInTheDocument();
    expect(screen.getByText("3 recorded")).toBeInTheDocument();
  });
});
