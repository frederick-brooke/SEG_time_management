//tests for scheduler/src/components/messaging/__tests__/ConversationList.test.tsx
import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import ConversationList from "../ConversationList";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// Module mocks

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

jest.mock("@/components/messaging/CreateGroupModal", () => ({
  CreateGroupModal: ({ onClose, onCreated }: any) => (
    <div data-testid="create-group-modal">
      <button onClick={onClose}>Close Modal</button>
      <button
        onClick={() =>
          onCreated({
            id: "new-conv",
            isGroup: true,
            name: "New Group",
            participants: [],
            lastMessage: null,
            lastMessageAt: null,
            lastMessageSentByMe: false,
            hasUnread: false,
          })
        }
      >
        Create
      </button>
    </div>
  ),
}));

// Pusher mock

const pusherHandlers: Record<string, Function> = {};

var pusherMocks = {
  bind: jest.fn(),
  unbindAll: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

jest.mock("pusher-js", () => {
  return jest.fn().mockImplementation(() => ({
    subscribe: (channel: string) => {
      pusherMocks.subscribe(channel);
      return {
        bind: (event: string, handler: Function) => {
          pusherMocks.bind(event, handler);
          pusherHandlers[event] = handler;
        },
        unbind_all: () => pusherMocks.unbindAll(),
      };
    },
    unsubscribe: (channel: string) => pusherMocks.unsubscribe(channel),
  }));
});

// Shared test data

const SESSION = { user: { id: "me-123", name: "Me" } };

const DIRECT_CONV = {
  id: "conv-1",
  lastMessage: "Hey!",
  lastMessageAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  lastMessageSentByMe: false,
  hasUnread: true,
  isGroup: false,
  name: null,
  participants: [
    { user: { id: "me-123",   username: "me",    fname: "Me",    lname: null,    pfp: null       } },
    { user: { id: "friend-1", username: "alice", fname: "Alice", lname: "Smith", pfp: "alice.png"} },
  ],
};

const GROUP_CONV = {
  id: "conv-2",
  lastMessage: "Hello group",
  lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  lastMessageSentByMe: true,
  hasUnread: false,
  isGroup: true,
  name: "Team Chat",
  participants: [
    { user: { id: "me-123",   username: "me",  fname: "Me",  lname: null,    pfp: null } },
    { user: { id: "friend-2", username: "bob", fname: "Bob", lname: "Jones", pfp: null } },
  ],
};

const FRIENDS = [
  { id: "friend-1", username: "alice", fname: "Alice", pfp: "alice.png" },
];

// Helpers

const mockPush = jest.fn();

function setupMocks({
  conversations = [DIRECT_CONV, GROUP_CONV],
  friends = FRIENDS,
  activeId = "",
  session = SESSION,
}: {
  conversations?: any[];
  friends?: any[];
  activeId?: string;
  session?: any;
} = {}) {
  (useSession as jest.Mock).mockReturnValue({ data: session });
  (useParams as jest.Mock).mockReturnValue({ conversationId: activeId });
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url === "/api/conversations")
      return Promise.resolve({ json: async () => conversations });
    if (url === "/api/user/search?q=")
      return Promise.resolve({ json: async () => friends });
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(pusherHandlers).forEach((k) => delete pusherHandlers[k]);
});

// formatLastMessageTime

describe("formatLastMessageTime", () => {
  it("shows 'now' for a message sent less than 1 minute ago", async () => {
    const conv = { ...DIRECT_CONV, lastMessageAt: new Date(Date.now() - 30_000).toISOString() };
    setupMocks({ conversations: [conv] });
    render(<ConversationList />);
    await waitFor(() => expect(screen.getByText("now")).toBeInTheDocument());
  });

  it("shows minutes (e.g. '5m') for recent messages", async () => {
    const conv = { ...DIRECT_CONV, lastMessageAt: new Date(Date.now() - 5 * 60_000).toISOString() };
    setupMocks({ conversations: [conv] });
    render(<ConversationList />);
    await waitFor(() => expect(screen.getByText("5m")).toBeInTheDocument());
  });

  it("shows hours (e.g. '2h') for messages sent hours ago", async () => {
    setupMocks({ conversations: [GROUP_CONV] });
    render(<ConversationList />);
    await waitFor(() => expect(screen.getByText("2h")).toBeInTheDocument());
  });

  it("shows days (e.g. '3d') for messages sent days ago", async () => {
    const conv = { ...DIRECT_CONV, lastMessageAt: new Date(Date.now() - 3 * 86_400_000).toISOString() };
    setupMocks({ conversations: [conv] });
    render(<ConversationList />);
    await waitFor(() => expect(screen.getByText("3d")).toBeInTheDocument());
  });

  it("shows weeks (e.g. '2w') for messages sent weeks ago", async () => {
    const conv = { ...DIRECT_CONV, lastMessageAt: new Date(Date.now() - 14 * 86_400_000).toISOString() };
    setupMocks({ conversations: [conv] });
    render(<ConversationList />);
    await waitFor(() => expect(screen.getByText("2w")).toBeInTheDocument());
  });
});

