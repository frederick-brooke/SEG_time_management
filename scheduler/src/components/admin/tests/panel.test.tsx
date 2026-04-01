import { render, screen, fireEvent } from "@testing-library/react";
import Panel from "../Panel";

// Mock the icon so it doesn't affect the DOM
jest.mock("@tabler/icons-react", () => ({
  IconX: () => <svg data-testid="icon-x" />,
}));

describe("Panel", () => {
  const onClose = jest.fn();

  const renderPanel = (open: boolean) =>
    render(
      <Panel open={open} onClose={onClose} title="Test Panel">
        <div data-testid="panel-content">Hello Panel</div>
      </Panel>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders title and children", () => {
    renderPanel(true);

    expect(screen.getByText("Test Panel")).toBeInTheDocument();
    expect(screen.getByTestId("panel-content")).toBeInTheDocument();
    expect(screen.getByTestId("icon-x")).toBeInTheDocument();
  });

  test("applies open state classes when open", () => {
    const { container } = renderPanel(true);

    const backdrop = container.firstChild as HTMLElement;
    expect(backdrop.className).toContain("opacity-100");

    const drawer = backdrop.firstChild as HTMLElement;
    expect(drawer.className).toContain("translate-x-0");
  });

  test("applies closed state classes when closed", () => {
    const { container } = renderPanel(false);

    const backdrop = container.firstChild as HTMLElement;
    expect(backdrop.className).toContain("opacity-0");
    expect(backdrop.className).toContain("pointer-events-none");

    const drawer = backdrop.firstChild as HTMLElement;
    expect(drawer.className).toContain("translate-x-full");
  });

  test("clicking backdrop calls onClose", () => {
    const { container } = renderPanel(true);

    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalled();
  });

  test("clicking inside panel does NOT call onClose", () => {
    renderPanel(true);

    fireEvent.click(screen.getByTestId("panel-content"));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("clicking close button calls onClose", () => {
    renderPanel(true);

    fireEvent.click(screen.getByTestId("icon-x").closest("button")!);
    expect(onClose).toHaveBeenCalled();
  });
});