import { render, screen, fireEvent, act } from "@testing-library/react";
import HeroSection from "../HeroSection";

/** Mocks next/image to prevent testing errors */
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

describe("HeroSection", () => {
  beforeEach(() => {
    /** Defines predictable window size for Math.hypot calculations */
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1000 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 1000 });
  });

  it("renders the hero section and handles star interactions", async () => {
    const { container } = render(<HeroSection />);

    /** Waits for component to mount */
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(screen.getByText(/Time moves./i)).toBeInTheDocument();
    expect(container.querySelector("img[alt='Moon']")).toBeInTheDocument();

    /** Simulates mouse move to center */
    act(() => {
      fireEvent.mouseMove(window, { clientX: 500, clientY: 500 });
    });

    /** Simulates mouse move to corner */
    act(() => {
      fireEvent.mouseMove(window, { clientX: 10, clientY: 10 });
    });
  });
});