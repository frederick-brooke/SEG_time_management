import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GoogleLinkButton from "../GoogleLinkButton"; 
import { signIn } from "next-auth/react";

// 1. Mock the next-auth/react module
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

describe("GoogleLinkButton Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("When isConnected is true", () => {
    it("renders the connected status UI", () => {
      render(<GoogleLinkButton isConnected={true} />);
      
      const connectedText = screen.getByText("Google Calendar Connected");
      expect(connectedText).toBeInTheDocument();
      
      const button = screen.queryByRole("button");
      expect(button).not.toBeInTheDocument();
    });
  });

  describe("When isConnected is false", () => {
    it("renders the link button UI", () => {
      render(<GoogleLinkButton isConnected={false} />);
      
      const button = screen.getByRole("button", { name: /link google calendar/i });
      expect(button).toBeInTheDocument();
      
      // Ensure the connected text is not rendered
      const connectedText = screen.queryByText("Google Calendar Connected");
      expect(connectedText).not.toBeInTheDocument();
      
      // Check for the Google favicon image
      const image = screen.getByRole("img", { name: /google/i });
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "https://www.google.com/favicon.ico");
    });

    it("calls signIn('google') when the button is clicked", async () => {
      const user = userEvent.setup();
      render(<GoogleLinkButton isConnected={false} />);
      
      const button = screen.getByRole("button", { name: /link google calendar/i });
      
      // Simulate a user click
      await user.click(button);
      
      // Assert that next-auth's signIn was triggered with the correct provider
      expect(signIn).toHaveBeenCalledTimes(1);
      expect(signIn).toHaveBeenCalledWith("google");
    });
  });
});