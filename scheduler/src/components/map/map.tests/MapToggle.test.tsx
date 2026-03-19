import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// MapToggle imports from @/src/lib/map — mock only what the component needs
jest.mock("@/src/lib/map", () => ({}));

import { MapToggle } from "../MapToggle";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("MapToggle", () => {
  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Rendering
  it("renders Events and Friends buttons", () => {
    render(<MapToggle mode="events" onChange={onChange} />);
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Friends")).toBeInTheDocument();
  });

  it("renders the events emoji", () => {
    render(<MapToggle mode="events" onChange={onChange} />);
    expect(screen.getByText("📅")).toBeInTheDocument();
  });

  it("renders the friends emoji", () => {
    render(<MapToggle mode="events" onChange={onChange} />);
    expect(screen.getByText("👥")).toBeInTheDocument();
  });

  // Active state classes
  it("applies active class to Events button when mode is events", () => {
    render(<MapToggle mode="events" onChange={onChange} />);
    const eventsBtn = screen.getByRole("button", { name: /Events/i });
    expect(eventsBtn.className).toContain("bg-primary");
  });

  it("does not apply active class to Friends button when mode is events", () => {
    render(<MapToggle mode="events" onChange={onChange} />);
    const friendsBtn = screen.getByRole("button", { name: /Friends/i });
    expect(friendsBtn.className).not.toContain("bg-primary");
  });

  it("applies active class to Friends button when mode is friends", () => {
    render(<MapToggle mode="friends" onChange={onChange} />);
    const friendsBtn = screen.getByRole("button", { name: /Friends/i });
    expect(friendsBtn.className).toContain("bg-primary");
  });

  it("does not apply active class to Events button when mode is friends", () => {
    render(<MapToggle mode="friends" onChange={onChange} />);
    const eventsBtn = screen.getByRole("button", { name: /Events/i });
    expect(eventsBtn.className).not.toContain("bg-primary");
  });

  // onChange callbacks
  it("calls onChange with 'events' when Events button is clicked", () => {
    render(<MapToggle mode="friends" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Events/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("events");
  });

  it("calls onChange with 'friends' when Friends button is clicked", () => {
    render(<MapToggle mode="events" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Friends/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("friends");
  });

  it("calls onChange only once per click", () => {
    render(<MapToggle mode="events" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Friends/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  // Count badges — eventCount
  it("renders eventCount badge when eventCount is provided", () => {
    render(<MapToggle mode="events" onChange={onChange} eventCount={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("does not render eventCount badge when eventCount is undefined", () => {
    render(<MapToggle mode="events" onChange={onChange} />);
    // "0" would also be an issue — just make sure there's no badge text
    // Both buttons should have no numeric badge
    const badges = screen
      .queryAllByText(/^\d+$/)
      .filter((el) => el.tagName !== "BUTTON");
    expect(badges).toHaveLength(0);
  });

  it("renders eventCount badge as 0 when eventCount is 0", () => {
    render(<MapToggle mode="events" onChange={onChange} eventCount={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  // Count badges — friendCount
  it("renders friendCount badge when friendCount is provided", () => {
    render(<MapToggle mode="events" onChange={onChange} friendCount={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not render friendCount badge when friendCount is undefined", () => {
    render(<MapToggle mode="friends" onChange={onChange} />);
    const badges = screen
      .queryAllByText(/^\d+$/)
      .filter((el) => el.tagName !== "BUTTON");
    expect(badges).toHaveLength(0);
  });

  it("renders both badges when both counts are provided", () => {
    render(
      <MapToggle mode="events" onChange={onChange} eventCount={4} friendCount={7} />
    );
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  // Badge colour changes with active state
  it("event badge uses active foreground classes when mode is events", () => {
    render(<MapToggle mode="events" onChange={onChange} eventCount={2} />);
    const badge = screen.getByText("2");
    expect(badge.className).toContain("bg-primary-foreground/15");
  });

  it("event badge uses muted classes when mode is friends", () => {
    render(<MapToggle mode="friends" onChange={onChange} eventCount={2} />);
    const badge = screen.getByText("2");
    expect(badge.className).toContain("bg-muted");
  });

  it("friend badge uses active foreground classes when mode is friends", () => {
    render(<MapToggle mode="friends" onChange={onChange} friendCount={8} />);
    const badge = screen.getByText("8");
    expect(badge.className).toContain("bg-primary-foreground/15");
  });

  it("friend badge uses muted classes when mode is events", () => {
    render(<MapToggle mode="events" onChange={onChange} friendCount={8} />);
    const badge = screen.getByText("8");
    expect(badge.className).toContain("bg-muted");
  });
});
