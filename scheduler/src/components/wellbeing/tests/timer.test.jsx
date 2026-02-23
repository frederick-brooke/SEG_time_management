import { render, screen, fireEvent, act } from "@testing-library/react";
import Timer from "../timer";

jest.useFakeTimers();

// ---- mocks ----
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();

  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      endTime: Date.now() + 5000,
    }),
  });
});

describe("Timer component", () => {
  test("renders initial time", () => {
    render(<Timer />);
    // match any element that contains '00:00:00' ignoring splitting
    expect(screen.getByText((content) => content.replace(/\s/g, '') === '00:00:00')).toBeInTheDocument();
  });

  test("starts timer when Start is clicked", async () => {
    render(<Timer />);

    // Find Start button
    await act(async () => {
      fireEvent.click(screen.getByText("Start"));
    });

    // match the displayed text after starting
    expect(screen.getByText((content) => content.replace(/\s/g, '').includes("00:00:05"))).toBeInTheDocument();
  });

  test("counts down every second", async () => {
    render(<Timer />);

    await act(async () => {
      fireEvent.click(screen.getByText("Start"));
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText((content) => content.replace(/\s/g, '').includes("00:00:04"))).toBeInTheDocument();
  });

  test("pauses timer", async () => {
    render(<Timer />);

    await act(async () => {
      fireEvent.click(screen.getByText("Start"));
    });

    fireEvent.click(screen.getByText("Pause"));

    const stored = JSON.parse(localStorage.getItem("wellbeing_timer"));
    expect(stored.isRunning).toBe(false);
  });

  test("resumes timer", async () => {
    render(<Timer />);

    await act(async () => {
      fireEvent.click(screen.getByText("Start"));
    });

    fireEvent.click(screen.getByText("Pause"));
    fireEvent.click(screen.getByText("Resume"));

    expect(screen.getByText("Pause")).toBeInTheDocument();
  });

  test("stops and resets timer", async () => {
    render(<Timer />);

    await act(async () => {
      fireEvent.click(screen.getByText("Start"));
    });

    fireEvent.click(screen.getByText("Stop"));

    expect(screen.getByText((content) => content.replace(/\s/g, '') === '00:00:00')).toBeInTheDocument();
    expect(localStorage.getItem("wellbeing_timer")).toBeNull();
  });

  test("restores paused timer from localStorage", () => {
    localStorage.setItem(
      "wellbeing_timer",
      JSON.stringify({
        endTime: null,
        remainingMs: 4000,
        isRunning: false,
      })
    );

    render(<Timer />);
    expect(screen.getByText((content) => content.replace(/\s/g, '') === '00:00:04')).toBeInTheDocument();
  });
});
