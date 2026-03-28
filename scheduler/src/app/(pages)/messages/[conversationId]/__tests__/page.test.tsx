/**
 * Testing for messages/[conversationId]/layout.
 */

import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import ConversationPage from "../page";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";


// Mocks

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
      <span data-testid="group-name">{name}</span>
      <span data-testid="participant-count">{participantCount}</span>
      <button onClick={onToggleMembers}>Toggle Members</button>
      <button onClick={onLeave}>Leave</button>
    </div>
  ),
}));

jest.mock("@/components/messaging/MembersPanel", () => ({
  MembersPanel: ({ participants, onRemove, onPromote, onAddMember }: any) => (
    <div data-testid="members-panel">
      {participants.map((p: any) => (
        <span key={p.userId} data-testid={`member-${p.userId}`}>{p.user.username}</span>
      ))}
      <button onClick={() => onRemove("user-2", "bob")}>Remove Bob</button>
      <button onClick={() => onPromote("user-2", "member")}>Promote Bob</button>
      <button onClick={() => onPromote("user-2", "admin")}>Demote Bob</button>
      <button onClick={onAddMember}>Add Member</button>
    </div>
  ),
}));

jest.mock("@/components/messaging/AddMemberModal", () => ({
  AddMemberModal: ({ onClose, onAdded }: any) => (
    <div data-testid="add-member-modal">
      <button onClick={onClose}>Close Modal</button>
      <button onClick={onAdded}>Member Added</button>
    </div>
  ),
}));

jest.mock("@/components/messaging/MessageBubble", () => ({
  MessageBubble: ({ msg, isMe, showDateDivider, dateDividerLabel, onAvatarClick }: any) => (
    <div data-testid={`message-${msg.id}`}>
      {showDateDivider && <div data-testid="date-divider">{dateDividerLabel}</div>}
      <span data-testid={`content-${msg.id}`}>{msg.content}</span>
      {isMe && <span data-testid={`is-me-${msg.id}`}>mine</span>}
      <button data-testid={`avatar-${msg.id}`} onClick={() => onAvatarClick?.(msg.sender.username)}>
        Avatar
      </button>
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

// Pusher Mock

const pusherHandlers: Record<string, Function> = {};

const pusherMocks = {
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

// Browser API mocks

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

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

// Shared Fixtures

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
    {
      userId: "user-1",
      role: "admin",
      joinedAt: new Date().toISOString(),
      user: { id: "user-1", username: "alice", fname: "Alice", pfp: null },
    },
    {
      userId: "user-2",
      role: "member",
      joinedAt: new Date().toISOString(),
      user: { id: "user-2", username: "bob", fname: "Bob", pfp: null },
    },
  ],
};

const GROUP_DETAILS = { ...CONV_DETAILS, isGroup: true, name: "Study Group" };

const mockPush = jest.fn();

//Setup helper

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

/**
 * Renders ConversationPage and waits for all async mount state updates to
 * settle inside a single act() call, eliminating act() warnings across tests.
 */
async function renderAndSettle() {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(<ConversationPage />);
  });
  return result!;
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(pusherHandlers).forEach((k) => delete pusherHandlers[k]);
});

// Rendering

