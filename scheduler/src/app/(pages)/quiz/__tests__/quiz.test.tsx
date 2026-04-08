import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuizPage from "../page";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
}));

// @ts-ignore
global.fetch = jest.fn();

describe("Quiz Page", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, "error").mockImplementation(() => {});
	});

	const goToStep = (n: number) => {
		for (let i = 1; i < n; i++) {
			fireEvent.click(screen.getByText(/Next/i));
		}
	};

	// ─── Original tests (preserved) ───────────────────────────────────────────

	it("renders step 1 initially", () => {
		render(<QuizPage />);
		expect(
			screen.getByRole("heading", { name: /Work Schedule/i }),
		).toBeInTheDocument();
	});

	it("shows correct progress width by step", () => {
		const { container } = render(<QuizPage />);
		const bar = container.querySelector(".bg-gradient-to-r");
		expect(bar).toHaveStyle({ width: "25%" });

		fireEvent.click(screen.getByText(/Next/i));
		expect(bar).toHaveStyle("width: 50%");
	});

	it("disables Back button on step 1 and enables after moving forward", () => {
		render(<QuizPage />);
		const back = screen.getByRole("button", { name: /Back/i });
		expect(back).toBeDisabled();

		fireEvent.click(screen.getByText(/Next/i));
		expect(
			screen.getByRole("button", { name: /Back/i }),
		).not.toBeDisabled();
	});

	it("updates Step 1 inputs: start/end time and days off checkboxes", () => {
		render(<QuizPage />);

		const start = screen.getByText(/When do you start working/i)
			.nextElementSibling as HTMLInputElement;
		fireEvent.change(start, { target: { value: "10:00" } });
		expect(start.value).toBe("10:00");

		fireEvent.click(screen.getByText(/Monday/i));
		expect(screen.getByText(/Days off: Mon/i)).toBeInTheDocument();
	});

	it("updates Step 2 numeric inputs", () => {
		render(<QuizPage />);
		goToStep(2);

		const slider = screen.getAllByRole("slider")[0] as HTMLInputElement;
		fireEvent.change(slider, { target: { value: "90" } });
		expect(slider.value).toBe("90");

		const breakBtn = screen.getByRole("button", { name: "3" });
		fireEvent.click(breakBtn);
		expect(breakBtn).toHaveClass("bg-gradient-to-br");
	});

	it("updates Step 3: taskOrder radios, maxTasksPerDay, defaultTaskDuration", () => {
		render(<QuizPage />);
		goToStep(3);

		const easyFirst = screen.getByText(/Easy tasks first/i);
		fireEvent.click(easyFirst);
		expect(easyFirst.closest("button")).toHaveClass("from-blue-500/20");
	});

	it("updates Step 4 reminderDays and pluralisation", () => {
		render(<QuizPage />);
		goToStep(4);

		fireEvent.click(screen.getByText("1d"));
		expect(screen.getByText(/reminded 1 day before/i)).toBeInTheDocument();

		fireEvent.click(screen.getByText(/Day of/i));
		expect(
			screen.getByText(/on the day the task is due/i),
		).toBeInTheDocument();
	});

	it("submit: success posts preferences and redirects", async () => {
		(global.fetch as jest.Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ user: { id: "user123" } }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			});

		render(<QuizPage />);
		goToStep(4);
		fireEvent.click(screen.getByText(/Complete Setup/i));

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith("/dashboard");
		});
	});

	it("submit: preferences POST not ok shows error alert and resets loading", async () => {
		(global.fetch as jest.Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ user: { id: "user123" } }),
			})
			.mockResolvedValueOnce({
				ok: false,
				json: async () => ({}),
			});

		// @ts-ignore
		global.alert = jest.fn();

		render(<QuizPage />);
		goToStep(4);
		fireEvent.click(screen.getByText(/Complete Setup/i));

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith(
				"Failed to save preferences. Please try again.",
			);
		});

		expect(screen.getByText(/Complete Setup/i)).not.toBeDisabled();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("guards handleNext", () => {
		render(<QuizPage />);
		goToStep(4);
		expect(screen.queryByText(/Next/i)).not.toBeInTheDocument();
	});

	// ─── Skip button ───────────────────────────────────────────────────────────

	it("skip: saves default preferences and redirects to dashboard", async () => {
		(global.fetch as jest.Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ user: { id: "user123" } }),
			})
			.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		render(<QuizPage />);
		fireEvent.click(screen.getByText(/Skip setup/i));

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith("/dashboard");
		});
	});

	it("skip: is available on every step", () => {
		render(<QuizPage />);
		for (let step = 1; step <= 4; step++) {
			expect(screen.getByText(/Skip setup/i)).toBeInTheDocument();
			if (step < 4) fireEvent.click(screen.getByText(/Next/i));
		}
	});

	it("skip: session fetch failure shows error alert and resets loading", async () => {
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: false,
			json: async () => ({}),
		});
		// @ts-ignore
		global.alert = jest.fn();

		render(<QuizPage />);
		fireEvent.click(screen.getByText(/Skip setup/i));

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith(
				expect.stringContaining("Failed"),
			);
		});
		// button should re-enable after failure
		expect(screen.getByText(/Skip setup/i)).not.toBeDisabled();
	});

	it("skip: disables skip button while loading", async () => {
		let resolveSession!: (v: unknown) => void;
		(global.fetch as jest.Mock).mockReturnValueOnce(
			new Promise((res) => {
				resolveSession = res;
			}),
		);

		render(<QuizPage />);
		fireEvent.click(screen.getByText(/Skip setup/i));

		expect(screen.getByText(/Skip setup/i)).toBeDisabled();

		resolveSession({ ok: true, json: async () => ({}) });
	});

	// ─── savePreferences: session failure ─────────────────────────────────────

	it("submit: missing user id in session throws and shows alert", async () => {
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ user: null }),
		});
		// @ts-ignore
		global.alert = jest.fn();

		render(<QuizPage />);
		goToStep(4);
		fireEvent.click(screen.getByText(/Complete Setup/i));

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith(
				expect.stringContaining("Failed"),
			);
		});
	});

	// ─── Working-window label ─────────────────────────────────────────────────

	it("shows working window label when times are valid", () => {
		render(<QuizPage />);
		// defaults are 09:00 – 17:00 → 8 h
		expect(screen.getByText(/8h working window/i)).toBeInTheDocument();
	});

	it("hides working window label when end time ≤ start time", () => {
		render(<QuizPage />);

		const start = screen.getByText(/When do you start working/i)
			.nextElementSibling as HTMLInputElement;
		const end = screen.getByText(/When do you stop working/i)
			.nextElementSibling as HTMLInputElement;

		fireEvent.change(start, { target: { value: "17:00" } });
		fireEvent.change(end, { target: { value: "09:00" } });

		expect(screen.queryByText(/working window/i)).not.toBeInTheDocument();
	});

	it("shows fractional working window label (e.g. 7h 30m)", () => {
		render(<QuizPage />);

		const start = screen.getByText(/When do you start working/i)
			.nextElementSibling as HTMLInputElement;
		const end = screen.getByText(/When do you stop working/i)
			.nextElementSibling as HTMLInputElement;

		fireEvent.change(start, { target: { value: "09:00" } });
		fireEvent.change(end, { target: { value: "16:30" } });

		expect(screen.getByText(/7h 30m working window/i)).toBeInTheDocument();
	});

	// ─── Step 1: days-off toggle ───────────────────────────────────────────────

	it("un-checking a day removes it from days-off list", () => {
		render(<QuizPage />);

		fireEvent.click(screen.getByText(/Saturday/i));
		expect(screen.getByText(/Days off: Sat/i)).toBeInTheDocument();

		fireEvent.click(screen.getByText(/Saturday/i));
		expect(screen.queryByText(/Days off:/i)).not.toBeInTheDocument();
	});

	it("multiple days off are shown in selection order", () => {
		render(<QuizPage />);

		fireEvent.click(screen.getByText(/Saturday/i));
		fireEvent.click(screen.getByText(/Sunday/i));

		expect(screen.getByText(/Days off: Sat, Sun/i)).toBeInTheDocument();
	});

	// ─── Step 2 ───────────────────────────────────────────────────────────────

	it("break-length slider updates the displayed duration", () => {
		render(<QuizPage />);
		goToStep(2);

		const sliders = screen.getAllByRole("slider");
		// second slider is breakLength
		fireEvent.change(sliders[1], { target: { value: "30" } });

		expect(screen.getByText(/30 min/i)).toBeInTheDocument();
	});

	it("schedule preview reflects sessionLength × breaksPerDay", () => {
		render(<QuizPage />);
		goToStep(2);

		const sliders = screen.getAllByRole("slider");
		fireEvent.change(sliders[0], { target: { value: "60" } }); // sessionLength
		fireEvent.click(screen.getByRole("button", { name: "4" })); // breaksPerDay

		// 60 × 4 = 240 min effective work time
		expect(
			screen.getByText(/~240min effective work time/i),
		).toBeInTheDocument();
	});

	it("breaks-per-day buttons are mutually exclusive", () => {
		render(<QuizPage />);
		goToStep(2);

		const btn2 = screen.getByRole("button", { name: "2" });
		const btn5 = screen.getByRole("button", { name: "5" });

		fireEvent.click(btn2);
		expect(btn2).toHaveClass("bg-gradient-to-br");
		expect(btn5).not.toHaveClass("bg-gradient-to-br");

		fireEvent.click(btn5);
		expect(btn5).toHaveClass("bg-gradient-to-br");
		expect(btn2).not.toHaveClass("bg-gradient-to-br");
	});

	// ─── Step 3 ───────────────────────────────────────────────────────────────

	it("all five task-order options are rendered", () => {
		render(<QuizPage />);
		goToStep(3);

		const options = [
			"Hard tasks first",
			"Easy tasks first",
			"Deadline first",
			"Shortest first",
			"Longest first",
		];
		options.forEach((label) => {
			expect(screen.getByText(label)).toBeInTheDocument();
		});
	});

	it("task-order options are mutually exclusive", () => {
		render(<QuizPage />);
		goToStep(3);

		fireEvent.click(screen.getByText(/Easy tasks first/i));
		fireEvent.click(screen.getByText(/Deadline first/i));

		expect(
			screen.getByText(/Easy tasks first/i).closest("button"),
		).not.toHaveClass("from-blue-500/20");
		expect(
			screen.getByText(/Deadline first/i).closest("button"),
		).toHaveClass("from-blue-500/20");
	});

	it("maxTasksPerDay number input updates correctly", () => {
		render(<QuizPage />);
		goToStep(3);

		// Labels have no `for` attribute so we find the input via its sibling label
		const label = screen.getByText(/Max tasks per day/i);
		const input = label.nextElementSibling as HTMLInputElement;
		fireEvent.change(input, { target: { value: "5" } });
		expect(input.value).toBe("5");
	});

	it("defaultTaskDuration number input updates correctly", () => {
		render(<QuizPage />);
		goToStep(3);

		// The duration input is wrapped in a relative div, so go label → parent → input
		const label = screen.getByText(/Default task duration/i);
		const input = label.nextElementSibling!.querySelector(
			"input",
		) as HTMLInputElement;
		fireEvent.change(input, { target: { value: "30" } });
		expect(input.value).toBe("30");
	});

	// ─── Step 4: summary grid ─────────────────────────────────────────────────

	it("summary grid shows correct default values", () => {
		render(<QuizPage />);
		goToStep(4);

		expect(screen.getByText("09:00 – 17:00")).toBeInTheDocument();
		expect(screen.getByText(/None/i)).toBeInTheDocument(); // no days off
		expect(screen.getByText(/hard first/i)).toBeInTheDocument(); // taskOrder
		expect(screen.getByText("8")).toBeInTheDocument(); // maxTasksPerDay default
		expect(screen.getByText(/2d before/i)).toBeInTheDocument(); // reminderDays default
	});

	it("summary grid reflects user changes made in previous steps", () => {
		render(<QuizPage />);

		// Step 1: change times + add day off
		const start = screen.getByText(/When do you start working/i)
			.nextElementSibling as HTMLInputElement;
		fireEvent.change(start, { target: { value: "08:00" } });
		fireEvent.click(screen.getByText(/Friday/i));
		fireEvent.click(screen.getByText(/Next/i));

		// Step 2: leave defaults
		fireEvent.click(screen.getByText(/Next/i));

		// Step 3: change task order
		fireEvent.click(screen.getByText(/Deadline first/i));
		fireEvent.click(screen.getByText(/Next/i));

		// Step 4: summary
		expect(screen.getByText("08:00 – 17:00")).toBeInTheDocument();
		expect(screen.getByText(/Fri/)).toBeInTheDocument();
		// The summary grid value is a <p> with class capitalize — scope query to avoid
		// matching the reminder label which also contains the word "deadline"
		const summaryGrid = screen
			.getByText("Your Preferences Summary")
			.closest("div") as HTMLElement;
		expect(summaryGrid).toHaveTextContent(/deadline/i);
	});

	it("summary shows plural reminder days correctly", () => {
		render(<QuizPage />);
		goToStep(4);

		fireEvent.click(screen.getByText("7d"));
		expect(screen.getByText(/7d before/i)).toBeInTheDocument();
	});

	it("summary shows 'Day of' when reminderDays is 0", () => {
		render(<QuizPage />);
		goToStep(4);

		fireEvent.click(screen.getByText(/Day of/i));
		const summarySection = screen
			.getByText("Your Preferences Summary")
			.closest("div") as HTMLElement;
		expect(summarySection).toHaveTextContent(/Day of/i);
	});

	// ─── Navigation: Back button ───────────────────────────────────────────────

	it("Back returns to the previous step", () => {
		render(<QuizPage />);
		fireEvent.click(screen.getByText(/Next/i));
		expect(
			screen.getByRole("heading", { name: /Breaks & Sessions/i }),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Back/i }));
		expect(
			screen.getByRole("heading", { name: /Work Schedule/i }),
		).toBeInTheDocument();
	});

	it("Back does not decrement below step 1", () => {
		render(<QuizPage />);
		// back is disabled but fire it anyway to ensure no crash or unexpected nav
		fireEvent.click(screen.getByRole("button", { name: /Back/i }));
		expect(
			screen.getByRole("heading", { name: /Work Schedule/i }),
		).toBeInTheDocument();
	});

	it("progress percentage updates correctly across all steps", () => {
		render(<QuizPage />);
		expect(screen.getByText("25%")).toBeInTheDocument();

		fireEvent.click(screen.getByText(/Next/i));
		expect(screen.getByText("50%")).toBeInTheDocument();

		fireEvent.click(screen.getByText(/Next/i));
		expect(screen.getByText("75%")).toBeInTheDocument();

		fireEvent.click(screen.getByText(/Next/i));
		expect(screen.getByText("100%")).toBeInTheDocument();
	});

	// ─── Step dots ────────────────────────────────────────────────────────────

	it("completed step dots show a checkmark", () => {
		const { container } = render(<QuizPage />);
		fireEvent.click(screen.getByText(/Next/i)); // move to step 2

		const dots = container.querySelectorAll(".rounded-full.flex");
		// step 1 dot should contain ✓
		expect(dots[0].textContent).toBe("✓");
	});

	it("current step dot is scaled up", () => {
		const { container } = render(<QuizPage />);
		const dots = container.querySelectorAll(".rounded-full.flex");
		// step 1 active on mount
		expect(dots[0]).toHaveClass("scale-110");
	});

	// ─── Submit button states ─────────────────────────────────────────────────

	it("shows 'Saving…' while submit is in progress", async () => {
		let resolveSession!: (v: unknown) => void;
		(global.fetch as jest.Mock).mockReturnValueOnce(
			new Promise((res) => {
				resolveSession = res;
			}),
		);

		render(<QuizPage />);
		goToStep(4);
		fireEvent.click(screen.getByText(/Complete Setup/i));

		expect(await screen.findByText("Saving…")).toBeInTheDocument();

		resolveSession({ ok: true, json: async () => ({}) });
	});

	it("Complete Setup button is disabled while loading", async () => {
		let resolveSession!: (v: unknown) => void;
		(global.fetch as jest.Mock).mockReturnValueOnce(
			new Promise((res) => {
				resolveSession = res;
			}),
		);

		render(<QuizPage />);
		goToStep(4);

		const btn = screen.getByText(/Complete Setup/i);
		fireEvent.click(btn);

		expect(btn).toBeDisabled();
		resolveSession({ ok: true, json: async () => ({}) });
	});

	it("Complete Setup button re-enables after a failed submit", async () => {
		(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
		// @ts-ignore
		global.alert = jest.fn();

		render(<QuizPage />);
		goToStep(4);
		fireEvent.click(screen.getByText(/Complete Setup/i));

		await waitFor(() => {
			expect(screen.getByText(/Complete Setup/i)).not.toBeDisabled();
		});
	});

	// ─── Fetch call assertions ────────────────────────────────────────────────

	it("submit: calls /api/auth/session then /api/preferences with correct payload", async () => {
		(global.fetch as jest.Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ user: { id: "abc42" } }),
			})
			.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		render(<QuizPage />);
		goToStep(4);
		fireEvent.click(screen.getByText(/Complete Setup/i));

		await waitFor(() => expect(mockPush).toHaveBeenCalled());

		const [sessionCall, prefCall] = (global.fetch as jest.Mock).mock.calls;
		expect(sessionCall[0]).toBe("/api/auth/session");
		expect(prefCall[0]).toBe("/api/preferences");
		expect(prefCall[1].method).toBe("POST");

		const body = JSON.parse(prefCall[1].body);
		expect(body.userID).toBe("abc42");
		expect(body).toMatchObject({
			workStartTime: "09:00",
			workEndTime: "17:00",
			taskOrder: "hard-first",
		});
	});

	it("skip: sends default form values in the POST body", async () => {
		(global.fetch as jest.Mock)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ user: { id: "xyz99" } }),
			})
			.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		render(<QuizPage />);
		fireEvent.click(screen.getByText(/Skip setup/i));

		await waitFor(() => expect(mockPush).toHaveBeenCalled());

		const [, prefCall] = (global.fetch as jest.Mock).mock.calls;
		const body = JSON.parse(prefCall[1].body);
		expect(body).toMatchObject({
			workStartTime: "09:00",
			workEndTime: "17:00",
			daysOff: [],
			sessionLength: 90,
			breakLength: 15,
			breaksPerDay: 3,
			taskOrder: "hard-first",
			maxTasksPerDay: 8,
			defaultTaskDuration: 60,
			reminderDays: 2,
		});
	});
});
