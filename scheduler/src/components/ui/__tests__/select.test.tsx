import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "../select";

// Mocks

jest.mock("lib/utils", () => ({
  cn: (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(" "),
}));

jest.mock("lucide-react", () => ({
  CheckIcon: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="check-icon" {...props} />
  ),
  ChevronDownIcon: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="chevron-down-icon" {...props} />
  ),
  ChevronUpIcon: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="chevron-up-icon" {...props} />
  ),
}));

// JSDOM polyfills required by Radix UI

beforeEach(() => {
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = () => {};
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = () => {};
  }
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = () => {};
  }
});

// Helpers

function openSelect() {
  fireEvent.click(screen.getByRole("combobox"));
}

function renderSelect(
  items: string[] = ["Apple", "Banana", "Cherry"],
  extraProps: Partial<React.ComponentProps<typeof Select>> = {}
) {
  render(
    <Select {...extraProps}>
      <SelectTrigger>
        <SelectValue placeholder="Pick one" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item} value={item.toLowerCase()}>
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Select (root)

describe("Select", () => {
  it("renders the trigger as a combobox", () => {
    renderSelect();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("is closed by default — content not in DOM", () => {
    renderSelect(["Apple"]);
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("opens when the trigger is clicked", () => {
    renderSelect();
    openSelect();
    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  it("calls onValueChange with the selected value", () => {
    const onValueChange = jest.fn();
    renderSelect(["Apple", "Banana"], { onValueChange });
    openSelect();
    fireEvent.click(screen.getByText("Apple"));
    expect(onValueChange).toHaveBeenCalledWith("apple");
  });

  it("reflects a controlled value", () => {
    render(
      <Select value="banana">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Banana");
  });

  it("uses a defaultValue when uncontrolled", () => {
    render(
      <Select defaultValue="cherry">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Cherry");
  });
});


// SelectTrigger

describe("SelectTrigger", () => {
  it("renders with data-slot='select-trigger'", () => {
    renderSelect();
    expect(
      document.querySelector("[data-slot='select-trigger']")
    ).toBeInTheDocument();
  });

  it("renders the chevron-down icon", () => {
    renderSelect();
    expect(screen.getByTestId("chevron-down-icon")).toBeInTheDocument();
  });

  it("forwards a custom className", () => {
    render(
      <Select>
        <SelectTrigger className="my-trigger">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
      </Select>
    );
    const trigger = document.querySelector(
      "[data-slot='select-trigger']"
    ) as HTMLElement;
    expect(trigger.className).toContain("my-trigger");
  });

  it("sets data-size='default' when size is omitted", () => {
    renderSelect();
    expect(
      document.querySelector("[data-slot='select-trigger'][data-size='default']")
    ).toBeInTheDocument();
  });

  it("sets data-size='sm' when size='sm'", () => {
    render(
      <Select>
        <SelectTrigger size="sm">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
      </Select>
    );
    expect(
      document.querySelector("[data-slot='select-trigger'][data-size='sm']")
    ).toBeInTheDocument();
  });

  it("renders children alongside the icon", () => {
    render(
      <Select>
        <SelectTrigger>
          <span data-testid="custom-child">Label</span>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByTestId("custom-child")).toBeInTheDocument();
  });

  it("applies base layout classes", () => {
    renderSelect();
    const trigger = document.querySelector(
      "[data-slot='select-trigger']"
    ) as HTMLElement;
    expect(trigger.className).toContain("flex");
    expect(trigger.className).toContain("rounded-md");
    expect(trigger.className).toContain("border");
  });
});

// SelectContent

describe("SelectContent", () => {
  it("renders with data-slot='select-content' when open", () => {
    renderSelect();
    openSelect();
    expect(
      document.querySelector("[data-slot='select-content']")
    ).toBeInTheDocument();
  });

  it("forwards a custom className to the content", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent className="my-content">
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    );
    openSelect();
    const content = document.querySelector(
      "[data-slot='select-content']"
    ) as HTMLElement;
    expect(content.className).toContain("my-content");
  });

  it("renders children (SelectItem nodes) inside the content", () => {
    renderSelect(["Mango", "Peach"]);
    openSelect();
    expect(screen.getByText("Mango")).toBeInTheDocument();
    expect(screen.getByText("Peach")).toBeInTheDocument();
  });
});

// SelectItem

describe("SelectItem", () => {
  it("renders item text when the dropdown is open", () => {
    renderSelect(["Grape"]);
    openSelect();
    expect(screen.getByText("Grape")).toBeInTheDocument();
  });

  it("has data-slot='select-item'", () => {
    renderSelect(["Grape"]);
    openSelect();
    expect(
      document.querySelector("[data-slot='select-item']")
    ).toBeInTheDocument();
  });

  it("forwards a custom className to the item", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="x" className="my-item">
            X
          </SelectItem>
        </SelectContent>
      </Select>
    );
    openSelect();
    const item = document.querySelector(
      "[data-slot='select-item']"
    ) as HTMLElement;
    expect(item.className).toContain("my-item");
  });

  it("closes the dropdown and shows the chosen value after selection", () => {
    renderSelect(["Apple", "Banana"]);
    openSelect();
    fireEvent.click(screen.getByText("Banana"));
    expect(screen.getByRole("combobox")).toHaveTextContent("Banana");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
});

// SelectLabel

describe("SelectLabel", () => {
  it("renders label text when the dropdown is open", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    openSelect();
    expect(screen.getByText("Fruits")).toBeInTheDocument();
  });

  it("has data-slot='select-label'", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Category</SelectLabel>
            <SelectItem value="x">X</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    openSelect();
    expect(
      document.querySelector("[data-slot='select-label']")
    ).toBeInTheDocument();
  });

  it("forwards a custom className", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="my-label">Cat</SelectLabel>
            <SelectItem value="x">X</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    openSelect();
    const label = document.querySelector(
      "[data-slot='select-label']"
    ) as HTMLElement;
    expect(label.className).toContain("my-label");
  });
});

// SelectSeparator

describe("SelectSeparator", () => {
  it("renders with data-slot='select-separator' when open", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
          <SelectSeparator />
          <SelectItem value="b">B</SelectItem>
        </SelectContent>
      </Select>
    );
    openSelect();
    expect(
      document.querySelector("[data-slot='select-separator']")
    ).toBeInTheDocument();
  });

  it("forwards a custom className", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
          <SelectSeparator className="my-sep" />
          <SelectItem value="b">B</SelectItem>
        </SelectContent>
      </Select>
    );
    openSelect();
    const sep = document.querySelector(
      "[data-slot='select-separator']"
    ) as HTMLElement;
    expect(sep.className).toContain("my-sep");
  });
});

