import { render, screen } from "@testing-library/react";
import WellbeingPage from "./page";

// Mock child components
jest.mock("components/wellbeing/quote_block", () => () => (
  <div data-testid="quote-block">QuoteBlock</div>
));

jest.mock("components/wellbeing/timer_controller", () => () => (
  <div data-testid="timer-controller">TimerController</div>
));

describe("WellbeingPage", () => {
  test("renders without crashing", () => {
    render(<WellbeingPage />);
  });

  test("renders QuoteBlock component", () => {
    render(<WellbeingPage />);
    expect(screen.getByTestId("quote-block")).toBeInTheDocument();
  });

  test("renders TimerController component", () => {
    render(<WellbeingPage />);
    expect(screen.getByTestId("timer-controller")).toBeInTheDocument();
  });
});