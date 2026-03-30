import React from "react";
import { render, screen } from "@testing-library/react";

// --- Mock Button so we can assert variant/size/asChild ---
const ButtonMock = jest.fn(({ variant, size, asChild, children }) => (
  <div
    data-testid="button"
    data-variant={variant}
    data-size={size}
    data-as-child={String(Boolean(asChild))}
  >
    {children}
  </div>
));

jest.mock("../../ui/button", () => ({
  __esModule: true,
  Button: (props) => ButtonMock(props),
}));

// --- Mock Radix AlertDialog primitives (avoid portal/context issues) ---
jest.mock("@radix-ui/react-alert-dialog", () => {
  const React = require("react");

  const Root = ({ children, ...props }) => (
    <div data-testid="radix-root" {...props}>
      {children}
    </div>
  );

  const Trigger = ({ children, ...props }) => (
    <button data-testid="radix-trigger" {...props}>
      {children}
    </button>
  );

  const Portal = ({ children }) => (
    <div data-testid="radix-portal">{children}</div>
  );

  const Overlay = ({ children, ...props }) => (
    <div data-testid="radix-overlay" {...props}>
      {children}
    </div>
  );

  const Content = ({ children, ...props }) => (
    <div data-testid="radix-content" {...props}>
      {children}
    </div>
  );

  const Title = ({ children, ...props }) => (
    <div data-testid="radix-title" {...props}>
      {children}
    </div>
  );

  const Description = ({ children, ...props }) => (
    <div data-testid="radix-description" {...props}>
      {children}
    </div>
  );

  const Action = ({ children, ...props }) => (
    <button data-testid="radix-action" {...props}>
      {children}
    </button>
  );

  const Cancel = ({ children, ...props }) => (
    <button data-testid="radix-cancel" {...props}>
      {children}
    </button>
  );

  return {
    __esModule: true,
    Root,
    Trigger,
    Portal,
    Overlay,
    Content,
    Title,
    Description,
    Action,
    Cancel,
  };
});

// Import AFTER mocks (relative path)
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../ui/alert-dialog";

describe("components/ui/alert-dialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ButtonMock.mockClear();
  });

  it("renders core pieces (smoke)", () => {
    render(
      <AlertDialog open>
        <AlertDialogTrigger>Open</AlertDialogTrigger>

        {/* We render an explicit overlay + AlertDialogContent also renders one,
            so there will be 2 overlays total. */}
        <AlertDialogPortal>
          <AlertDialogOverlay className="my-overlay" />
          <AlertDialogContent className="my-content" size="sm">
            <AlertDialogHeader className="my-header">
              <AlertDialogMedia className="my-media">M</AlertDialogMedia>
              <AlertDialogTitle className="my-title">Title</AlertDialogTitle>
              <AlertDialogDescription className="my-desc">
                Description
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="my-footer">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>,
    );

    expect(screen.getByTestId("radix-root")).toBeInTheDocument();
    expect(screen.getByTestId("radix-trigger")).toHaveTextContent("Open");

    const overlays = screen.getAllByTestId("radix-overlay");
    expect(overlays.length).toBeGreaterThanOrEqual(2);
    expect(overlays.some((el) => el.classList.contains("my-overlay"))).toBe(
      true,
    );

    expect(screen.getByTestId("radix-content")).toHaveClass("my-content");

    // Ensure our wrapper components render their text
    expect(screen.getByTestId("radix-title")).toHaveTextContent("Title");
    expect(screen.getByTestId("radix-description")).toHaveTextContent(
      "Description",
    );
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("AlertDialogAction uses default variant/size and wraps with Button asChild", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogFooter>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(ButtonMock).toHaveBeenCalled();
    const callProps = ButtonMock.mock.calls[0][0];
    expect(callProps.variant).toBe("default");
    expect(callProps.size).toBe("default");
    expect(callProps.asChild).toBe(true);

    expect(screen.getByTestId("radix-action")).toHaveTextContent("Delete");
  });

  it("AlertDialogAction forwards custom variant/size", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogFooter>
            <AlertDialogAction variant="destructive" size="sm">
              Destroy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    const props = ButtonMock.mock.calls[0][0];
    expect(props.variant).toBe("destructive");
    expect(props.size).toBe("sm");
    expect(props.asChild).toBe(true);

    expect(screen.getByTestId("radix-action")).toHaveTextContent("Destroy");
  });

  it("AlertDialogCancel uses default outline variant/size and wraps with Button asChild", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(ButtonMock).toHaveBeenCalled();
    const props = ButtonMock.mock.calls[0][0];
    expect(props.variant).toBe("outline");
    expect(props.size).toBe("default");
    expect(props.asChild).toBe(true);

    expect(screen.getByTestId("radix-cancel")).toHaveTextContent("Cancel");
  });

  it("AlertDialogCancel forwards custom variant/size", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost" size="sm">
              Nope
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    const props = ButtonMock.mock.calls[0][0];
    expect(props.variant).toBe("ghost");
    expect(props.size).toBe("sm");
    expect(props.asChild).toBe(true);

    expect(screen.getByTestId("radix-cancel")).toHaveTextContent("Nope");
  });
});
