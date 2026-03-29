import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import PreferencesForm from "../PreferencesForm";

global.fetch = jest.fn();
window.alert = jest.fn();

describe("PreferencesForm", () => {
  const mockUserId = "user-123";
  const mockOnSaved = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders a loading spinner initially", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    const { container } = render(<PreferencesForm userId={mockUserId} />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("loads and displays user preferences", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preferences: {
          workStartTime: "10:00",
          workEndTime: "18:00",
          daysOff: ["Sat"],
          sessionLength: 60,
          breakLength: 10,
          breaksPerDay: 4,
          taskOrder: "easy-first",
          maxTasksPerDay: 5,
          defaultTaskDuration: 45,
          reminderDays: 1,
        },
      }),
    });

    render(<PreferencesForm userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("10:00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("18:00")).toBeInTheDocument();
    expect(screen.getByText("Off: Sat")).toBeInTheDocument();
  });

  it("handles successful fetch with missing preferences object", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<PreferencesForm userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("09:00")).toBeInTheDocument();
    });
  });

  it("handles fetch errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<PreferencesForm userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("09:00")).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith("Failed to load preferences:", expect.any(Error));
    consoleSpy.mockRestore();
  });

  it("updates form state when user interacts with inputs", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ preferences: {} }),
    });

    render(<PreferencesForm userId={mockUserId} />);
    await waitFor(() => expect(screen.getByDisplayValue("09:00")).toBeInTheDocument());

    fireEvent.change(screen.getByDisplayValue("09:00"), { target: { value: "08:00" } });
    fireEvent.change(screen.getByDisplayValue("17:00"), { target: { value: "16:00" } });

    const monButton = screen.getByText("Mon");
    fireEvent.click(monButton); 
    expect(screen.getByText("Off: Mon")).toBeInTheDocument();
    fireEvent.click(monButton); 
    expect(screen.queryByText("Off: Mon")).not.toBeInTheDocument();

    const sessionSlider = screen.getByDisplayValue("90");
    fireEvent.change(sessionSlider, { target: { value: "120" } });
    
    const breakSlider = screen.getByDisplayValue("15");
    fireEvent.change(breakSlider, { target: { value: "20" } });

    fireEvent.click(screen.getByText("5", { selector: "button" }));

    fireEvent.click(screen.getByLabelText("Deadline first"));

    const maxTasksInput = screen.getByDisplayValue("8");
    fireEvent.change(maxTasksInput, { target: { value: "10" } });

    const defaultDurationInput = screen.getByDisplayValue("60");
    fireEvent.change(defaultDurationInput, { target: { value: "45" } });

    fireEvent.click(screen.getByText("1d before"));

    expect(screen.getByDisplayValue("120")).toBeInTheDocument();
    expect(screen.getByDisplayValue("20")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
  });

  it("saves preferences successfully and shows success message", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ preferences: {} }) })
      .mockResolvedValueOnce({ ok: true }); // Save

    render(<PreferencesForm userId={mockUserId} onSaved={mockOnSaved} />);
    await waitFor(() => expect(screen.getByDisplayValue("09:00")).toBeInTheDocument());

    const saveButton = screen.getByText("Save Preferences");
    
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/preferences", expect.objectContaining({
      method: "POST",
    }));
    
    expect(mockOnSaved).toHaveBeenCalled();
    expect(screen.getByText("Saved successfully")).toBeInTheDocument();

    act(() => {
      jest.runAllTimers();
    });

    expect(screen.queryByText("Saved successfully")).not.toBeInTheDocument();
  });

  it("handles save failure and alerts the user", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ preferences: {} }) })
      .mockResolvedValueOnce({ ok: false }); 

    render(<PreferencesForm userId={mockUserId} />);
    await waitFor(() => expect(screen.getByDisplayValue("09:00")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText("Save Preferences"));
    });

    expect(window.alert).toHaveBeenCalledWith("Failed to save preferences. Please try again.");
  });
});