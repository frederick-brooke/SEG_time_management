import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import ConversationPage from "../page";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

jest.mock("@/components/messaging/GroupHeader", () => ({
  GroupHeader: ({ name, participantCount, onToggleMembers, onLeave }: any) => (
    <div data-testid="group-header">
      <span>{name}</span>
      <span data-testid="participant-count">{participantCount}</span>
      <button onClick={onToggleMembers}>Toggle Members</button>
      <button onClick={onLeave}>Leave</button>
    </div>
  ),
}));

jest.mock("@/components/messaging/MembersPanel", () => ({
  MembersPanel: ({ participants }: any) => (
    <div data-testid="members-panel">
      {participants.map((p: any) => (
        <span key={p.userId}>{p.user.username}</span>
      ))}
    </div>
  ),
}));

jest.mock("@/components/messaging/AddMemberModal", () => ({
  AddMemberModal: ({ onClose, onAdded }: any) => (
    <div data-testid="add-member-modal">
      <button onClick={onClose}>Close</button>
      <button onClick={onAdded}>Added</button>
    </div>
  ),
}));

jest.mock("@/components/messaging/MessageBubble", () => ({
  MessageBubble: ({ msg, isMe, showDateDivider, dateDividerLabel, onAvatarClick }: any) => (
    <div data-testid={`message-${msg.id}`}>
      {showDateDivider && <div data-testid="date-divider">{dateDividerLabel}</div>}
      <span data-testid={`content-${msg.id}`}>{msg.content}</span>
      {isMe && <span data-testid="is-me">mine</span>}
      <button onClick={() => onAvatarClick?.(msg.sender.username)}>Avatar</button>
    </div>
  ),
}));

jest.mock("@/components/messaging/MessageInput", () => ({
  MessageInput: ({ value, sending, onChange, onKeyDown, onSend }: any) => (
    <div data-testid="message-input">
      <textarea
        data-testid="textarea"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      <button data-testid="send-btn" onClick={onSend} disabled={sending}>
        {sending ? "Sending" : "Send"}
      </button>
    </div>
  ),
}));

jest.mock("@/components/ui/StarBackground", () => ({
  StarBackground: () => <div data-testid="star-background" />,
}));

// Pusher mock
const pusherHandlers: Record<string, Function> = {};
var pusherMocks = {
  bind: jest.fn(),
  unbindAll: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

jest.mock("pusher-js", () =>
  jest.fn().mockImplementation(() => ({
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
  }))
);

// IntersectionObserver mock
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = MockIntersectionObserver as any;

// scrollIntoView mock
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

// Shared test data
const SESSION = { user: { id: "user-1", name: "Alice", username: "alice" } };

const MESSAGES = [
  {
    id: "msg-1",
    content: "Hello",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    sender: { id: "user-2", username: "bob", pfp: null },
  },
  {
    id: "msg-2",
    content: "Hi back",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    sender: { id: "user-1", username: "alice", pfp: null },
  },
];

const CONV_DETAILS = {
  id: "conv-1",
  isGroup: false,
  name: null,
  participants: [
    { userId: "user-1", role: "admin", joinedAt: new Date().toISOString(), user: { id: "user-1", username: "alice", fname: "Alice", pfp: null } },
    { userId: "user-2", role: "member", joinedAt: new Date().toISOString(), user: { id: "user-2", username: "bob", fname: "Bob", pfp: null } },
  ],
};

const GROUP_DETAILS = {
  ...CONV_DETAILS,
  isGroup: true,
  name: "Study Group",
};

const mockPush = jest.fn();

function setupMocks({
  messages = MESSAGES,
  details = CONV_DETAILS,
  conversationId = "conv-1",
  session = SESSION,
}: {
  messages?: any[];
  details?: any;
  conversationId?: string;
  session?: any;
} = {}) {
  (useSession as jest.Mock).mockReturnValue({ data: session });
  (useParams as jest.Mock).mockReturnValue({ conversationId });
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

  global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
    if (url.includes("/messages") && (!options || options.method !== "POST")) {
      return Promise.resolve({ ok: true, json: async () => messages });
    }
    if (url.includes("/details")) {
      return Promise.resolve({ ok: true, json: async () => details });
    }
    if (options?.method === "POST" && url.includes("/typing")) {
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    if (options?.method === "POST") {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: "msg-sent",
          content: JSON.parse(options.body).content,
          createdAt: new Date().toISOString(),
          sender: { id: "user-1", username: "alice", pfp: null },
        }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(pusherHandlers).forEach((k) => delete pusherHandlers[k]);
});

describe("ConversationPage – rendering", () => {
  it("renders the message input", async () => {
    setupMocks();
    render(<ConversationPage />);
    expect(screen.getByTestId("message-input")).toBeInTheDocument();
  });

  it("renders the star background", async () => {
    setupMocks();
    render(<ConversationPage />);
    expect(screen.getByTestId("star-background")).toBeInTheDocument();
  });

  it("renders messages after fetching", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() => {
      expect(screen.getByTestId("message-msg-1")).toBeInTheDocument();
      expect(screen.getByTestId("message-msg-2")).toBeInTheDocument();
    });
  });

  it("renders message content correctly", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() => {
      expect(screen.getByTestId("content-msg-1")).toHaveTextContent("Hello");
      expect(screen.getByTestId("content-msg-2")).toHaveTextContent("Hi back");
    });
  });

  it("marks own messages with isMe", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() => {
      expect(screen.getByTestId("message-msg-2").querySelector("[data-testid='is-me']")).toBeInTheDocument();
      expect(screen.queryByTestId("message-msg-1")?.querySelector("[data-testid='is-me']")).not.toBeInTheDocument();
    });
  });

  it("does not render GroupHeader for a DM conversation", async () => {
    setupMocks({ details: CONV_DETAILS });
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("message-input"));
    expect(screen.queryByTestId("group-header")).not.toBeInTheDocument();
  });

  it("renders GroupHeader for a group conversation", async () => {
    setupMocks({ details: GROUP_DETAILS });
    render(<ConversationPage />);
    await waitFor(() =>
      expect(screen.getByTestId("group-header")).toBeInTheDocument()
    );
  });

  it("renders the group name in GroupHeader", async () => {
    setupMocks({ details: GROUP_DETAILS });
    render(<ConversationPage />);
    await waitFor(() =>
      expect(screen.getByText("Study Group")).toBeInTheDocument()
    );
  });

  it("shows 'Beginning of conversation' when all messages are loaded", async () => {
    setupMocks({ messages: [MESSAGES[0]] });
    render(<ConversationPage />);
    await waitFor(() =>
      expect(screen.getByText("Beginning of conversation")).toBeInTheDocument()
    );
  });

  it("does not show 'Beginning of conversation' when there may be more messages", async () => {
    const twentyMessages = Array.from({ length: 20 }, (_, i) => ({
      ...MESSAGES[0],
      id: `msg-${i}`,
    }));
    setupMocks({ messages: twentyMessages });
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("message-msg-0"));
    expect(screen.queryByText("Beginning of conversation")).not.toBeInTheDocument();
  });
});