describe("ConversationPage – rendering", () => {
  it("renders the message input on mount", async () => {
    setupMocks();
    await renderAndSettle();
    expect(screen.getByTestId("message-input")).toBeInTheDocument();
  });

  it("renders messages after fetching", async () => {
    setupMocks();
    await renderAndSettle();
    expect(screen.getByTestId("message-msg-1")).toBeInTheDocument();
    expect(screen.getByTestId("message-msg-2")).toBeInTheDocument();
  });

  it("renders message content correctly", async () => {
    setupMocks();
    await renderAndSettle();
    expect(screen.getByTestId("content-msg-1")).toHaveTextContent("Hello");
    expect(screen.getByTestId("content-msg-2")).toHaveTextContent("Hi back");
  });

  it("marks own messages with isMe and not others", async () => {
    setupMocks();
    await renderAndSettle();
    expect(screen.getByTestId("is-me-msg-2")).toBeInTheDocument();
    expect(screen.queryByTestId("is-me-msg-1")).not.toBeInTheDocument();
  });

  it("does not render GroupHeader for a DM conversation", async () => {
    setupMocks({ details: CONV_DETAILS });
    await renderAndSettle();
    expect(screen.queryByTestId("group-header")).not.toBeInTheDocument();
  });

  it("renders GroupHeader for a group conversation", async () => {
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    expect(screen.getByTestId("group-header")).toBeInTheDocument();
  });

  it("renders the group name in GroupHeader", async () => {
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    expect(screen.getByTestId("group-name")).toHaveTextContent("Study Group");
  });

  it("renders without error when group has no name", async () => {
    setupMocks({ details: { ...GROUP_DETAILS, name: null } });
    await renderAndSettle();
    expect(screen.getByTestId("group-header")).toBeInTheDocument();
  });

  it("renders participant count in GroupHeader", async () => {
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    expect(screen.getByTestId("participant-count")).toHaveTextContent("2");
  });

  it("shows 'Beginning of conversation' when fewer than 20 messages returned", async () => {
    setupMocks({ messages: [MESSAGES[0]] });
    await renderAndSettle();
    expect(screen.getByText("Beginning of conversation")).toBeInTheDocument();
  });

  it("does not show 'Beginning of conversation' when 20 messages returned", async () => {
    const twenty = Array.from({ length: 20 }, (_, i) => ({ ...MESSAGES[0], id: `msg-${i}` }));
    setupMocks({ messages: twenty });
    await renderAndSettle();
    expect(screen.queryByText("Beginning of conversation")).not.toBeInTheDocument();
  });

  it("does not render MembersPanel initially", async () => {
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    expect(screen.queryByTestId("members-panel")).not.toBeInTheDocument();
  });

  it("does not render AddMemberModal initially", async () => {
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    expect(screen.queryByTestId("add-member-modal")).not.toBeInTheDocument();
  });
});

// Data fetching

describe("ConversationPage – data fetching", () => {
  it("fetches messages on mount", async () => {
    setupMocks();
    await renderAndSettle();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/messages"));
  });

  it("fetches conversation details on mount", async () => {
    setupMocks();
    await renderAndSettle();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/details"));
  });

  it("sends PATCH to mark conversation as read on mount", async () => {
    setupMocks();
    await renderAndSettle();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/conversations/conv-1",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("handles non-array response from messages API gracefully", async () => {
    (useSession as jest.Mock).mockReturnValue({ data: SESSION });
    (useParams as jest.Mock).mockReturnValue({ conversationId: "conv-1" });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes("/messages")) return Promise.resolve({ ok: true, json: async () => null });
      if (url.includes("/details")) return Promise.resolve({ ok: true, json: async () => CONV_DETAILS });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    await renderAndSettle();
    expect(screen.queryByTestId("message-msg-1")).not.toBeInTheDocument();
  });

  it("skips fetching when conversationId is absent", async () => {
    (useSession as jest.Mock).mockReturnValue({ data: SESSION });
    (useParams as jest.Mock).mockReturnValue({});
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    await renderAndSettle();
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/messages"),
      expect.anything()
    );
  });
});

// Group features

