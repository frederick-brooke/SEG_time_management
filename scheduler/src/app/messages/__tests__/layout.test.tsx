import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import MessagesLayout from "../layout";
import { useParams, useRouter } from "next/navigation";

// Module mocks

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
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

const mockPush = jest.fn();

function setupMocks({
  conversationId = undefined as string | undefined,
} = {}) {
  (useParams as jest.Mock).mockReturnValue(
    conversationId ? { conversationId } : {}
  );
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setViewportWidth(1024); // default to desktop
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

  it("renders the back arrow button to dashboard", () => {
    setupMocks();
    render(<MessagesLayout>children</MessagesLayout>);
    expect(screen.getByText("←")).toBeInTheDocument();
  });

  it("navigates to /dashboard when back arrow is clicked", () => {
    setupMocks();
    render(<MessagesLayout>children</MessagesLayout>);
    fireEvent.click(screen.getByText("←"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});

describe("MessagesLayout – children rendering", () => {
  it("renders children", () => {
    setupMocks();
    render(<MessagesLayout><div data-testid="child">Hello</div></MessagesLayout>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders children when no conversationId", () => {
    setupMocks({ conversationId: undefined });
    render(<MessagesLayout><div data-testid="child">Hello</div></MessagesLayout>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});

describe("MessagesLayout – desktop layout", () => {
  it("shows the sidebar on desktop", () => {
    setViewportWidth(1024);
    setupMocks();
    render(<MessagesLayout>children</MessagesLayout>);
    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
  });

  it("shows children on desktop", () => {
    setViewportWidth(1024);
    setupMocks({ conversationId: "conv-1" });
    render(<MessagesLayout><div data-testid="child" /></MessagesLayout>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("does not show the Back button on desktop even with a conversationId", () => {
    setViewportWidth(1024);
    setupMocks({ conversationId: "conv-1" });
    render(<MessagesLayout>children</MessagesLayout>);
    expect(screen.queryByText("← Back")).not.toBeInTheDocument();
  });

  it("sidebar has 380px width on desktop", () => {
    setViewportWidth(1024);
    setupMocks();
    render(<MessagesLayout>children</MessagesLayout>);
    const aside = screen.getByTestId("conversation-list").closest("aside");
    expect(aside).toHaveStyle({ width: "380px" });
  });
});

describe("MessagesLayout – mobile layout", () => {
  it("shows the sidebar and hides children when no conversation is open on mobile", () => {
    setViewportWidth(375);
    setupMocks({ conversationId: undefined });
    render(<MessagesLayout><div data-testid="child" /></MessagesLayout>);

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("hides the sidebar and shows children when a conversation is open on mobile", () => {
    setViewportWidth(375);
    setupMocks({ conversationId: "conv-1" });
    render(<MessagesLayout><div data-testid="child" /></MessagesLayout>);

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("shows the Back button on mobile when a conversation is open", () => {
    setViewportWidth(375);
    setupMocks({ conversationId: "conv-1" });
    render(<MessagesLayout>children</MessagesLayout>);

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.getByText("← Back")).toBeInTheDocument();
  });

  it("does not show the Back button on mobile when no conversation is open", () => {
    setViewportWidth(375);
    setupMocks({ conversationId: undefined });
    render(<MessagesLayout>children</MessagesLayout>);

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.queryByText("← Back")).not.toBeInTheDocument();
  });

  it("navigates to /messages and opens sidebar when Back is clicked", () => {
    setViewportWidth(375);
    setupMocks({ conversationId: "conv-1" });
    render(<MessagesLayout>children</MessagesLayout>);

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    fireEvent.click(screen.getByText("← Back"));
    expect(mockPush).toHaveBeenCalledWith("/messages");
  });

  it("sidebar is full width on mobile", () => {
    setViewportWidth(375);
    setupMocks({ conversationId: undefined });
    render(<MessagesLayout>children</MessagesLayout>);

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    const aside = screen.getByTestId("conversation-list").closest("aside");
    expect(aside).toHaveStyle({ width: "100vw" });
  });
});

describe("MessagesLayout – resize behaviour", () => {
  it("cleans up resize listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    setupMocks();
    const { unmount } = render(<MessagesLayout>children</MessagesLayout>);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );
  });

  it("shows sidebar on desktop after resizing from mobile", () => {
    setViewportWidth(375);
    setupMocks({ conversationId: "conv-1" });
    render(<MessagesLayout><div data-testid="child" /></MessagesLayout>);

    act(() => { window.dispatchEvent(new Event("resize")); });
    expect(screen.getByTestId("child")).toBeInTheDocument();

    // Resize to desktop
    setViewportWidth(1024);
    act(() => { window.dispatchEvent(new Event("resize")); });

    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});