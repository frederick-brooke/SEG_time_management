import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuizPage from "../page";
import { beforeEach } from "node:test";


const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush })
}));

// @ts-ignore
global.fetch = jest.fn();

describe("Quiz Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // prevent noise in test output
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  const goToStep = (n: number) => {
    // starts at step 1
    for (let i = 1; i < n; i++) {
      fireEvent.click(screen.getByText(/Next/i));
    }
  };

  it("renders step 1 initially", () => {
    render(<QuizPage />);
    expect(screen.getByRole("heading", { name: /Work Schedule/i})).toBeInTheDocument();
  });

  it("shows correct progress width by step", () => {
    const { container } = render(<QuizPage />);
    const bar = container.querySelector(".bg-gradient-to-r");
    expect(bar).toHaveStyle({ width: "25%" });

    fireEvent.click(screen.getByText(/Next/i)); // step 2
    expect(bar).toHaveStyle("width: 50%");
  });

  it("disables Back button on step 1 and enables after moving forward", () => {
    render(<QuizPage />);
    const back = screen.getByRole("button", { name: /Back/i});
    expect(back).toBeDisabled();

    fireEvent.click(screen.getByText(/Next/i));
    expect(screen.getByRole("button", { name: /Back/i})).not.toBeDisabled();
  });

  it("updates Step 1 inputs: start/end time and days off checkboxes", () => {
    render(<QuizPage />);

    const start = screen.getByText(/When do you start working/i).nextElementSibling as HTMLInputElement;
    fireEvent.change(start, { target: { value: "10:00" } });
    expect(start.value).toBe("10:00");

    const monday = screen.getByText(/Monday/i);
    fireEvent.click(monday);
    expect(screen.getByText(/Days off: Mon/i)).toBeInTheDocument();
  });

  it("updates Step 2 numeric inputs", () => {
    render(<QuizPage />);
    goToStep(2);

    const slider = screen.getAllByRole(
      "slider")[0] as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "90" } });
    expect(slider.value).toBe("90");

    const breakBtn = screen.getByRole("button", { name: "3"});
    fireEvent.click(breakBtn)
    expect(breakBtn).toHaveClass("bg-gradient-to-br");
  });

  it("updates Step 3: taskOrder radios, maxTasksPerDay, defaultTaskDuration", () => {
    render(<QuizPage />);
    goToStep(3);

    // radio switch
    const easyFirst = screen.getByText(/Easy tasks first/i);
    fireEvent.click(easyFirst);
    expect(easyFirst.closest('button')).toHaveClass("from-blue-500/20");
  });

  it("updates Step 4 reminderDays and pluralisation", () => {
    render(<QuizPage />);
    goToStep(4);

    fireEvent.click(screen.getByText("1d"));
    expect(
      screen.getByText(/reminded 1 day before/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Day of/i));
    expect(
      screen.getByText(/on the day the task is due/i),
    ).toBeInTheDocument();
  });

  it("submit: success posts preferences and redirects", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: "user123" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<QuizPage />);
    goToStep(4);
    fireEvent.click(screen.getByText(/Complete Setup/i));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("submit: preferences POST not ok -> shows error alert + resets loading", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
      })

      // @ts-ignore
    global.alert = jest.fn();

    render(<QuizPage />);
    goToStep(4);

    fireEvent.click(screen.getByText(/Complete Setup/i));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining("Failed"));
    });
  });

  it("guards handleNext", () => {
    render(<QuizPage />);
    goToStep(4);
    expect(screen.queryByText(/Next/i)).not.toBeInTheDocument();
  });
});
