import React from "react";
import { render, screen } from "@testing-library/react";
import Providers from "../app/providers";

// Mock next-auth/react SessionProvider
jest.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-session-provider">{children}</div>
  ),
}));

describe("Providers", () => {
  it("renders without crashing", () => {
    render(
      <Providers>
        <div>test</div>
      </Providers>
    );
    expect(document.body).toBeTruthy();
  });

  it("wraps children in SessionProvider", () => {
    render(
      <Providers>
        <div data-testid="child">Content</div>
      </Providers>
    );
    const sessionProvider = screen.getByTestId("mock-session-provider");
    expect(sessionProvider).toBeInTheDocument();
    expect(sessionProvider).toContainElement(screen.getByTestId("child"));
  });

  it("renders children correctly", () => {
    render(
      <Providers>
        <p data-testid="inner-child">Hello from child</p>
      </Providers>
    );
    expect(screen.getByTestId("inner-child")).toBeInTheDocument();
    expect(screen.getByText("Hello from child")).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    render(
      <Providers>
        <div data-testid="child-one">One</div>
        <div data-testid="child-two">Two</div>
      </Providers>
    );
    expect(screen.getByTestId("child-one")).toBeInTheDocument();
    expect(screen.getByTestId("child-two")).toBeInTheDocument();
  });
});