describe("ConversationPage – group features", () => {
  it("shows MembersPanel when Toggle Members is clicked", async () => {
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    fireEvent.click(screen.getByText("Toggle Members"));
    expect(screen.getByTestId("members-panel")).toBeInTheDocument();
  });

  it("hides MembersPanel when Toggle Members is clicked again", async () => {
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    fireEvent.click(screen.getByText("Toggle Members"));
    fireEvent.click(screen.getByText("Toggle Members"));
    expect(screen.queryByTestId("members-panel")).not.toBeInTheDocument();
  });

  it("renders participant usernames in MembersPanel", async () => {
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    fireEvent.click(screen.getByText("Toggle Members"));
    expect(screen.getByTestId("member-user-1")).toHaveTextContent("alice");
    expect(screen.getByTestId("member-user-2")).toHaveTextContent("bob");
  });

  it("confirms and leaves the group when Leave is clicked", async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
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
    await renderAndSettle();
    fireEvent.click(screen.getByText("Leave"));
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// Sending messages

describe("ConversationPage – sending messages", () => {
  it("sends a message when Send is clicked", async () => {
    setupMocks();
    await renderAndSettle();
    fireEvent.change(screen.getByTestId("textarea"), { target: { value: "Test message" } });
    await act(async () => { fireEvent.click(screen.getByTestId("send-btn")); });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/conversations/conv-1",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ content: "Test message" }) })
    );
  });

  it("clears the input after sending", async () => {
    setupMocks();
    await renderAndSettle();
    fireEvent.change(screen.getByTestId("textarea"), { target: { value: "Test message" } });
    await act(async () => { fireEvent.click(screen.getByTestId("send-btn")); });
    expect(screen.getByTestId("textarea")).toHaveValue("");
  });

  it("does not send an empty message", async () => {
    setupMocks();
    await renderAndSettle();
    await act(async () => { fireEvent.click(screen.getByTestId("send-btn")); });
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/conversations/conv-1",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("does not send when session is null", async () => {
    setupMocks({ session: null });
    await renderAndSettle();
    fireEvent.change(screen.getByTestId("textarea"), { target: { value: "Hello" } });
    await act(async () => { fireEvent.click(screen.getByTestId("send-btn")); });
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/conversations/conv-1",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("adds an optimistic message immediately before API responds", async () => {
    setupMocks();
    await renderAndSettle();
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    fireEvent.change(screen.getByTestId("textarea"), { target: { value: "Optimistic" } });
    act(() => { fireEvent.click(screen.getByTestId("send-btn")); });
    expect(screen.getByText("Optimistic")).toBeInTheDocument();
  });

  it("replaces optimistic message with real message on success", async () => {
    setupMocks();
    await renderAndSettle();
    fireEvent.change(screen.getByTestId("textarea"), { target: { value: "Real" } });
    await act(async () => { fireEvent.click(screen.getByTestId("send-btn")); });
    expect(screen.getByTestId("message-msg-sent")).toBeInTheDocument();
  });

  it("removes optimistic message if API responds with non-ok", async () => {
    setupMocks();
    await renderAndSettle();
    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === "POST" && !url.includes("/typing")) {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    fireEvent.change(screen.getByTestId("textarea"), { target: { value: "Will fail" } });
    await act(async () => { fireEvent.click(screen.getByTestId("send-btn")); });
    expect(screen.queryByText("Will fail")).not.toBeInTheDocument();
  });

  it("removes optimistic message when fetch throws a network error", async () => {
    setupMocks();
    await renderAndSettle();
    global.fetch = jest.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === "POST" && !url.includes("/typing")) {
        return Promise.reject(new Error("Network failure"));
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    fireEvent.change(screen.getByTestId("textarea"), { target: { value: "Will throw" } });
    await act(async () => { fireEvent.click(screen.getByTestId("send-btn")); });
    expect(screen.queryByText("Will throw")).not.toBeInTheDocument();
  });

  it("sends message on Enter key", async () => {
    setupMocks();
    await renderAndSettle();
    fireEvent.change(screen.getByTestId("textarea"), { target: { value: "Enter message" } });
    await act(async () => {
      fireEvent.keyDown(screen.getByTestId("textarea"), { key: "Enter", shiftKey: false });
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/conversations/conv-1",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("does not send on Shift+Enter", async () => {
    setupMocks();
    await renderAndSettle();
    fireEvent.change(screen.getByTestId("textarea"), { target: { value: "Multiline" } });
    fireEvent.keyDown(screen.getByTestId("textarea"), { key: "Enter", shiftKey: true });
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/conversations/conv-1",
      expect.objectContaining({ method: "POST" })
    );
  });
});

// Typing indicator

describe("ConversationPage – typing indicator", () => {
  it("sends isTyping=true POST when user types", async () => {
    setupMocks();
    await renderAndSettle();
    fireEvent.change(screen.getByTestId("textarea"), { target: { value: "Hello" } });
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/typing"),
        expect.objectContaining({ method: "POST", body: JSON.stringify({ isTyping: true }) })
      )
    );
  });

  it("sends isTyping=false after typing timeout", async () => {
    jest.useFakeTimers();
    setupMocks();
    await renderAndSettle();
    fireEvent.change(screen.getByTestId("textarea"), { target: { value: "Hello" } });
    await act(async () => { jest.advanceTimersByTime(2500); });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/typing"),
      expect.objectContaining({ body: JSON.stringify({ isTyping: false }) })
    );
    jest.useRealTimers();
  });

  it("shows bounce dots when another user is typing via Pusher", async () => {
    setupMocks();
    await renderAndSettle();
    act(() => {
      pusherHandlers["typing"]({ userId: "user-2", username: "bob", isTyping: true });
    });
    await waitFor(() =>
      expect(document.querySelector(".animate-bounce")).toBeInTheDocument()
    );
  });

  it("hides bounce dots when isTyping becomes false", async () => {
    setupMocks();
    await renderAndSettle();
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
    await renderAndSettle();
    act(() => {
      pusherHandlers["typing"]({ userId: "user-1", username: "alice", isTyping: true });
    });
    expect(document.querySelectorAll(".animate-bounce").length).toBe(0);
  });
});

