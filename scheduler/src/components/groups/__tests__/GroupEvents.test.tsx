//tests for scheduler/src/components/groups/GroupEvents.tsx

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GroupEvents from "@/components/groups/GroupEvents";

// Mocks

jest.mock("@/lib/format", () => ({
  formatEventDate: jest.fn(() => "March 15, 2026"),
}));

jest.mock("lucide-react", () => ({
  Calendar: () => <svg data-testid="calendar-icon" />,
  Pencil:   () => <svg data-testid="pencil-icon" />,
  Trash2:   () => <svg data-testid="trash-icon" />,
  X:        () => <svg data-testid="x-icon" />,
  MapPin:   () => <svg data-testid="map-pin-icon" />,
}));

// Fixtures

const mockOnEdit   = jest.fn();
const mockOnDelete = jest.fn();

const mockEvents = [
  {
    id:                "evt-1",
    groupEventGroupId: "gevt-1",
    title:             "Project Sync",
    description:       "Discussing rocket propulsion",
    category:          "Study",
    start:             new Date("2026-03-15T10:00:00Z"),
  },
  {
    id:                "evt-2",
    groupEventGroupId: "gevt-2",
    title:             "Team Pizza",
    description:       null,
    category:          "Social",
    start:             new Date("2026-03-15T18:00:00Z"),
  },
];

// Tests

describe("GroupEvents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirms the component displays a clear empty state message when the events array is empty
  it("renders empty state correctly", () => {
    render(<GroupEvents events={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText("Group Events (0)")).toBeInTheDocument();
    expect(screen.getByText(/No events yet/i)).toBeInTheDocument();
  });

  // Confirms fundamental event details like title and formatted date are mapped to the UI.
  // Both events share the same mocked date, so getAllByText is used to assert the count.
  it("renders event details correctly", () => {
    render(<GroupEvents events={mockEvents} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText("Project Sync")).toBeInTheDocument();
    expect(screen.getByText("Discussing rocket propulsion")).toBeInTheDocument();

    const dateLabels = screen.getAllByText(/March 15, 2026/i);
    expect(dateLabels).toHaveLength(mockEvents.length);
  });

  // Confirms the correct CSS classes are applied based on the event's category
  it("applies the correct category-specific styles", () => {
    render(<GroupEvents events={mockEvents} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText("Study")).toHaveClass("text-amber-400");
    expect(screen.getByText("Social")).toHaveClass("text-blue-400");
  });

  // Confirms the UI gracefully handles events with no description
  it("does not render description paragraph when description is null", () => {
    render(<GroupEvents events={mockEvents} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const teamPizzaHeading = screen.getByText("Team Pizza").closest("div");
    expect(teamPizzaHeading?.querySelector("p")).not.toBeInTheDocument();
  });

  // Confirms the fallback style is applied when an event has an unrecognised category
  it("applies default styling for unknown categories", () => {
    const unknownCategoryEvent = [{ ...mockEvents[0], category: "UnknownCategory" }];

    render(<GroupEvents events={unknownCategoryEvent} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText("UnknownCategory")).toHaveClass("text-white");
  });

  // Confirms the onEdit callback fires with the full event object when the edit button is clicked
  it("fires onEdit with the correct event when the edit button is clicked", () => {
    render(<GroupEvents events={mockEvents} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getAllByTitle("Edit event")[0]);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockEvents[0]);
  });

  // Confirms the onDelete callback fires with the groupEventGroupId when the delete button is clicked
  it("fires onDelete with the correct groupEventGroupId when the delete button is clicked", () => {
    render(<GroupEvents events={mockEvents} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getAllByTitle("Delete event")[0]);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith("gevt-1");
  });
});