import { render, screen } from "@testing-library/react";
import Providers from "./providers"; // Adjust the import path/name if needed

// Mock the next-auth SessionProvider to avoid needing a real session context
jest.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-session-provider">{children}</div>
  ),
}));

describe("Providers Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children successfully within the SessionProvider", () => {
    render(
      <Providers>
        <div data-testid="child-element">Hello Context</div>
      </Providers>
    );

    const providerWrapper = screen.getByTestId("mock-session-provider");
    const childElement = screen.getByTestId("child-element");

    // Verify the mock provider rendered
    expect(providerWrapper).toBeInTheDocument();

    // Verify the child rendered
    expect(childElement).toBeInTheDocument();
    expect(childElement).toHaveTextContent("Hello Context");

    // Verify the child is actually nested inside the provider
    expect(providerWrapper).toContainElement(childElement);
  });
});