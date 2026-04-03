import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "../DropdownMenu"; 

// Mocks

jest.mock("lib/utils", () => ({
  cn: (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(" "),
}));

// Radix UI uses ResizeObserver internally
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Helpers

/**
 * Renders a basic open dropdown so content is visible in the DOM.
 * Radix DropdownMenu uses a Portal; `open` + `onOpenChange` bypasses the
 * trigger-click cycle and makes content immediately queryable.
 */
function renderOpen(content: React.ReactNode) {
  return render(
    <DropdownMenu open>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>{content}</DropdownMenuContent>
    </DropdownMenu>
  );
}

// DropdownMenu (root)

describe("DropdownMenu", () => {
  it("renders the trigger", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Toggle</DropdownMenuTrigger>
      </DropdownMenu>
    );
    expect(screen.getByText("Toggle")).toBeInTheDocument();
  });

  it("trigger has data-slot='dropdown-menu-trigger'", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Toggle</DropdownMenuTrigger>
      </DropdownMenu>
    );
    expect(
      screen.getByText("Toggle").closest("[data-slot='dropdown-menu-trigger']")
    ).toBeInTheDocument();
  });

  it("opens and shows content when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Toggle</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item One</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await user.click(screen.getByText("Toggle"));
    expect(screen.getByText("Item One")).toBeInTheDocument();
  });

  it("is closed by default (content not in DOM)", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Toggle</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Hidden Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.queryByText("Hidden Item")).not.toBeInTheDocument();
  });
});

// DropdownMenuContent

describe("DropdownMenuContent", () => {
  it("renders with data-slot='dropdown-menu-content'", () => {
    renderOpen(<DropdownMenuItem>Test</DropdownMenuItem>);
    expect(
      document.querySelector("[data-slot='dropdown-menu-content']")
    ).toBeInTheDocument();
  });

  it("forwards a custom className", () => {
    renderOpen(<DropdownMenuItem>Test</DropdownMenuItem>);
    // Re-render with className to verify forwarding
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent className="my-custom-class">
          <DropdownMenuItem>Test</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(
      document.querySelector("[data-slot='dropdown-menu-content'].my-custom-class")
    ).toBeInTheDocument();
  });
});

// DropdownMenuGroup

describe("DropdownMenuGroup", () => {
  it("renders with data-slot='dropdown-menu-group'", () => {
    renderOpen(
      <DropdownMenuGroup>
        <DropdownMenuItem>Grouped Item</DropdownMenuItem>
      </DropdownMenuGroup>
    );
    expect(
      document.querySelector("[data-slot='dropdown-menu-group']")
    ).toBeInTheDocument();
  });

  it("renders its children", () => {
    renderOpen(
      <DropdownMenuGroup>
        <DropdownMenuItem>Alpha</DropdownMenuItem>
        <DropdownMenuItem>Beta</DropdownMenuItem>
      </DropdownMenuGroup>
    );
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });
});

// DropdownMenuLabel

describe("DropdownMenuLabel", () => {
  it("renders label text", () => {
    renderOpen(<DropdownMenuLabel>My Label</DropdownMenuLabel>);
    expect(screen.getByText("My Label")).toBeInTheDocument();
  });

  it("has data-slot='dropdown-menu-label'", () => {
    renderOpen(<DropdownMenuLabel>My Label</DropdownMenuLabel>);
    expect(
      document.querySelector("[data-slot='dropdown-menu-label']")
    ).toBeInTheDocument();
  });

  it("applies pl-8 when inset prop is true", () => {
    renderOpen(<DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>);
    const label = document.querySelector("[data-slot='dropdown-menu-label']") as HTMLElement;
    expect(label.className).toContain("pl-8");
  });

  it("does not apply pl-8 when inset is false", () => {
    renderOpen(<DropdownMenuLabel>Normal Label</DropdownMenuLabel>);
    const label = document.querySelector("[data-slot='dropdown-menu-label']") as HTMLElement;
    expect(label.className).not.toContain("pl-8");
  });
});

// DropdownMenuItem