// Rendering

describe("ConversationList – rendering", () => {
  it("renders the Messages heading and + Group button", async () => {
    setupMocks({ conversations: [] });
    render(<ConversationList />);
    expect(screen.getByText("Messages")).toBeInTheDocument();
    expect(screen.getByTitle("New group chat")).toBeInTheDocument();
  });

  it("renders a direct conversation with the other user's name", async () => {
    setupMocks({ conversations: [DIRECT_CONV] });
    render(<ConversationList />);
    await waitFor(() => expect(screen.getByText("Alice Smith")).toBeInTheDocument());
  });

  it("falls back to username when fname/lname are null", async () => {
    const conv = {
      ...DIRECT_CONV,
      participants: [
        { user: { id: "me-123",   username: "me",    fname: null, lname: null, pfp: null } },
        { user: { id: "friend-1", username: "alice", fname: null, lname: null, pfp: null } },
      ],
    };
    setupMocks({ conversations: [conv] });
    render(<ConversationList />);
    await waitFor(() => expect(screen.getByText("alice")).toBeInTheDocument());
  });

  it("renders a group conversation with its name and 'Group' badge", async () => {
    setupMocks({ conversations: [GROUP_CONV] });
    render(<ConversationList />);
    await waitFor(() => {
      expect(screen.getByText("Team Chat")).toBeInTheDocument();
      // getAllByText since "+ Group" button also contains "Group"
      expect(screen.getAllByText("Group").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("renders an <img> for a direct conversation when the user has a pfp", async () => {
    setupMocks({ conversations: [DIRECT_CONV] });
    render(<ConversationList />);
    await waitFor(() =>
      expect(screen.getByRole("img", { name: "Alice Smith" })).toHaveAttribute("src", "alice.png")
    );
  });

  it("renders an initial avatar for a direct conversation without pfp", async () => {
    const conv = {
      ...DIRECT_CONV,
      participants: [
        { user: { id: "me-123",   username: "me",    fname: null, lname: null, pfp: null } },
        { user: { id: "friend-1", username: "alice", fname: null, lname: null, pfp: null } },
      ],
    };
    setupMocks({ conversations: [conv] });
    render(<ConversationList />);
    await waitFor(() => expect(screen.getByText("A")).toBeInTheDocument());
  });

  it("renders 'G' initial avatar for a group with no pfp", async () => {
    const conv = { ...GROUP_CONV, name: "Gang" };
    setupMocks({ conversations: [conv] });
    render(<ConversationList />);
    await waitFor(() => expect(screen.getByText("G")).toBeInTheDocument());
  });

  it("shows the last message preview text", async () => {
    setupMocks({ conversations: [DIRECT_CONV] });
    render(<ConversationList />);
    await waitFor(() => expect(screen.getByText("Hey!")).toBeInTheDocument());
  });

  it("shows 'Start a conversation' when lastMessage is null", async () => {
    const conv = { ...DIRECT_CONV, lastMessage: null, lastMessageAt: null };
    setupMocks({ conversations: [conv] });
    render(<ConversationList />);
    await waitFor(() => expect(screen.getByText("Start a conversation")).toBeInTheDocument());
  });

  it("renders DeliveryTick when lastMessageSentByMe is true", async () => {
    setupMocks({ conversations: [GROUP_CONV] });
    render(<ConversationList />);
    await waitFor(() => expect(screen.getByText("Hello group")).toBeInTheDocument());
    const svgs = document.querySelectorAll("svg[aria-hidden]");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("does not render DeliveryTick when lastMessageSentByMe is false", async () => {
    setupMocks({ conversations: [DIRECT_CONV] });
    render(<ConversationList />);
    await waitFor(() => screen.getByText("Hey!"));
    const svgs = document.querySelectorAll("svg[aria-hidden]");
    expect(svgs.length).toBe(0);
  });

  it("shows the unread dot when hasUnread is true", async () => {
    setupMocks({ conversations: [DIRECT_CONV] });
    render(<ConversationList />);
    await waitFor(() => {
      const dot = document.querySelector(".w-2\\.5.h-2\\.5.rounded-full");
      expect(dot).toBeInTheDocument();
    });
  });

  it("skips rendering a direct conversation with no other participant", async () => {
    const conv = {
      ...DIRECT_CONV,
      participants: [{ user: { id: "me-123", username: "me", fname: "Me", lname: null, pfp: null } }],
    };
    setupMocks({ conversations: [conv] });
    render(<ConversationList />);
    await waitFor(() => expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument());
  });
});

// Data fetching

describe("ConversationList – data fetching", () => {
  it("fetches conversations and friends on mount", async () => {
    setupMocks();
    render(<ConversationList />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/conversations");
      expect(global.fetch).toHaveBeenCalledWith("/api/user/search?q=");
    });
  });

  it("refetches conversations on window focus", async () => {
    setupMocks();
    render(<ConversationList />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    act(() => { window.dispatchEvent(new Event("focus")); });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
  });
});

// Navigation

describe("ConversationList – navigation", () => {
  it("navigates to the conversation when a row is clicked", async () => {
    setupMocks({ conversations: [DIRECT_CONV] });
    render(<ConversationList />);
    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.click(screen.getByText("Alice Smith").closest("button")!);
    expect(mockPush).toHaveBeenCalledWith("/messages/conv-1");
  });

  it("optimistically clears hasUnread when a row is clicked", async () => {
    setupMocks({ conversations: [DIRECT_CONV] });
    render(<ConversationList />);
    await waitFor(() => screen.getByText("Alice Smith"));
    expect(document.querySelector(".w-2\\.5.h-2\\.5.rounded-full")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Alice Smith").closest("button")!);

    await waitFor(() =>
      expect(document.querySelector(".w-2\\.5.h-2\\.5.rounded-full")).not.toBeInTheDocument()
    );
  });
});

// ConversationMenu (delete)

describe("ConversationMenu", () => {
  it("opens the dropdown on three-dot button click", async () => {
    setupMocks({ conversations: [DIRECT_CONV] });
    render(<ConversationList />);
    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.click(screen.getByTitle("More options"));
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("closes the dropdown when clicking outside", async () => {
    setupMocks({ conversations: [DIRECT_CONV] });
    render(<ConversationList />);
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getByTitle("More options"));
    expect(screen.getByText("Delete")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(screen.queryByText("Delete")).not.toBeInTheDocument());
  });

  it("sends DELETE request and removes conversation from list", async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    setupMocks({ conversations: [DIRECT_CONV] });
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ json: async () => [DIRECT_CONV] })
      .mockResolvedValueOnce({ json: async () => FRIENDS })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<ConversationList />);
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getByTitle("More options"));
    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/conversations/conv-1",
        { method: "DELETE" }
      );
      expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
    });
  });

  it("navigates to /messages when the active conversation is deleted", async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    setupMocks({ conversations: [DIRECT_CONV], activeId: "conv-1" });
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ json: async () => [DIRECT_CONV] })
      .mockResolvedValueOnce({ json: async () => FRIENDS })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<ConversationList />);
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getByTitle("More options"));
    await act(async () => { fireEvent.click(screen.getByText("Delete")); });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/messages"));
  });

  it("shows an alert and keeps the conversation if DELETE fails", async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    window.alert = jest.fn();
    setupMocks({ conversations: [DIRECT_CONV] });
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ json: async () => [DIRECT_CONV] })
      .mockResolvedValueOnce({ json: async () => FRIENDS })
      .mockResolvedValueOnce({ ok: false });

    render(<ConversationList />);
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getByTitle("More options"));
    await act(async () => { fireEvent.click(screen.getByText("Delete")); });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to delete conversation.");
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });
  });

  it("aborts delete when confirm is cancelled", async () => {
    window.confirm = jest.fn().mockReturnValue(false);
    setupMocks({ conversations: [DIRECT_CONV] });
    render(<ConversationList />);
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getByTitle("More options"));
    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() =>
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining("conv-1"),
        expect.objectContaining({ method: "DELETE" })
      )
    );
  });
});

