import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import CalendarPage from "../page";

// 1. Mock FullCalendar
jest.mock("@fullcalendar/react", () => {
  return function MockCalendar({ select, eventClick }) {
    return (
      <div data-testid="full-calendar">
        <button 
          data-testid="mock-select" 
          onClick={() => select({ startStr: "2024-01-01", endStr: "2024-01-01" })}
        >
          Mock Select
        </button>
        <button 
          data-testid="mock-event-click" 
          onClick={() => eventClick({ 
            event: { 
              id: "1", title: "Test Event", startStr: "2024-01-01T10:00", endStr: "2024-01-01T11:00",
              extendedProps: { description: "Test Desc" } 
            } 
          })}
        >
          Mock Event Click
        </button>
      </div>
    );
  };
});

// 2. Mock global fetch
global.fetch = jest.fn();

describe("CalendarPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => [] 
    });
  });

  it("opens the Create Modal when a date is selected", async () => {
    render(<CalendarPage />);
    
    await act(async () => {
      fireEvent.click(screen.getByTestId("mock-select"));
    });

    expect(screen.getByText("New Event")).toBeInTheDocument();
  });
});