// Pusher real-time messages

describe("ConversationPage – Pusher", () => {
  it("subscribes to the conversation channel on mount", async () => {
    setupMocks();
    await renderAndSettle();
    expect(pusherMocks.subscribe).toHaveBeenCalledWith("conversation-conv-1");
  });

  it("unsubscribes and unbinds on unmount", async () => {
    setupMocks();
    const { unmount } = await renderAndSettle();
    unmount();
    expect(pusherMocks.unbindAll).toHaveBeenCalled();
    expect(pusherMocks.unsubscribe).toHaveBeenCalledWith("conversation-conv-1");
  });

  it("appends a new message received via Pusher", async () => {
    setupMocks({ messages: [MESSAGES[0]] });
    await renderAndSettle();
    const newMsg = {
      id: "msg-new",
      content: "Real-time!",
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
    await renderAndSettle();
    act(() => { pusherHandlers["new-message"](MESSAGES[0]); });
    await waitFor(() =>
      expect(screen.getAllByTestId("message-msg-1")).toHaveLength(1)
    );
  });

  it("clears typing indicator when a new Pusher message arrives", async () => {
    setupMocks({ messages: [MESSAGES[0]] });
    await renderAndSettle();
    act(() => {
      pusherHandlers["typing"]({ userId: "user-2", username: "bob", isTyping: true });
    });
    await waitFor(() =>
      expect(document.querySelector(".animate-bounce")).toBeInTheDocument()
    );
    act(() => {
      pusherHandlers["new-message"]({
        id: "msg-clears-typing",
        content: "Here",
        createdAt: new Date().toISOString(),
        sender: { id: "user-2", username: "bob", pfp: null },
      });
    });
    await waitFor(() =>
      expect(document.querySelectorAll(".animate-bounce").length).toBe(0)
    );
  });
});

// Member management

describe("ConversationPage – member management", () => {
  it("calls DELETE with userId when Remove is confirmed", async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    fireEvent.click(screen.getByText("Toggle Members"));
    await act(async () => { fireEvent.click(screen.getByText("Remove Bob")); });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/members"),
      expect.objectContaining({ method: "DELETE", body: JSON.stringify({ userId: "user-2" }) })
    );
  });

  it("does not call DELETE when Remove is cancelled", async () => {
    window.confirm = jest.fn().mockReturnValue(false);
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    fireEvent.click(screen.getByText("Toggle Members"));
    fireEvent.click(screen.getByText("Remove Bob"));
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/members"),
      expect.objectContaining({ method: "DELETE", body: expect.any(String) })
    );
  });

  it("re-fetches details after removing a member", async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    fireEvent.click(screen.getByText("Toggle Members"));
    await act(async () => { fireEvent.click(screen.getByText("Remove Bob")); });
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/details"));
  });
});