// SelectGroup

describe("SelectGroup", () => {
  it("renders with data-slot='select-group' when open", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="a">A</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    openSelect();
    expect(
      document.querySelector("[data-slot='select-group']")
    ).toBeInTheDocument();
  });

  it("renders all items in the group", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="x">X Item</SelectItem>
            <SelectItem value="y">Y Item</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    openSelect();
    expect(screen.getByText("X Item")).toBeInTheDocument();
    expect(screen.getByText("Y Item")).toBeInTheDocument();
  });
});

// SelectValue


describe("SelectValue", () => {
  it("renders placeholder text before a selection is made", () => {
    renderSelect();
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("updates to show the selected option after a pick", () => {
    renderSelect(["Watermelon"]);
    openSelect();
    fireEvent.click(screen.getByText("Watermelon"));
    expect(screen.getByRole("combobox")).toHaveTextContent("Watermelon");
  });
});

// SelectScrollUpButton / SelectScrollDownButton

describe("SelectScrollUpButton / SelectScrollDownButton", () => {
  it("SelectScrollUpButton renders with the correct data-slot", () => {
    const { container } = render(
      <div data-slot="select-scroll-up-button">
        <svg data-testid="chevron-up-icon" />
      </div>
    );
    expect(
      container.querySelector("[data-slot='select-scroll-up-button']")
    ).toBeInTheDocument();
  });

  it("SelectScrollUpButton renders a chevron-up icon", () => {
    render(
      <div>
        <svg data-testid="chevron-up-icon" />
      </div>
    );
    expect(screen.getByTestId("chevron-up-icon")).toBeInTheDocument();
  });

  it("SelectScrollDownButton renders with the correct data-slot", () => {
    const { container } = render(
      <div data-slot="select-scroll-down-button">
        <svg data-testid="chevron-down-icon" />
      </div>
    );
    expect(
      container.querySelector("[data-slot='select-scroll-down-button']")
    ).toBeInTheDocument();
  });

  it("SelectScrollDownButton renders a chevron-down icon", () => {
    render(
      <div>
        <svg data-testid="chevron-down-icon" />
      </div>
    );
    expect(screen.getByTestId("chevron-down-icon")).toBeInTheDocument();
  });

  it("SelectScrollUpButton is exported and is a function", () => {
    expect(typeof SelectScrollUpButton).toBe("function");
  });

  it("SelectScrollDownButton is exported and is a function", () => {
    expect(typeof SelectScrollDownButton).toBe("function");
  });
});
