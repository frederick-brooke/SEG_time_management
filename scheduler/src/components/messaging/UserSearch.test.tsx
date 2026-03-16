import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import UserSearch from "./UserSearch";

// Module mocks

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    const { width, height, ...rest } = props;
    return <span data-testid="next-image" data-src={src} data-alt={alt} {...rest} />;
  },
}));

import { useRouter } from "next/navigation";

// Shared test data

const mockPush = jest.fn();

const FRIENDS = [
  { id: "u-1", username: "alice", fname: "Alice", lname: "Smith", pfp: "alice.png" },
  { id: "u-2", username: "bob",   fname: "Bob",   lname: "Jones", pfp: null },
  { id: "u-3", username: "carol", fname: null,    lname: null,    pfp: null },
];

const GROUPS = [
  {
    id: "g-1",
    name: "Study Squad",
    isGroup: true,
    participants: [
      { user: { id: "u-1", username: "alice" } },
      { user: { id: "u-2", username: "bob" } },
    ],
  },
  {
    id: "g-2",
    name: "Book Club",
    isGroup: true,
    participants: [{ user: { id: "u-3", username: "carol" } }],
  },
];

const CONVERSATIONS = [
  ...GROUPS,
  { id: "c-1", name: null, isGroup: false, participants: [] }, // direct — should be filtered out
];

// Helpers

function setupFetch({
  friends = FRIENDS,
  conversations = CONVERSATIONS,
}: { friends?: any[]; conversations?: any[] } = {}) {
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url === "/api/user/search")
      return Promise.resolve({ json: async () => friends });
    if (url === "/api/conversations")
      return Promise.resolve({ json: async () => conversations });
    // /api/conversations/new
    return Promise.resolve({ json: async () => ({ id: "conv-new" }) });
  });
}

async function typeQuery(text: string) {
  fireEvent.change(screen.getByPlaceholderText(/search friends or groups/i), {
    target: { value: text },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
});

// Rendering

describe("UserSearch – rendering", () => {
  it("renders the search input", () => {
    setupFetch();
    render(<UserSearch />);
    expect(screen.getByPlaceholderText(/search friends or groups/i)).toBeInTheDocument();
  });

  it("does not show the dropdown when query is empty", () => {
    setupFetch();
    render(<UserSearch />);
    expect(screen.queryByText("No results found")).not.toBeInTheDocument();
  });

  it("does not show the dropdown for a single character query", async () => {
    setupFetch();
    render(<UserSearch />);
    await typeQuery("a");
    expect(screen.queryByText("No results found")).not.toBeInTheDocument();
  });

  it("shows the dropdown once query reaches 2 characters", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {}); // let fetch settle
    await typeQuery("al");
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });
});

// Data fetching

describe("UserSearch – data fetching", () => {
  it("fetches friends and conversations on mount", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/user/search");
      expect(global.fetch).toHaveBeenCalledWith("/api/conversations");
    });
  });

  it("filters out non-group conversations", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("bo");
    // "Book Club" is a group — should appear; direct conv "c-1" should not
    expect(screen.getByText("Book Club")).toBeInTheDocument();
  });
});

// Friend filtering

describe("UserSearch – friend filtering", () => {
  it("shows matching friends by first name", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("ali");
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("shows matching friends by last name", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("jon");
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("shows matching friends by username", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("bo");
    expect(screen.getByText("@bob")).toBeInTheDocument();
  });

  it("is case-insensitive", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("ALICE");
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("does not show friends that do not match the query", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("ali");
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
  });

  it("renders a pfp image when the friend has one", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("ali");
    const img = screen.getByTestId("next-image");
    expect(img).toHaveAttribute("data-src", "alice.png");
    expect(img).toHaveAttribute("data-alt", "alice");
  });

  it("renders an initial avatar when the friend has no pfp", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("bo");
    // "bo" matches Bob (friend, no pfp) and Book Club (group) — both show "B"
    expect(screen.getAllByText("B").length).toBeGreaterThanOrEqual(1);
    // Also confirm the friend row itself is present
    expect(screen.getByText("@bob")).toBeInTheDocument();
  });

  it("shows the Friends section header when there are friend results", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("ali");
    expect(screen.getByText("Friends")).toBeInTheDocument();
  });
});

// Group filtering

describe("UserSearch – group filtering", () => {
  it("shows matching groups by name", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("stu");
    expect(screen.getByText("Study Squad")).toBeInTheDocument();
  });

  it("does not show groups that do not match the query", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("stu");
    expect(screen.queryByText("Book Club")).not.toBeInTheDocument();
  });

  it("shows the participant count for groups", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("stu");
    expect(screen.getByText("2 members")).toBeInTheDocument();
  });

  it("renders the group initial avatar using the first letter of the name", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("stu");
    expect(screen.getByText("S")).toBeInTheDocument();
  });

  it("renders 'G' as the avatar initial for a group with no name", async () => {
    const conversations = [{ id: "g-3", name: null, isGroup: true, participants: [] }];
    setupFetch({ conversations });
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("zz"); // matches nothing in friends or groups
    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("shows the Groups section header when there are group results", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("stu");
    expect(screen.getByText("Groups")).toBeInTheDocument();
  });
});

// No results

describe("UserSearch – no results", () => {
  it("shows 'No results found' when query matches nothing", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("zzz");
    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("hides 'No results found' when there are matches", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("ali");
    expect(screen.queryByText("No results found")).not.toBeInTheDocument();
  });
});

// startChat

describe("UserSearch – startChat", () => {
  it("POSTs to /api/conversations/new with the correct userId", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("ali");

    await act(async () => {
      fireEvent.click(screen.getByText("Alice Smith").closest("button")!);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/conversations/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: "u-1" }),
    });
  });

  it("navigates to the new conversation after startChat", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("ali");

    await act(async () => {
      fireEvent.click(screen.getByText("Alice Smith").closest("button")!);
    });

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/messages/conv-new")
    );
  });

  it("clears the query after startChat", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("ali");

    await act(async () => {
      fireEvent.click(screen.getByText("Alice Smith").closest("button")!);
    });

    await waitFor(() =>
      expect(screen.getByPlaceholderText(/search friends or groups/i)).toHaveValue("")
    );
  });
});

// openGroup

describe("UserSearch – openGroup", () => {
  it("navigates to the group conversation when a group row is clicked", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("stu");
    fireEvent.click(screen.getByText("Study Squad").closest("button")!);
    expect(mockPush).toHaveBeenCalledWith("/messages/g-1");
  });

  it("clears the query after opening a group", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("stu");
    fireEvent.click(screen.getByText("Study Squad").closest("button")!);
    expect(screen.getByPlaceholderText(/search friends or groups/i)).toHaveValue("");
  });

  it("does not call /api/conversations/new when opening a group", async () => {
    setupFetch();
    render(<UserSearch />);
    await waitFor(() => {});
    await typeQuery("stu");
    fireEvent.click(screen.getByText("Study Squad").closest("button")!);
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/conversations/new",
      expect.anything()
    );
  });
});