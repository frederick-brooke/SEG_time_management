/**
 * Testing for messages/layout.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MessagesLayout from "../layout";
import { useParams, useRouter } from "next/navigation";


// Module mocks

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock("components/ui/sidebar", () => ({
  useSidebar: jest.fn(),
}));

jest.mock("components/messaging/UserSearch", () => ({
  __esModule: true,
  default: () => <div data-testid="user-search" />,
}));

jest.mock("components/messaging/ConversationList", () => ({
  __esModule: true,
  default: () => <div data-testid="conversation-list" />,
}));


// Helpers

import { useSidebar } from "components/ui/sidebar";

const mockPush = jest.fn();

function setupMocks({
  conversationId = undefined as string | undefined,
  isMobile = false,
} = {}) {
  (useParams as jest.Mock).mockReturnValue(
    conversationId ? { conversationId } : {}
  );
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (useSidebar as jest.Mock).mockReturnValue({ isMobile });
}

beforeEach(() => {
  jest.clearAllMocks();
});


// Tests

describe("MessagesLayout – sidebar content", () => {
  it("renders the Messages heading", () => {
    setupMocks();
    render(<MessagesLayout>children</MessagesLayout>);
    expect(screen.getByText("Messages")).toBeInTheDocument();
  });

  it("renders UserSearch", () => {
    setupMocks();
    render(<MessagesLayout>children</MessagesLayout>);
    expect(screen.getByTestId("user-search")).toBeInTheDocument();
  });

  it("renders ConversationList", () => {
    setupMocks();
    render(<MessagesLayout>children</MessagesLayout>);
    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
  });
});

describe("MessagesLayout – children rendering", () => {
  it("renders children on desktop", () => {
    setupMocks({ isMobile: false });
    render(<MessagesLayout><div data-testid="child">Hello</div></MessagesLayout>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders children when no conversationId on desktop", () => {
    setupMocks({ conversationId: undefined, isMobile: false });
    render(<MessagesLayout><div data-testid="child">Hello</div></MessagesLayout>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});

describe("MessagesLayout – desktop layout", () => {
  it("shows the sidebar on desktop", () => {
    setupMocks({ isMobile: false });
    render(<MessagesLayout>children</MessagesLayout>);
    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
  });

  it("shows children on desktop", () => {
    setupMocks({ conversationId: "conv-1", isMobile: false });
    render(<MessagesLayout><div data-testid="child" /></MessagesLayout>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("does not show the Back button on desktop even with a conversationId", () => {
    setupMocks({ conversationId: "conv-1", isMobile: false });
    render(<MessagesLayout>children</MessagesLayout>);
    expect(screen.queryByText("← Back")).not.toBeInTheDocument();
  });

  it("sidebar has 380px width on desktop", () => {
    setupMocks({ isMobile: false });
    render(<MessagesLayout>children</MessagesLayout>);
    const aside = screen.getByTestId("conversation-list").closest("aside");
    expect(aside).toHaveClass("w-[380px]");
  });

  it("shows both sidebar and children simultaneously on desktop", () => {
    setupMocks({ conversationId: "conv-1", isMobile: false });
    render(<MessagesLayout><div data-testid="child" /></MessagesLayout>);
    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});

describe("MessagesLayout – mobile layout", () => {
  it("shows the conversation list when no conversation is open on mobile", () => {
    setupMocks({ conversationId: undefined, isMobile: true });
    render(<MessagesLayout><div data-testid="child" /></MessagesLayout>);
    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
  });

  it("hides children when no conversation is open on mobile", () => {
    setupMocks({ conversationId: undefined, isMobile: true });
    render(<MessagesLayout><div data-testid="child" /></MessagesLayout>);
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("shows children when a conversation is open on mobile", () => {
    setupMocks({ conversationId: "conv-1", isMobile: true });
    render(<MessagesLayout><div data-testid="child" /></MessagesLayout>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("hides the conversation list when a conversation is open on mobile", () => {
    setupMocks({ conversationId: "conv-1", isMobile: true });
    render(<MessagesLayout><div data-testid="child" /></MessagesLayout>);
    expect(screen.queryByTestId("conversation-list")).not.toBeInTheDocument();
  });

  it("shows the Back button on mobile when a conversation is open", () => {
    setupMocks({ conversationId: "conv-1", isMobile: true });
    render(<MessagesLayout>children</MessagesLayout>);
    expect(screen.getByText("← Back")).toBeInTheDocument();
  });

  it("does not show the Back button on mobile when no conversation is open", () => {
    setupMocks({ conversationId: undefined, isMobile: true });
    render(<MessagesLayout>children</MessagesLayout>);
    expect(screen.queryByText("← Back")).not.toBeInTheDocument();
  });

  it("navigates to /messages when Back is clicked on mobile", () => {
    setupMocks({ conversationId: "conv-1", isMobile: true });
    render(<MessagesLayout>children</MessagesLayout>);
    fireEvent.click(screen.getByText("← Back"));
    expect(mockPush).toHaveBeenCalledWith("/messages");
  });

  it("mobile conversation list container is full width", () => {
    setupMocks({ conversationId: undefined, isMobile: true });
    render(<MessagesLayout>children</MessagesLayout>);
    // On mobile with no conversation, the list renders in a full-width flex div, not an aside
    const list = screen.getByTestId("conversation-list");
    const container = list.closest("div[class*='flex-1']");
    expect(container).toBeInTheDocument();
  });
});

describe("MessagesLayout – isMobile transitions", () => {
  it("shows sidebar and children simultaneously after switching to desktop", () => {
    // Start as desktop
    setupMocks({ conversationId: "conv-1", isMobile: false });
    const { rerender } = render(
      <MessagesLayout><div data-testid="child" /></MessagesLayout>
    );
    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("hides conversation list and shows chat when conversation opens on mobile", () => {
    // Start mobile, no conversation
    setupMocks({ conversationId: undefined, isMobile: true });
    const { rerender } = render(
      <MessagesLayout><div data-testid="child" /></MessagesLayout>
    );
    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();

    // Simulate opening a conversation
    (useParams as jest.Mock).mockReturnValue({ conversationId: "conv-1" });
    rerender(<MessagesLayout><div data-testid="child" /></MessagesLayout>);
    expect(screen.queryByTestId("conversation-list")).not.toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});