// Promote / demote

describe("ConversationPage – promote/demote", () => {
  it("calls PATCH with role=admin when promoting a member", async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    fireEvent.click(screen.getByText("Toggle Members"));
    await act(async () => { fireEvent.click(screen.getByText("Promote Bob")); });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/members"),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ userId: "user-2", role: "admin" }) })
    );
  });

  it("calls PATCH with role=member when demoting an admin", async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    fireEvent.click(screen.getByText("Toggle Members"));
    await act(async () => { fireEvent.click(screen.getByText("Demote Bob")); });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/members"),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ userId: "user-2", role: "member" }) })
    );
  });

  it("does not call PATCH when promote confirm is cancelled", async () => {
    window.confirm = jest.fn().mockReturnValue(false);
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    fireEvent.click(screen.getByText("Toggle Members"));
    fireEvent.click(screen.getByText("Promote Bob"));
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/members"),
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("re-fetches details after a role change", async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    fireEvent.click(screen.getByText("Toggle Members"));
    await act(async () => { fireEvent.click(screen.getByText("Promote Bob")); });
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/details"));
  });

  it("MembersPanel renders when current user is non-admin", async () => {
    const nonAdminDetails = {
      ...GROUP_DETAILS,
      participants: [
        { userId: "user-1", role: "member", joinedAt: new Date().toISOString(), user: { id: "user-1", username: "alice", fname: "Alice", pfp: null } },
        { userId: "user-2", role: "admin", joinedAt: new Date().toISOString(), user: { id: "user-2", username: "bob", fname: "Bob", pfp: null } },
      ],
    };
    setupMocks({ details: nonAdminDetails });
    await renderAndSettle();
    fireEvent.click(screen.getByText("Toggle Members"));
    expect(screen.getByTestId("members-panel")).toBeInTheDocument();
  });
});

// AddMemberModal

describe("ConversationPage – AddMemberModal", () => {
  it("shows modal when Add Member is clicked", async () => {
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    fireEvent.click(screen.getByText("Toggle Members"));
    fireEvent.click(screen.getByText("Add Member"));
    expect(screen.getByTestId("add-member-modal")).toBeInTheDocument();
  });

  it("closes modal when onClose is called", async () => {
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    fireEvent.click(screen.getByText("Toggle Members"));
    fireEvent.click(screen.getByText("Add Member"));
    fireEvent.click(screen.getByText("Close Modal"));
    expect(screen.queryByTestId("add-member-modal")).not.toBeInTheDocument();
  });

  it("calls fetchDetails when onAdded is called", async () => {
    setupMocks({ details: GROUP_DETAILS });
    await renderAndSettle();
    fireEvent.click(screen.getByText("Toggle Members"));
    fireEvent.click(screen.getByText("Add Member"));
    await act(async () => { fireEvent.click(screen.getByText("Member Added")); });
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/details"));
  });
});

// Avatar click

describe("ConversationPage – avatar click", () => {
  it("navigates to the sender's profile when avatar is clicked", async () => {
    setupMocks();
    await renderAndSettle();
    fireEvent.click(screen.getByTestId("avatar-msg-1"));
    expect(mockPush).toHaveBeenCalledWith("/profile/bob");
  });

  it("navigates to own profile when own message avatar is clicked", async () => {
    setupMocks();
    await renderAndSettle();
    fireEvent.click(screen.getByTestId("avatar-msg-2"));
    expect(mockPush).toHaveBeenCalledWith("/profile/alice");
  });
});

// Date dividers

