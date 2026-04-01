/**
 * Testing for Dialog component.
 */

import React from "react";
import { render, screen } from "@testing-library/react";

// Mocks

const ButtonMock = jest.fn(({ children, variant, ...rest }) => (
  <div data-testid="button" data-variant={variant || ""} {...rest}>
    {children}
  </div>
));

jest.mock("../../ui/Button", () => ({
  __esModule: true,
  Button: (props: any) => ButtonMock(props),
}));

jest.mock("lucide-react", () => ({
  __esModule: true,
  XIcon: () => <svg data-testid="xicon" />,
}));

jest.mock("@radix-ui/react-dialog", () => {
  const React = require("react");

  const Root = ({ children, ...props }: any) => (
    <div data-testid="radix-root" {...props}>
      {children}
    </div>
  );

  const Trigger = ({ children, ...props }: any) => (
    <button data-testid="radix-trigger" {...props}>
      {children}
    </button>
  );

  const Portal = ({ children }: any) => <>{children}</>;

  const Close = ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return <div data-testid="radix-close-aschild">{children}</div>;
    }
    return (
      <button data-testid="radix-close" {...props}>
        {children}
      </button>
    );
  };

  const Overlay = ({ children, className, ...props }: any) => (
    <div data-testid="radix-overlay" className={className} {...props}>
      {children}
    </div>
  );

  const Content = ({ children, className, ...props }: any) => (
    <div data-testid="radix-content" className={className} {...props}>
      {children}
    </div>
  );

  const Title = ({ children, ...props }: any) => (
    <div data-testid="radix-title" {...props}>
      {children}
    </div>
  );

  const Description = ({ children, ...props }: any) => (
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

import { Button } from "../../ui/Button";

// Tests

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

  it("DialogContent renders built-in close button when showCloseButton=true", () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton>
          <div>Body</div>
        </DialogContent>
      </Dialog>,
    );

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

    expect(screen.queryByTestId("radix-close")).not.toBeInTheDocument();
    expect(screen.queryByText("Close")).not.toBeInTheDocument();
  });

  it("DialogFooter renders Close button via asChild when showCloseButton=true", () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogFooter showCloseButton>
            <div>FooterChild</div>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByTestId("radix-close-aschild")).toBeInTheDocument();

    expect(ButtonMock).toHaveBeenCalled();
    const props = ButtonMock.mock.calls[0][0];
    expect(props.variant).toBe("outline");
    expect(screen.getByTestId("button")).toHaveTextContent("Close");

    expect(screen.getByText("FooterChild")).toBeInTheDocument();
  });
});