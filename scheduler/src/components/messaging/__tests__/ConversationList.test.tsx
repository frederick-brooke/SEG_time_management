/**
 * @file ConversationList.test.tsx
 * @description Tests for ConversationList component
 */

import { Button } from "@/components/ui/Button";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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


// eslint-disable-next-line no-var
var pusherMocks: {
  bind: jest.Mock;
  unbind: jest.Mock;
  subscribe: jest.Mock;
  unsubscribe: jest.Mock;
};

const channelHandlers: Record<string, (data: unknown) => void> = {};

jest.mock("pusher-js", () => {
  const bind = jest.fn((event: string, handler: (data: unknown) => void) => {
    channelHandlers[event] = handler;
  });
  const unbind = jest.fn();
  const subscribe = jest.fn().mockReturnValue({ bind, unbind_all: unbind });
  const unsubscribe = jest.fn();

  pusherMocks = { bind, unbind, subscribe, unsubscribe };

  return jest.fn().mockImplementation(() => ({
    subscribe,
    unsubscribe,
  }));
});


jest.mock("@/components/messaging/CreateGroupModal", () => ({
  CreateGroupModal: ({
    onClose,
    onCreated,
  }: {
    friends: unknown[];
    onClose: () => void;
    onCreated: (conv: { id: string }) => void;
  }) => (
    <div data-testid="create-group-modal">
      <Button onClick={onClose}>Close</Button>
      <Button onClick={() => onCreated({ id: "new-conv-id" })}>Create</Button>
    </div>
  ),
}));

jest.mock("../ConversationRow", () => ({
  ConversationRow: ({
    convo,
    isActive,
    onNavigate,
    onDeleted,
  }: {
    convo: { id: string; lastMessage?: string };
    isActive: boolean;
    currentUserId: string;
    onNavigate: (id: string) => void;
    onDeleted: (id: string) => void;
  }) => (
    <div data-testid={`conversation-row-${convo.id}`} data-active={String(isActive)}>
      <Button onClick={() => onNavigate(convo.id)}>Navigate</Button>
      <Button onClick={() => onDeleted(convo.id)}>Delete</Button>
      <span>{convo.lastMessage}</span>
    </div>
  ),
}));

// Helpers

const mockPush = jest.fn();
const mockSession = {
  data: { user: { id: "user-123" } },
  status: "authenticated",
};

const baseConversations = [
  {
    id: "conv-1",
    lastMessage: "Hello",
    lastMessageAt: "2024-01-01T10:00:00Z",
    hasUnread: false,
    lastMessageSentByMe: true,
  },
  {
    id: "conv-2",
    lastMessage: "World",
    lastMessageAt: "2024-01-01T09:00:00Z",
    hasUnread: true,
    lastMessageSentByMe: false,
  },
];

const baseFriends = [{ id: "friend-1", username: "alice", fname: "Alice", pfp: null }];

function setupFetchMock(
  conversations = baseConversations,
  friends = baseFriends
) {
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url === "/api/conversations") {
      return Promise.resolve({
        json: () => Promise.resolve(conversations),
      });
    }
    if (url.includes("/api/user/search")) {
      return Promise.resolve({
        json: () => Promise.resolve(friends),
      });
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });
}


import ConversationList from "../ConversationList";

// Tests

