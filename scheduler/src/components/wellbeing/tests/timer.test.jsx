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
  test("renders time input initially", () => {
    render(<Timer />);

    const input = screen.getByDisplayValue("00:00:00");
    expect(input).toBeInTheDocument();
  });

  test("starts timer when Start is clicked", async () => {
    render(<Timer />);

    fireEvent.change(screen.getByDisplayValue("00:00:00"), {
      target: { value: "00:00:05" },
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Start"));
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/wellbeing/timer",
      expect.objectContaining({
        method: "POST",
      })
    );

    expect(screen.getByText("00:00:05")).toBeInTheDocument();
  });

  test("counts down every second", async () => {
    render(<Timer />);

    fireEvent.change(screen.getByDisplayValue("00:00:00"), {
      target: { value: "00:00:03" },
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Start"));
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText("00:00:02")).toBeInTheDocument();
  });

  test("pauses timer", async () => {
    render(<Timer />);

    fireEvent.change(screen.getByDisplayValue("00:00:00"), {
      target: { value: "00:00:05" },
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Start"));
    });

    fireEvent.click(screen.getByText("Pause"));

    expect(localStorage.getItem("wellbeing_timer")).toContain(
      '"isRunning":false'
    );
  });

  test("resumes timer", async () => {
    render(<Timer />);

    fireEvent.change(screen.getByDisplayValue("00:00:00"), {
      target: { value: "00:00:05" },
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Start"));
    });

    fireEvent.click(screen.getByText("Pause"));
    fireEvent.click(screen.getByText("Resume"));

    expect(screen.getByText("Pause")).toBeInTheDocument();
  });

  test("stops and resets timer", async () => {
    render(<Timer />);

    fireEvent.change(screen.getByDisplayValue("00:00:00"), {
      target: { value: "00:00:05" },
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Start"));
    });

    fireEvent.click(screen.getByText("Stop"));

    expect(screen.getByDisplayValue("00:00:00")).toBeInTheDocument();
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

    expect(screen.getByText("00:00:04")).toBeInTheDocument();
  });
});
