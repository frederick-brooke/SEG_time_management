/**
 * @file ConversationPage.test.tsx
 * @description Tests for conversation page.
 */

import React from "react";
import {
	render,
	screen,
	fireEvent,
	waitFor,
	act,
	cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import ConversationPage from "../page";

const pushMock = jest.fn();

let mockSession: any = {
	user: { id: "me", name: "Deeti" },
};

let mockParams: any = {
	conversationId: "conv-1",
};

jest.mock("next/navigation", () => ({
	useParams: () => mockParams,
	useRouter: () => ({
		push: pushMock,
	}),
}));

jest.mock("next-auth/react", () => ({
	useSession: () => ({
		data: mockSession,
	}),
}));

jest.mock("@/components/messaging/GroupHeader", () => ({
	GroupHeader: ({
		name,
		participantCount,
		onToggleMembers,
		onLeave,
	}: any) => (
		<div data-testid="group-header">
			<div>{name}</div>
			<div>{participantCount}</div>
			<button onClick={onToggleMembers}>toggle-members</button>
			<button onClick={onLeave}>leave-group</button>
		</div>
	),
}));

jest.mock("@/components/messaging/MembersPanel", () => ({
	MembersPanel: ({ participants, onAddMember, onRemove, onPromote }: any) => (
		<div data-testid="members-panel">
			<div>members-panel</div>
			<button onClick={onAddMember}>open-add-member</button>
			{participants.map((p: any) => (
				<div key={p.userId}>
					<span>{p.user.username}</span>
					<button onClick={() => onRemove(p.userId, p.user.username)}>
						remove-{p.user.username}
					</button>
					<button onClick={() => onPromote(p.userId, p.role)}>
						promote-{p.user.username}
					</button>
				</div>
			))}
		</div>
	),
}));

jest.mock("@/components/messaging/AddMemberModal", () => ({
	AddMemberModal: ({ onClose, onAdded, existingMemberIds }: any) => (
		<div data-testid="add-member-modal">
			<div>existing:{existingMemberIds.join(",")}</div>
			<button onClick={onClose}>close-add-member</button>
			<button onClick={onAdded}>added-member</button>
		</div>
	),
}));

jest.mock("@/components/messaging/MessageBubble", () => ({
	MessageBubble: ({
		msg,
		showDateDivider,
		dateDividerLabel,
		isMe,
		isFirst,
		isLast,
		isHovered,
		onMouseEnter,
		onMouseLeave,
		onAvatarClick,
	}: any) => (
		<div
			data-testid={`message-${msg.id}`}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<div>{msg.content}</div>
			<div>{isMe ? "me" : "other"}</div>
			<div>{isFirst ? "first" : "not-first"}</div>
			<div>{isLast ? "last" : "not-last"}</div>
			<div>{isHovered ? "hovered" : "not-hovered"}</div>
			{showDateDivider && <div>{dateDividerLabel}</div>}
			<button onClick={() => onAvatarClick(msg.sender.username)}>
				avatar-{msg.sender.username}
			</button>
		</div>
	),
}));

jest.mock("@/components/messaging/MessageInput", () => ({
	MessageInput: ({ value, sending, onChange, onKeyDown, onSend }: any) => (
		<div>
			<textarea
				aria-label="message-input"
				value={value}
				onChange={onChange}
				onKeyDown={onKeyDown}
			/>
			<div>{sending ? "sending" : "not-sending"}</div>
			<button onClick={onSend}>send-message</button>
		</div>
	),
}));

type HandlerMap = Record<string, (...args: any[]) => void>;

const pusherChannels = new Map<string, { handlers: HandlerMap }>();

jest.mock("pusher-js", () => {
	return jest.fn().mockImplementation(() => ({
		subscribe: (channelName: string) => {
			const channel = {
				handlers: {} as HandlerMap,
				bind(event: string, cb: (...args: any[]) => void) {
					this.handlers[event] = cb;
				},
				unbind_all: jest.fn(),
			};
			pusherChannels.set(channelName, channel);
			return channel;
		},
		unsubscribe: jest.fn(),
	}));
});

const detailsResponse = {
	id: "conv-1",
	isGroup: true,
	name: "Test Group",
	participants: [
		{
			userId: "me",
			role: "admin",
			joinedAt: "2026-01-01T10:00:00.000Z",
			user: { id: "me", username: "deeti", fname: "Deeti", pfp: null },
		},
		{
			userId: "u2",
			role: "member",
			joinedAt: "2026-01-01T10:00:00.000Z",
			user: { id: "u2", username: "alice", fname: "Alice", pfp: null },
		},
	],
};

const makeMessage = (
	id: string,
	content: string,
	senderId = "u2",
	username = "alice",
	createdAt = "2026-04-07T10:00:00.000Z",
) => ({
	id,
	content,
	createdAt,
	sender: {
		id: senderId,
		username,
		pfp: null,
	},
});

const initial20Messages = Array.from({ length: 20 }, (_, i) =>
	makeMessage(
		`m${i + 1}`,
		`message-${i + 1}`,
		i % 2 === 0 ? "u2" : "me",
		i % 2 === 0 ? "alice" : "deeti",
		`2026-04-07T10:${String(i).padStart(2, "0")}:00.000Z`,
	),
);

const olderMessages = [
	makeMessage("old-1", "older-1", "u2", "alice", "2026-04-06T09:00:00.000Z"),
	makeMessage("old-2", "older-2", "u2", "alice", "2026-04-06T09:05:00.000Z"),
];

let intersectionCallback: ((entries: any[]) => void) | null = null;

class MockIntersectionObserver {
	callback: (entries: any[]) => void;

	constructor(callback: (entries: any[]) => void) {
		this.callback = callback;
		intersectionCallback = callback;
	}

	observe = jest.fn();
	unobserve = jest.fn();
	disconnect = jest.fn();
}

describe("ConversationPage", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		cleanup();
		pusherChannels.clear();

		mockSession = {
			user: { id: "me", name: "Deeti" },
		};

		mockParams = {
			conversationId: "conv-1",
		};

		intersectionCallback = null;

		(global as any).IntersectionObserver = MockIntersectionObserver;
		(global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
			cb(0);
			return 1;
		};
		Element.prototype.scrollIntoView = jest.fn();

		global.confirm = jest.fn(() => true);

		process.env.NEXT_PUBLIC_PUSHER_KEY = "test-key";
		process.env.NEXT_PUBLIC_PUSHER_CLUSTER = "eu";

		global.fetch = jest.fn(
			async (input: RequestInfo | URL, init?: RequestInit) => {
				const url = String(input);
				const method = init?.method || "GET";

				if (url === "/api/conversations/conv-1/messages") {
					return {
						ok: true,
						json: async () => initial20Messages,
					} as Response;
				}

				if (url === "/api/conversations/conv-1/details") {
					return {
						ok: true,
						json: async () => detailsResponse,
					} as Response;
				}

				if (url === "/api/conversations/conv-1/messages?cursor=m20") {
					return {
						ok: true,
						json: async () => olderMessages,
					} as Response;
				}

				if (url === "/api/conversations/conv-1" && method === "PATCH") {
					return {
						ok: true,
						json: async () => ({}),
					} as Response;
				}

				if (
					url === "/api/conversations/conv-1/typing" &&
					method === "POST"
				) {
					return {
						ok: true,
						json: async () => ({}),
					} as Response;
				}

				if (url === "/api/conversations/conv-1" && method === "POST") {
					return {
						ok: true,
						json: async () =>
							makeMessage(
								"real-1",
								"hello world",
								"me",
								"Deeti",
								"2026-04-07T12:00:00.000Z",
							),
					} as Response;
				}

				if (
					url === "/api/conversations/conv-1/members" &&
					method === "DELETE"
				) {
					return {
						ok: true,
						json: async () => ({}),
					} as Response;
				}

				if (
					url === "/api/conversations/conv-1/members" &&
					method === "PATCH"
				) {
					return {
						ok: true,
						json: async () => ({}),
					} as Response;
				}

				throw new Error(`Unhandled fetch: ${method} ${url}`);
			},
		) as jest.Mock;
	});

	afterEach(async () => {
		await act(async () => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
		cleanup();
	});

	it("renders initial group conversation, fetches details/messages, and supports hover/avatar click", async () => {
		render(<ConversationPage />);

		expect(await screen.findByTestId("group-header")).toBeInTheDocument();
		expect(screen.getByText("Test Group")).toBeInTheDocument();
		expect(await screen.findByText("message-1")).toBeInTheDocument();

		expect(global.fetch).toHaveBeenCalledWith("/api/conversations/conv-1", {
			method: "PATCH",
		});

		const bubble = screen.getByTestId("message-m1");
		fireEvent.mouseEnter(bubble);
		expect(screen.getByText("hovered")).toBeInTheDocument();

		fireEvent.click(screen.getAllByText(/avatar-/)[0]);
		expect(pushMock).toHaveBeenCalled();

		act(() => {
			jest.advanceTimersByTime(60);
		});

		expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
	});

	it("loads more messages when top sentinel intersects and shows beginning of conversation once exhausted", async () => {
		render(<ConversationPage />);

		expect(await screen.findByText("message-20")).toBeInTheDocument();

		await act(async () => {
			intersectionCallback?.([{ isIntersecting: true }]);
			await Promise.resolve();
		});

		expect(await screen.findByText("older-1")).toBeInTheDocument();
		expect(await screen.findByText("older-2")).toBeInTheDocument();

		await act(async () => {
			intersectionCallback?.([{ isIntersecting: true }]);
			await Promise.resolve();
		});

		expect(
			screen.getByText("Beginning of conversation"),
		).toBeInTheDocument();
	});

	it("handles non-array messages response safely", async () => {
		(global.fetch as jest.Mock).mockImplementation(
			async (input: RequestInfo | URL, init?: RequestInit) => {
				const url = String(input);
				const method = init?.method || "GET";

				if (url === "/api/conversations/conv-1/messages") {
					return {
						ok: true,
						json: async () => ({ not: "an array" }),
					} as Response;
				}

				if (url === "/api/conversations/conv-1/details") {
					return {
						ok: true,
						json: async () => detailsResponse,
					} as Response;
				}

				if (url === "/api/conversations/conv-1" && method === "PATCH") {
					return { ok: true, json: async () => ({}) } as Response;
				}

				if (
					url === "/api/conversations/conv-1/typing" &&
					method === "POST"
				) {
					return { ok: true, json: async () => ({}) } as Response;
				}

				if (url === "/api/conversations/conv-1" && method === "POST") {
					return {
						ok: true,
						json: async () => makeMessage("r1", "x", "me", "Deeti"),
					} as Response;
				}

				if (
					url === "/api/conversations/conv-1/members" &&
					(method === "DELETE" || method === "PATCH")
				) {
					return { ok: true, json: async () => ({}) } as Response;
				}

				throw new Error(`Unhandled fetch: ${method} ${url}`);
			},
		);

		render(<ConversationPage />);

		expect(await screen.findByTestId("group-header")).toBeInTheDocument();
		expect(screen.getByText("Test Group")).toBeInTheDocument();
		expect(screen.queryByText("message-1")).not.toBeInTheDocument();
	});

	it("subscribes to pusher and handles new-message and typing events", async () => {
		const { container } = render(<ConversationPage />);

		await screen.findByText("message-1");

		const channel = pusherChannels.get("conversation-conv-1");
		expect(channel).toBeTruthy();

		act(() => {
			channel?.handlers["new-message"]?.(
				makeMessage(
					"new-1",
					"live message",
					"u2",
					"alice",
					"2026-04-07T13:00:00.000Z",
				),
			);
		});

		expect(await screen.findByText("live message")).toBeInTheDocument();

		act(() => {
			channel?.handlers["typing"]?.({
				userId: "u2",
				username: "alice",
				isTyping: true,
			});
		});

		expect(container.querySelectorAll("span.animate-bounce").length).toBe(
			3,
		);

		act(() => {
			jest.advanceTimersByTime(3000);
		});

		await waitFor(() => {
			expect(
				container.querySelectorAll("span.animate-bounce").length,
			).toBe(0);
		});
	});

	it("ignores typing events from the current user", async () => {
		const { container } = render(<ConversationPage />);

		await screen.findByText("message-1");

		const channel = pusherChannels.get("conversation-conv-1");

		act(() => {
			channel?.handlers["typing"]?.({
				userId: "me",
				username: "deeti",
				isTyping: true,
			});
		});

		expect(container.querySelectorAll("span.animate-bounce").length).toBe(
			0,
		);
	});

	it("posts typing true then false when input changes", async () => {
		render(<ConversationPage />);

		await screen.findByText("message-1");

		fireEvent.change(screen.getByLabelText("message-input"), {
			target: { value: "hello world" },
		});

		expect(global.fetch).toHaveBeenCalledWith(
			"/api/conversations/conv-1/typing",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isTyping: true }),
			},
		);

		act(() => {
			jest.advanceTimersByTime(2000);
		});

		expect(global.fetch).toHaveBeenCalledWith(
			"/api/conversations/conv-1/typing",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isTyping: false }),
			},
		);
	});

	it("sends a message on Enter and replaces optimistic message with real one", async () => {
		render(<ConversationPage />);

		await screen.findByText("message-1");

		fireEvent.change(screen.getByLabelText("message-input"), {
			target: { value: "hello world" },
		});

		fireEvent.keyDown(screen.getByLabelText("message-input"), {
			key: "Enter",
			shiftKey: false,
			preventDefault: jest.fn(),
		});

		expect(screen.getByText("sending")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText("hello world")).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getByText("not-sending")).toBeInTheDocument();
		});
	});

	it("does not send on Shift+Enter and does not send blank messages", async () => {
		render(<ConversationPage />);

		await screen.findByText("message-1");

		const textarea = screen.getByLabelText("message-input");

		fireEvent.keyDown(textarea, {
			key: "Enter",
			shiftKey: true,
			preventDefault: jest.fn(),
		});

		expect(global.fetch).not.toHaveBeenCalledWith(
			"/api/conversations/conv-1",
			expect.objectContaining({ method: "POST" }),
		);

		fireEvent.change(textarea, {
			target: { value: "   " },
		});

		fireEvent.click(screen.getByText("send-message"));

		expect(global.fetch).not.toHaveBeenCalledWith(
			"/api/conversations/conv-1",
			expect.objectContaining({ method: "POST" }),
		);
	});

	it("removes optimistic message when send returns non-ok", async () => {
		(global.fetch as jest.Mock).mockImplementation(
			async (input: RequestInfo | URL, init?: RequestInit) => {
				const url = String(input);
				const method = init?.method || "GET";

				if (url === "/api/conversations/conv-1/messages") {
					return {
						ok: true,
						json: async () => initial20Messages,
					} as Response;
				}
				if (url === "/api/conversations/conv-1/details") {
					return {
						ok: true,
						json: async () => detailsResponse,
					} as Response;
				}
				if (url === "/api/conversations/conv-1" && method === "PATCH") {
					return { ok: true, json: async () => ({}) } as Response;
				}
				if (
					url === "/api/conversations/conv-1/typing" &&
					method === "POST"
				) {
					return { ok: true, json: async () => ({}) } as Response;
				}
				if (url === "/api/conversations/conv-1" && method === "POST") {
					return { ok: false, json: async () => ({}) } as Response;
				}
				throw new Error(`Unhandled fetch: ${method} ${url}`);
			},
		);

		render(<ConversationPage />);

		await screen.findByText("message-1");

		fireEvent.change(screen.getByLabelText("message-input"), {
			target: { value: "will fail" },
		});

		fireEvent.click(screen.getByText("send-message"));

		await waitFor(() => {
			expect(screen.getByText("not-sending")).toBeInTheDocument();
		});

		expect(screen.queryByText("will fail")).not.toBeInTheDocument();
	});

	it("removes optimistic message when send throws", async () => {
		(global.fetch as jest.Mock).mockImplementation(
			async (input: RequestInfo | URL, init?: RequestInit) => {
				const url = String(input);
				const method = init?.method || "GET";

				if (url === "/api/conversations/conv-1/messages") {
					return {
						ok: true,
						json: async () => initial20Messages,
					} as Response;
				}
				if (url === "/api/conversations/conv-1/details") {
					return {
						ok: true,
						json: async () => detailsResponse,
					} as Response;
				}
				if (url === "/api/conversations/conv-1" && method === "PATCH") {
					return { ok: true, json: async () => ({}) } as Response;
				}
				if (
					url === "/api/conversations/conv-1/typing" &&
					method === "POST"
				) {
					return { ok: true, json: async () => ({}) } as Response;
				}
				if (url === "/api/conversations/conv-1" && method === "POST") {
					throw new Error("network fail");
				}
				throw new Error(`Unhandled fetch: ${method} ${url}`);
			},
		);

		render(<ConversationPage />);

		await screen.findByText("message-1");

		fireEvent.change(screen.getByLabelText("message-input"), {
			target: { value: "throws" },
		});

		fireEvent.click(screen.getByText("send-message"));

		await waitFor(() => {
			expect(screen.getByText("not-sending")).toBeInTheDocument();
		});

		expect(screen.queryByText("throws")).not.toBeInTheDocument();
	});

	it("opens members panel, add member modal, closes modal, and refreshes details on added", async () => {
		render(<ConversationPage />);

		await screen.findByText("Test Group");

		fireEvent.click(screen.getByText("toggle-members"));
		expect(screen.getByTestId("members-panel")).toBeInTheDocument();

		fireEvent.click(screen.getByText("open-add-member"));
		expect(screen.getByTestId("add-member-modal")).toBeInTheDocument();
		expect(screen.getByText("existing:me,u2")).toBeInTheDocument();

		fireEvent.click(screen.getByText("added-member"));
		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/conversations/conv-1/details",
			);
		});

		fireEvent.click(screen.getByText("close-add-member"));
		await waitFor(() => {
			expect(
				screen.queryByTestId("add-member-modal"),
			).not.toBeInTheDocument();
		});
	});

	it("handles leave group confirm true and false", async () => {
		render(<ConversationPage />);

		await screen.findByText("Test Group");

		(global.confirm as jest.Mock).mockReturnValueOnce(false);
		fireEvent.click(screen.getByText("leave-group"));

		expect(pushMock).not.toHaveBeenCalled();

		(global.confirm as jest.Mock).mockReturnValueOnce(true);
		fireEvent.click(screen.getByText("leave-group"));

		expect(pushMock).toHaveBeenCalledWith("/messages");
		expect(global.fetch).toHaveBeenCalledWith(
			"/api/conversations/conv-1/members",
			{
				method: "DELETE",
			},
		);
	});

	it("handles remove member confirm true and false", async () => {
		render(<ConversationPage />);

		await screen.findByText("Test Group");

		fireEvent.click(screen.getByText("toggle-members"));

		(global.confirm as jest.Mock).mockReturnValueOnce(false);
		fireEvent.click(screen.getByText("remove-alice"));

		expect(global.fetch).not.toHaveBeenCalledWith(
			"/api/conversations/conv-1/members",
			expect.objectContaining({
				method: "DELETE",
				body: JSON.stringify({ userId: "u2" }),
			}),
		);

		(global.confirm as jest.Mock).mockReturnValueOnce(true);
		fireEvent.click(screen.getByText("remove-alice"));

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/conversations/conv-1/members",
				{
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId: "u2" }),
				},
			);
		});

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/conversations/conv-1/details",
			);
		});
	});

	it("handles promote member confirm true and false", async () => {
		render(<ConversationPage />);

		await screen.findByText("Test Group");

		fireEvent.click(screen.getByText("toggle-members"));

		(global.confirm as jest.Mock).mockReturnValueOnce(false);
		fireEvent.click(screen.getByText("promote-alice"));

		expect(global.fetch).not.toHaveBeenCalledWith(
			"/api/conversations/conv-1/members",
			expect.objectContaining({ method: "PATCH" }),
		);

		(global.confirm as jest.Mock).mockReturnValueOnce(true);
		fireEvent.click(screen.getByText("promote-alice"));

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/conversations/conv-1/members",
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId: "u2", role: "admin" }),
				},
			);
		});

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/conversations/conv-1/details",
			);
		});
	});

	it("handles demote admin back to member", async () => {
		const adminDetails = {
			...detailsResponse,
			participants: [
				detailsResponse.participants[0],
				{
					...detailsResponse.participants[1],
					role: "admin",
				},
			],
		};

		(global.fetch as jest.Mock).mockImplementation(
			async (input: RequestInfo | URL, init?: RequestInit) => {
				const url = String(input);
				const method = init?.method || "GET";

				if (url === "/api/conversations/conv-1/messages") {
					return {
						ok: true,
						json: async () => initial20Messages,
					} as Response;
				}

				if (url === "/api/conversations/conv-1/details") {
					return {
						ok: true,
						json: async () => adminDetails,
					} as Response;
				}

				if (url === "/api/conversations/conv-1" && method === "PATCH") {
					return { ok: true, json: async () => ({}) } as Response;
				}

				if (
					url === "/api/conversations/conv-1/members" &&
					method === "PATCH"
				) {
					return { ok: true, json: async () => ({}) } as Response;
				}

				if (
					url === "/api/conversations/conv-1/typing" &&
					method === "POST"
				) {
					return { ok: true, json: async () => ({}) } as Response;
				}

				throw new Error(`Unhandled fetch: ${method} ${url}`);
			},
		);

		render(<ConversationPage />);

		await screen.findByText("Test Group");

		fireEvent.click(screen.getByText("toggle-members"));

		(global.confirm as jest.Mock).mockReturnValueOnce(true);
		fireEvent.click(screen.getByText("promote-alice"));

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/conversations/conv-1/members",
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId: "u2", role: "member" }),
				},
			);
		});

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/conversations/conv-1/details",
			);
		});
	});

	it("renders without group-only UI for direct conversations", async () => {
		(global.fetch as jest.Mock).mockImplementation(
			async (input: RequestInfo | URL, init?: RequestInit) => {
				const url = String(input);
				const method = init?.method || "GET";

				if (url === "/api/conversations/conv-1/messages") {
					return {
						ok: true,
						json: async () => initial20Messages,
					} as Response;
				}

				if (url === "/api/conversations/conv-1/details") {
					return {
						ok: true,
						json: async () => ({
							...detailsResponse,
							isGroup: false,
						}),
					} as Response;
				}

				if (url === "/api/conversations/conv-1" && method === "PATCH") {
					return {
						ok: true,
						json: async () => ({}),
					} as Response;
				}

				if (
					url === "/api/conversations/conv-1/typing" &&
					method === "POST"
				) {
					return {
						ok: true,
						json: async () => ({}),
					} as Response;
				}

				if (url === "/api/conversations/conv-1" && method === "POST") {
					return {
						ok: true,
						json: async () =>
							makeMessage("r2", "hello", "me", "Deeti"),
					} as Response;
				}

				throw new Error(`Unhandled fetch: ${method} ${url}`);
			},
		);

		render(<ConversationPage />);

		expect(await screen.findByText("message-1")).toBeInTheDocument();
		expect(screen.queryByTestId("group-header")).not.toBeInTheDocument();
		expect(screen.queryByTestId("members-panel")).not.toBeInTheDocument();
	});

	it("returns early when there is no conversationId", () => {
		mockParams = { conversationId: undefined };

		render(<ConversationPage />);

		expect(screen.getByLabelText("message-input")).toBeInTheDocument();
		expect(global.fetch).not.toHaveBeenCalledWith(
			"/api/conversations/undefined/details",
		);
	});

	it("does not send if session user id is missing", async () => {
		mockSession = {
			user: { name: "Deeti" },
		};

		render(<ConversationPage />);

		await screen.findByText("message-1");

		fireEvent.change(screen.getByLabelText("message-input"), {
			target: { value: "hello" },
		});

		fireEvent.click(screen.getByText("send-message"));

		expect(global.fetch).not.toHaveBeenCalledWith(
			"/api/conversations/conv-1",
			expect.objectContaining({ method: "POST" }),
		);
	});
});