describe("ConversationList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(channelHandlers).forEach((k) => delete channelHandlers[k]);

    pusherMocks.bind.mockImplementation(
      (event: string, handler: (data: unknown) => void) => {
        channelHandlers[event] = handler;
      }
    );
    pusherMocks.subscribe.mockReturnValue({
      bind: pusherMocks.bind,
      unbind_all: pusherMocks.unbind,
    });

    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useParams as jest.Mock).mockReturnValue({ conversationId: "conv-1" });
    (useSession as jest.Mock).mockReturnValue(mockSession);

    setupFetchMock();
  });

  it("renders the Messages heading and Group button", async () => {
    render(<ConversationList />);
    expect(screen.getByText("Messages")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /group/i })).toBeInTheDocument();
  });

  it("renders conversation rows after fetching", async () => {
    render(<ConversationList />);
    await waitFor(() => {
      expect(screen.getByTestId("conversation-row-conv-1")).toBeInTheDocument();
      expect(screen.getByTestId("conversation-row-conv-2")).toBeInTheDocument();
    });
  });

  it("marks the active conversation based on URL params", async () => {
    render(<ConversationList />);
    await waitFor(() => {
      expect(screen.getByTestId("conversation-row-conv-1")).toHaveAttribute(
        "data-active",
        "true"
      );
      expect(screen.getByTestId("conversation-row-conv-2")).toHaveAttribute(
        "data-active",
        "false"
      );
    });
  });

  it("calls /api/conversations and /api/user/search on mount", async () => {
    render(<ConversationList />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/conversations");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/user/search")
      );
    });
  });

  it("handles non-array response from /api/conversations gracefully", async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === "/api/conversations") {
        return Promise.resolve({ json: () => Promise.resolve({ error: "bad" }) });
      }
      return Promise.resolve({ json: () => Promise.resolve([]) });
    });

    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    render(<ConversationList />);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Expected array for conversations, got:",
        expect.anything()
      );
    });
    consoleSpy.mockRestore();
  });

  it("logs error when /api/conversations fetch fails", async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === "/api/conversations") {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve({ json: () => Promise.resolve([]) });
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<ConversationList />);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch conversations:",
        expect.any(Error)
      );
    });
    consoleSpy.mockRestore();
  });

  it("logs error when /api/user/search fetch fails", async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === "/api/conversations") {
        return Promise.resolve({ json: () => Promise.resolve([]) });
      }
      return Promise.reject(new Error("Friend fetch error"));
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<ConversationList />);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch friends:",
        expect.any(Error)
      );
    });
    consoleSpy.mockRestore();
  });


  it("refetches conversations on window focus", async () => {
    render(<ConversationList />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() => {
      const convCalls = (global.fetch as jest.Mock).mock.calls.filter(
        ([url]: [string]) => url === "/api/conversations"
      );
      expect(convCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("removes the focus listener on unmount", async () => {
    const removeListenerSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = render(<ConversationList />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    unmount();
    expect(removeListenerSpy).toHaveBeenCalledWith("focus", expect.any(Function));
    removeListenerSpy.mockRestore();
  });

  it("navigates to a conversation and clears unread flag", async () => {
    render(<ConversationList />);
    await waitFor(() =>
      expect(screen.getByTestId("conversation-row-conv-2")).toBeInTheDocument()
    );

    const navigateBtn = screen
      .getByTestId("conversation-row-conv-2")
      .querySelector("button");
    await userEvent.click(navigateBtn!);

    expect(mockPush).toHaveBeenCalledWith("/messages/conv-2");
  });

  it("removes a deleted conversation from the list", async () => {
    render(<ConversationList />);
    await waitFor(() =>
      expect(screen.getByTestId("conversation-row-conv-2")).toBeInTheDocument()
    );

    const deleteBtn = screen
      .getByTestId("conversation-row-conv-2")
      .querySelectorAll("button")[1];
    await userEvent.click(deleteBtn!);

    await waitFor(() => {
      expect(
        screen.queryByTestId("conversation-row-conv-2")
      ).not.toBeInTheDocument();
    });
  });

  it("navigates to /messages when the active conversation is deleted", async () => {
    render(<ConversationList />);
    await waitFor(() =>
      expect(screen.getByTestId("conversation-row-conv-1")).toBeInTheDocument()
    );

    const deleteBtn = screen
      .getByTestId("conversation-row-conv-1")
      .querySelectorAll("button")[1];
    await userEvent.click(deleteBtn!);

    expect(mockPush).toHaveBeenCalledWith("/messages");
  });

  it("opens the CreateGroupModal when Group button is clicked", async () => {
    render(<ConversationList />);
    await userEvent.click(screen.getByRole("button", { name: /group/i }));
    expect(screen.getByTestId("create-group-modal")).toBeInTheDocument();
  });

  it("closes the modal when onClose is called", async () => {
    render(<ConversationList />);
    await userEvent.click(screen.getByRole("button", { name: /group/i }));
    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByTestId("create-group-modal")).not.toBeInTheDocument();
  });

  it("adds a newly created conversation and navigates to it", async () => {
    render(<ConversationList />);
    await waitFor(() =>
      expect(screen.getByTestId("conversation-row-conv-1")).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: /group/i }));
    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByTestId("conversation-row-new-conv-id")).toBeInTheDocument();
    });
    expect(mockPush).toHaveBeenCalledWith("/messages/new-conv-id");
  });

  it("does not duplicate a conversation that already exists when created via modal", async () => {
    jest.mock("@/components/messaging/CreateGroupModal", () => ({
      CreateGroupModal: ({
        onClose: _onClose,
        onCreated,
      }: {
        friends: unknown[];
        onClose: () => void;
        onCreated: (conv: { id: string }) => void;
      }) => (
        <div data-testid="create-group-modal">
          <Button onClick={() => onCreated({ id: "conv-1" })}>Create Duplicate</Button>
        </div>
      ),
    }));

    const { rerender } = render(<ConversationList />);
    await waitFor(() =>
      expect(screen.getByTestId("conversation-row-conv-1")).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: /group/i }));
    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    rerender(<ConversationList />);

    const rows = screen.getAllByTestId(/conversation-row-conv-1/);
    expect(rows).toHaveLength(1);
  });

  it("subscribes to the user Pusher channel on mount", async () => {
    render(<ConversationList />);
    await waitFor(() => {
      expect(pusherMocks.subscribe).toHaveBeenCalledWith("user-user-123");
    });
  });

  it("unsubscribes from Pusher on unmount", async () => {
    const { unmount } = render(<ConversationList />);
    await waitFor(() => expect(pusherMocks.subscribe).toHaveBeenCalled());
    unmount();
    expect(pusherMocks.unbind).toHaveBeenCalled();
    expect(pusherMocks.unsubscribe).toHaveBeenCalledWith("user-user-123");
  });

  it("does not subscribe when there is no session user id", () => {
    (useSession as jest.Mock).mockReturnValue({ data: null });
    render(<ConversationList />);
    expect(pusherMocks.subscribe).not.toHaveBeenCalled();
  });

  it("updates an existing conversation on conversation-updated event", async () => {
    render(<ConversationList />);
    await waitFor(() =>
      expect(screen.getByTestId("conversation-row-conv-2")).toBeInTheDocument()
    );

    act(() => {
      channelHandlers["conversation-updated"]({
        id: "conv-2",
        lastMessage: "Updated message",
        lastMessageAt: "2024-01-01T11:00:00Z",
        senderId: "other-user",
      });
    });

    await waitFor(() => {
      const rows = screen.getAllByTestId(/conversation-row-conv/);
      expect(rows[0]).toHaveAttribute("data-testid", "conversation-row-conv-2");
    });
  });

  it("marks conversation as read when updated by current user", async () => {
    render(<ConversationList />);
    await waitFor(() =>
      expect(screen.getByTestId("conversation-row-conv-2")).toBeInTheDocument()
    );

    act(() => {
      channelHandlers["conversation-updated"]({
        id: "conv-2",
        lastMessage: "My message",
        senderId: "user-123",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("conversation-row-conv-2")).toBeInTheDocument();
    });
  });

  it("does not mark as unread when the conversation is currently active", async () => {
    render(<ConversationList />);
    await waitFor(() =>
      expect(screen.getByTestId("conversation-row-conv-1")).toBeInTheDocument()
    );

    act(() => {
      channelHandlers["conversation-updated"]({
        id: "conv-1",
        lastMessage: "New msg",
        senderId: "other-user",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("conversation-row-conv-1")).toBeInTheDocument();
    });
  });

  it("triggers a full refetch when conversation-updated has refetch: true", async () => {
    render(<ConversationList />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    act(() => {
      channelHandlers["conversation-updated"]({ id: "conv-1", refetch: true });
    });

    await waitFor(() => {
      const convCalls = (global.fetch as jest.Mock).mock.calls.filter(
        ([url]: [string]) => url === "/api/conversations"
      );
      expect(convCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("triggers a full refetch when updated conversation is not in the local list", async () => {
    render(<ConversationList />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    act(() => {
      channelHandlers["conversation-updated"]({
        id: "conv-unknown",
        lastMessage: "hello",
      });
    });

    await waitFor(() => {
      const convCalls = (global.fetch as jest.Mock).mock.calls.filter(
        ([url]: [string]) => url === "/api/conversations"
      );
      expect(convCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("removes conversation from list on conversation-deleted Pusher event", async () => {
    render(<ConversationList />);
    await waitFor(() =>
      expect(screen.getByTestId("conversation-row-conv-2")).toBeInTheDocument()
    );

    act(() => {
      channelHandlers["conversation-deleted"]({ id: "conv-2" });
    });

    await waitFor(() => {
      expect(
        screen.queryByTestId("conversation-row-conv-2")
      ).not.toBeInTheDocument();
    });
  });

  it("navigates to /messages on conversation-deleted when active conv is deleted", async () => {
    render(<ConversationList />);
    await waitFor(() =>
      expect(screen.getByTestId("conversation-row-conv-1")).toBeInTheDocument()
    );

    act(() => {
      channelHandlers["conversation-deleted"]({ id: "conv-1" });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/messages");
    });
  });
});