/**
 * Testing for Message Input
 */

import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent } from "@testing-library/react";
import { MessageInput } from "../MessageInput";

const defaultProps = {
  value: "",
  sending: false,
  onChange: jest.fn(),
  onKeyDown: jest.fn(),
  onSend: jest.fn(),
};

function setup(props: Partial<typeof defaultProps> = {}) {
  return render(<MessageInput {...defaultProps} {...props} />);
}

beforeEach(() => jest.clearAllMocks());

// Rendering

describe("MessageInput – rendering", () => {
  it("renders the textarea with the correct placeholder", () => {
    setup();
    expect(screen.getByPlaceholderText("Message...")).toBeInTheDocument();
  });

  it("renders the Send button", () => {
    setup();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("displays the current value in the textarea", () => {
    setup({ value: "Hello!" });
    expect(screen.getByPlaceholderText("Message...")).toHaveValue("Hello!");
  });
});

// Disabled states

describe("MessageInput – disabled states", () => {
  it("disables the textarea while sending", () => {
    setup({ sending: true, value: "hi" });
    expect(screen.getByPlaceholderText("Message...")).toBeDisabled();
  });

  it("disables the Send button while sending", () => {
    setup({ sending: true, value: "hi" });
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("disables the Send button when value is empty", () => {
    setup({ value: "" });
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("disables the Send button when value is whitespace only", () => {
    setup({ value: "   " });
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("enables the Send button when value has non-whitespace content", () => {
    setup({ value: "Hello" });
    expect(screen.getByRole("button", { name: /send/i })).toBeEnabled();
  });

  it("enables the textarea when not sending", () => {
    setup({ sending: false, value: "hi" });
    expect(screen.getByPlaceholderText("Message...")).toBeEnabled();
  });
});

// Callbacks

describe("MessageInput – callbacks", () => {
  it("calls onChange when the textarea value changes", () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText("Message..."), {
      target: { value: "typing" },
    });
    expect(defaultProps.onChange).toHaveBeenCalledTimes(1);
  });

  it("calls onKeyDown when a key is pressed in the textarea", () => {
    setup({ value: "hi" });
    fireEvent.keyDown(screen.getByPlaceholderText("Message..."), { key: "Enter" });
    expect(defaultProps.onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("calls onSend when the Send button is clicked", () => {
    setup({ value: "Hello" });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(defaultProps.onSend).toHaveBeenCalledTimes(1);
  });

  it("does not call onSend when Send is clicked while disabled", () => {
    setup({ value: "" });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(defaultProps.onSend).not.toHaveBeenCalled();
  });

  it("does not call onSend when Send is clicked while sending", () => {
    setup({ value: "hi", sending: true });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(defaultProps.onSend).not.toHaveBeenCalled();
  });
});

// Auto-grow

describe("MessageInput – auto-grow", () => {
  it("sets textarea height to scrollHeight when value changes", () => {
    const { rerender } = setup({ value: "" });
    const textarea = screen.getByPlaceholderText("Message...") as HTMLTextAreaElement;

    Object.defineProperty(textarea, "scrollHeight", { configurable: true, value: 80 });
    rerender(<MessageInput {...defaultProps} value="line one\nline two\nline three" />);

    expect(textarea.style.height).toBe("80px");
  });

  it("resets height to 'auto' before measuring scrollHeight", () => {
    const { rerender } = setup({ value: "some text" });
    const textarea = screen.getByPlaceholderText("Message...") as HTMLTextAreaElement;

    Object.defineProperty(textarea, "scrollHeight", { configurable: true, value: 40 });
    rerender(<MessageInput {...defaultProps} value="updated text" />);

    expect(textarea.style.height).toBe("40px");
  });
});