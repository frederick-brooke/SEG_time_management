import { render, screen, fireEvent } from "@testing-library/react";
import UserPanel from "../AdminUserPanel";
const baseUser = {
  username: "johndoe",
  email: "john@example.com",
  fname: "John",
  lname: "Doe",
  isBanned: false,
  pfp: null,
  createdAt: "2023-01-01T00:00:00.000Z",
  _count: {
    reportsMade: 2,
    reportsReceived: 1,
    appeals: 3,
  },
};

describe("UserPanel", () => {
  test("returns null when no user is provided", () => {
    const { container } = render(<UserPanel user={null} onClose={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  test("renders user info correctly", () => {
    render(<UserPanel user={baseUser} onClose={jest.fn()} />);

    expect(screen.getByText("User Details")).toBeInTheDocument();
    expect(screen.getByText("johndoe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  test("renders banned status correctly", () => {
    const bannedUser = { ...baseUser, isBanned: true };

    render(<UserPanel user={bannedUser} onClose={jest.fn()} />);

    expect(screen.getByText("Banned")).toBeInTheDocument();
  });

  test("renders initials fallback when no profile picture", () => {
    render(<UserPanel user={baseUser} onClose={jest.fn()} />);

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  test("renders profile image when pfp exists", () => {
    const userWithPfp = { ...baseUser, pfp: "https://example.com/pfp.jpg" };

    render(<UserPanel user={userWithPfp} onClose={jest.fn()} />);

    const img = screen.getByAltText("Profile");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/pfp.jpg");
  });

  test("renders activity stats correctly", () => {
    render(<UserPanel user={baseUser} onClose={jest.fn()} />);

    expect(screen.getByText("Reports Made")).toBeInTheDocument();
    expect(screen.getByText("Reports Received")).toBeInTheDocument();
    expect(screen.getByText("Appeals")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("handles missing _count values (defaults to 0)", () => {
    const userNoCounts = { ...baseUser, _count: undefined };

    render(<UserPanel user={userNoCounts} onClose={jest.fn()} />);

    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(3);
  });

  test("calls onClose when clicking overlay", () => {
    const onClose = jest.fn();

    render(<UserPanel user={baseUser} onClose={onClose} />);

    const overlay = screen.getByText("User Details").closest("div")?.parentElement?.parentElement;
    if (!overlay) throw new Error("Overlay not found");

    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  test("does NOT call onClose when clicking inside panel", () => {
    const onClose = jest.fn();

    render(<UserPanel user={baseUser} onClose={onClose} />);

    fireEvent.click(screen.getByText("User Details"));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("calls onClose when clicking close button", () => {
    const onClose = jest.fn();

    render(<UserPanel user={baseUser} onClose={onClose} />);

    fireEvent.click(screen.getByText("✕"));
    expect(onClose).toHaveBeenCalled();
  });

  test("calls onClose when clicking footer close button", () => {
    const onClose = jest.fn();

    render(<UserPanel user={baseUser} onClose={onClose} />);

    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});