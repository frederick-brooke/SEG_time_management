import * as React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RocketProgress } from "../RocketProgress"; 

beforeEach(() => {
  jest.useFakeTimers();

  let mockTime = 0;
  jest.spyOn(performance, "now").mockImplementation(() => mockTime);

  let rafId = 0;
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    rafId += 1;
    mockTime += 3000;
    cb(mockTime);
    return rafId;
  });

  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function renderAndComplete(props: Partial<React.ComponentProps<typeof RocketProgress>> = {}) {
  const result = render(<RocketProgress progress={100} {...props} />);
  act(() => { jest.advanceTimersByTime(400); }); 
  act(() => { jest.advanceTimersByTime(100); });
  return result;
}

describe("RocketProgress — initial render", () => {
  it("renders without crashing", () => {
    const { container } = render(<RocketProgress progress={50} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("shows 0% on first render before ignition delay fires", () => {
    render(<RocketProgress progress={50} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders the rocket emoji", () => {
    render(<RocketProgress progress={50} />);
    expect(screen.getByText("🚀")).toBeInTheDocument();
  });

  it("shows the default mission name 'MISSION START'", () => {
    render(<RocketProgress progress={50} />);
    expect(screen.getByText("MISSION START")).toBeInTheDocument();
  });

  it("shows a custom missionName when provided", () => {
    render(<RocketProgress progress={50} missionName="APOLLO 13" />);
    expect(screen.getByText("APOLLO 13")).toBeInTheDocument();
  });

  it("shows the REMAINING readout starting at 100%", () => {
    render(<RocketProgress progress={50} />);
    expect(screen.getByText("100% REMAINING")).toBeInTheDocument();
  });

  it("renders the live-ping indicator spans", () => {
    const { container } = render(<RocketProgress progress={50} />);
    const pingSpans = container.querySelectorAll(".animate-ping");
    expect(pingSpans.length).toBeGreaterThanOrEqual(1);
  });

  it("applies a custom height via inline style", () => {
    const { container } = render(<RocketProgress progress={50} height={60} />);
    const track = container.querySelector("[style*='height: 60px']");
    expect(track).toBeInTheDocument();
  });

  it("uses the default height of 40px when height prop is omitted", () => {
    const { container } = render(<RocketProgress progress={50} />);
    const track = container.querySelector("[style*='height: 40px']");
    expect(track).toBeInTheDocument();
  });
});

describe("RocketProgress — progress clamping", () => {
  it("clamps progress above 100 to 100", () => {
    renderAndComplete({ progress: 150 });
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("clamps progress below 0 to 0", () => {
    render(<RocketProgress progress={-20} />);
    act(() => { jest.advanceTimersByTime(400); });
    act(() => { jest.advanceTimersByTime(100); });
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

describe("RocketProgress — animation cycle", () => {
  it("stays at 0 before the 400 ms ignition delay", () => {
    render(<RocketProgress progress={80} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(399); });
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("reaches the target progress after animation completes", () => {
    render(<RocketProgress progress={50} />);
    act(() => { jest.advanceTimersByTime(400); });
    act(() => { jest.advanceTimersByTime(100); });
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("shows LAUNCH SEQ status at 0% before animation starts", () => {
    render(<RocketProgress progress={30} />);
    expect(screen.getByText(/LAUNCH SEQ/)).toBeInTheDocument();
  });

  it("shows ALL TASKS ACHIEVED when displayProgress reaches 100", () => {
    renderAndComplete({ progress: 100 });
    expect(screen.getByText(/ALL TASKS ACHIEVED/)).toBeInTheDocument();
  });

  it("does not reset animation when component re-renders with same progress", () => {
    const { rerender } = render(<RocketProgress progress={50} />);
    act(() => { jest.advanceTimersByTime(400); });
    act(() => { jest.advanceTimersByTime(100); });
    expect(screen.getByText("50")).toBeInTheDocument();

    rerender(<RocketProgress progress={50} />);
    expect(screen.getByText("50")).toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(8000); });
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("only animates when progress value actually changes (dependency on safeProgress)", () => {
    const { rerender } = render(<RocketProgress progress={30} />);
    act(() => { jest.advanceTimersByTime(400); });
    act(() => { jest.advanceTimersByTime(100); });
    expect(screen.getByText("30")).toBeInTheDocument();

    rerender(<RocketProgress progress={60} />);
    act(() => { jest.advanceTimersByTime(400); });
    act(() => { jest.advanceTimersByTime(100); });
    expect(screen.getByText("60")).toBeInTheDocument();
  });

  it("completes animation and holds at burst state without rescheduling", () => {
    render(<RocketProgress progress={50} />);
    act(() => { jest.advanceTimersByTime(400); });
    act(() => { jest.advanceTimersByTime(100); });
    expect(screen.getByText("50")).toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(8000); });
    expect(screen.getByText("50")).toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(10000); });
    expect(screen.getByText("50")).toBeInTheDocument();
  });
});

describe("RocketProgress — completion state", () => {
  it("displays 100 when complete", () => {
    renderAndComplete();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("shows 0% REMAINING when complete", () => {
    renderAndComplete();
    expect(screen.getByText("0% REMAINING")).toBeInTheDocument();
  });

  it("nebula fill switches to emerald gradient on completion", () => {
    const { container } = renderAndComplete();
    const nebula = container.querySelector(".rp-nebula") as HTMLElement;
    expect(nebula.className).toContain("34d399"); 
  });

  it("nebula fill uses blue gradient while incomplete", () => {
    const { container } = render(<RocketProgress progress={40} />);
    const nebula = container.querySelector(".rp-nebula") as HTMLElement;
    expect(nebula.className).toContain("1d4ed8"); 
  });
});

describe("RocketProgress — mission clock", () => {
  it("shows T+00:00 at 0% (before animation)", () => {
    render(<RocketProgress progress={50} />);
    expect(screen.getByText("T+00:00")).toBeInTheDocument();
  });

  it("shows T+05:00 after animation reaches 50%", () => {
    render(<RocketProgress progress={50} />);
    act(() => { jest.advanceTimersByTime(400); });
    act(() => { jest.advanceTimersByTime(100); });
    expect(screen.getByText("T+05:00")).toBeInTheDocument();
  });

  it("shows T+10:00 after animation reaches 100%", () => {
    renderAndComplete();
    expect(screen.getByText("T+10:00")).toBeInTheDocument();
  });
});


describe("RocketProgress — cleanup", () => {
  it("cancels animation frame on unmount", () => {
    const { unmount } = render(<RocketProgress progress={50} />);
    act(() => { jest.advanceTimersByTime(400); });
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it("does not throw after unmount when timers fire", () => {
    const { unmount } = render(<RocketProgress progress={50} />);
    unmount();
    expect(() => {
      act(() => { jest.advanceTimersByTime(10000); });
    }).not.toThrow();
  });
});

describe("RocketProgress — star-field", () => {
  it("renders the star-field container", () => {
    const { container } = render(<RocketProgress progress={50} />);
    const starField = container.querySelector(
      ".pointer-events-none.absolute.inset-0.rounded-full.overflow-hidden"
    );
    expect(starField).toBeInTheDocument();
  });
});