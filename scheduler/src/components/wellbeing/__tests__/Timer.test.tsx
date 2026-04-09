import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Timer from "../Timer";
import "@testing-library/jest-dom";

// Mocks

const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

const remindersSpy = jest.fn();

jest.mock("@/components/wellbeing/Reminders", () => ({
	__esModule: true,
	default: (props: any) => {
		remindersSpy(props);
		return (
			<div>
				MockReminders
				<button
					onClick={() => props.setReminderOffsetMs(5000)}
					data-testid="set-reminder"
				>
					Set Reminder
				</button>
			</div>
		);
	},
}));

jest.mock("@/components/ui/GlassCard", () => ({
	__esModule: true,
	default: ({ children }: any) => (
		<div data-testid="glass-card">{children}</div>
	),
}));

let mockTimerState: any;

const mockStart = jest.fn();
const mockPause = jest.fn();
const mockResume = jest.fn();
const mockStop = jest.fn();

jest.mock("@/hooks/useTimer", () => ({
	useTimer: (args: any) => mockTimerState(args),
}));

describe("Timer Component", () => {
	const consoleLogSpy = jest
		.spyOn(console, "log")
		.mockImplementation(() => {});
	const consoleErrorSpy = jest
		.spyOn(console, "error")
		.mockImplementation(() => {});

	beforeEach(() => {
		jest.clearAllMocks();

		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({}),
		});

		mockTimerState = jest.fn(() => ({
			time: { hours: 0, minutes: 0, seconds: 0 },
			isRunning: false,
			hasStarted: false,
			startTimer: mockStart,
			pauseTimer: mockPause,
			resumeTimer: mockResume,
			stopTimer: mockStop,
			remainingMs: 10000,
		}));
	});

	afterAll(() => {
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	test("renders initial input state", () => {
		render(<Timer storageKey="test" onTick={() => {}} />);

		expect(screen.getByDisplayValue("00:00:00")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /start focus/i }),
		).toBeInTheDocument();
		expect(screen.getByText(/session duration/i)).toBeInTheDocument();
	});

	test("logs when mounted", () => {
		render(<Timer storageKey="test" onTick={() => {}} />);
		expect(consoleLogSpy).toHaveBeenCalledWith("Timer mounted");
	});

	test("passes storageKey and onTick into useTimer", () => {
		const onTick = jest.fn();

		render(<Timer storageKey="abc123" onTick={onTick} />);

		expect(mockTimerState).toHaveBeenCalledWith({
			storageKey: "abc123",
			onTick,
		});
	});

	test("updates input value", () => {
		render(<Timer storageKey="test" onTick={() => {}} />);

		const input = screen.getByDisplayValue("00:00:00") as HTMLInputElement;

		fireEvent.change(input, {
			target: { value: "00:00:10" },
		});

		expect(input.value).toBe("00:00:10");
	});

	test("clicking preset updates time", () => {
		render(<Timer storageKey="test" onTick={() => {}} />);

		fireEvent.click(screen.getByText(/25 min/i));

		expect(screen.getByDisplayValue("00:25:00")).toBeInTheDocument();
	});

	test("submits HH:MM:SS time and calls startTimer + API", async () => {
		render(<Timer storageKey="test" onTick={() => {}} />);

		fireEvent.change(screen.getByDisplayValue("00:00:00"), {
			target: { value: "00:00:10" },
		});

		fireEvent.click(screen.getByRole("button", { name: /start focus/i }));

		expect(mockStart).toHaveBeenCalledWith(10000);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith("/api/wellbeing/timer", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ durationMs: 10000 }),
			});
		});
	});

	test("submits HH:MM time and uses s || 0 branch", () => {
		render(<Timer storageKey="test" onTick={() => {}} />);

		fireEvent.change(screen.getByDisplayValue("00:00:00"), {
			target: { value: "00:10" },
		});

		fireEvent.click(screen.getByRole("button", { name: /start focus/i }));

		expect(mockStart).toHaveBeenCalledWith(10 * 60 * 1000);
	});

	test("logs API failure when fetch rejects", async () => {
		mockFetch.mockRejectedValueOnce(new Error("network fail"));

		render(<Timer storageKey="test" onTick={() => {}} />);

		fireEvent.click(screen.getByText(/15 min/i));
		fireEvent.click(screen.getByRole("button", { name: /start focus/i }));

		await waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalled();
		});

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Timer API failed:",
			expect.any(Error),
		);
	});

	test("renders running countdown state with pause button", () => {
		mockTimerState = jest.fn(() => ({
			time: { hours: 1, minutes: 2, seconds: 3 },
			isRunning: true,
			hasStarted: true,
			startTimer: mockStart,
			pauseTimer: mockPause,
			resumeTimer: mockResume,
			stopTimer: mockStop,
			remainingMs: 3723000,
		}));

		render(<Timer storageKey="test" onTick={() => {}} />);

		expect(screen.getByText(/remaining time/i)).toBeInTheDocument();
		expect(screen.getByText("01:02:03")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /pause session/i }),
		).toBeInTheDocument();
		expect(
			screen.getByText(/focus session in progress/i),
		).toBeInTheDocument();
	});

	test("pause button works", () => {
		mockTimerState = jest.fn(() => ({
			time: { hours: 0, minutes: 10, seconds: 0 },
			isRunning: true,
			hasStarted: true,
			startTimer: mockStart,
			pauseTimer: mockPause,
			resumeTimer: mockResume,
			stopTimer: mockStop,
			remainingMs: 600000,
		}));

		render(<Timer storageKey="test" onTick={() => {}} />);

		fireEvent.click(screen.getByRole("button", { name: /pause session/i }));

		expect(mockPause).toHaveBeenCalled();
	});

	test("resume button works when paused", () => {
		mockTimerState = jest.fn(() => ({
			time: { hours: 0, minutes: 10, seconds: 0 },
			isRunning: false,
			hasStarted: true,
			startTimer: mockStart,
			pauseTimer: mockPause,
			resumeTimer: mockResume,
			stopTimer: mockStop,
			remainingMs: 600000,
		}));

		render(<Timer storageKey="test" onTick={() => {}} />);

		fireEvent.click(screen.getByRole("button", { name: /resume focus/i }));

		expect(mockResume).toHaveBeenCalled();
	});

	test("end session button works", () => {
		mockTimerState = jest.fn(() => ({
			time: { hours: 0, minutes: 10, seconds: 0 },
			isRunning: false,
			hasStarted: true,
			startTimer: mockStart,
			pauseTimer: mockPause,
			resumeTimer: mockResume,
			stopTimer: mockStop,
			remainingMs: 600000,
		}));

		render(<Timer storageKey="test" onTick={() => {}} />);

		fireEvent.click(screen.getByRole("button", { name: /end session/i }));

		expect(mockStop).toHaveBeenCalled();
	});

	test("shows paused session text", () => {
		mockTimerState = jest.fn(() => ({
			time: { hours: 0, minutes: 10, seconds: 0 },
			isRunning: false,
			hasStarted: true,
			startTimer: mockStart,
			pauseTimer: mockPause,
			resumeTimer: mockResume,
			stopTimer: mockStop,
			remainingMs: 600000,
		}));

		render(<Timer storageKey="test" onTick={() => {}} />);

		expect(screen.getByText(/session paused/i)).toBeInTheDocument();
	});

	test("resets time input to 00:00:00 when timer has not started", () => {
		render(<Timer storageKey="test" onTick={() => {}} />);

		const input = screen.getByDisplayValue("00:00:00") as HTMLInputElement;

		fireEvent.change(input, {
			target: { value: "00:45:00" },
		});

		expect(input.value).toBe("00:45:00");

		render(<Timer storageKey="test" onTick={() => {}} />);
		expect(screen.getByDisplayValue("00:00:00")).toBeInTheDocument();
	});

	test("passes reminder props into Reminders", () => {
		render(<Timer storageKey="test" onTick={() => {}} />);

		expect(screen.getByText("MockReminders")).toBeInTheDocument();
		expect(remindersSpy).toHaveBeenCalled();

		const latestCall =
			remindersSpy.mock.calls[remindersSpy.mock.calls.length - 1][0];

		expect(latestCall.isRunning).toBe(false);
		expect(latestCall.remainingMs).toBe(10000);
		expect(latestCall.reminderFired).toBe(null);
		expect(typeof latestCall.setReminderOffsetMs).toBe("function");
	});

	test("sets reminder fire time on start when reminder offset exists", () => {
		render(<Timer storageKey="test" onTick={() => {}} />);

		fireEvent.click(screen.getByTestId("set-reminder"));
		fireEvent.click(screen.getByText(/15 min/i));
		fireEvent.click(screen.getByRole("button", { name: /start focus/i }));

		expect(mockStart).toHaveBeenCalledWith(15 * 60 * 1000);
	});

	test("fires reminder when remaining time reaches threshold", () => {
		let state = {
			time: { hours: 0, minutes: 15, seconds: 0 },
			isRunning: false,
			hasStarted: false,
			startTimer: mockStart,
			pauseTimer: mockPause,
			resumeTimer: mockResume,
			stopTimer: mockStop,
			remainingMs: 900000,
		};

		mockTimerState = jest.fn(() => state);

		const { rerender } = render(
			<Timer storageKey="test" onTick={() => {}} />,
		);

		fireEvent.click(screen.getByTestId("set-reminder"));
		fireEvent.click(screen.getByText(/15 min/i));
		fireEvent.click(screen.getByRole("button", { name: /start focus/i }));

		state = {
			...state,
			hasStarted: true,
			isRunning: true,
			remainingMs: 895000,
		};

		rerender(<Timer storageKey="test" onTick={() => {}} />);

		expect(consoleLogSpy).toHaveBeenCalledWith("Alert fired");
	});

	test("renders wellbeing tips", () => {
		render(<Timer storageKey="test" onTick={() => {}} />);

		expect(
			screen.getByText(/tip: set a reminder to take a drink/i),
		).toBeInTheDocument();

		expect(
			screen.getByText(
				/taking short breaks every 30–60 minutes improves focus/i,
			),
		).toBeInTheDocument();
	});
});
