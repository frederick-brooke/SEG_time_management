import React from "react";
import { render, screen } from "@testing-library/react";


// Mocks

const ButtonMock = jest.fn(({ children, variant, size, asChild, ...rest }) => (
  <div
    data-testid="button"
    data-variant={variant || ""}
    data-size={size || "default"}
    data-as-child={asChild ? "true" : "false"}
    {...rest}
  >
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

jest.mock("@radix-ui/react-alert-dialog", () => {
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

  const Portal = ({ children, ...props }: any) => (
    <div data-testid="radix-portal" {...props}>
      {children}
    </div>
  );

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

  const Action = ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return (
        <div data-testid="radix-action" data-as-child="true" {...props}>
          {children}
        </div>
      );
    }
    return (
      <button data-testid="radix-action" {...props}>
        {children}
      </button>
    );
  };

  const Cancel = ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return (
        <div data-testid="radix-cancel" data-as-child="true" {...props}>
          {children}
        </div>
      );
    }
    return (
      <button data-testid="radix-cancel" {...props}>
        {children}
      </button>
    );
  };

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

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "../../ui/AlertDialog";

// Tests

describe("components/ui/AlertDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ButtonMock.mockClear();
  });

  it("renders core pieces (smoke)", () => {
    render(
      <AlertDialog open>
        <AlertDialogTrigger>Open</AlertDialogTrigger>

        <AlertDialogPortal>
          <AlertDialogOverlay className="my-overlay" />
          <AlertDialogContent className="my-content">
            <AlertDialogHeader className="my-header">
              <div className="my-media">M</div>
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
    expect(screen.getByTestId("radix-title")).toHaveTextContent("Title");
    expect(screen.getByTestId("radix-description")).toHaveTextContent(
      "Description",
    );
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

    const actionButtonCall = ButtonMock.mock.calls.find(
      (c) => c[0].asChild === true && (c[0].variant === "default" || !c[0].variant),
    );
    expect(actionButtonCall).toBeTruthy();
    const callProps = actionButtonCall![0];
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

    const actionButtonCall = ButtonMock.mock.calls.find(
      (c) => c[0].variant === "destructive",
    );
    expect(actionButtonCall).toBeTruthy();
    const props = actionButtonCall![0];
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

    const cancelButtonCall = ButtonMock.mock.calls.find(
      (c) => c[0].variant === "outline",
    );
    expect(cancelButtonCall).toBeTruthy();
    const props = cancelButtonCall![0];
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

    const cancelButtonCall = ButtonMock.mock.calls.find(
      (c) => c[0].variant === "ghost",
    );
    expect(cancelButtonCall).toBeTruthy();
    const props = cancelButtonCall![0];
    expect(props.asChild).toBe(true);

    expect(screen.getByTestId("radix-cancel")).toHaveTextContent("Nope");
  });
});