import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { MessageBubble, formatDate } from "../MessageBubble";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, onClick, style, ...props }: any) => (
    <img src={src} alt={alt} onClick={onClick} style={style} {...props} />
  ),
}));

const BASE_MSG = {
  id: "msg-1",
  content: "Hello world",
  createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  sender: { id: "u-2", username: "bob", pfp: null },
};

const defaultProps = {
  msg: BASE_MSG,
  isMe: false,
  isFirst: true,
  isLast: true,
  showDateDivider: false,
  dateDividerLabel: "Today",
  isHovered: false,
  onMouseEnter: jest.fn(),
  onMouseLeave: jest.fn(),
  onAvatarClick: jest.fn(),
};

function setup(props: Partial<typeof defaultProps> = {}) {
  return render(<MessageBubble {...defaultProps} {...props} />);
}

beforeEach(() => jest.clearAllMocks());

/* ------------------------- formatDate ------------------------- */

describe("formatDate", () => {
  it("returns 'Today' for a timestamp from today", () => {
    expect(formatDate(new Date().toISOString())).toBe("Today");
  });

  it("returns 'Yesterday' for a timestamp from yesterday", () => {
    const iso = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(formatDate(iso)).toBe("Yesterday");
  });

  it("returns a weekday name for a timestamp within the last 7 days", () => {
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const expected = date.toLocaleDateString([], { weekday: "long" });
    expect(formatDate(date.toISOString())).toBe(expected);
  });

  it("returns a short date for a timestamp older than 7 days", () => {
    const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const expected = date.toLocaleDateString([], { month: "short", day: "numeric" });
    expect(formatDate(date.toISOString())).toBe(expected);
  });
});

/* ------------------------- MessageBubble: Date Divider ------------------------- */

describe("MessageBubble – date divider", () => {
  it("does not render when disabled", () => {
    setup({ showDateDivider: false });
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
  });

  it("renders 'Today'", () => {
    setup({ showDateDivider: true, dateDividerLabel: "Today" });
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders 'Yesterday'", () => {
    const msg = {
      ...BASE_MSG,
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    };
    setup({ msg, showDateDivider: true, dateDividerLabel: "Yesterday" });
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });
});

/* ------------------------- MessageBubble: Content ------------------------- */

describe("MessageBubble – content", () => {
  it("renders message content", () => {
    setup();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders timestamp", () => {
    const msg = {
      ...BASE_MSG,
      createdAt: new Date("2025-01-01T14:35:00").toISOString(),
    };
    setup({ msg });

    const time = new Date(msg.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    expect(screen.getByText(time)).toBeInTheDocument();
  });

  it("applies optimistic opacity", () => {
    const msg = { ...BASE_MSG, id: "temp-1" };
    setup({ msg });

    expect(screen.getByText("Hello world").closest("div.opacity-50")).toBeInTheDocument();
  });

  it("applies full opacity for confirmed messages", () => {
    setup();
    expect(screen.getByText("Hello world").closest("div.opacity-100")).toBeInTheDocument();
  });
});

/* ------------------------- MessageBubble: Sender ------------------------- */

describe("MessageBubble – sender", () => {
  it("shows username for first message", () => {
    setup({ isFirst: true });
    expect(screen.getByText("bob")).toBeInTheDocument();
  });

  it("hides username for non-first message", () => {
    setup({ isFirst: false });
    expect(screen.queryByText("bob")).not.toBeInTheDocument();
  });

  it("hides username for own messages", () => {
    setup({ isMe: true });
    expect(screen.queryByText("bob")).not.toBeInTheDocument();
  });

  it("renders avatar with image", () => {
    const msg = { ...BASE_MSG, sender: { ...BASE_MSG.sender, pfp: "bob.png" } };
    setup({ msg });

    expect(screen.getByRole("img", { name: "bob" })).toBeInTheDocument();
  });

  it("renders fallback initial", () => {
    setup();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("calls onAvatarClick", () => {
    setup();
    fireEvent.click(screen.getByText("B"));
    expect(defaultProps.onAvatarClick).toHaveBeenCalledWith("bob");
  });
});

/* ------------------------- MessageBubble: Hover ------------------------- */

describe("MessageBubble – hover", () => {
  it("calls onMouseEnter", () => {
    setup();
    fireEvent.mouseEnter(screen.getByText("Hello world").closest(".flex.items-end")!);
    expect(defaultProps.onMouseEnter).toHaveBeenCalled();
  });

  it("calls onMouseLeave", () => {
    setup();
    fireEvent.mouseLeave(screen.getByText("Hello world").closest(".flex.items-end")!);
    expect(defaultProps.onMouseLeave).toHaveBeenCalled();
  });
});

/* ------------------------- MessageBubble: Menu ------------------------- */

describe("MessageBubble – menu", () => {
  it("opens menu", () => {
    setup({ isHovered: true });
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Report")).toBeInTheDocument();
  });

  it("closes menu on mouse leave", () => {
    setup({ isHovered: true });

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Report")).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByText("Hello world").closest(".flex.items-end")!);
    expect(screen.queryByText("Report")).not.toBeInTheDocument();
  });
});

/* ------------------------- MessageBubble: ReportModal ------------------------- */

describe("MessageBubble – ReportModal", () => {
  const openModal = () => {
    setup({ isHovered: true });
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Report"));
  };

  it("renders modal", () => {
    openModal();
    expect(screen.getByText("Report User")).toBeInTheDocument();
  });

  it("submits report", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    window.alert = jest.fn();

    openModal();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "SPAM" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  it("closes modal on cancel", () => {
    openModal();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText("Report User")).not.toBeInTheDocument();
  });
});