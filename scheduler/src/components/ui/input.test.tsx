// src/components/ui/input.test.tsx
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./input";

describe("Input component", () => {
  it("renders without crashing", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
  });

  it("applies additional className", () => {
    render(<Input placeholder="Enter" className="my-custom-class" />);
    const input = screen.getByPlaceholderText("Enter");
    expect(input).toHaveClass("my-custom-class");
  });

  it("accepts input text", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Type here" />);
    const input = screen.getByPlaceholderText("Type here") as HTMLInputElement;
    await user.type(input, "Hello World");
    expect(input.value).toBe("Hello World");
  });

  it("supports different types", () => {
    render(<Input placeholder="Password" type="password" />);
    const input = screen.getByPlaceholderText("Password");
    expect(input).toHaveAttribute("type", "password");
  });

  it("supports disabled prop", () => {
    render(<Input placeholder="Disabled" disabled />);
    const input = screen.getByPlaceholderText("Disabled");
    expect(input).toBeDisabled();
  });
});