describe("ConversationPage – date dividers", () => {
  it("renders a date divider for the first message", async () => {
    setupMocks({ messages: [MESSAGES[0]] });
    await renderAndSettle();
    expect(screen.getByTestId("date-divider")).toBeInTheDocument();
  });

  it("shows 'Today' for messages sent today", async () => {
    setupMocks({ messages: [MESSAGES[0]] });
    await renderAndSettle();
    expect(screen.getByTestId("date-divider")).toHaveTextContent("Today");
  });

  it("shows 'Yesterday' for messages sent yesterday", async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    setupMocks({ messages: [{ ...MESSAGES[0], id: "msg-y", createdAt: yesterday }] });
    await renderAndSettle();
    expect(screen.getByTestId("date-divider")).toHaveTextContent("Yesterday");
  });

  it("shows a weekday label for messages 3 days ago", async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    setupMocks({ messages: [{ ...MESSAGES[0], id: "msg-w", createdAt: threeDaysAgo }] });
    await renderAndSettle();
    const weekdays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    expect(weekdays.some((d) => screen.getByTestId("date-divider").textContent?.includes(d))).toBe(true);
  });

  it("shows a formatted month/day for old messages", async () => {
    const old = new Date("2023-01-15T10:00:00Z").toISOString();
    setupMocks({ messages: [{ ...MESSAGES[0], id: "msg-old", createdAt: old }] });
    await renderAndSettle();
    expect(screen.getByTestId("date-divider").textContent).toMatch(/Jan/);
  });

  it("shows dividers between messages from different days", async () => {
    const dayOne = new Date("2024-06-01T10:00:00Z").toISOString();
    const dayTwo = new Date("2024-06-02T10:00:00Z").toISOString();
    setupMocks({
      messages: [
        { ...MESSAGES[0], id: "msg-d1", createdAt: dayOne },
        { ...MESSAGES[1], id: "msg-d2", createdAt: dayTwo },
      ],
    });
    await renderAndSettle();
    expect(screen.getAllByTestId("date-divider")).toHaveLength(2);
  });

  it("shows only one divider for consecutive messages on the same day", async () => {
    setupMocks({
      messages: [
        { ...MESSAGES[0], id: "msg-s1", createdAt: new Date(Date.now() - 2 * 60000).toISOString() },
        { ...MESSAGES[1], id: "msg-s2", createdAt: new Date(Date.now() - 1 * 60000).toISOString() },
      ],
    });
    await renderAndSettle();
    expect(screen.getAllByTestId("date-divider")).toHaveLength(1);
  });
});

// loadMore / pagination

describe("ConversationPage – loadMore", () => {
  it("does not attempt loadMore when hasMore is false (< 20 messages returned)", async () => {
    setupMocks({ messages: [MESSAGES[0]] });
    await renderAndSettle();
    const callCount = (global.fetch as jest.Mock).mock.calls.length;
    await act(async () => {});
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(callCount);
  });

  it("prepends older messages when IntersectionObserver fires", async () => {
    let observerCallback: IntersectionObserverCallback | null = null;
    (global.IntersectionObserver as any) = jest.fn().mockImplementation(
      (cb: IntersectionObserverCallback) => {
        observerCallback = cb;
        return { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() };
      }
    );
    const twenty = Array.from({ length: 20 }, (_, i) => ({
      id: `msg-p-${i}`,
      content: `Page1 ${i}`,
      createdAt: new Date(Date.now() - i * 60000).toISOString(),
      sender: { id: "user-2", username: "bob", pfp: null },
    }));
    setupMocks({ messages: twenty });
    await renderAndSettle();

    const older = {
      id: "msg-older",
      content: "Older message",
      createdAt: new Date(Date.now() - 999 * 60000).toISOString(),
      sender: { id: "user-2", username: "bob", pfp: null },
    };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [older] });

    await act(async () => {
      observerCallback?.([{ isIntersecting: true }] as any, {} as any);
    });
    await waitFor(() =>
      expect(screen.getByTestId("message-msg-older")).toBeInTheDocument()
    );
  });
});