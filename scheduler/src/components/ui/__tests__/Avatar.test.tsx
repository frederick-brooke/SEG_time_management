import React from "react";
import { render, screen } from "@testing-library/react";
import {
  Avatar as AvatarBase,
  AvatarImage as AvatarImageBase,
  AvatarFallback as AvatarFallbackBase,
  AvatarBadge as AvatarBadgeBase,
  AvatarGroup as AvatarGroupBase,
  AvatarGroupCount as AvatarGroupCountBase,
} from "@/components/ui/Avatar";

// Cast to permissive FC types so tests don't need to supply className every time
const Avatar = AvatarBase as React.FC<React.HTMLAttributes<HTMLElement> & { size?: string }>;
const AvatarImage = AvatarImageBase as React.FC<React.ImgHTMLAttributes<HTMLImageElement>>;
const AvatarFallback = AvatarFallbackBase as React.FC<React.HTMLAttributes<HTMLElement>>;
const AvatarBadge = AvatarBadgeBase as React.FC<React.HTMLAttributes<HTMLElement>>;
const AvatarGroup = AvatarGroupBase as React.FC<React.HTMLAttributes<HTMLElement>>;
const AvatarGroupCount = AvatarGroupCountBase as React.FC<React.HTMLAttributes<HTMLElement>>;

jest.mock("@radix-ui/react-avatar", () => ({
  Root: ({ children, className, ...props }: any) =>
    React.createElement("div", { className, ...props }, children),
  Image: ({ className, ...props }: any) =>
    React.createElement("img", { className, ...props }),
  Fallback: ({ children, className, ...props }: any) =>
    React.createElement("span", { className, ...props }, children),
}));

