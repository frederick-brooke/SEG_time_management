import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { PageHeader } from "../PageHeader"; 

// Fixtures

const defaultProps = {
  icon: <svg data-testid="test-icon" />,
  title: "Dashboard",
  subtitle: "Welcome back",
};

// PageHeader

describe("PageHeader", () => {
  it("renders without crashing", () => {
    const { container } = render(<PageHeader {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(<PageHeader {...defaultProps} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<PageHeader {...defaultProps} />);
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    render(<PageHeader {...defaultProps} />);
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("title is an h1 element", () => {
    render(<PageHeader {...defaultProps} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Dashboard");
  });

  it("subtitle is a paragraph element", () => {
    render(<PageHeader {...defaultProps} />);
    const subtitle = screen.getByText("Welcome back");
    expect(subtitle.tagName).toBe("P");
  });

  it("renders different title and subtitle values", () => {
    render(
      <PageHeader
        icon={<span />}
        title="Settings"
        subtitle="Manage your account"
      />
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Manage your account")).toBeInTheDocument();
  });

  it("accepts any ReactNode as icon — string", () => {
    render(<PageHeader icon="★" title="T" subtitle="S" />);
    expect(screen.getByText("★")).toBeInTheDocument();
  });

  it("accepts any ReactNode as icon — element with text", () => {
    render(
      <PageHeader
        icon={<span data-testid="emoji-icon">📅</span>}
        title="Calendar"
        subtitle="Your schedule"
      />
    );
    expect(screen.getByTestId("emoji-icon")).toBeInTheDocument();
  });

  it("icon is rendered inside the icon wrapper div", () => {
    const { container } = render(<PageHeader {...defaultProps} />);
    const icon = screen.getByTestId("test-icon");
    const iconWrapper = container.querySelector(".flex > div:first-child") as HTMLElement;
    expect(iconWrapper).toContainElement(icon);
  });

  it("outer wrapper has flex layout classes", () => {
    const { container } = render(<PageHeader {...defaultProps} />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain("flex");
    expect(outer.className).toContain("items-center");
    expect(outer.className).toContain("gap-4");
  });

  it("icon wrapper has fixed dimensions", () => {
    const { container } = render(<PageHeader {...defaultProps} />);
    const iconWrapper = container.querySelector(".flex > div:first-child") as HTMLElement;
    expect(iconWrapper.className).toContain("w-14");
    expect(iconWrapper.className).toContain("h-14");
  });

  it("icon wrapper is rounded", () => {
    const { container } = render(<PageHeader {...defaultProps} />);
    const iconWrapper = container.querySelector(".flex > div:first-child") as HTMLElement;
    expect(iconWrapper.className).toContain("rounded-2xl");
  });

  it("title has the correct typography classes", () => {
    render(<PageHeader {...defaultProps} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.className).toContain("text-3xl");
    expect(heading.className).toContain("font-semibold");
    expect(heading.className).toContain("tracking-tight");
  });

  it("subtitle has muted styling", () => {
    render(<PageHeader {...defaultProps} />);
    const subtitle = screen.getByText("Welcome back");
    expect(subtitle.className).toContain("text-sm");
    expect(subtitle.className).toContain("mt-0.5");
  });
});
