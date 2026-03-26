import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PendingRequests from "../PendingRequests";
import { acceptFriendRequest, declineFriendRequest } from "@/app/actions/profile/friends";

jest.mock("@/app/actions/profile/friends", () => ({
  acceptFriendRequest: jest.fn(),
  declineFriendRequest: jest.fn(),
}));

jest.mock("@/lib/avatar", () => ({
  resolveAvatarSrc: jest.fn((src) => `/resolved/${src}`),
}));

describe("PendingRequests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null if requests array is empty", () => {
    const { container } = render(<PendingRequests requests={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("returns null if requests array is undefined", () => {
    const { container } = render(<PendingRequests requests={undefined as any} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders with full sender details and accepts request", async () => {
    const requests = [
      {
        id: "req1",
        sender: {
          id: "sender1",
          username: "testuser",
          fname: "Test",
          lname: "User",
          pfp: "pic.jpg",
        },
      },
    ];

    render(<PendingRequests requests={requests} />);

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("@testuser")).toBeInTheDocument();
    expect(screen.getByAltText("testuser")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Accept"));

    await waitFor(() => {
      expect(acceptFriendRequest).toHaveBeenCalledWith("sender1");
    });
  });

  it("renders without pfp and without fname and rejects request", async () => {
    const requests = [
      {
        id: "req2",
        sender: {
          id: "sender2",
          username: "nouser",
          pfp: null,
        },
      },
    ];

    render(<PendingRequests requests={requests} />);

    expect(screen.getByText("nouser")).toBeInTheDocument();
    expect(screen.getByText("n")).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(declineFriendRequest).toHaveBeenCalledWith("sender2");
    });
  });
});