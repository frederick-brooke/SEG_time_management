import { render, screen, fireEvent } from "@testing-library/react";
import LunarDrawer from "./lunar-drawer";

/**
 * Tests the LunarDrawer component's rendering, positioning logic, and interaction behavior.
 */
describe("LunarDrawer Component", () => {
  it("renders correctly when open on the left side", () => {
    render(
      <LunarDrawer open={true} onClose={jest.fn()} side="left" title="Test Drawer">
        <div>Content</div>
      </LunarDrawer>
    );

    const drawer = screen.getByText("Test Drawer").closest("div")?.parentElement;
    expect(drawer).toHaveClass("translate-x-0");
    expect(drawer).toHaveClass("left-0");
  });

  it("applies hidden classes when closed on the left side", () => {
    const { container } = render(
      <LunarDrawer open={false} onClose={jest.fn()} side="left" title="Closed">
        <div />
      </LunarDrawer>
    );

    const drawer = container.querySelectorAll("div")[1];
    expect(drawer).toHaveClass("-translate-x-full");
  });

  it("renders correctly when open on the right side", () => {
    const { container } = render(
      <LunarDrawer open={true} onClose={jest.fn()} side="right" title="Right Drawer">
        <div />
      </LunarDrawer>
    );

    const drawer = container.querySelectorAll("div")[1];
    expect(drawer).toHaveClass("right-0");
    expect(drawer).toHaveClass("translate-x-0");
  });

  it("applies hidden classes when closed on the right side", () => {
    const { container } = render(
      <LunarDrawer open={false} onClose={jest.fn()} side="right" title="Closed Right">
        <div />
      </LunarDrawer>
    );

    const drawer = container.querySelectorAll("div")[1];
    expect(drawer).toHaveClass("translate-x-full");
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onCloseMock = jest.fn();
    const { container } = render(
      <LunarDrawer open={true} onClose={onCloseMock} title="Backdrop Test">
        <div />
      </LunarDrawer>
    );

    const backdrop = container.querySelectorAll("div")[0];
    fireEvent.click(backdrop);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("applies custom width style", () => {
    const customWidth = "300px";
    const { container } = render(
      <LunarDrawer open={true} onClose={jest.fn()} width={customWidth} title="Width Test">
        <div />
      </LunarDrawer>
    );

    const drawer = container.querySelectorAll("div")[1];
    expect(drawer).toHaveStyle({ width: customWidth });
  });
});