// Mock cn 
jest.mock("lib/utils", () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Avatar 
describe("Avatar", () => {
  it("renders with data-slot='avatar'", () => {
    const { container } = render(<Avatar />);
    expect(container.querySelector("[data-slot='avatar']")).toBeInTheDocument();
  });

  it("defaults to size='default' via data-size attribute", () => {
    const { container } = render(<Avatar />);
    expect(
      container.querySelector("[data-slot='avatar']")
    ).toHaveAttribute("data-size", "default");
  });

  it("accepts a custom size prop", () => {
    const { container } = render(<Avatar size="lg" />);
    expect(
      container.querySelector("[data-slot='avatar']")
    ).toHaveAttribute("data-size", "lg");
  });

  it("accepts size='sm'", () => {
    const { container } = render(<Avatar size="sm" />);
    expect(
      container.querySelector("[data-slot='avatar']")
    ).toHaveAttribute("data-size", "sm");
  });

  it("applies default layout classes", () => {
    const { container } = render(<Avatar />);
    const el = container.querySelector("[data-slot='avatar']");
    expect(el?.className).toContain("relative");
    expect(el?.className).toContain("flex");
    expect(el?.className).toContain("size-8");
    expect(el?.className).toContain("shrink-0");
    expect(el?.className).toContain("overflow-hidden");
    expect(el?.className).toContain("rounded-full");
  });

  it("merges custom className", () => {
    const { container } = render(<Avatar className="custom-avatar" />);
    expect(
      container.querySelector("[data-slot='avatar']")?.className
    ).toContain("custom-avatar");
  });

  it("renders children", () => {
    render(
      <Avatar>
        <span data-testid="avatar-child">child</span>
      </Avatar>
    );
    expect(screen.getByTestId("avatar-child")).toBeInTheDocument();
  });

  it("passes extra props through", () => {
    const { container } = render(<Avatar data-testid="av" />);
    expect(screen.getByTestId("av")).toBeInTheDocument();
  });
});

// AvatarImage 
describe("AvatarImage", () => {
  it("renders with data-slot='avatar-image'", () => {
    const { container } = render(<AvatarImage />);
    expect(
      container.querySelector("[data-slot='avatar-image']")
    ).toBeInTheDocument();
  });

  it("applies default image classes", () => {
    const { container } = render(<AvatarImage />);
    const img = container.querySelector("[data-slot='avatar-image']");
    expect(img?.className).toContain("aspect-square");
    expect(img?.className).toContain("size-full");
  });

  it("merges custom className", () => {
    const { container } = render(<AvatarImage className="custom-img" />);
    expect(
      container.querySelector("[data-slot='avatar-image']")?.className
    ).toContain("custom-img");
  });

  it("forwards src and alt props", () => {
    render(<AvatarImage src="/photo.png" alt="User photo" />);
    const img = screen.getByAltText("User photo") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain("/photo.png");
  });
});

// AvatarFallback 
describe("AvatarFallback", () => {
  it("renders with data-slot='avatar-fallback'", () => {
    const { container } = render(<AvatarFallback>AB</AvatarFallback>);
    expect(
      container.querySelector("[data-slot='avatar-fallback']")
    ).toBeInTheDocument();
  });

  it("applies default fallback classes", () => {
    const { container } = render(<AvatarFallback>AB</AvatarFallback>);
    const el = container.querySelector("[data-slot='avatar-fallback']");
    expect(el?.className).toContain("bg-muted");
    expect(el?.className).toContain("text-muted-foreground");
    expect(el?.className).toContain("flex");
    expect(el?.className).toContain("items-center");
    expect(el?.className).toContain("justify-center");
    expect(el?.className).toContain("rounded-full");
    expect(el?.className).toContain("text-sm");
  });

  it("merges custom className", () => {
    const { container } = render(
      <AvatarFallback className="custom-fallback">AB</AvatarFallback>
    );
    expect(
      container.querySelector("[data-slot='avatar-fallback']")?.className
    ).toContain("custom-fallback");
  });

  it("renders text content", () => {
    render(<AvatarFallback>JD</AvatarFallback>);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });
});

// AvatarBadge 
describe("AvatarBadge", () => {
  it("renders with data-slot='avatar-badge'", () => {
    const { container } = render(<AvatarBadge />);
    expect(
      container.querySelector("[data-slot='avatar-badge']")
    ).toBeInTheDocument();
  });

  it("applies default badge classes", () => {
    const { container } = render(<AvatarBadge />);
    const el = container.querySelector("[data-slot='avatar-badge']");
    expect(el?.className).toContain("bg-primary");
    expect(el?.className).toContain("text-primary-foreground");
    expect(el?.className).toContain("ring-background");
    expect(el?.className).toContain("absolute");
    expect(el?.className).toContain("right-0");
    expect(el?.className).toContain("bottom-0");
    expect(el?.className).toContain("z-10");
    expect(el?.className).toContain("rounded-full");
    expect(el?.className).toContain("ring-2");
  });

  it("merges custom className", () => {
    const { container } = render(<AvatarBadge className="custom-badge" />);
    expect(
      container.querySelector("[data-slot='avatar-badge']")?.className
    ).toContain("custom-badge");
  });

  it("renders as a <span>", () => {
    const { container } = render(<AvatarBadge />);
    expect(container.querySelector("span[data-slot='avatar-badge']")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(<AvatarBadge><svg data-testid="badge-icon" /></AvatarBadge>);
    expect(screen.getByTestId("badge-icon")).toBeInTheDocument();
  });
});

// AvatarGroup 
describe("AvatarGroup", () => {
  it("renders with data-slot='avatar-group'", () => {
    const { container } = render(<AvatarGroup />);
    expect(
      container.querySelector("[data-slot='avatar-group']")
    ).toBeInTheDocument();
  });

  it("applies default group classes", () => {
    const { container } = render(<AvatarGroup />);
    const el = container.querySelector("[data-slot='avatar-group']");
    expect(el?.className).toContain("flex");
    expect(el?.className).toContain("-space-x-2");
  });

  it("merges custom className", () => {
    const { container } = render(<AvatarGroup className="custom-group" />);
    expect(
      container.querySelector("[data-slot='avatar-group']")?.className
    ).toContain("custom-group");
  });

  it("renders children", () => {
    render(
      <AvatarGroup>
        <Avatar data-testid="av-1" />
        <Avatar data-testid="av-2" />
      </AvatarGroup>
    );
    expect(screen.getByTestId("av-1")).toBeInTheDocument();
    expect(screen.getByTestId("av-2")).toBeInTheDocument();
  });

  it("renders as a <div>", () => {
    const { container } = render(<AvatarGroup />);
    expect(
      container.querySelector("div[data-slot='avatar-group']")
    ).toBeInTheDocument();
  });
});

// AvatarGroupCount 
describe("AvatarGroupCount", () => {
  it("renders with data-slot='avatar-group-count'", () => {
    const { container } = render(<AvatarGroupCount />);
    expect(
      container.querySelector("[data-slot='avatar-group-count']")
    ).toBeInTheDocument();
  });

  it("applies default group count classes", () => {
    const { container } = render(<AvatarGroupCount />);
    const el = container.querySelector("[data-slot='avatar-group-count']");
    expect(el?.className).toContain("bg-muted");
    expect(el?.className).toContain("text-muted-foreground");
    expect(el?.className).toContain("ring-background");
    expect(el?.className).toContain("flex");
    expect(el?.className).toContain("size-8");
    expect(el?.className).toContain("shrink-0");
    expect(el?.className).toContain("items-center");
    expect(el?.className).toContain("justify-center");
    expect(el?.className).toContain("rounded-full");
    expect(el?.className).toContain("text-sm");
    expect(el?.className).toContain("ring-2");
  });

  it("merges custom className", () => {
    const { container } = render(
      <AvatarGroupCount className="custom-count" />
    );
    expect(
      container.querySelector("[data-slot='avatar-group-count']")?.className
    ).toContain("custom-count");
  });

  it("renders children", () => {
    render(<AvatarGroupCount>+3</AvatarGroupCount>);
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("renders as a <div>", () => {
    const { container } = render(<AvatarGroupCount />);
    expect(
      container.querySelector("div[data-slot='avatar-group-count']")
    ).toBeInTheDocument();
  });
});

// Composed usage 
describe("Avatar composed", () => {
  it("renders a full avatar with image and fallback", () => {
    render(
      <Avatar size="lg">
        <AvatarImage src="/user.png" alt="Jane Doe" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByAltText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders an avatar with a badge", () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
        <AvatarBadge data-testid="status-badge" />
      </Avatar>
    );
    expect(screen.getByText("AB")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge")).toBeInTheDocument();
  });

  it("renders an AvatarGroup with multiple avatars and a count", () => {
    render(
      <AvatarGroup>
        <Avatar size="sm">
          <AvatarFallback>A1</AvatarFallback>
        </Avatar>
        <Avatar size="sm">
          <AvatarFallback>A2</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+5</AvatarGroupCount>
      </AvatarGroup>
    );
    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByText("+5")).toBeInTheDocument();
  });
});
