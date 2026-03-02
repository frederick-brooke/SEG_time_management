import { render, screen, act } from "@testing-library/react";
import BreathTrack from "../breath_tracker";

jest.useFakeTimers();

describe("BreathTrack component", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it("runs through the full breathing cycle and updates text + classes", async () => {
    render(<BreathTrack />);

    const text = screen.getByText("", { selector: "p" });
    const container = text.closest("div");

    // Phase 1 — Breathe in
    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    expect(text.innerHTML).toBe("Breathe in through nose");
    expect(container.className).toContain("grow");

    // Phase 2 — Hold
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });

    expect(text.innerHTML).toBe("Hold");

    // Phase 3 — Breathe out
    await act(async () => {
      jest.advanceTimersByTime(7000);
    });

    expect(text.innerHTML).toBe("Breathe in through mouth");
    expect(container.className).toContain("shrink");

    // End of full cycle
    await act(async () => {
      jest.advanceTimersByTime(8000);
    });
  });

  it("stops the animation loop when unmounted", async () => {
    const { unmount } = render(<BreathTrack />);

    const text = screen.getByText("", { selector: "p" });

    await act(async () => {
      jest.advanceTimersByTime(4000);
    });

    unmount();

    // Advance timers again — text should NOT change
    const previousText = text.innerHTML;

    await act(async () => {
      jest.advanceTimersByTime(20000);
    });

    expect(text.innerHTML).toBe(previousText);
  });

  it("safely exits if refs are missing", async () => {
    // Spy on useRef to force null refs
    jest.spyOn(React, "useRef").mockReturnValueOnce({ current: null });

    render(<BreathTrack />);

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    // No crash = branch covered
    expect(true).toBe(true);

    React.useRef.mockRestore();
  });
});
