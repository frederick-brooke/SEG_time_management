import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PreferencesForm from "../PreferencesForm";

// Mocks 

global.fetch = jest.fn();
global.alert = jest.fn();

const mockPreferences = {
  workStartTime: "08:00",
  workEndTime: "18:00",
  daysOff: ["Sat", "Sun"],
  sessionLength: 60,
  breakLength: 10,
  breaksPerDay: 4,
  taskOrder: "easy-first",
  maxTasksPerDay: 10,
  defaultTaskDuration: 45,
  reminderDays: 1,
};

describe("PreferencesForm Component", () => {
  const mockOnSaved = jest.fn();
  const userId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Loading State 

  it("shows a loading spinner initially", () => {
    // Mock a pending promise so it stays in the loading state
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    const { container } = render(<PreferencesForm userId={userId} />);
    
    // Check for the spinner element by its class
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  // 2. Data Fetching & Rendering 

  it("loads and displays user preferences from the API", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ preferences: mockPreferences }),
    });

    render(<PreferencesForm userId={userId} />);

    // Wait for the loading state to finish and form to render
    await waitFor(() => {
      expect(screen.getByText("Work Hours")).toBeInTheDocument();
    });

    // Verify GET request
    expect(global.fetch).toHaveBeenCalledWith(`/api/preferences?userId=${userId}`);

    // Verify populated values
    expect(screen.getByDisplayValue("08:00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("18:00")).toBeInTheDocument();
    
    // Verify custom days off are highlighted (using the active class)
    const satButton = screen.getByRole("button", { name: "Sat" });
    expect(satButton).toHaveClass("bg-red-500");
  });

  it("uses default values if the API returns no preferences", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ preferences: null }),
    });

    render(<PreferencesForm userId={userId} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("09:00")).toBeInTheDocument(); 
    });
  });

  // 3. User Interactions 

  it("allows the user to toggle days off", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ preferences: mockPreferences }), 
    });

    render(<PreferencesForm userId={userId} />);
    await waitFor(() => screen.getByText("Work Hours"));

    const monButton = screen.getByRole("button", { name: "Mon" });
    const satButton = screen.getByRole("button", { name: "Sat" });

    expect(monButton).not.toHaveClass("bg-red-500");
    
    fireEvent.click(monButton);
    expect(monButton).toHaveClass("bg-red-500");

    fireEvent.click(satButton);
    expect(satButton).not.toHaveClass("bg-red-500");
  });

  // 4. Saving Data 

  it("saves preferences and calls onSaved on success", async () => {
    const user = userEvent.setup();
    
    // 1. Mock the initial GET request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ preferences: mockPreferences }),
    });

    // 2. Mock the POST request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    render(<PreferencesForm userId={userId} onSaved={mockOnSaved} />);
    await waitFor(() => screen.getByText("Work Hours"));

    // Click Save
    const saveButton = screen.getByRole("button", { name: /Save Preferences/i });
    await user.click(saveButton);

    // Verify POST payload
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenLastCalledWith("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userID: userId,
        ...mockPreferences,
      }),
    });

    // Verify callback and success message
    expect(mockOnSaved).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Saved successfully/i)).toBeInTheDocument();
  });

  it("shows an alert if saving fails", async () => {
    const user = userEvent.setup();
    
    // 1. Mock the initial GET request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ preferences: mockPreferences }),
    });

    // 2. Mock a failed POST request
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));

    render(<PreferencesForm userId={userId} onSaved={mockOnSaved} />);
    await waitFor(() => screen.getByText("Work Hours"));

    // Click Save
    const saveButton = screen.getByRole("button", { name: /Save Preferences/i });
    await user.click(saveButton);

    // Verify failure handling
    expect(global.alert).toHaveBeenCalledWith("Failed to save preferences. Please try again.");
    expect(mockOnSaved).not.toHaveBeenCalled();
    expect(screen.queryByText(/Saved successfully/i)).not.toBeInTheDocument();
  });
});