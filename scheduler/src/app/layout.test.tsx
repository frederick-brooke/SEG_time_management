import React from "react";
import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

// Mock next/font/google
jest.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

// Mock globals.css and leaflet.css
jest.mock("../src/app/globals.css", () => ({}), { virtual: true });
jest.mock("leaflet/dist/leaflet.css", () => ({}), { virtual: true });

// Mock Providers
jest.mock("../app/providers", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-providers">{children}</div>
  ),
}));

// Mock UIProvider
jest.mock("@/context/UIContext", () => ({
  UIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-ui-provider">{children}</div>
  ),
}));

describe("RootLayout", () => {
  it("renders children inside the layout", () => {
    render(
      <RootLayout>
        <main data-testid="child-content">Hello World</main>
      </RootLayout>
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders the Providers wrapper", () => {
    render(
      <RootLayout>
        <span>test</span>
      </RootLayout>
    );
    expect(screen.getByTestId("mock-providers")).toBeInTheDocument();
  });

  it("renders the UIProvider wrapper", () => {
    render(
      <RootLayout>
        <span>test</span>
      </RootLayout>
    );
    expect(screen.getByTestId("mock-ui-provider")).toBeInTheDocument();
  });

  it("renders the modal-root div", () => {
    render(
      <RootLayout>
        <span>test</span>
      </RootLayout>
    );
    expect(document.getElementById("modal-root")).toBeInTheDocument();
  });
});
