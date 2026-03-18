import { render, screen, fireEvent } from "@testing-library/react";
import SearchUsers from "../searchUsers";

import {
  addRecentUser,
  getRecentUsers,
  removeRecentUser,
  clearRecentUsers,
} from "@/lib/recent-users";

jest.mock("@/components/admin/admin-user-panel", () => () => (
  <div data-testid="user-panel" />
));

jest.mock("./user-cards", () => ({ user, onClick }: any) => (
  <button data-testid="user-card" onClick={onClick}>
    {user.username}
  </button>
));

jest.mock("@/lib/recent-users", () => ({
  addRecentUser: jest.fn(),
  getRecentUsers: jest.fn(),
  removeRecentUser: jest.fn(),
  clearRecentUsers: jest.fn(),
}));

describe("SearchUsers", () => {
  const baseProps = {
    users: [],
    totalUsers: 0,
    totalUserPages: 1,
    setIsUserFilterOpen: jest.fn(),
    selectedUser: null,
    setSelectedUser: jest.fn(),
    filters: { search: "", page: 1, limit: 10 },
    setFilters: jest.fn(),
    resetFilters: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  test("shows recent users when search is empty", () => {
    (getRecentUsers as jest.Mock).mockReturnValue([
      { username: "alice" },
      { username: "bob" },
    ]);

    render(<SearchUsers {...baseProps} />);

    expect(screen.getByText("Recent")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
  });

  test("shows empty recent message", () => {
    (getRecentUsers as jest.Mock).mockReturnValue([]);

    render(<SearchUsers {...baseProps} />);

    expect(screen.getByText("No recent searches")).toBeInTheDocument();
  });

  test("clear all recent users", () => {
    (getRecentUsers as jest.Mock).mockReturnValue([{ username: "alice" }]);

    render(<SearchUsers {...baseProps} />);

    fireEvent.click(screen.getByText("Clear All"));

    expect(clearRecentUsers).toHaveBeenCalled();
  });

  test("remove single recent user", () => {
    (getRecentUsers as jest.Mock)
      .mockReturnValueOnce([{ username: "alice" }])
      .mockReturnValueOnce([]);

    render(<SearchUsers {...baseProps} />);

    fireEvent.click(screen.getByText("✕"));

    expect(removeRecentUser).toHaveBeenCalledWith("alice");
  });

  test("navigate to profile when user clicked", () => {
    const props = {
      ...baseProps,
      filters: { search: "test", page: 1, limit: 10 },
      users: [{ id: 1, username: "alice" }],
      totalUsers: 1,
    };

    render(<SearchUsers {...props} />);

    fireEvent.click(screen.getByText("alice"));

    expect(addRecentUser).toHaveBeenCalled();
    expect(window.location.href).toBe("/profile/alice");
  });

  test("shows no users found message when searching with no results", () => {
    const props = {
      ...baseProps,
      filters: { search: "query", page: 1, limit: 10 },
      users: [],
    };

    render(<SearchUsers {...props} />);

    expect(screen.getByText("No users found")).toBeInTheDocument();
  });

  test("shows pagination and navigates pages", () => {
    const setFilters = jest.fn();

    const props = {
      ...baseProps,
      filters: { search: "a", page: 2, limit: 10 },
      setFilters,
      users: [{ id: 1, username: "alice" }],
      totalUsers: 25,
      totalUserPages: 3,
    };

    render(<SearchUsers {...props} />);

    fireEvent.click(screen.getByText("Previous"));

    expect(setFilters).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Next"));

    expect(setFilters).toHaveBeenCalled();
  });

  test("renders user panel", () => {
    render(<SearchUsers {...baseProps} />);

    expect(screen.getByTestId("user-panel")).toBeInTheDocument();
  });
});
