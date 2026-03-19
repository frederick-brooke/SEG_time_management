import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchUsers from "../searchUsers";
import * as recentUsersLib from "@/lib/recent-users";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@/lib/recent-users", () => ({
  addRecentUser:    jest.fn(),
  getRecentUsers:   jest.fn(() => []),
  removeRecentUser: jest.fn(),
  clearRecentUsers: jest.fn(),
}));

jest.mock("@/components/ui/glassCard", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="glass-card">{children}</div>,
}));

jest.mock("@/components/admin/admin-user-panel", () => ({
  __esModule: true,
  default: ({ user, onClose }: any) =>
    user ? (
      <div data-testid="user-panel">
        <span>{user.username}</span>
        <button onClick={onClose}>ClosePanel</button>
      </div>
    ) : null,
}));

jest.mock("../user-cards", () => ({
  __esModule: true,
  default: ({ user, onClick }: any) => (
    <div data-testid="user-card" onClick={onClick}>
      {user.username}
    </div>
  ),
}));

jest.mock("@tabler/icons-react", () => ({
  IconX: () => <span data-testid="icon-x" />,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockUsers = [
  { id: "1", username: "alice" },
  { id: "2", username: "bob" },
];

const defaultProps = {
  users:              mockUsers,
  totalUsers:         2,
  totalUserPages:     1,
  setIsUserFilterOpen: jest.fn(),
  selectedUser:       null,
  setSelectedUser:    jest.fn(),
  filters:            { search: "alice", page: 1, limit: 10 },
  setFilters:         jest.fn(),
  resetFilters:       jest.fn(),
};

const renderComponent = (overrides = {}) =>
  render(<SearchUsers {...defaultProps} {...overrides} />);

// ── Suite ─────────────────────────────────────────────────────────────────────

describe("SearchUsers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (recentUsersLib.getRecentUsers as jest.Mock).mockReturnValue([]);
  });

  // ── Search mode (search !== "") ───────────────────────────────────────────
  describe("search mode", () => {
    it("shows 'Users' heading when search is active", () => {
      renderComponent();
      expect(screen.getByText("Users")).toBeInTheDocument();
    });

    it("renders a UserCard for each user", () => {
      renderComponent();
      expect(screen.getAllByTestId("user-card")).toHaveLength(2);
      expect(screen.getByText("alice")).toBeInTheDocument();
      expect(screen.getByText("bob")).toBeInTheDocument();
    });

    it("shows 'No users found' when users array is empty", () => {
      renderComponent({ users: [], totalUsers: 0 });
      expect(screen.getByText("No users found")).toBeInTheDocument();
    });

    it("does not render pagination when no users", () => {
      renderComponent({ users: [], totalUsers: 0 });
      expect(screen.queryByText("Previous")).not.toBeInTheDocument();
    });
  });

  // ── Recent searches mode (search === "") ──────────────────────────────────
  describe("recent searches mode", () => {
    const emptySearchProps = {
      ...defaultProps,
      filters: { ...defaultProps.filters, search: "" },
    };

    it("shows 'Recent Searches' heading when search is empty", () => {
      renderComponent(emptySearchProps);
      expect(screen.getByText("Recent Searches")).toBeInTheDocument();
    });

    it("shows 'No recent searches' when recent list is empty", () => {
      renderComponent(emptySearchProps);
      expect(screen.getByText("No recent searches")).toBeInTheDocument();
    });

    it("renders recent users from getRecentUsers", () => {
      (recentUsersLib.getRecentUsers as jest.Mock).mockReturnValue([
        { id: "3", username: "charlie" },
      ]);
      renderComponent(emptySearchProps);
      expect(screen.getByText("charlie")).toBeInTheDocument();
    });

    it("shows 'Clear All' button when recent users exist", () => {
      (recentUsersLib.getRecentUsers as jest.Mock).mockReturnValue([
        { id: "3", username: "charlie" },
      ]);
      renderComponent(emptySearchProps);
      expect(screen.getByText("Clear All")).toBeInTheDocument();
    });

    it("does not show 'Clear All' when recent list is empty", () => {
      renderComponent(emptySearchProps);
      expect(screen.queryByText("Clear All")).not.toBeInTheDocument();
    });

    it("calls clearRecentUsers when 'Clear All' is clicked", () => {
      (recentUsersLib.getRecentUsers as jest.Mock).mockReturnValue([
        { id: "3", username: "charlie" },
      ]);
      renderComponent(emptySearchProps);
      fireEvent.click(screen.getByText("Clear All"));
      expect(recentUsersLib.clearRecentUsers).toHaveBeenCalledTimes(1);
    });

    it("renders remove button for each recent user", () => {
      (recentUsersLib.getRecentUsers as jest.Mock).mockReturnValue([
        { id: "3", username: "charlie" },
        { id: "4", username: "diana" },
      ]);
      renderComponent(emptySearchProps);
      expect(screen.getAllByTestId("icon-x")).toHaveLength(2);
    });

    it("calls removeRecentUser when remove button is clicked", () => {
      (recentUsersLib.getRecentUsers as jest.Mock).mockReturnValue([
        { id: "3", username: "charlie" },
      ]);
      renderComponent(emptySearchProps);
      fireEvent.click(screen.getByTestId("icon-x"));
      expect(recentUsersLib.removeRecentUser).toHaveBeenCalledWith("charlie");
    });

    it("calls addRecentUser when a recent user card is clicked", () => {
      const user = { id: "3", username: "charlie" };
      (recentUsersLib.getRecentUsers as jest.Mock).mockReturnValue([user]);

      // Mock window.location.href setter
      delete (window as any).location;
      (window as any).location = { href: "" };

      renderComponent(emptySearchProps);
      fireEvent.click(screen.getByTestId("user-card"));
      expect(recentUsersLib.addRecentUser).toHaveBeenCalledWith(user);
    });
  });

  // ── Pagination ────────────────────────────────────────────────────────────
  describe("pagination", () => {
    it("renders pagination when search is active and users exist", () => {
      renderComponent();
      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
    });

    it("shows correct page range — '1-2 of 2'", () => {
      renderComponent();
      expect(screen.getByText("1-2 of 2")).toBeInTheDocument();
    });

    it("disables Previous on page 1", () => {
      renderComponent();
      expect(screen.getByText("Previous")).toBeDisabled();
    });

    it("disables Next on last page", () => {
      renderComponent({ totalUserPages: 1 });
      expect(screen.getByText("Next")).toBeDisabled();
    });

    it("calls setFilters with page - 1 when Previous is clicked", () => {
      const setFilters = jest.fn();
      renderComponent({
        filters:        { search: "a", page: 2, limit: 10 },
        totalUserPages: 3,
        setFilters,
      });
      fireEvent.click(screen.getByText("Previous"));
      expect(setFilters).toHaveBeenCalledTimes(1);
    });

    it("calls setFilters with page + 1 when Next is clicked", () => {
      const setFilters = jest.fn();
      renderComponent({
        filters:        { search: "a", page: 1, limit: 10 },
        totalUserPages: 3,
        setFilters,
      });
      fireEvent.click(screen.getByText("Next"));
      expect(setFilters).toHaveBeenCalledTimes(1);
    });

    it("hides pagination when search is empty", () => {
      renderComponent({
        filters: { search: "", page: 1, limit: 10 },
      });
      expect(screen.queryByText("Previous")).not.toBeInTheDocument();
    });
  });

  // ── UserPanel ─────────────────────────────────────────────────────────────
  describe("UserPanel", () => {
    it("does not render UserPanel when selectedUser is null", () => {
      renderComponent();
      expect(screen.queryByTestId("user-panel")).not.toBeInTheDocument();
    });

    it("renders UserPanel when selectedUser is set", () => {
      renderComponent({ selectedUser: { id: "1", username: "alice" } });
      expect(screen.getByTestId("user-panel")).toBeInTheDocument();
    });

    it("calls setSelectedUser(null) when panel is closed", () => {
      const setSelectedUser = jest.fn();
      renderComponent({
        selectedUser:    { id: "1", username: "alice" },
        setSelectedUser,
      });
      fireEvent.click(screen.getByText("ClosePanel"));
      expect(setSelectedUser).toHaveBeenCalledWith(null);
    });
  });
});