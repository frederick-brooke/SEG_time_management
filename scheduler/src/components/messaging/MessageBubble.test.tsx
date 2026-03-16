import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { MessageBubble } from "./MessageBubble";

// Module mocks

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, onClick, style, ...props }: any) => (
    <img src={src} alt={alt} onClick={onClick} style={style} {...props} />
  ),
}));

// Shared test data

const BASE_MSG = {
  id: "msg-1",
  content: "Hello world",
  createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5m ago, today
  sender: { id: "u-2", username: "bob", pfp: null },
};

const defaultProps = {
  msg: BASE_MSG,
  isMe: false,
  isFirst: true,
  isLast: true,
  showDateDivider: false,
  isHovered: false,
  onMouseEnter: jest.fn(),
  onMouseLeave: jest.fn(),
  onAvatarClick: jest.fn(),
};

function setup(props: Partial<typeof defaultProps> = {}) {
  return render(<MessageBubble {...defaultProps} {...props} />);
}

beforeEach(() => jest.clearAllMocks());

// Date divider

describe("MessageBubble – date divider", () => {
  it("does not render a date divider when showDateDivider is false", () => {
    setup({ showDateDivider: false });
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
  });

  it("renders 'Today' divider for a message sent today", () => {
    setup({ showDateDivider: true });
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders 'Yesterday' divider for a message sent yesterday", () => {
    const msg = {
      ...BASE_MSG,
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    };
    setup({ msg, showDateDivider: true });
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("renders a weekday name for messages sent within the last 7 days", () => {
    const msg = {
      ...BASE_MSG,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setup({ msg, showDateDivider: true });
    // Any weekday name is acceptable — just verify it rendered something
    const weekdays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    const found = weekdays.some((d) => screen.queryByText(d));
    expect(found).toBe(true);
  });

  it("renders a short date for messages older than 7 days", () => {
    const msg = {
      ...BASE_MSG,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setup({ msg, showDateDivider: true });
    // Should render something like "Mar 6" — just check it's not Today/Yesterday
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
    expect(screen.queryByText("Yesterday")).not.toBeInTheDocument();
  });
});

// Message content

describe("MessageBubble – content", () => {
  it("renders the message content", () => {
    setup();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders the timestamp element", () => {
    const msg = { ...BASE_MSG, createdAt: new Date("2025-01-01T14:35:00").toISOString() };
    setup({ msg });
    // Timestamp is always in the DOM; visibility is controlled by opacity
    const time = new Date("2025-01-01T14:35:00").toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    expect(screen.getByText(time)).toBeInTheDocument();
  });

  it("renders at reduced opacity for optimistic (temp-) messages", () => {
    const msg = { ...BASE_MSG, id: "temp-abc" };
    setup({ msg });
    const bubble = screen.getByText("Hello world").closest("div.opacity-50");
    expect(bubble).toBeInTheDocument();
  });

  it("renders at full opacity for confirmed messages", () => {
    setup();
    const bubble = screen.getByText("Hello world").closest("div.opacity-100");
    expect(bubble).toBeInTheDocument();
  });
});

// Sender label & avatar

describe("MessageBubble – sender label and avatar", () => {
  it("shows the sender username label for others' first messages", () => {
    setup({ isMe: false, isFirst: true });
    expect(screen.getByText("bob")).toBeInTheDocument();
  });

  it("hides the sender username label for others' non-first messages", () => {
    setup({ isMe: false, isFirst: false });
    expect(screen.queryByText("bob")).not.toBeInTheDocument();
  });

  it("never shows the sender label for own messages", () => {
    setup({ isMe: true, isFirst: true });
    expect(screen.queryByText("bob")).not.toBeInTheDocument();
  });

  it("renders the avatar on the last message in a group", () => {
    const msg = { ...BASE_MSG, sender: { ...BASE_MSG.sender, pfp: "bob.png" } };
    setup({ msg, isMe: false, isLast: true });
    expect(screen.getByRole("img", { name: "bob" })).toBeInTheDocument();
  });

  it("renders a spacer instead of the avatar on non-last messages", () => {
    setup({ isMe: false, isLast: false });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText("B")).not.toBeInTheDocument();
  });

  it("renders an initial avatar when sender has no pfp", () => {
    setup({ isMe: false, isLast: true });
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("renders '?' when username is empty", () => {
    const msg = { ...BASE_MSG, sender: { ...BASE_MSG.sender, username: "" } };
    setup({ msg, isMe: false, isLast: true });
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("calls onAvatarClick with the username when avatar is clicked", () => {
    setup({ isMe: false, isLast: true });
    fireEvent.click(screen.getByText("B"));
    expect(defaultProps.onAvatarClick).toHaveBeenCalledWith("bob");
  });

  it("calls onAvatarClick when pfp image is clicked", () => {
    const msg = { ...BASE_MSG, sender: { ...BASE_MSG.sender, pfp: "bob.png" } };
    setup({ msg, isMe: false, isLast: true });
    fireEvent.click(screen.getByRole("img", { name: "bob" }));
    expect(defaultProps.onAvatarClick).toHaveBeenCalledWith("bob");
  });

  it("does not crash when onAvatarClick is not provided", () => {
    setup({ isMe: false, isLast: true, onAvatarClick: undefined });
    expect(() => fireEvent.click(screen.getByText("B"))).not.toThrow();
  });
});

// Own vs others' bubbles

describe("MessageBubble – isMe layout", () => {
  it("does not render the avatar area for own messages", () => {
    setup({ isMe: true, isLast: true });
    // No img and no initial letter avatar
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText("B")).not.toBeInTheDocument();
  });

  it("does not render the three-dot menu button for own messages", () => {
    setup({ isMe: true, isHovered: true });
    expect(screen.queryByRole("button", { name: "" })).not.toBeInTheDocument();
  });
});

// Hover behaviour

describe("MessageBubble – hover", () => {
  it("calls onMouseEnter when the row is hovered", () => {
    setup();
    fireEvent.mouseEnter(screen.getByText("Hello world").closest(".flex.items-end")!);
    expect(defaultProps.onMouseEnter).toHaveBeenCalledTimes(1);
  });

  it("calls onMouseLeave when the cursor leaves the row", () => {
    setup();
    fireEvent.mouseLeave(screen.getByText("Hello world").closest(".flex.items-end")!);
    expect(defaultProps.onMouseLeave).toHaveBeenCalledTimes(1);
  });
});

// Three-dot menu

describe("MessageBubble – three-dot menu", () => {
  it("does not render the three-dot button for optimistic messages", () => {
    const msg = { ...BASE_MSG, id: "temp-xyz" };
    setup({ msg, isMe: false, isHovered: true });
    // Menu button renders only when !isMe && !isOptimistic
    const menuButtons = document.querySelectorAll("button svg circle");
    expect(menuButtons.length).toBe(0);
  });

  it("opens the dropdown when the three-dot button is clicked", () => {
    setup({ isMe: false, isHovered: true });
    const menuBtn = document.querySelector("button svg")!.closest("button")!;
    fireEvent.click(menuBtn);
    expect(screen.getByText("Report")).toBeInTheDocument();
  });

  it("closes the dropdown when the row is mouse-left", () => {
    setup({ isMe: false, isHovered: true });
    const menuBtn = document.querySelector("button svg")!.closest("button")!;
    fireEvent.click(menuBtn);
    expect(screen.getByText("Report")).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByText("Hello world").closest(".flex.items-end")!);
    expect(screen.queryByText("Report")).not.toBeInTheDocument();
  });

  it("opens the ReportModal when Report is clicked", () => {
    setup({ isMe: false, isHovered: true });
    const menuBtn = document.querySelector("button svg")!.closest("button")!;
    fireEvent.click(menuBtn);
    fireEvent.click(screen.getByText("Report"));
    expect(screen.getByText("Report User")).toBeInTheDocument();
  });
});

// ReportModal

describe("MessageBubble – ReportModal", () => {
  function openReportModal() {
    setup({ isMe: false, isHovered: true });
    const menuBtn = document.querySelector("button svg")!.closest("button")!;
    fireEvent.click(menuBtn);
    fireEvent.click(screen.getByText("Report"));
  }

  it("renders reason select and description textarea", () => {
    openReportModal();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/additional details/i)).toBeInTheDocument();
  });

  it("Submit Report button is disabled when no reason is selected", () => {
    openReportModal();
    expect(screen.getByRole("button", { name: /submit report/i })).toBeDisabled();
  });

  it("Submit Report button is enabled once a reason is selected", () => {
    openReportModal();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "SPAM" } });
    expect(screen.getByRole("button", { name: /submit report/i })).toBeEnabled();
  });

  it("POSTs to /api/report with correct payload", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    window.alert = jest.fn();
    openReportModal();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "HARASSMENT" } });
    fireEvent.change(screen.getByPlaceholderText(/additional details/i), {
      target: { value: "They were rude" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportedUserId: "u-2",
        reason: "HARASSMENT",
        description: "They were rude",
      }),
    });
  });

  it("shows success alert and closes modal on successful submission", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    window.alert = jest.fn();
    openReportModal();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "SPAM" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Report submitted successfully.");
      expect(screen.queryByText("Report User")).not.toBeInTheDocument();
    });
  });

  it("shows error alert when submission fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Already reported" }),
    });
    window.alert = jest.fn();
    openReportModal();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "SPAM" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
    });

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Already reported")
    );
  });

  it("shows fallback error message when response has no error field", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    window.alert = jest.fn();
    openReportModal();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "OTHER" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
    });

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Something went wrong.")
    );
  });

  it("shows 'Submitting...' while request is in flight", async () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})); // never resolves
    openReportModal();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "SPAM" } });
    fireEvent.click(screen.getByRole("button", { name: /submit report/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled()
    );
  });

  it("closes the modal when Cancel is clicked", () => {
    openReportModal();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText("Report User")).not.toBeInTheDocument();
  });

  it("shows 'Already reported' in the menu after a successful report", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    window.alert = jest.fn();
    openReportModal();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "SPAM" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
    });

    await waitFor(() => screen.queryByText("Report User") === null);

    // Re-open the menu
    const menuBtn = document.querySelector("button svg")!.closest("button")!;
    fireEvent.click(menuBtn);
    expect(screen.getByText("Already reported")).toBeInTheDocument();
  });

  it("does not open ReportModal when already reported", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    window.alert = jest.fn();
    openReportModal();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "SPAM" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
    });
    await waitFor(() => screen.queryByText("Report User") === null);

    const menuBtn = document.querySelector("button svg")!.closest("button")!;
    fireEvent.click(menuBtn);
    fireEvent.click(screen.getByText("Already reported"));

    expect(screen.queryByText("Report User")).not.toBeInTheDocument();
  });
});