// Pusher events

describe("ConversationList – Pusher", () => {
  it("subscribes to the user's Pusher channel on mount", async () => {
    setupMocks();
    render(<ConversationList />);
    await waitFor(() =>
      expect(pusherMocks.subscribe).toHaveBeenCalledWith(`user-${SESSION.user.id}`)
    );
  });

  it("unsubscribes on unmount", async () => {
    setupMocks();
    const { unmount } = render(<ConversationList />);
    await waitFor(() => expect(pusherMocks.subscribe).toHaveBeenCalled());
    unmount();
    expect(pusherMocks.unbindAll).toHaveBeenCalled();
    expect(pusherMocks.unsubscribe).toHaveBeenCalledWith(`user-${SESSION.user.id}`);
  });

  it("updates lastMessage and floats conversation to top on conversation-updated", async () => {
    setupMocks({ conversations: [GROUP_CONV, DIRECT_CONV] });
    render(<ConversationList />);
    await waitFor(() => screen.getByText("Team Chat"));

    act(() => {
      pusherHandlers["conversation-updated"]({
        id: "conv-1",
        lastMessage: "New message!",
        lastMessageAt: new Date().toISOString(),
        senderId: "friend-1",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("New message!")).toBeInTheDocument();
      const names = screen.getAllByText(/Alice Smith|Team Chat/);
      expect(names[0].textContent).toBe("Alice Smith");
    });
  });

  it("marks conversation as unread when message is from someone else and not active", async () => {
    setupMocks({ conversations: [DIRECT_CONV], activeId: "conv-2" });
    render(<ConversationList />);
    await waitFor(() => screen.getByText("Alice Smith"));

    act(() => {
      pusherHandlers["conversation-updated"]({
        id: "conv-1",
        lastMessage: "Ping!",
        lastMessageAt: new Date().toISOString(),
        senderId: "friend-1",
      });
    });

    await waitFor(() => {
      expect(document.querySelector(".w-2\\.5.h-2\\.5.rounded-full")).toBeInTheDocument();
    });
  });

  it("does NOT mark as unread when the conversation is currently active", async () => {
    setupMocks({ conversations: [DIRECT_CONV], activeId: "conv-1" });
    render(<ConversationList />);
    await waitFor(() => screen.getByText("Alice Smith"));

    act(() => {
      pusherHandlers["conversation-updated"]({
        id: "conv-1",
        lastMessage: "Hi again",
        lastMessageAt: new Date().toISOString(),
        senderId: "friend-1",
      });
    });

    await waitFor(() => {
      expect(document.querySelector(".w-2\\.5.h-2\\.5.rounded-full")).not.toBeInTheDocument();
    });
  });

  it("triggers a full refetch when conversation-updated has refetch: true", async () => {
    setupMocks();
    render(<ConversationList />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    act(() => {
      pusherHandlers["conversation-updated"]({ id: "conv-1", refetch: true });
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
  });

  it("triggers a full refetch when the conversation id is not in the list", async () => {
    setupMocks({ conversations: [DIRECT_CONV] });
    render(<ConversationList />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    act(() => {
      pusherHandlers["conversation-updated"]({
        id: "brand-new-conv",
        lastMessage: "First message",
        lastMessageAt: new Date().toISOString(),
        senderId: "stranger",
      });
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
  });

  it("removes a conversation on conversation-deleted event", async () => {
    setupMocks({ conversations: [DIRECT_CONV, GROUP_CONV] });
    render(<ConversationList />);
    await waitFor(() => screen.getByText("Alice Smith"));

    act(() => { pusherHandlers["conversation-deleted"]({ id: "conv-1" }); });

    await waitFor(() =>
      expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument()
    );
  });

  it("navigates to /messages when the active conversation is deleted via Pusher", async () => {
    setupMocks({ conversations: [DIRECT_CONV], activeId: "conv-1" });
    render(<ConversationList />);
    await waitFor(() => screen.getByText("Alice Smith"));

    act(() => { pusherHandlers["conversation-deleted"]({ id: "conv-1" }); });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/messages"));
  });
});

// CreateGroupModal

describe("ConversationList – CreateGroupModal", () => {
  it("opens the modal when '+ Group' is clicked", async () => {
    setupMocks({ conversations: [] });
    render(<ConversationList />);
    fireEvent.click(screen.getByTitle("New group chat"));
    expect(screen.getByTestId("create-group-modal")).toBeInTheDocument();
  });

  it("closes the modal when onClose is called", async () => {
    setupMocks({ conversations: [] });
    render(<ConversationList />);
    fireEvent.click(screen.getByTitle("New group chat"));
    fireEvent.click(screen.getByText("Close Modal"));
    expect(screen.queryByTestId("create-group-modal")).not.toBeInTheDocument();
  });

  it("prepends the new conversation and navigates to it on creation", async () => {
    setupMocks({ conversations: [DIRECT_CONV] });
    render(<ConversationList />);
    await waitFor(() => screen.getByText("Alice Smith"));

    fireEvent.click(screen.getByTitle("New group chat"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.getByText("New Group")).toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith("/messages/new-conv");
    });
  });

  it("does not duplicate a conversation that already exists in the list", async () => {
    const existingGroupConv = {
      id: "new-conv",
      isGroup: true,
      name: "New Group",
      participants: [],
      lastMessage: null,
      lastMessageAt: null,
      lastMessageSentByMe: false,
      hasUnread: false,
    };
    setupMocks({ conversations: [existingGroupConv] });
    render(<ConversationList />);
    await waitFor(() => screen.getByText("New Group"));

    fireEvent.click(screen.getByTitle("New group chat"));
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.getAllByText("New Group")).toHaveLength(1);
    });
  });
});