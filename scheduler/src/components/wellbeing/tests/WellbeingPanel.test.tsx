import React from "react";
import { render, screen } from "@testing-library/react";
import WellbeingPanel from "../WellbeingPanel";

jest.mock("@/components/layout/LunarDrawer", () =>
  jest.fn(({ open, onClose, side, title, children }: {
    open: boolean;
    onClose: () => void;
    side: string;
    title: string;
    children: React.ReactNode;
  }) => open ? (
    <div data-testid="lunar-drawer" data-side={side} data-title={title}>
      <button onClick={onClose} data-testid="close-btn" />
      {children}
    </div>
  ) : null)
);

jest.mock("@/app/(pages)/wellbeing/page", () =>
  jest.fn(() => <div data-testid="wellbeing-page" />)
);

const defaultProps = {
  open: true,
  onClose: jest.fn(),
};

describe("WellbeingPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes open=true to LunarDrawer and renders content", () => {
    render(<WellbeingPanel {...defaultProps} />);
    expect(screen.getByTestId("lunar-drawer")).toBeInTheDocument();
  });

  it("passes open=false to LunarDrawer and renders nothing", () => {
    render(<WellbeingPanel {...defaultProps} open={false} />);
    expect(screen.queryByTestId("lunar-drawer")).not.toBeInTheDocument();
  });

  it("passes side='right' to LunarDrawer", () => {
    render(<WellbeingPanel {...defaultProps} />);
    expect(screen.getByTestId("lunar-drawer")).toHaveAttribute("data-side", "right");
  });

  it("passes title='Wellbeing' to LunarDrawer", () => {
    render(<WellbeingPanel {...defaultProps} />);
    expect(screen.getByTestId("lunar-drawer")).toHaveAttribute("data-title", "Wellbeing");
  });

  it("calls onClose when drawer close is triggered", () => {
    const onClose = jest.fn();
    render(<WellbeingPanel {...defaultProps} onClose={onClose} />);
    screen.getByTestId("close-btn").click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders WellbeingPage inside the drawer", () => {
    render(<WellbeingPanel {...defaultProps} />);
    expect(screen.getByTestId("wellbeing-page")).toBeInTheDocument();
  });

  it("wraps WellbeingPage in a container with correct classes", () => {
    const { container } = render(<WellbeingPanel {...defaultProps} />);
    const wrapper = container.querySelector(".flex.flex-1.flex-col.min-h-0.p-4");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toContainElement(screen.getByTestId("wellbeing-page"));
  });

  it("accepts and ignores the optional title prop without error", () => {
    expect(() =>
      render(<WellbeingPanel {...defaultProps} title="Custom Title" />)
    ).not.toThrow();
  });

  it("accepts and ignores the optional children prop without error", () => {
    expect(() =>
      render(<WellbeingPanel {...defaultProps}><span>child</span></WellbeingPanel>)
    ).not.toThrow();
  });
});