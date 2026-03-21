import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MembersPanel } from "../MembersPanel";
import { useRouter } from "next/navigation";

// Module mocks

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Local types

type Participant = {
  userId: string;
  role: string;
  joinedAt: string;
  user: { id: string; username: string; fname: string | null; pfp: string | null };
};

// Shared test data

const mockPush = jest.fn();

const ADMIN: Participant = {
  userId: "u-1",
  role: "admin",
  joinedAt: "2024-01-01T00:00:00Z",
  user: { id: "u-1", username: "alice", fname: "Alice", pfp: "alice.png" },
};

const MEMBER: Participant = {
  userId: "u-2",
  role: "member",
  joinedAt: "2024-01-02T00:00:00Z",
  user: { id: "u-2", username: "bob", fname: null, pfp: null },
};

const MEMBER_2: Participant = {
  userId: "u-3",
  role: "member",
  joinedAt: "2024-01-03T00:00:00Z",
  user: { id: "u-3", username: "carol", fname: "  Carol", pfp: null },
};

const defaultProps = {
  conversationId: "conv-1",
  participants: [ADMIN, MEMBER, MEMBER_2],
  currentUserId: "u-1",
  isAdmin: true,
  onAddMember: jest.fn(),
  onRemove: jest.fn(),
  onPromote: jest.fn(),
};

function setup(props = defaultProps) {
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  return render(<MembersPanel {...props} />);
}

beforeEach(() => jest.clearAllMocks());

// Rendering

describe("MembersPanel – rendering", () => {
  it("renders the Members heading", () => {
    setup();
    expect(screen.getByText("Members")).toBeInTheDocument();
  });

  it("renders a row for each participant", () => {
    setup();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();
  });

  it("renders an <img> for participants with a pfp", () => {
    setup();
    expect(screen.getByRole("img", { name: "alice" })).toHaveAttribute("src", "alice.png");
  });

  it("renders an initial avatar for participants without a pfp", () => {
    setup();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("shows (you) label next to the current user", () => {
    setup();
    expect(screen.getByText("(you)")).toBeInTheDocument();
  });

  it("does not show (you) next to other participants", () => {
    setup();
    expect(screen.getAllByText("(you)")).toHaveLength(1);
  });

  it("shows the Admin badge for admin participants", () => {
    setup();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("does not show Admin badge for regular members", () => {
    setup();
    expect(screen.getAllByText("Admin")).toHaveLength(1);
  });

  it("renders an empty list without crashing", () => {
    setup({ ...defaultProps, participants: [] });
    expect(screen.getByText("Members")).toBeInTheDocument();
  });
});

// Admin-only UI

describe("MembersPanel – admin controls", () => {
  it("shows + Add member button when isAdmin is true", () => {
    setup();
    expect(screen.getByRole("button", { name: /add member/i })).toBeInTheDocument();
  });

  it("hides + Add member button when isAdmin is false", () => {
    setup({ ...defaultProps, isAdmin: false });
    expect(screen.queryByRole("button", { name: /add member/i })).not.toBeInTheDocument();
  });

  it("shows Remove and promote buttons for other participants when isAdmin", () => {
    setup();
    expect(screen.getAllByRole("button", { name: /remove$/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /make admin|remove admin/i })).toHaveLength(2);
  });

  it("does not show Remove/promote buttons for the current user's own row", () => {
    setup();
    const rows = screen.getAllByRole("button", { name: /remove$/i });
    rows.forEach((btn) => {
      expect(btn.closest("div")).not.toHaveTextContent("Alice");
    });
  });

  it("hides Remove and promote buttons for all rows when isAdmin is false", () => {
    setup({ ...defaultProps, isAdmin: false });
    expect(screen.queryByRole("button", { name: /remove$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /make admin|remove admin/i })).not.toBeInTheDocument();
  });

  it("shows 'Remove admin' for admin participants", () => {
    const bobAdmin: Participant = { ...MEMBER, role: "admin" };
    setup({ ...defaultProps, participants: [ADMIN, bobAdmin] });
    expect(screen.getByRole("button", { name: /remove admin/i })).toBeInTheDocument();
  });

  it("shows 'Make admin' for regular member participants", () => {
    setup();
    expect(screen.getAllByRole("button", { name: /make admin/i }).length).toBeGreaterThan(0);
  });
});

// Interactions

describe("MembersPanel – interactions", () => {
  it("calls onAddMember when + Add member is clicked", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /add member/i }));
    expect(defaultProps.onAddMember).toHaveBeenCalledTimes(1);
  });

  it("calls onRemove with userId and username when Remove is clicked", () => {
    setup();
    const removeButtons = screen.getAllByRole("button", { name: /remove$/i });
    fireEvent.click(removeButtons[0]);
    expect(defaultProps.onRemove).toHaveBeenCalledWith("u-2", "bob");
  });

  it("calls onPromote with userId and current role when promote button is clicked", () => {
    setup();
    const promoteButtons = screen.getAllByRole("button", { name: /make admin|remove admin/i });
    fireEvent.click(promoteButtons[0]);
    expect(defaultProps.onPromote).toHaveBeenCalledWith("u-2", "member");
  });

  it("navigates to the participant's profile when their name button is clicked", () => {
    setup();
    fireEvent.click(screen.getByText("bob").closest("button")!);
    expect(mockPush).toHaveBeenCalledWith("/profile/bob");
  });

  it("navigates to the current user's own profile when their row is clicked", () => {
    setup();
    fireEvent.click(screen.getByText("Alice").closest("button")!);
    expect(mockPush).toHaveBeenCalledWith("/profile/alice");
  });

  it("does not call onRemove or onPromote when a profile button is clicked", () => {
    setup();
    fireEvent.click(screen.getByText("bob").closest("button")!);
    expect(defaultProps.onRemove).not.toHaveBeenCalled();
    expect(defaultProps.onPromote).not.toHaveBeenCalled();
  });
});