import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "../Sheet"; 

beforeAll(() => {
  if (typeof window !== "undefined" && !window.PointerEvent) {
    class PointerEvent extends MouseEvent {}
    (window as any).PointerEvent = PointerEvent;
  }
});

describe("Sheet Component", () => {
  const TestSheet = ({ side, showCloseButton, defaultOpen = false }: any) => (
    <Sheet defaultOpen={defaultOpen}>
      <SheetTrigger>Open Sheet</SheetTrigger>
      <SheetContent side={side} showCloseButton={showCloseButton}>
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>This is a description.</SheetDescription>
        </SheetHeader>
        <div data-testid="custom-content">Main content goes here</div>
        <SheetFooter>
          <SheetClose>Close Action</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  it("renders the trigger button initially", () => {
    render(<TestSheet />);
    expect(screen.getByText("Open Sheet")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the sheet and displays content when trigger is clicked", () => {
    render(<TestSheet />);
    
    // Click the trigger
    fireEvent.click(screen.getByText("Open Sheet"));
    
    // Radix UI sets role="dialog" on the content container
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    
    // Check if the title and description (required for accessibility) are rendered
    expect(screen.getByText("Sheet Title")).toBeInTheDocument();
    expect(screen.getByText("This is a description.")).toBeInTheDocument();
    expect(screen.getByTestId("custom-content")).toBeInTheDocument();
  });

  it("applies the correct default classes (side='right')", () => {
    render(<TestSheet defaultOpen={true} />);
    
    const content = screen.getByRole("dialog");
    expect(content).toHaveClass("right-0", "border-l");
  });

  it("applies the correct classes when side='left' is passed", () => {
    render(<TestSheet defaultOpen={true} side="left" />);
    
    const content = screen.getByRole("dialog");
    expect(content).toHaveClass("left-0", "border-r");
    expect(content).not.toHaveClass("right-0");
  });

  it("applies the correct classes when side='bottom' is passed", () => {
    render(<TestSheet defaultOpen={true} side="bottom" />);
    
    const content = screen.getByRole("dialog");
    expect(content).toHaveClass("bottom-0", "border-t", "inset-x-0");
  });

  it("renders the close button by default", () => {
    render(<TestSheet defaultOpen={true} />);
    
    const defaultCloseButton = screen.getByRole("button", { name: "Close" });
    expect(defaultCloseButton).toBeInTheDocument();
  });

  it("hides the close button when showCloseButton={false}", () => {
    render(<TestSheet defaultOpen={true} showCloseButton={false} />);
    
    const defaultCloseButtons = screen.queryAllByRole("button", { name: "Close" });
    
    expect(defaultCloseButtons).toHaveLength(0);
  });

  it("merges custom classNames correctly", () => {
    render(
      <Sheet defaultOpen={true}>
        <SheetContent className="custom-sheet-class border-red-500">
          <div>Content</div>
        </SheetContent>
      </Sheet>
    );

    const content = screen.getByRole("dialog");
    expect(content).toHaveClass("custom-sheet-class");
    expect(content).toHaveClass("border-red-500");
    expect(content).toHaveClass("fixed", "z-50", "shadow-lg");
  });
});