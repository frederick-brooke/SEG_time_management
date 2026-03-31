/**
 * Testing for ConversationRow component.
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ConversationRow, Conversation } from "@/components/messaging/ConversationRow";

// Mocks

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

jest.mock("@/lib/avatar", () => ({
  resolveAvatarSrc: (pfp: string | null) => (pfp ? `/resolved/${pfp}` : null),
}));

global.fetch = jest.fn();
global.confirm = jest.fn();

// Fixtures

const CURRENT_USER_ID = "user-1";

const makeDirectConvo = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: "convo-1",
  lastMessage: "Hey there!",
  lastMessageAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  lastMessageSentByMe: false,
  hasUnread: false,
  isGroup: false,
  name: null,
  participants: [
    {
      user: {
        id: CURRENT_USER_ID,
        username: "me",
        fname: "Me",
        lname: "User",
        pfp: null,
      },
    },
    {
      user: {
        id: "user-2",
        username: "alice",
        fname: "Alice",
        lname: "Smith",
        pfp: null,
      },
    },
  ],
  ...overrides,
});

const makeGroupConvo = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: "convo-group-1",
  lastMessage: "Hello group!",
  lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  lastMessageSentByMe: false,
  hasUnread: false,
  isGroup: true,
  name: "Team Chat",
  participants: [
    { user: { id: CURRENT_USER_ID, username: "me", fname: "Me", lname: "User", pfp: null } },
    { user: { id: "user-2", username: "alice", fname: "Alice", lname: "Smith", pfp: null } },
    { user: { id: "user-3", username: "bob", fname: "Bob", lname: "Jones", pfp: null } },
  ],
  ...overrides,
});

const defaultProps = {
  isActive: false,
  currentUserId: CURRENT_USER_ID,
  onNavigate: jest.fn(),
  onDeleted: jest.fn(),
};


// Helpers

function renderConvo(convo: Conversation, props = {}) {
  return render(<ConversationRow convo={convo} {...defaultProps} {...props} />);
}

// Tests

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ConversationRow — direct conversation", () => {
  it("renders the other participant's full name", () => {
    renderConvo(makeDirectConvo());
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("falls back to username when fname/lname are null", () => {
    const convo = makeDirectConvo();
    convo.participants[1].user.fname = null;
    convo.participants[1].user.lname = null;
    renderConvo(convo);
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("renders the last message text", () => {
    renderConvo(makeDirectConvo());
    expect(screen.getByText("Hey there!")).toBeInTheDocument();
  });

  it("shows 'Start a conversation' when lastMessage is null", () => {
    renderConvo(makeDirectConvo({ lastMessage: null, lastMessageAt: null }));
    expect(screen.getByText("Start a conversation")).toBeInTheDocument();
  });

  it("renders avatar image when pfp is provided", () => {
    const convo = makeDirectConvo();
    convo.participants[1].user.pfp = "avatar.png";
    renderConvo(convo);
    const img = screen.getByRole("img", { name: "Alice Smith" });
    expect(img).toHaveAttribute("src", "/resolved/avatar.png");
  });

  it("renders initials avatar when pfp is null", () => {
    renderConvo(makeDirectConvo());
    expect(screen.getByText("A")).toBeInTheDocument(); // first letter of "alice"
  });

  it("returns null when the other participant cannot be found", () => {
    const convo = makeDirectConvo();
    // Remove the other participant
    convo.participants = convo.participants.filter((p) => p.user.id === CURRENT_USER_ID);
    const { container } = renderConvo(convo);
    expect(container.firstChild).toBeNull();
  });

  it("does NOT show the Group badge for direct convos", () => {
    renderConvo(makeDirectConvo());
    expect(screen.queryByText("Group")).not.toBeInTheDocument();
  });
});

describe("ConversationRow — group conversation", () => {
  it("renders the group name", () => {
    renderConvo(makeGroupConvo());
    expect(screen.getByText("Team Chat")).toBeInTheDocument();
  });

  it("shows the Group badge", () => {
    renderConvo(makeGroupConvo());
    expect(screen.getByText("Group")).toBeInTheDocument();
  });

  it("renders the first letter of the group name as avatar", () => {
    renderConvo(makeGroupConvo());
    expect(screen.getByText("T")).toBeInTheDocument(); // "Team Chat"[0]
  });

  it("falls back to 'G' avatar letter when group name is null", () => {
    renderConvo(makeGroupConvo({ name: null }));
    expect(screen.getByText("G")).toBeInTheDocument();
  });
});

describe("ConversationRow — active state", () => {
  it("applies active styles when isActive is true", () => {
    const { container } = renderConvo(makeDirectConvo(), { isActive: true });
    const row = container.firstChild as HTMLElement;
    expect(row.className).toContain("bg-[rgba(88,101,242,0.12)]");
  });

  it("does not apply active styles when isActive is false", () => {
    const { container } = renderConvo(makeDirectConvo(), { isActive: false });
    const row = container.firstChild as HTMLElement;
    expect(row.className).not.toContain("bg-[rgba(88,101,242,0.12)]");
  });
});

describe("ConversationRow — unread indicator", () => {
  it("renders unread dot when hasUnread is true", () => {
    const { container } = renderConvo(makeDirectConvo({ hasUnread: true }));
    const dot = container.querySelector(".rounded-full.bg-\\[rgba\\(99\\,149\\,255\\,0\\.95\\)\\]");
    expect(dot).toBeInTheDocument();
  });

  it("does not render unread dot when hasUnread is false", () => {
    const { container } = renderConvo(makeDirectConvo({ hasUnread: false }));
    const dot = container.querySelector(".bg-\\[rgba\\(99\\,149\\,255\\,0\\.95\\)\\]");
    expect(dot).not.toBeInTheDocument();
  });

  it("applies font-semibold to name when hasUnread is true", () => {
    renderConvo(makeDirectConvo({ hasUnread: true }));
    const name = screen.getByText("Alice Smith");
    expect(name.className).toContain("font-semibold");
  });
});

describe("ConversationRow — delivery tick", () => {
  it("shows delivery tick when lastMessageSentByMe is true", () => {
    const { container } = renderConvo(makeDirectConvo({ lastMessageSentByMe: true }));
    const tick = container.querySelector("svg[aria-hidden]");
    expect(tick).toBeInTheDocument();
  });

  it("does not show delivery tick when lastMessageSentByMe is false", () => {
    const { container } = renderConvo(makeDirectConvo({ lastMessageSentByMe: false }));
    const svgs = container.querySelectorAll("svg[aria-hidden]");
    expect(svgs).toHaveLength(0);
  });

  it("does not show delivery tick when lastMessage is null", () => {
    const { container } = renderConvo(
      makeDirectConvo({ lastMessage: null, lastMessageAt: null, lastMessageSentByMe: true })
    );
    const svgs = container.querySelectorAll("svg[aria-hidden]");
    expect(svgs).toHaveLength(0);
  });
});

describe("ConversationRow — timestamp formatting", () => {
  it("shows 'now' for timestamps under 1 minute ago", () => {
    const convo = makeDirectConvo({
      lastMessageAt: new Date(Date.now() - 30 * 1000).toISOString(),
    });
    renderConvo(convo);
    expect(screen.getByText("now")).toBeInTheDocument();
  });

  it("shows minutes label for timestamps between 1–59 minutes ago", () => {
    const convo = makeDirectConvo({
      lastMessageAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    });
    renderConvo(convo);
    expect(screen.getByText("15m")).toBeInTheDocument();
  });

  it("shows hours label for timestamps between 1–23 hours ago", () => {
    const convo = makeDirectConvo({
      lastMessageAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    });
    renderConvo(convo);
    expect(screen.getByText("3h")).toBeInTheDocument();
  });

  it("shows days label for timestamps between 1–6 days ago", () => {
    const convo = makeDirectConvo({
      lastMessageAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    });
    renderConvo(convo);
    expect(screen.getByText("2d")).toBeInTheDocument();
  });

  it("shows weeks label for timestamps between 1–4 weeks ago", () => {
    const convo = makeDirectConvo({
      lastMessageAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    });
    renderConvo(convo);
    expect(screen.getByText("2w")).toBeInTheDocument();
  });

  it("shows locale date for timestamps older than ~5 weeks", () => {
    const old = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    const convo = makeDirectConvo({ lastMessageAt: old.toISOString() });
    renderConvo(convo);
    const expected = old.toLocaleDateString([], { month: "short", day: "numeric" });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("renders no timestamp section when lastMessageAt is null", () => {
    renderConvo(makeDirectConvo({ lastMessageAt: null }));
    expect(screen.queryByText("·")).not.toBeInTheDocument();
  });
});

describe("ConversationRow — navigation", () => {
  it("calls onNavigate with the conversation id when the row is clicked", () => {
    const onNavigate = jest.fn();
    renderConvo(makeDirectConvo(), { onNavigate });
    fireEvent.click(screen.getByText("Alice Smith"));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith("convo-1");
  });
});

describe("ConversationMenu — three-dot menu", () => {
  it("does not show the dropdown by default", () => {
    renderConvo(makeDirectConvo());
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("opens the dropdown when the three-dot button is clicked", () => {
    renderConvo(makeDirectConvo());
    const menuBtn = screen.getByTitle("More options");
    fireEvent.click(menuBtn);
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("closes the dropdown when clicking outside", async () => {
    renderConvo(makeDirectConvo());
    fireEvent.click(screen.getByTitle("More options"));
    expect(screen.getByText("Delete")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    });
  });

  it("does not open or close the dropdown AND does not navigate when clicking menu button", () => {
    const onNavigate = jest.fn();
    renderConvo(makeDirectConvo(), { onNavigate });
    fireEvent.click(screen.getByTitle("More options"));
    expect(onNavigate).not.toHaveBeenCalled();
  });
});

describe("ConversationMenu — delete action", () => {
  it("does NOT call fetch when user cancels the confirmation", async () => {
    (global.confirm as jest.Mock).mockReturnValue(false);
    renderConvo(makeDirectConvo());
    fireEvent.click(screen.getByTitle("More options"));
    fireEvent.click(screen.getByText("Delete"));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("calls DELETE on the correct endpoint when confirmed", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    renderConvo(makeDirectConvo());
    fireEvent.click(screen.getByTitle("More options"));
    await act(async () => {
      fireEvent.click(screen.getByText("Delete"));
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/conversations/convo-1", { method: "DELETE" });
  });

  it("calls onDeleted with conversation id after a successful delete", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    const onDeleted = jest.fn();

    renderConvo(makeDirectConvo(), { onDeleted });
    fireEvent.click(screen.getByTitle("More options"));
    await act(async () => {
      fireEvent.click(screen.getByText("Delete"));
    });

    expect(onDeleted).toHaveBeenCalledWith("convo-1");
  });

  it("does NOT call onDeleted when the API returns a non-ok response", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    const onDeleted = jest.fn();
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    renderConvo(makeDirectConvo(), { onDeleted });
    fireEvent.click(screen.getByTitle("More options"));
    await act(async () => {
      fireEvent.click(screen.getByText("Delete"));
    });

    expect(onDeleted).not.toHaveBeenCalled();
    alertMock.mockRestore();
  });

  it("shows an alert when the delete API call fails", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    renderConvo(makeDirectConvo());
    fireEvent.click(screen.getByTitle("More options"));
    await act(async () => {
      fireEvent.click(screen.getByText("Delete"));
    });

    expect(alertMock).toHaveBeenCalledWith("Failed to delete conversation.");
    alertMock.mockRestore();
  });

  it("shows 'Deleting…' while the request is in flight", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    let resolveRequest!: (v: unknown) => void;
    (global.fetch as jest.Mock).mockReturnValue(new Promise((r) => { resolveRequest = r; }));

    renderConvo(makeDirectConvo());
    fireEvent.click(screen.getByTitle("More options"));
    fireEvent.click(screen.getByText("Delete"));

    expect(await screen.findByText("Deleting…")).toBeInTheDocument();

    await act(async () => {
      resolveRequest({ ok: true });
    });
  });

  it("closes the dropdown after deletion completes", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    renderConvo(makeDirectConvo());
    fireEvent.click(screen.getByTitle("More options"));
    await act(async () => {
      fireEvent.click(screen.getByText("Delete"));
    });

    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("does not propagate click to onNavigate when clicking Delete", async () => {
    (global.confirm as jest.Mock).mockReturnValue(false);
    const onNavigate = jest.fn();

    renderConvo(makeDirectConvo(), { onNavigate });
    fireEvent.click(screen.getByTitle("More options"));
    fireEvent.click(screen.getByText("Delete"));

    expect(onNavigate).not.toHaveBeenCalled();
  });
});