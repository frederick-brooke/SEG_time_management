import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuizPage from "../page";

global.fetch = jest.fn();

describe("Quiz Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // prevent noise in test output
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore?.();
  });

  const goToStep = (n) => {
    // starts at step 1
    for (let i = 1; i < n; i++) {
      fireEvent.click(screen.getByText("Next"));
    }
  };

  it("renders step 1 initially", () => {
    render(<QuizPage />);
    expect(screen.getByText("Work Schedule")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  });

  it("shows correct progress width by step", () => {
    const { container } = render(<QuizPage />);
    const bar = container.querySelector(".bg-blue-600");
    expect(bar).toHaveStyle({ width: "25%" });

    fireEvent.click(screen.getByText("Next")); // step 2
    expect(container.querySelector(".bg-blue-600")).toHaveStyle({ width: "50%" });

    fireEvent.click(screen.getByText("Next")); // step 3
    expect(container.querySelector(".bg-blue-600")).toHaveStyle({ width: "75%" });

    fireEvent.click(screen.getByText("Next")); // step 4
    expect(container.querySelector(".bg-blue-600")).toHaveStyle({ width: "100%" });
  });

  it("disables Back button on step 1 and enables after moving forward", () => {
    render(<QuizPage />);
    const back = screen.getByText("Back");
    expect(back).toBeDisabled();

    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Back")).not.toBeDisabled();
  });

  it("navigates through steps and back", () => {
    render(<QuizPage />);

    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Breaks and Sessions")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Task Preferences")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Breaks and Sessions")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Work Schedule")).toBeInTheDocument();
  });

  it("updates Step 1 inputs: start/end time and days off checkboxes", () => {
    render(<QuizPage />);

    const start = screen.getByLabelText("When would you like to start working?");
    fireEvent.change(start, { target: { value: "10:00" } });
    expect(start.value).toBe("10:00");

    const end = screen.getByLabelText("When would you like to stop working?");
    fireEvent.change(end, { target: { value: "18:30" } });
    expect(end.value).toBe("18:30");

    const monday = screen.getByLabelText("Monday");
    expect(monday).not.toBeChecked();
    fireEvent.click(monday);
    expect(monday).toBeChecked();
    fireEvent.click(monday);
    expect(monday).not.toBeChecked();
  });

  it("updates Step 2 numeric inputs", () => {
    render(<QuizPage />);
    goToStep(2);

    const sessionLength = screen.getByLabelText(
      "How long do you work before taking a break? (minutes)",
    );
    fireEvent.change(sessionLength, { target: { value: "90" } });
    expect(sessionLength.value).toBe("90");

    const breakLength = screen.getByLabelText("How long are your breaks? (minutes)");
    fireEvent.change(breakLength, { target: { value: "20" } });
    expect(breakLength.value).toBe("20");

    const breaksPerDay = screen.getByLabelText("How many breaks do you take per day?");
    fireEvent.change(breaksPerDay, { target: { value: "3" } });
    expect(breaksPerDay.value).toBe("3");
  });

  it("updates Step 3: taskOrder radios, maxTasksPerDay, defaultTaskDuration", () => {
    render(<QuizPage />);
    goToStep(3);

    // radio switch
    const easyFirst = screen.getByLabelText("Easy tasks first");
    fireEvent.click(easyFirst);
    expect(easyFirst).toBeChecked();

    const maxTasks = screen.getByLabelText("How many tasks can you handle per day?");
    fireEvent.change(maxTasks, { target: { value: "9" } });
    expect(maxTasks.value).toBe("9");

    const defaultDuration = screen.getByLabelText("Default task duration? (minutes)");
    fireEvent.change(defaultDuration, { target: { value: "45" } });
    expect(defaultDuration.value).toBe("45");
  });

  it("updates Step 4 reminderDays and pluralisation", () => {
    render(<QuizPage />);
    goToStep(4);

    const reminderDays = screen.getByLabelText(
      "How many days before a deadline should we remind you?",
    );

    // default is 2 => "days"
    expect(
      screen.getByText(/We'll send you a reminder 2 days before tasks are due/i),
    ).toBeInTheDocument();

    fireEvent.change(reminderDays, { target: { value: "1" } });
    expect(
      screen.getByText(/We'll send you a reminder 1 day before tasks are due/i),
    ).toBeInTheDocument();

    fireEvent.change(reminderDays, { target: { value: "0" } });
    expect(
      screen.getByText(/We'll send you a reminder 0 days before tasks are due/i),
    ).toBeInTheDocument();
  });

  it("shows Complete Setup button on step 4", () => {
    render(<QuizPage />);
    goToStep(4);

    expect(screen.getByText("Complete Setup")).toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  it("submit: unauthenticated session triggers alert + stops loading", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}), // no user id
    });

    global.alert = jest.fn();

    render(<QuizPage />);
    goToStep(4);

    fireEvent.click(screen.getByText("Complete Setup"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/session");
      expect(global.alert).toHaveBeenCalledWith("Failed to get user session");
    });

    // loading should reset -> button text should be back to normal
    expect(screen.getByText("Complete Setup")).toBeInTheDocument();
  });

  it("submit: success posts preferences and redirects", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: "user123" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    // mock redirect
    delete window.location;
    window.location = { href: "" };

    render(<QuizPage />);
    goToStep(4);

    fireEvent.click(screen.getByText("Complete Setup"));

    // immediately should show loading label
    expect(screen.getByText("Saving...")).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/session");
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/preferences",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-type": "application/json" },
        }),
      );
      expect(window.location.href).toBe("/dashboard");
    });
  });

  it("submit: preferences POST not ok -> shows error alert + resets loading", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: "user123" } }),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    global.alert = jest.fn();

    render(<QuizPage />);
    goToStep(4);

    fireEvent.click(screen.getByText("Complete Setup"));
    expect(screen.getByText("Saving...")).toBeInTheDocument();

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        "Failed to save preferences. Please try again.",
      );
    });

    // loading reset
    expect(screen.getByText("Complete Setup")).toBeInTheDocument();
  });

  it("does not go past step 4 when Next is clicked (guards handleNext)", () => {
    render(<QuizPage />);
    goToStep(4);

    // no "Next" button on step 4, so this is effectively guarded
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
    expect(screen.getByText("Reminders")).toBeInTheDocument();
  });
});
