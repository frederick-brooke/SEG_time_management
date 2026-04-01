import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "../Command";

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Add scrollIntoView to the HTMLElement prototype
Object.defineProperty(global.HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: jest.fn(),
});

describe("Command components", () => {
  it("renders Command without crashing", () => {
    render(<Command data-testid="command" />);
    const command = screen.getByTestId("command");
    expect(command).toBeInTheDocument();
  });

  it("renders CommandDialog with title and description", () => {
    render(
      <CommandDialog 
        open={true} 
        title="Test Dialog" 
        description="Dialog description"
      >
        <CommandList>
          <CommandItem>Test Item</CommandItem>
        </CommandList>
      </CommandDialog>
    );

    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog description")).toBeInTheDocument();
  });

  it("renders CommandInput and allows typing", async () => {
    const user = userEvent.setup();
    render(
      <Command>
        <CommandInput placeholder="Search..." />
      </Command>
    );

    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;
    await user.type(input, "Hello Cmdk");
    expect(input.value).toBe("Hello Cmdk");
  });

  it("renders CommandList with children", () => {
    render(
      <Command>
        <CommandList>
          <CommandItem>Item 1</CommandItem>
          <CommandItem>Item 2</CommandItem>
        </CommandList>
      </Command>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders CommandEmpty", () => {
    render(
      <Command>
        <CommandEmpty>No results</CommandEmpty>
      </Command>
    );
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("renders CommandGroup with heading", () => {
    render(
      <Command>
        <CommandGroup heading="Suggestions">
          <CommandItem>Item A</CommandItem>
        </CommandGroup>
      </Command>
    );

    expect(screen.getByText("Item A")).toBeInTheDocument();
  });

  it("renders CommandItem with className", () => {
    render(
      <Command>
        <CommandList>
          <CommandItem className="my-item">Test Item</CommandItem>
        </CommandList>
      </Command>
    );

    const item = screen.getByText("Test Item");
    expect(item).toHaveClass("my-item");
  });

  it("renders CommandShortcut", () => {
    render(<CommandShortcut>⌘K</CommandShortcut>);
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("renders CommandSeparator", () => {
    render(
      <Command>
        <CommandSeparator data-testid="command-separator" />
      </Command>
    );
    const separator = screen.getByTestId("command-separator");
    expect(separator).toBeInTheDocument();
  });
});