import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toggle } from "../Toggle";

describe("Toggle component", () => {
  test("toggles on click and updates state", async () => {
    const user = userEvent.setup();

    render(
      <Toggle>
        Bold
      </Toggle>
    );

    const button = screen.getByRole("button", { name: /bold/i });

    // initial state
    expect(button).toHaveAttribute("data-state", "off");

    // click to toggle on
    await user.click(button);
    expect(button).toHaveAttribute("data-state", "on");

    // click to toggle off
    await user.click(button);
    expect(button).toHaveAttribute("data-state", "off");
  });
});