describe("ConversationPage – data fetching", () => {
  it("fetches messages on mount", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/messages")
      )
    );
  });

  it("fetches conversation details on mount", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/details")
      )
    );
  });

  it("sends PATCH to mark conversation as read on mount", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/conversations/conv-1",
        expect.objectContaining({ method: "PATCH" })
      )
    );
  });
});

describe("ConversationPage – group features", () => {
  it("shows MembersPanel when Toggle Members is clicked", async () => {
    setupMocks({ details: GROUP_DETAILS });
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("group-header"));
    fireEvent.click(screen.getByText("Toggle Members"));
    expect(screen.getByTestId("members-panel")).toBeInTheDocument();
  });

  it("hides MembersPanel when Toggle Members is clicked again", async () => {
    setupMocks({ details: GROUP_DETAILS });
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("group-header"));
    fireEvent.click(screen.getByText("Toggle Members"));
    expect(screen.getByTestId("members-panel")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Toggle Members"));
    expect(screen.queryByTestId("members-panel")).not.toBeInTheDocument();
  });

  it("confirms and leaves the group when Leave is clicked", async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    setupMocks({ details: GROUP_DETAILS });
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("group-header"));
    fireEvent.click(screen.getByText("Leave"));
    expect(mockPush).toHaveBeenCalledWith("/messages");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/members"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("does not leave if confirm is cancelled", async () => {
    window.confirm = jest.fn().mockReturnValue(false);
    setupMocks({ details: GROUP_DETAILS });
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("group-header"));
    fireEvent.click(screen.getByText("Leave"));
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("ConversationPage – sending messages", () => {
  it("sends a message when Send is clicked", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("textarea"));

    fireEvent.change(screen.getByTestId("textarea"), {
      target: { value: "Test message" },
    });
    fireEvent.click(screen.getByTestId("send-btn"));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/conversations/conv-1",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ content: "Test message" }),
        })
      )
    );
  });

  it("clears the input after sending", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("textarea"));

    fireEvent.change(screen.getByTestId("textarea"), {
      target: { value: "Test message" },
    });
    fireEvent.click(screen.getByTestId("send-btn"));

    await waitFor(() =>
      expect(screen.getByTestId("textarea")).toHaveValue("")
    );
  });

  it("does not send an empty message", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("textarea"));
    fireEvent.click(screen.getByTestId("send-btn"));
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/conversations/conv-1",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("adds optimistic message immediately", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("textarea"));

    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

    fireEvent.change(screen.getByTestId("textarea"), {
      target: { value: "Optimistic" },
    });
    fireEvent.click(screen.getByTestId("send-btn"));

    await waitFor(() =>
      expect(screen.getByText("Optimistic")).toBeInTheDocument()
    );
  });

  it("removes optimistic message if send fails", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("textarea"));

    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === "POST" && !url.includes("/typing")) {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    fireEvent.change(screen.getByTestId("textarea"), {
      target: { value: "Will fail" },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("send-btn"));
    });

    await waitFor(() =>
      expect(screen.queryByText("Will fail")).not.toBeInTheDocument()
    );
  });

  it("sends message on Enter key", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("textarea"));

    fireEvent.change(screen.getByTestId("textarea"), {
      target: { value: "Enter message" },
    });
    fireEvent.keyDown(screen.getByTestId("textarea"), {
      key: "Enter",
      shiftKey: false,
    });

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/conversations/conv-1",
        expect.objectContaining({ method: "POST" })
      )
    );
  });

  it("does not send on Shift+Enter", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("textarea"));

    fireEvent.change(screen.getByTestId("textarea"), {
      target: { value: "Multiline" },
    });
    fireEvent.keyDown(screen.getByTestId("textarea"), {
      key: "Enter",
      shiftKey: true,
    });

    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/conversations/conv-1",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("ConversationPage – Pusher", () => {
  it("subscribes to the conversation Pusher channel on mount", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() =>
      expect(pusherMocks.subscribe).toHaveBeenCalledWith("conversation-conv-1")
    );
  });

  it("unsubscribes on unmount", async () => {
    setupMocks();
    const { unmount } = render(<ConversationPage />);
    await waitFor(() => expect(pusherMocks.subscribe).toHaveBeenCalled());
    unmount();
    expect(pusherMocks.unbindAll).toHaveBeenCalled();
    expect(pusherMocks.unsubscribe).toHaveBeenCalledWith("conversation-conv-1");
  });

  it("appends a new message received via Pusher", async () => {
    setupMocks({ messages: [MESSAGES[0]] });
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("message-msg-1"));

    const newMsg = {
      id: "msg-new",
      content: "New real-time message",
      createdAt: new Date().toISOString(),
      sender: { id: "user-2", username: "bob", pfp: null },
    };

    act(() => { pusherHandlers["new-message"](newMsg); });

    await waitFor(() =>
      expect(screen.getByTestId("content-msg-new")).toBeInTheDocument()
    );
  });

  it("does not duplicate a message already in the list", async () => {
    setupMocks({ messages: [MESSAGES[0]] });
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("message-msg-1"));

    act(() => { pusherHandlers["new-message"](MESSAGES[0]); });

    await waitFor(() => {
      expect(screen.getAllByTestId("message-msg-1")).toHaveLength(1);
    });
  });

  it("shows typing indicator when another user is typing", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("message-input"));

    act(() => {
      pusherHandlers["typing"]({
        userId: "user-2",
        username: "bob",
        isTyping: true,
      });
    });

    await waitFor(() =>
      expect(document.querySelector(".animate-bounce")).toBeInTheDocument()
    );
  });

  it("hides typing indicator when isTyping is false", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("message-input"));

    act(() => {
      pusherHandlers["typing"]({ userId: "user-2", username: "bob", isTyping: true });
    });
    act(() => {
      pusherHandlers["typing"]({ userId: "user-2", username: "bob", isTyping: false });
    });

    await waitFor(() =>
      expect(document.querySelectorAll(".animate-bounce").length).toBe(0)
    );
  });

  it("ignores typing events from the current user", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("message-input"));

    act(() => {
      pusherHandlers["typing"]({
        userId: "user-1",
        username: "alice",
        isTyping: true,
      });
    });

    expect(document.querySelectorAll(".animate-bounce").length).toBe(0);
  });
});

