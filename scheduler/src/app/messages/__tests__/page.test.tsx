import React from "react";
import { render, screen } from "@testing-library/react";
import MessagesPage from "../page";

describe("MessagesPage", () => {
  it("renders the 'Select a conversation' heading", () => {
    render(<MessagesPage />);
    expect(screen.getByText("Select a conversation")).toBeInTheDocument();
  });

  it("renders the helper text", () => {
    render(<MessagesPage />);
    expect(screen.getByText("or search for someone to message")).toBeInTheDocument();
  });

  it("applies the correct text color style", () => {
    const { container } = render(<MessagesPage />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ color: "rgba(148,163,255,0.35)" });
  });

  it("is centred using flex layout", () => {
    const { container } = render(<MessagesPage />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("items-center");
    expect(wrapper.className).toContain("justify-center");
  });
});