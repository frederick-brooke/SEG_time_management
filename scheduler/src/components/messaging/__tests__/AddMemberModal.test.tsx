/**
 * Testing for Add Member Modal
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AddMemberModal } from "../AddMemberModal";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

const mockFriends = [
  { id: "user-1", username: "alice", fname: "Alice Smith", pfp: "alice.png" },
  { id: "user-2", username: "bob", fname: null, pfp: null },
  { id: "user-3", username: "carol", fname: "Carol Jones", pfp: null },
];

const defaultProps = {
  conversationId: "conv-123",
  existingMemberIds: [],
  onClose: jest.fn(),
  onAdded: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

// Fetch helpers

function mockSearchSuccess(friends = mockFriends) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    json: async () => friends,
  } as any);
}

function mockSearchAndAddSuccess(friends = mockFriends) {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({ json: async () => friends } as any)   // GET search
    .mockResolvedValueOnce({ json: async () => ({}) } as any);     // POST add
}

// Rendering

describe("AddMemberModal – rendering", () => {
  it("renders the modal with heading and close button", async () => {
    mockSearchSuccess([]);
    render(<AddMemberModal {...defaultProps} />);

    expect(screen.getByText("Add Member")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("shows empty state when no friends are available", async () => {
    mockSearchSuccess([]);
    render(<AddMemberModal {...defaultProps} />);

    await waitFor(() =>
      expect(screen.getByText("No friends to add")).toBeInTheDocument()
    );
  });

  it("renders a friend row for each non-member friend", async () => {
    mockSearchSuccess(mockFriends);
    render(<AddMemberModal {...defaultProps} />);

    // use Alice's fname, bob falls back to username
    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("bob")).toBeInTheDocument();
      expect(screen.getByText("Carol Jones")).toBeInTheDocument();
    });
  });

  it("renders an <img> when the friend has a pfp", async () => {
    mockSearchSuccess([mockFriends[0]]); // alice has pfp
    render(<AddMemberModal {...defaultProps} />);

    await waitFor(() =>
      expect(screen.getByRole("img", { name: "alice" })).toHaveAttribute(
        "src",
        "alice.png"
      )
    );
  });

  it("renders an avatar initial when the friend has no pfp", async () => {
    mockSearchSuccess([mockFriends[1]]); // bob, no pfp
    render(<AddMemberModal {...defaultProps} />);

    await waitFor(() => expect(screen.getByText("B")).toBeInTheDocument());
  });

  it("renders an 'Add' label next to every friend row", async () => {
    mockSearchSuccess(mockFriends);
    render(<AddMemberModal {...defaultProps} />);

    await waitFor(() => {
      const addLabels = screen.getAllByText("Add");
      expect(addLabels).toHaveLength(mockFriends.length);
    });
  });
});

// Filtering

describe("AddMemberModal – existingMemberIds filtering", () => {
  it("excludes friends who are already members", async () => {
    mockSearchSuccess(mockFriends);
    render(
      <AddMemberModal {...defaultProps} existingMemberIds={["user-1", "user-3"]} />
    );

    await waitFor(() => {
      expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
      expect(screen.queryByText("Carol Jones")).not.toBeInTheDocument();
      expect(screen.getByText("bob")).toBeInTheDocument();
    });
  });

  it("shows empty state when all friends are already members", async () => {
    mockSearchSuccess(mockFriends);
    render(
      <AddMemberModal
        {...defaultProps}
        existingMemberIds={mockFriends.map((f) => f.id)}
      />
    );

    await waitFor(() =>
      expect(screen.getByText("No friends to add")).toBeInTheDocument()
    );
  });
});

// Data fetching

describe("AddMemberModal – data fetching", () => {
  it("fetches from /api/user/search?q= on mount", async () => {
    mockSearchSuccess();
    render(<AddMemberModal {...defaultProps} />);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/user/search?q=")
    );
  });

  it("re-fetches when existingMemberIds changes", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => mockFriends } as any);

    const { rerender } = render(<AddMemberModal {...defaultProps} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    rerender(
      <AddMemberModal {...defaultProps} existingMemberIds={["user-1"]} />
    );
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });
});

// Adding a member

describe("AddMemberModal – handleAdd", () => {
  it("POSTs to the correct endpoint with the userId", async () => {
    mockSearchAndAddSuccess();
    render(<AddMemberModal {...defaultProps} />);

    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.click(screen.getAllByRole("button", { name: /alice smith/i })[0]);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/conversations/${defaultProps.conversationId}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: "user-1" }),
        }
      )
    );
  });

  it("calls onAdded and onClose after a successful add", async () => {
    mockSearchAndAddSuccess();
    render(<AddMemberModal {...defaultProps} />);

    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.click(screen.getAllByRole("button")[0]); // first friend row

    await waitFor(() => {
      expect(defaultProps.onAdded).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("disables all friend buttons while loading", async () => {
    // keep the POST pending so loading stays true
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ json: async () => [mockFriends[0]] } as any)
      .mockReturnValueOnce(new Promise(() => {})); // never resolves

    render(<AddMemberModal {...defaultProps} />);

    await waitFor(() => screen.getByText("Alice Smith"));
    const addButton = screen.getAllByRole("button")[0];
    fireEvent.click(addButton);

    await waitFor(() => expect(addButton).toBeDisabled());
  });
});

// onClose

describe("AddMemberModal – onClose", () => {
  it("calls onClose when the Close button is clicked", async () => {
    mockSearchSuccess([]);
    render(<AddMemberModal {...defaultProps} />);

    await waitFor(() => screen.getByRole("button", { name: /close/i }));
    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});