describe("DropdownMenuItem", () => {
  it("renders with data-slot='dropdown-menu-item'", () => {
    renderOpen(<DropdownMenuItem>Click me</DropdownMenuItem>);
    expect(
      document.querySelector("[data-slot='dropdown-menu-item']")
    ).toBeInTheDocument();
  });

  it("renders its text content", () => {
    renderOpen(<DropdownMenuItem>Hello</DropdownMenuItem>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("sets data-variant='default' by default", () => {
    renderOpen(<DropdownMenuItem>Default</DropdownMenuItem>);
    expect(
      document.querySelector("[data-slot='dropdown-menu-item'][data-variant='default']")
    ).toBeInTheDocument();
  });

  it("sets data-variant='destructive' when variant prop is destructive", () => {
    renderOpen(<DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>);
    expect(
      document.querySelector("[data-slot='dropdown-menu-item'][data-variant='destructive']")
    ).toBeInTheDocument();
  });

  it("sets data-inset when inset prop is true", () => {
    renderOpen(<DropdownMenuItem inset>Inset Item</DropdownMenuItem>);
    const item = document.querySelector("[data-slot='dropdown-menu-item']") as HTMLElement;
    expect(item.dataset.inset).toBe("true");
  });

  it("fires onSelect callback when clicked", async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    renderOpen(<DropdownMenuItem onSelect={onSelect}>Click</DropdownMenuItem>);
    await user.click(screen.getByText("Click"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("forwards a custom className", () => {
    renderOpen(<DropdownMenuItem className="extra-class">Item</DropdownMenuItem>);
    const item = document.querySelector("[data-slot='dropdown-menu-item']") as HTMLElement;
    expect(item.className).toContain("extra-class");
  });
});

// DropdownMenuCheckboxItem


describe("DropdownMenuCheckboxItem", () => {
  it("renders with data-slot='dropdown-menu-checkbox-item'", () => {
    renderOpen(
      <DropdownMenuCheckboxItem checked={false}>Check me</DropdownMenuCheckboxItem>
    );
    expect(
      document.querySelector("[data-slot='dropdown-menu-checkbox-item']")
    ).toBeInTheDocument();
  });

  it("renders children text", () => {
    renderOpen(
      <DropdownMenuCheckboxItem checked={false}>Option A</DropdownMenuCheckboxItem>
    );
    expect(screen.getByText("Option A")).toBeInTheDocument();
  });

  it("calls onCheckedChange when clicked", async () => {
    const onCheckedChange = jest.fn();
    const user = userEvent.setup();
    renderOpen(
      <DropdownMenuCheckboxItem checked={false} onCheckedChange={onCheckedChange}>
        Toggle
      </DropdownMenuCheckboxItem>
    );
    await user.click(screen.getByText("Toggle"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

// DropdownMenuRadioGroup + DropdownMenuRadioItem

describe("DropdownMenuRadioGroup / DropdownMenuRadioItem", () => {
  it("renders radio items inside a group", () => {
    renderOpen(
      <DropdownMenuRadioGroup value="a">
        <DropdownMenuRadioItem value="a">Option A</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="b">Option B</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    );
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
  });

  it("radio group has data-slot='dropdown-menu-radio-group'", () => {
    renderOpen(
      <DropdownMenuRadioGroup value="a">
        <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    );
    expect(
      document.querySelector("[data-slot='dropdown-menu-radio-group']")
    ).toBeInTheDocument();
  });

  it("radio item has data-slot='dropdown-menu-radio-item'", () => {
    renderOpen(
      <DropdownMenuRadioGroup value="a">
        <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    );
    expect(
      document.querySelector("[data-slot='dropdown-menu-radio-item']")
    ).toBeInTheDocument();
  });

  it("calls onValueChange when a radio item is clicked", async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();
    renderOpen(
      <DropdownMenuRadioGroup value="a" onValueChange={onValueChange}>
        <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="b">B</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    );
    await user.click(screen.getByText("B"));
    expect(onValueChange).toHaveBeenCalledWith("b");
  });
});

// DropdownMenuSeparator

describe("DropdownMenuSeparator", () => {
  it("renders with data-slot='dropdown-menu-separator'", () => {
    renderOpen(<DropdownMenuSeparator />);
    expect(
      document.querySelector("[data-slot='dropdown-menu-separator']")
    ).toBeInTheDocument();
  });

  it("forwards a custom className", () => {
    renderOpen(<DropdownMenuSeparator className="my-sep" />);
    const sep = document.querySelector("[data-slot='dropdown-menu-separator']") as HTMLElement;
    expect(sep.className).toContain("my-sep");
  });
});

// DropdownMenuShortcut

describe("DropdownMenuShortcut", () => {
  it("renders shortcut text", () => {
    renderOpen(
      <DropdownMenuItem>
        Save
        <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
      </DropdownMenuItem>
    );
    expect(screen.getByText("⌘S")).toBeInTheDocument();
  });

  it("has data-slot='dropdown-menu-shortcut'", () => {
    renderOpen(
      <DropdownMenuItem>
        <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
      </DropdownMenuItem>
    );
    expect(
      document.querySelector("[data-slot='dropdown-menu-shortcut']")
    ).toBeInTheDocument();
  });

  it("forwards a custom className", () => {
    renderOpen(
      <DropdownMenuItem>
        <DropdownMenuShortcut className="custom-shortcut">⌘X</DropdownMenuShortcut>
      </DropdownMenuItem>
    );
    const shortcut = document.querySelector(
      "[data-slot='dropdown-menu-shortcut']"
    ) as HTMLElement;
    expect(shortcut.className).toContain("custom-shortcut");
  });
});

// DropdownMenuSub + DropdownMenuSubTrigger + DropdownMenuSubContent


describe("DropdownMenuSub", () => {
  it("renders the sub-trigger inside an open menu", () => {
    renderOpen(
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>More options</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>Sub Item</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
    expect(screen.getByText("More options")).toBeInTheDocument();
  });

  it("sub-trigger has data-slot='dropdown-menu-sub-trigger'", () => {
    renderOpen(
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>Sub</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
    expect(
      document.querySelector("[data-slot='dropdown-menu-sub-trigger']")
    ).toBeInTheDocument();
  });

  it("sub-trigger applies pl-8 when inset is true", () => {
    renderOpen(
      <DropdownMenuSub>
        <DropdownMenuSubTrigger inset>More</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>Sub</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
    const trigger = document.querySelector(
      "[data-slot='dropdown-menu-sub-trigger']"
    ) as HTMLElement;
    expect(trigger.className).toContain("pl-8");
  });

  it("opens sub-content when sub-trigger is clicked", async () => {
    const user = userEvent.setup();
    renderOpen(
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>More options</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>Sub Item</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
    await user.click(screen.getByText("More options"));
    expect(screen.getByText("Sub Item")).toBeInTheDocument();
  });

  it("sub-content has data-slot='dropdown-menu-sub-content'", async () => {
    const user = userEvent.setup();
    renderOpen(
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>Sub</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
    await user.click(screen.getByText("More"));
    expect(
      document.querySelector("[data-slot='dropdown-menu-sub-content']")
    ).toBeInTheDocument();
  });
});

// DropdownMenuPortal

describe("DropdownMenuPortal", () => {
  it("renders children into a portal", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent>
            <DropdownMenuItem>Portal Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    );
    expect(screen.getByText("Portal Item")).toBeInTheDocument();
  });
});
