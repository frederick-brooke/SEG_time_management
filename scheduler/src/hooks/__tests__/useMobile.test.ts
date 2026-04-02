import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/hooks/use-mobile";

// Helpers

const MOBILE_BREAKPOINT = 768;

let mediaQueryListener: (() => void) | null = null;

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
}

function setupMatchMedia(matches: boolean) {
  const mql = {
    matches,
    addEventListener: jest.fn((_event: string, handler: () => void) => {
      mediaQueryListener = handler;
    }),
    removeEventListener: jest.fn(),
  };
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: jest.fn().mockReturnValue(mql),
  });
  return mql;
}

beforeEach(() => {
  mediaQueryListener = null;
});

// Initial state

describe("initial state", () => {
  it("returns false when viewport is at the breakpoint width", () => {
    setViewportWidth(MOBILE_BREAKPOINT);
    setupMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns false when viewport is above the breakpoint", () => {
    setViewportWidth(1024);
    setupMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true when viewport is below the breakpoint", () => {
    setViewportWidth(375);
    setupMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns true at one pixel below the breakpoint", () => {
    setViewportWidth(MOBILE_BREAKPOINT - 1);
    setupMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns false (not undefined) before the effect has settled", () => {
    setViewportWidth(375);
    setupMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());
    expect(typeof result.current).toBe("boolean");
  });
});

// matchMedia query string

describe("matchMedia query", () => {
  it("calls matchMedia with the correct max-width query", () => {
    setViewportWidth(1024);
    const mql = setupMatchMedia(false);

    renderHook(() => useIsMobile());

    expect(window.matchMedia).toHaveBeenCalledWith(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    );
  });
});

// Resize behaviour

describe("responding to viewport changes", () => {
  it("updates to true when viewport shrinks below breakpoint", () => {
    setViewportWidth(1024);
    setupMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      setViewportWidth(375);
      mediaQueryListener?.();
    });

    expect(result.current).toBe(true);
  });

  it("updates to false when viewport grows above breakpoint", () => {
    setViewportWidth(375);
    setupMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    act(() => {
      setViewportWidth(1280);
      mediaQueryListener?.();
    });

    expect(result.current).toBe(false);
  });

  it("stays false when viewport changes but remains above breakpoint", () => {
    setViewportWidth(1024);
    setupMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());

    act(() => {
      setViewportWidth(900);
      mediaQueryListener?.();
    });

    expect(result.current).toBe(false);
  });

  it("stays true when viewport changes but remains below breakpoint", () => {
    setViewportWidth(375);
    setupMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());

    act(() => {
      setViewportWidth(500);
      mediaQueryListener?.();
    });

    expect(result.current).toBe(true);
  });
});

// Cleanup

describe("cleanup", () => {
  it("removes the matchMedia event listener on unmount", () => {
    setViewportWidth(1024);
    const mql = setupMatchMedia(false);

    const { unmount } = renderHook(() => useIsMobile());
    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("adds exactly one event listener per mount", () => {
    setViewportWidth(1024);
    const mql = setupMatchMedia(false);

    renderHook(() => useIsMobile());

    expect(mql.addEventListener).toHaveBeenCalledTimes(1);
    expect(mql.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });
});