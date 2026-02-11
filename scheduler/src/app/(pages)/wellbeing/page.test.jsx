import { render, screen } from "@testing-library/react";
import WellbeingPage from "../WellbeingPage";

// Mock all child components
jest.mock("../../components/wellbeing/timer", () => () => <div>Timer</div>);
jest.mock("../../components/wellbeing/quote_block", () => () => <div>QuoteBlock</div>);
jest.mock("../../components/wellbeing/breath_tracker", () => () => <div>BreathTrack</div>);
jest.mock("./view_buttons", () => () => <div>ViewButtons</div>);
jest.mock("../../components/wellbeing/character_background", () => () => <div>LoadCharacter</div>);

describe("WellbeingPage", () => {
  test("renders all main blocks", () => {
    render(<WellbeingPage />);

    expect(screen.getByText("Timer")).toBeInTheDocument();
    expect(screen.getByText("QuoteBlock")).toBeInTheDocument();
    expect(screen.getByText("BreathTrack")).toBeInTheDocument();
    expect(screen.getByText("ViewButtons")).toBeInTheDocument();
    expect(screen.getByText("LoadCharacter")).toBeInTheDocument();
    expect(screen.getByText("For Your Wellbeing and Care")).toBeInTheDocument();
  });
});
