import React from "react";
import { render, screen } from "@testing-library/react";

// Mock Button (relative path so Jest can resolve it)
const ButtonMock = jest.fn(({ children, variant }) => (
  <Button data-testid="button" data-variant={variant || ""}>
    {children}
  </Button>
));

jest.mock("../../ui/Button", () => ({
  __esModule: true,
  Button: (props) => ButtonMock(props),
}));

// Mock lucide icon
jest.mock("lucide-react", () => ({
  __esModule: true,
  XIcon: () => <svg data-testid="xicon" />,
}));

// Mock Radix Dialog primitives
jest.mock("@radix-ui/react-dialog", () => {
  const React = require("react");

  const Root = ({ children, ...props }) => (
    <div data-testid="radix-root" {...props}>
      {children}
    </div>
  );

  const Trigger = ({ children, ...props }) => (
    <Button data-testid="radix-trigger" {...props}>
      {children}
    </Button>
  );

  const Portal = ({ children, ...props }) => (
    <div data-testid="radix-portal" {...props}>
      {children}
    </div>
  );

  const Close = ({ children, asChild, ...props }) => {
    if (asChild) {
      // AsChild means "just return the child", but we still want a wrapper marker
      return <div data-testid="radix-close-aschild">{children}</div>;
    }
    return (
      <Button data-testid="radix-close" {...props}>
        {children}
      </Button>
    );
  };

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

  return {
    __esModule: true,
    Root,
    Trigger,
    Portal,
    Close,
    Overlay,
    Content,
    Title,
    Description,
  };
});

// Import AFTER mocks (relative path)
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "../../ui/Dialog";

describe("components/ui/dialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ButtonMock.mockClear();
  });

  it("smoke: renders primitives and DialogOverlay merges className", () => {
    render(
      <Dialog open>
        <DialogTrigger>Open</DialogTrigger>

        <DialogPortal>
          <DialogOverlay className="my-overlay" />
          <DialogContent className="my-content" showCloseButton={false}>
            <DialogHeader className="my-header">
              <DialogTitle className="my-title">Title</DialogTitle>
              <DialogDescription className="my-desc">
                Description
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="my-footer" showCloseButton={false}>
              <Button type="button">Child</Button>
            </DialogFooter>

            <DialogClose>CloseX</DialogClose>
          </DialogContent>
        </DialogPortal>
      </Dialog>,
    );

    expect(screen.getByTestId("radix-root")).toBeInTheDocument();
    expect(screen.getByTestId("radix-trigger")).toHaveTextContent("Open");

    // We rendered one explicit overlay + DialogContent renders another overlay internally
    const overlays = screen.getAllByTestId("radix-overlay");
    expect(overlays.length).toBeGreaterThanOrEqual(2);
    expect(overlays.some((el) => el.classList.contains("my-overlay"))).toBe(
      true,
    );

    expect(screen.getByTestId("radix-content")).toHaveClass("my-content");
    expect(screen.getByTestId("radix-title")).toHaveTextContent("Title");
    expect(screen.getByTestId("radix-description")).toHaveTextContent(
      "Description",
    );
  });

  it("DialogContent renders built-in close button when showCloseButton=true (covers line 138)", () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton>
          <div>Body</div>
        </DialogContent>
      </Dialog>,
    );

    // Built-in close uses DialogPrimitive.Close (not asChild) and contains sr-only text "Close"
    expect(screen.getByTestId("radix-close")).toBeInTheDocument();
    expect(screen.getByText("Close")).toBeInTheDocument();
    expect(screen.getByTestId("xicon")).toBeInTheDocument();
  });

  it("DialogContent omits built-in close when showCloseButton=false", () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <div>Body</div>
        </DialogContent>
      </Dialog>,
    );

    // Close button inside content should not exist
    expect(screen.queryByTestId("radix-close")).not.toBeInTheDocument();
    expect(screen.queryByText("Close")).not.toBeInTheDocument();
  });

  it("DialogFooter renders Close button via asChild when showCloseButton=true (covers lines 143-144)", () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogFooter showCloseButton>
            <div>FooterChild</div>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    // Radix close wrapper for asChild path exists
    expect(screen.getByTestId("radix-close-aschild")).toBeInTheDocument();

    // Our mocked Button should have been used with variant="outline"
    expect(ButtonMock).toHaveBeenCalled();
    const props = ButtonMock.mock.calls[0][0];
    expect(props.variant).toBe("outline");
    expect(screen.getByTestId("button")).toHaveTextContent("Close");

    // Also includes children we passed
    expect(screen.getByText("FooterChild")).toBeInTheDocument();
  });
});
