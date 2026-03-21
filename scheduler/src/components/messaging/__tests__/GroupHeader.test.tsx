import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { GroupHeader } from "../GroupHeader";

// Shared props

const defaultProps = {
  name: "Team Chat",
  participantCount: 5,
  onToggleMembers: jest.fn(),
  onLeave: jest.fn(),
};

function setup(props = defaultProps) {
  return render(<GroupHeader {...props} />);
}

beforeEach(() => jest.clearAllMocks());

// Rendering

describe("GroupHeader – rendering", () => {
  it("renders the group name", () => {
    setup();
    expect(screen.getByText("Team Chat")).toBeInTheDocument();
  });

  it("renders the participant count", () => {
    setup();
    expect(screen.getByText("5 members")).toBeInTheDocument();
  });

  it("renders the Leave group button", () => {
    setup();
    expect(screen.getByRole("button", { name: /leave group/i })).toBeInTheDocument();
  });

  it("renders null name without crashing", () => {
    setup({ ...defaultProps, name: null });
    expect(screen.getByText("5 members")).toBeInTheDocument();
  });

  it("renders correctly with 1 member", () => {
    setup({ ...defaultProps, participantCount: 1 });
    expect(screen.getByText("1 members")).toBeInTheDocument();
  });

  it("renders correctly with 0 members", () => {
    setup({ ...defaultProps, participantCount: 0 });
    expect(screen.getByText("0 members")).toBeInTheDocument();
  });
});

// Interactions

describe("GroupHeader – interactions", () => {
  it("calls onToggleMembers when the group name button is clicked", () => {
    setup();
    fireEvent.click(screen.getByText("Team Chat"));
    expect(defaultProps.onToggleMembers).toHaveBeenCalledTimes(1);
  });

  it("calls onLeave when the Leave group button is clicked", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /leave group/i }));
    expect(defaultProps.onLeave).toHaveBeenCalledTimes(1);
  });

  it("does not call onLeave when the name button is clicked", () => {
    setup();
    fireEvent.click(screen.getByText("Team Chat"));
    expect(defaultProps.onLeave).not.toHaveBeenCalled();
  });

  it("does not call onToggleMembers when the Leave group button is clicked", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /leave group/i }));
    expect(defaultProps.onToggleMembers).not.toHaveBeenCalled();
  });
});