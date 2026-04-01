import { render, screen, fireEvent } from "@testing-library/react";
import UserManagement from "../UserManagement";
import { Button } from "@/components/ui/Button";

// Mock AdminListSection so we can inspect what gets passed to it
jest.mock("../AdminListSection", () => (props: any) => {
  return (
    <div>
      <Button onClick={props.onFilterOpen}>open-filter</Button>

      <ul>
        {props.items.map((item: any) =>
          props.renderItem(item)
        )}
      </ul>

      <div data-testid="panel">
        {props.renderPanel()}
      </div>
    </div>
  );
});

// Mock UserPanel
jest.mock("@/components/admin/AdminUserPanel", () => (props: any) => {
  return (
    <div>
      <span>USER PANEL {props.user?.username}</span>
      <Button onClick={props.onClose}>close-panel</Button>
    </div>
  );
});

describe("UserManagement", () => {
  const users = [
    { id: 1, username: "alice", isBanned: false },
    { id: 2, username: "bob", isBanned: true },
  ];

  const setIsUserFilterOpen = jest.fn();
  const setSelectedUser = jest.fn();
  const setFilters = jest.fn();
  const resetFilters = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (selectedUser: any = null) =>
    render(
      <UserManagement
        users={users}
        totalUsers={2}
        totalUserPages={1}
        setIsUserFilterOpen={setIsUserFilterOpen}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        filters={{}}
        setFilters={setFilters}
        resetFilters={resetFilters}
      />
    );

  test("renders users and clicking one selects it", () => {
    renderComponent();

    fireEvent.click(screen.getByText("alice"));
    expect(setSelectedUser).toHaveBeenCalledWith(users[0]);

    fireEvent.click(screen.getByText("bob"));
    expect(setSelectedUser).toHaveBeenCalledWith(users[1]);
  });

  test("filter button opens filter modal", () => {
    renderComponent();

    fireEvent.click(screen.getByText("open-filter"));
    expect(setIsUserFilterOpen).toHaveBeenCalledWith(true);
  });

  test("panel renders selected user and can close", () => {
    renderComponent(users[0]);

    expect(screen.getByText("USER PANEL alice")).toBeInTheDocument();

    fireEvent.click(screen.getByText("close-panel"));
    expect(setSelectedUser).toHaveBeenCalledWith(null);
  });
});