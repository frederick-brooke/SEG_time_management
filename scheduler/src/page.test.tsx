import { render, screen } from "@testing-library/react";
import MessagesPage from "./page";

describe("MessagesPage (Static)", () => {
  it("renders the empty state text", () => {
    render(<MessagesPage />);
    
    expect(screen.getByText("Select a conversation")).toBeInTheDocument();
    expect(screen.getByText("or search for someone to message")).toBeInTheDocument();
  });
});