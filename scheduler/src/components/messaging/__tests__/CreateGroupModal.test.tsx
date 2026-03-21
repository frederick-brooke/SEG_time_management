import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { CreateGroupModal } from "../CreateGroupModal";

// Module mocks

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Shared test data

const FRIENDS = [
  { id: "u-1", username: "alice", fname: "Alice",  pfp: "alice.png" },
  { id: "u-2", username: "bob",   fname: null,      pfp: null        },
  { id: "u-3", username: "carol", fname: "  Carol", pfp: null        },
];

const defaultProps = {
  friends: FRIENDS,
  onClose: jest.fn(),
  onCreated: jest.fn(),
};

const FRESH_CONV = {
  id: "conv-new",
  name: "Squad",
  isGroup: true,
  createdAt: new Date(Date.now() - 1000).toISOString(), // 1s old group is new
};

const STALE_CONV = {
  id: "conv-old",
  name: "Squad",
  isGroup: true,
  createdAt: new Date(Date.now() - 10_000).toISOString(), // 10s old group is a duplicate
};

// Helpers

function setup(props = defaultProps) {
  return render(<CreateGroupModal {...props} />);
}

/** Type a group name and select friends by username label */
async function fillForm(name: string, friendLabels: string[]) {
  fireEvent.change(screen.getByPlaceholderText(/group name/i), {
    target: { value: name },
  });
  for (const label of friendLabels) {
    fireEvent.click(screen.getByText(label).closest("label")!);
  }
}

beforeEach(() => jest.clearAllMocks());

// Rendering

describe("CreateGroupModal – rendering", () => {
  it("renders the heading, name input, and action buttons", () => {
    setup();
    expect(screen.getByText("New Group Chat")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/group name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create group/i })).toBeInTheDocument();
  });

  it("renders a row for each friend", () => {
    setup();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();
  });

  it("renders an <img> for friends with a pfp", () => {
    setup();
    expect(screen.getByRole("img", { name: "alice" })).toHaveAttribute("src", "alice.png");
  });

  it("renders an initial avatar for friends without a pfp", () => {
    setup();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("Create Group button is disabled when name is empty", () => {
    setup();
    expect(screen.getByRole("button", { name: /create group/i })).toBeDisabled();
  });

  it("Create Group button is disabled when no friends are selected", () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText(/group name/i), {
      target: { value: "My Group" },
    });
    expect(screen.getByRole("button", { name: /create group/i })).toBeDisabled();
  });

  it("Create Group button is enabled when name and at least one friend are provided", async () => {
    setup();
    await fillForm("My Group", ["Alice"]);
    expect(screen.getByRole("button", { name: /create group/i })).toBeEnabled();
  });

  it("does not show the duplicate warning initially", () => {
    setup();
    expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument();
  });
});

// Checkbox toggling

describe("CreateGroupModal – friend selection", () => {
  it("checks a friend when their row is clicked", () => {
    setup();
    const checkbox = screen.getByRole("checkbox", { name: /alice/i });
    expect(checkbox).not.toBeChecked();
    fireEvent.click(screen.getByText("Alice").closest("label")!);
    expect(checkbox).toBeChecked();
  });

  it("unchecks a friend when their row is clicked again", () => {
    setup();
    const label = screen.getByText("Alice").closest("label")!;
    fireEvent.click(label);
    fireEvent.click(label);
    expect(screen.getByRole("checkbox", { name: /alice/i })).not.toBeChecked();
  });

  it("allows multiple friends to be selected", () => {
    setup();
    fireEvent.click(screen.getByText("Alice").closest("label")!);
    fireEvent.click(screen.getByText("bob").closest("label")!);
    expect(screen.getByRole("checkbox", { name: /alice/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /bob/i })).toBeChecked();
  });
});

// handleCreate – success

describe("CreateGroupModal – handleCreate (success)", () => {
  it("POSTs to /api/conversations with correct payload", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => FRESH_CONV,
    });
    setup();
    await fillForm("Squad", ["Alice", "bob"]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create group/i }));
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Squad", memberIds: ["u-1", "u-2"], isGroup: true }),
    });
  });

  it("calls onCreated and onClose after a successful creation", async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => FRESH_CONV });
    setup();
    await fillForm("Squad", ["Alice"]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create group/i }));
    });

    await waitFor(() => {
      expect(defaultProps.onCreated).toHaveBeenCalledWith(FRESH_CONV);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("shows 'Creating...' while the request is in flight", async () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})); // never resolves
    setup();
    await fillForm("Squad", ["Alice"]);
    fireEvent.click(screen.getByRole("button", { name: /create group/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /creating/i })).toBeDisabled()
    );
  });

  it("does nothing if name is whitespace only", async () => {
    global.fetch = jest.fn();
    setup();
    fireEvent.change(screen.getByPlaceholderText(/group name/i), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByText("Alice").closest("label")!);
    fireEvent.click(screen.getByRole("button", { name: /create group/i }));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// handleCreate – duplicate detection

describe("CreateGroupModal – duplicate detection", () => {
  it("shows the duplicate warning when the API returns a stale conversation", async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => STALE_CONV });
    setup();
    await fillForm("Squad", ["Alice"]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create group/i }));
    });

    await waitFor(() =>
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    );
  });

  it("does not call onCreated when a duplicate is detected", async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => STALE_CONV });
    setup();
    await fillForm("Squad", ["Alice"]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create group/i }));
    });

    await waitFor(() => screen.getByText(/already exists/i));
    expect(defaultProps.onCreated).not.toHaveBeenCalled();
  });

  it("clears the duplicate warning when the name input changes", async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => STALE_CONV });
    setup();
    await fillForm("Squad", ["Alice"]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create group/i }));
    });

    await waitFor(() => screen.getByText(/already exists/i));
    fireEvent.change(screen.getByPlaceholderText(/group name/i), {
      target: { value: "New Name" },
    });
    expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument();
  });

  it("clears the duplicate warning when selection changes", async () => {
    global.fetch = jest.fn().mockResolvedValue({ json: async () => STALE_CONV });
    setup();
    await fillForm("Squad", ["Alice"]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create group/i }));
    });

    await waitFor(() => screen.getByText(/already exists/i));
    fireEvent.click(screen.getByText("bob").closest("label")!);
    expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument();
  });

  it("'Open' button calls onCreated and onClose with the existing conversation", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ json: async () => STALE_CONV }) // handleCreate
      .mockResolvedValueOnce({ json: async () => STALE_CONV }); // Open button refetch

    setup();
    await fillForm("Squad", ["Alice"]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /create group/i }));
    });

    await waitFor(() => screen.getByRole("button", { name: /open/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /open/i }));
    });

    await waitFor(() => {
      expect(defaultProps.onCreated).toHaveBeenCalledWith(STALE_CONV);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});

// onClose

describe("CreateGroupModal – onClose", () => {
  it("calls onClose when Cancel is clicked", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});

// Empty friends list

describe("CreateGroupModal – empty friends list", () => {
  it("renders no friend rows when friends is empty", () => {
    setup({ ...defaultProps, friends: [] });
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("Create Group button stays disabled with an empty friends list", () => {
    setup({ ...defaultProps, friends: [] });
    fireEvent.change(screen.getByPlaceholderText(/group name/i), {
      target: { value: "My Group" },
    });
    expect(screen.getByRole("button", { name: /create group/i })).toBeDisabled();
  });
});