describe("ConversationPage – AddMemberModal", () => {
  it("does not show AddMemberModal by default", async () => {
    setupMocks({ details: GROUP_DETAILS });
    render(<ConversationPage />);
    await waitFor(() => screen.getByTestId("group-header"));
    expect(screen.queryByTestId("add-member-modal")).not.toBeInTheDocument();
  });
});

describe("ConversationPage – avatar click", () => {
  it("navigates to user profile when avatar is clicked", async () => {
    setupMocks();
    render(<ConversationPage />);
    await waitFor(() => screen.getAllByText("Avatar")[0]);
    fireEvent.click(screen.getAllByText("Avatar")[0]);
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/profile/")
    );
  });
});

describe("ConversationPage – date dividers", () => {
  it("renders a date divider for the first message of a new day", async () => {
    setupMocks({ messages: [MESSAGES[0]] });
    render(<ConversationPage />);
    await waitFor(() =>
      expect(screen.getByTestId("date-divider")).toBeInTheDocument()
    );
  });

  it("shows 'Today' for messages sent today", async () => {
    setupMocks({ messages: [MESSAGES[0]] });
    render(<ConversationPage />);
    await waitFor(() =>
      expect(screen.getByTestId("date-divider")).toHaveTextContent("Today")
    );
  });
});