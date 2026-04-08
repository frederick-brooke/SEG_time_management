/**
 * Testing for lib/scheduling/scheduler
 */

import { scheduleTasks } from "../scheduler";

jest.mock("../taskSchedulingUtils", () => ({
	getNextOccurrenceDeadline: jest.fn(() => null),
}));

jest.mock("../../ui", () => ({
	PRIORITY_SCORE: { high: 3, medium: 2, low: 1, none: 0 },
}));

// Helpers

const basePrefs = {
	workStartTime: "09:00",
	workEndTime: "17:00",
	daysOff: [] as string[],
	sessionLength: 90,
	breakLength: 15,
	taskOrder: "priority",
};

function makeDay(dateStr: string): Date {
	const [y, m, d] = dateStr.split("-").map(Number);
	return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function makeTask(
	overrides: Partial<{
		id: string;
		title: string;
		duration: number;
		dueDate: Date | null;
		bufferDays: number | null;
		priority: string;
		eventId: string | null;
		relativeOffsetDays: number | null;
		isRecurring: boolean;
	}> = {},
) {
	return {
		id: "task-1",
		title: "Task 1",
		duration: 60,
		dueDate: null,
		bufferDays: null,
		priority: "medium",
		eventId: null,
		relativeOffsetDays: null,
		isRecurring: false,
		...overrides,
	};
}

// Future Monday
const MON = makeDay("2030-01-07");
const TUE = makeDay("2030-01-08");
const WED = makeDay("2030-01-09");
const THU = makeDay("2030-01-10");
const FRI = makeDay("2030-01-11");
const SAT = makeDay("2030-01-12");
const SUN = makeDay("2030-01-13");

// Tests

describe("scheduleTasks — basic scheduling", () => {
	it("schedules a single task", () => {
		const result = scheduleTasks([makeTask()], [], basePrefs, [MON]);
		expect(result.scheduled).toHaveLength(1);
		expect(result.scheduled[0].taskId).toBe("task-1");
		expect(result.overCapacity).toHaveLength(0);
		expect(result.missedDeadline).toHaveLength(0);
	});

	it("schedules multiple tasks on the same day", () => {
		const tasks = [
			makeTask({ id: "t1", duration: 60 }),
			makeTask({ id: "t2", duration: 60 }),
		];
		const result = scheduleTasks(tasks, [], basePrefs, [MON]);
		expect(result.scheduled).toHaveLength(2);
	});

	it("returns empty scheduled when no tasks provided", () => {
		const result = scheduleTasks([], [], basePrefs, [MON]);
		expect(result.scheduled).toHaveLength(0);
		expect(result.overCapacity).toHaveLength(0);
	});

	it("schedules task at work start time", () => {
		const result = scheduleTasks([makeTask()], [], basePrefs, [MON]);
		const slot = result.scheduled[0].scheduledTime;
		expect(slot.getHours()).toBe(9);
		expect(slot.getMinutes()).toBe(0);
	});

	it("uses 60 min default duration when task duration is 0", () => {
		const result = scheduleTasks(
			[makeTask({ duration: 0 })],
			[],
			basePrefs,
			[MON],
		);
		expect(result.scheduled).toHaveLength(1);
	});
});

describe("scheduleTasks — no working days", () => {
	it("puts all tasks in overCapacity when all days are days off", () => {
		const prefs = { ...basePrefs, daysOff: ["Mon"] };
		const result = scheduleTasks([makeTask()], [], prefs, [MON]);
		expect(result.scheduled).toHaveLength(0);
		expect(result.overCapacity).toHaveLength(1);
		expect(result.overCapacity[0].taskId).toBe("task-1");
	});

	it("returns empty missedDeadline when all days are days off", () => {
		const prefs = { ...basePrefs, daysOff: ["Mon"] };
		const result = scheduleTasks([makeTask()], [], prefs, [MON]);
		expect(result.missedDeadline).toHaveLength(0);
	});
});

describe("scheduleTasks — days off", () => {
	it("skips days off and schedules on next available day", () => {
		const prefs = { ...basePrefs, daysOff: ["Mon"] };
		const result = scheduleTasks([makeTask()], [], prefs, [MON, TUE]);
		expect(result.scheduled[0].scheduledDate.getDay()).toBe(TUE.getDay());
	});

	it("skips Saturday and Sunday when in daysOff", () => {
		const prefs = { ...basePrefs, daysOff: ["Sat", "Sun"] };
		const result = scheduleTasks([makeTask()], [], prefs, [SAT, SUN, MON]);
		expect(result.scheduled[0].scheduledDate.getDay()).toBe(MON.getDay());
	});
});

describe("scheduleTasks — deadlines", () => {
	it("places task with dueDate before the deadline", () => {
		const task = makeTask({ dueDate: new Date(2030, 0, 8, 23, 59, 59) }); // Tue
		const result = scheduleTasks([task], [], basePrefs, [MON, TUE]);
		expect(result.scheduled).toHaveLength(1);
		expect(result.missedDeadline).toHaveLength(0);
	});

	it("adds task to missedDeadline when it cannot be placed before deadline", () => {
		const pastDeadline = new Date(2030, 0, 6, 23, 59, 59); // Sunday before MON
		const task = makeTask({ dueDate: pastDeadline });
		const result = scheduleTasks([task], [], basePrefs, [MON]);
		expect(result.missedDeadline).toHaveLength(1);
		expect(result.missedDeadline[0].taskId).toBe("task-1");
	});

	it("respects bufferDays by scheduling before the buffer window", () => {
		const task = makeTask({
			dueDate: new Date(2030, 0, 10, 23, 59, 59),
			bufferDays: 2,
		});
		const result = scheduleTasks([task], [], basePrefs, [
			MON,
			TUE,
			WED,
			THU,
		]);
		expect(result.scheduled).toHaveLength(1);
		expect(result.scheduled[0].scheduledDate <= TUE).toBe(true);
	});

	it("falls back to hard deadline when buffer placement fails", () => {
		const task = makeTask({
			dueDate: new Date(2030, 0, 8, 23, 59, 59),
			bufferDays: 5,
		});
		const result = scheduleTasks([task], [], basePrefs, [MON, TUE]);
		expect(result.scheduled).toHaveLength(1);
	});
});

describe("scheduleTasks — over capacity", () => {
	it("adds task to overCapacity when no slot available and no dueDate", () => {
		const prefs = {
			...basePrefs,
			workStartTime: "09:00",
			workEndTime: "09:30",
		};
		const tasks = [
			makeTask({ id: "t1", duration: 30 }),
			makeTask({ id: "t2", duration: 30 }),
		];
		const result = scheduleTasks(tasks, [], prefs, [MON]);
		expect(result.overCapacity.length + result.scheduled.length).toBe(2);
	});
});

describe("scheduleTasks — week mode", () => {
	it("spreads tasks across multiple days", () => {
		const tasks = Array.from({ length: 6 }, (_, i) =>
			makeTask({ id: `t${i}`, duration: 60 }),
		);
		const result = scheduleTasks(tasks, [], basePrefs, [MON, TUE, WED]);
		const days = new Set(
			result.scheduled.map((s) => s.scheduledDate.toDateString()),
		);
		expect(days.size).toBeGreaterThan(1);
	});

	it("uses single day mode when only one day provided", () => {
		const tasks = [makeTask({ id: "t1" }), makeTask({ id: "t2" })];
		const result = scheduleTasks(tasks, [], basePrefs, [MON]);
		expect(result.scheduled.length).toBeGreaterThan(0);
	});
});

describe("scheduleTasks — calendar event blocking", () => {
	it("schedules task after a blocking event", () => {
		const blockEvent = {
			id: "ev-1",
			start: new Date(2030, 0, 7, 9, 0),
			end: new Date(2030, 0, 7, 10, 0),
		};
		const result = scheduleTasks(
			[makeTask({ duration: 60 })],
			[blockEvent],
			basePrefs,
			[MON],
		);
		expect(
			result.scheduled[0].scheduledTime.getHours(),
		).toBeGreaterThanOrEqual(10);
	});

	it("schedules task before a blocking event when there is room", () => {
		const blockEvent = {
			id: "ev-1",
			start: new Date(2030, 0, 7, 11, 0),
			end: new Date(2030, 0, 7, 17, 0),
		};
		const result = scheduleTasks(
			[makeTask({ duration: 60 })],
			[blockEvent],
			basePrefs,
			[MON],
		);
		expect(result.scheduled[0].scheduledTime.getHours()).toBe(9);
	});
});

describe("scheduleTasks — session and break rules", () => {
	it("inserts a break after the session length is reached", () => {
		const prefs = { ...basePrefs, sessionLength: 60, breakLength: 15 };
		const tasks = [
			makeTask({ id: "t1", duration: 60 }),
			makeTask({ id: "t2", duration: 60 }),
		];
		const result = scheduleTasks(tasks, [], prefs, [MON]);
		expect(result.scheduled).toHaveLength(2);
		const t1End = result.scheduled[0].scheduledTime.getTime() + 60 * 60_000;
		const t2Start = result.scheduled[1].scheduledTime.getTime();
		expect(t2Start).toBeGreaterThanOrEqual(t1End + 15 * 60_000);
	});
});

describe("scheduleTasks — task ordering", () => {
	const highTask = makeTask({ id: "high", priority: "high", duration: 60 });
	const lowTask = makeTask({ id: "low", priority: "low", duration: 60 });

	it("schedules high priority task before low priority with default order", () => {
		const result = scheduleTasks([lowTask, highTask], [], basePrefs, [MON]);
		const highIdx = result.scheduled.findIndex((s) => s.taskId === "high");
		const lowIdx = result.scheduled.findIndex((s) => s.taskId === "low");
		expect(highIdx).toBeLessThan(lowIdx);
	});

	it("sorts by duration ascending with duration_asc order", () => {
		const short = makeTask({ id: "short", duration: 30 });
		const long = makeTask({ id: "long", duration: 120 });
		const prefs = { ...basePrefs, taskOrder: "duration_asc" };
		const result = scheduleTasks([long, short], [], prefs, [MON]);
		expect(result.scheduled[0].taskId).toBe("short");
	});

	it("sorts by duration descending with duration_desc order", () => {
		const short = makeTask({ id: "short", duration: 30 });
		const long = makeTask({ id: "long", duration: 120 });
		const prefs = { ...basePrefs, taskOrder: "duration_desc" };
		const result = scheduleTasks([short, long], [], prefs, [MON]);
		expect(result.scheduled[0].taskId).toBe("long");
	});

	it("sorts by deadline with deadline order", () => {
		const sooner = makeTask({
			id: "sooner",
			dueDate: new Date(2030, 0, 8),
			duration: 60,
		});
		const later = makeTask({
			id: "later",
			dueDate: new Date(2030, 0, 10),
			duration: 60,
		});
		const prefs = { ...basePrefs, taskOrder: "deadline" };
		const result = scheduleTasks([later, sooner], [], prefs, [MON, TUE]);
		expect(result.scheduled[0].taskId).toBe("sooner");
	});

	it("sorts easier tasks first with easy-first order", () => {
		const easy = makeTask({ id: "easy", priority: "low", duration: 30 });
		const hard = makeTask({ id: "hard", priority: "high", duration: 60 });
		const prefs = { ...basePrefs, taskOrder: "easy-first" };
		const result = scheduleTasks([hard, easy], [], prefs, [MON]);
		expect(result.scheduled[0].taskId).toBe("easy");
	});

	it("sorts harder tasks first with hard-first order", () => {
		const sooner = makeTask({
			id: "sooner",
			dueDate: new Date(2030, 0, 8),
			duration: 60,
		});
		const later = makeTask({
			id: "later",
			dueDate: new Date(2030, 0, 10),
			duration: 60,
		});
		const prefs = { ...basePrefs, taskOrder: "hard-first" };
		const result = scheduleTasks([later, sooner], [], prefs, [MON, TUE]);
		expect(result.scheduled[0].taskId).toBe("sooner");
	});
});

describe("scheduleTasks — preference normalisation", () => {
	it("falls back to 09:00 work start when not provided", () => {
		const prefs = { ...basePrefs, workStartTime: "" };
		const result = scheduleTasks([makeTask()], [], prefs, [MON]);
		expect(result.scheduled[0].scheduledTime.getHours()).toBe(9);
	});

	it("falls back to 17:00 work end when not provided", () => {
		const prefs = { ...basePrefs, workEndTime: "" };
		const result = scheduleTasks([makeTask()], [], prefs, [MON]);
		expect(result.scheduled).toHaveLength(1);
	});

	it("handles non-array daysOff gracefully", () => {
		const prefs = { ...basePrefs, daysOff: null as any };
		const result = scheduleTasks([makeTask()], [], prefs, [MON]);
		expect(result.scheduled).toHaveLength(1);
	});
});

describe("scheduleTasks — allEvents", () => {
	it("uses allEvents over events for event lookup when provided", () => {
		const { getNextOccurrenceDeadline } = require("../taskSchedulingUtils");
		const linkedEvent = {
			id: "ev-linked",
			start: new Date(2030, 0, 10),
			end: new Date(2030, 0, 10),
			recurrence: { type: "weekly", days: ["Fri"] },
		};
		(getNextOccurrenceDeadline as jest.Mock).mockReturnValue(
			new Date(2030, 0, 9),
		);
		const task = makeTask({ eventId: "ev-linked", relativeOffsetDays: 0 });
		const result = scheduleTasks(
			[task],
			[],
			basePrefs,
			[MON, TUE, WED, THU],
			[linkedEvent],
		);
		expect(result.scheduled).toHaveLength(1);
	});
});

describe("scheduleTasks — output shape", () => {
	it("scheduled entry has taskId, scheduledDate, scheduledTime", () => {
		const result = scheduleTasks([makeTask()], [], basePrefs, [MON]);
		const entry = result.scheduled[0];
		expect(entry).toHaveProperty("taskId");
		expect(entry).toHaveProperty("scheduledDate");
		expect(entry).toHaveProperty("scheduledTime");
		expect(entry.scheduledDate).toBeInstanceOf(Date);
		expect(entry.scheduledTime).toBeInstanceOf(Date);
	});

	it("scheduledDate is set to local midnight", () => {
		const result = scheduleTasks([makeTask()], [], basePrefs, [MON]);
		const d = result.scheduled[0].scheduledDate;
		expect(d.getHours()).toBe(0);
		expect(d.getMinutes()).toBe(0);
		expect(d.getSeconds()).toBe(0);
	});

	describe("scheduleTasks — uncovered branches", () => {
		it("returns null slot when workEnd is before or equal to workStart", () => {
			const prefs = {
				...basePrefs,
				workStartTime: "17:00",
				workEndTime: "09:00",
			};
			const result = scheduleTasks([makeTask()], [], prefs, [MON]);
			expect(result.scheduled).toHaveLength(0);
			expect(result.overCapacity).toHaveLength(1);
		});

		it("skips overloaded day and schedules on next day when load spreading is active", () => {
			const prefs = {
				...basePrefs,
				workStartTime: "09:00",
				workEndTime: "10:00",
			};
			const tasks = [
				makeTask({ id: "t1", duration: 60 }),
				makeTask({ id: "t2", duration: 60 }),
			];
			const result = scheduleTasks(tasks, [], prefs, [MON, TUE]);
			const days = new Set(
				result.scheduled.map((s) => s.scheduledDate.toDateString()),
			);
			expect(days.size).toBe(2);
		});
	});

	describe("scheduleTasks — remaining uncovered branches", () => {
		it("returns overCapacity when a task cannot fit after the final blocking event", () => {
			const prefs = {
				...basePrefs,
				workStartTime: "09:00",
				workEndTime: "10:00",
				sessionLength: 60,
				breakLength: 15,
			};

			const events = [
				{
					id: "ev-1",
					start: new Date(2030, 0, 7, 9, 0),
					end: new Date(2030, 0, 7, 10, 0),
				},
			];

			const result = scheduleTasks(
				[makeTask({ id: "blocked", duration: 30 })],
				events,
				prefs,
				[MON],
			);

			expect(result.scheduled).toHaveLength(0);
			expect(result.overCapacity).toEqual([
				{ taskId: "blocked", title: "Task 1" },
			]);
		});

		it("moves past an event and schedules in the later free window", () => {
			const prefs = {
				...basePrefs,
				workStartTime: "09:00",
				workEndTime: "12:00",
			};

			const events = [
				{
					id: "ev-1",
					start: new Date(2030, 0, 7, 9, 0),
					end: new Date(2030, 0, 7, 10, 0),
				},
			];

			const result = scheduleTasks(
				[makeTask({ id: "later", duration: 60 })],
				events,
				prefs,
				[MON],
			);

			expect(result.scheduled).toHaveLength(1);
			expect(result.scheduled[0].scheduledTime.getHours()).toBe(10);
			expect(result.scheduled[0].scheduledTime.getMinutes()).toBe(0);
		});

		it("continues searching after a session overflow until a later slot fits", () => {
			const prefs = {
				...basePrefs,
				workStartTime: "09:00",
				workEndTime: "12:00",
				sessionLength: 30,
				breakLength: 15,
			};

			const tasks = [
				makeTask({ id: "first", duration: 30 }),
				makeTask({ id: "second", duration: 20 }),
			];

			const events = [
				{
					id: "ev-1",
					start: new Date(2030, 0, 7, 9, 45),
					end: new Date(2030, 0, 7, 10, 15),
				},
			];

			const result = scheduleTasks(tasks, events, prefs, [MON]);

			expect(result.scheduled).toHaveLength(2);

			const first = result.scheduled.find((t) => t.taskId === "first")!;
			const second = result.scheduled.find((t) => t.taskId === "second")!;

			expect(first.scheduledTime.getHours()).toBe(9);
			expect(first.scheduledTime.getMinutes()).toBe(0);
			expect(second.scheduledTime.getTime()).toBeGreaterThan(
				new Date(2030, 0, 7, 10, 15).getTime() - 1,
			);
		});
	});

	it("uses priority fallback when hard-first tasks have no deadlines", () => {
		const high = makeTask({ id: "high", priority: "high", dueDate: null });
		const low = makeTask({ id: "low", priority: "low", dueDate: null });
		const prefs = { ...basePrefs, taskOrder: "hard-first" };

		const result = scheduleTasks([low, high], [], prefs, [MON]);

		expect(result.scheduled[0].taskId).toBe("high");
	});

	it("returns overCapacity when the whole work day is covered by back-to-back events", () => {
		const prefs = {
			...basePrefs,
			workStartTime: "09:00",
			workEndTime: "11:00",
		};

		const events = [
			{
				id: "ev-1",
				start: new Date(2030, 0, 7, 9, 0),
				end: new Date(2030, 0, 7, 10, 0),
			},
			{
				id: "ev-2",
				start: new Date(2030, 0, 7, 10, 0),
				end: new Date(2030, 0, 7, 11, 0),
			},
		];

		const result = scheduleTasks(
			[makeTask({ id: "blocked", duration: 30 })],
			events,
			prefs,
			[MON],
		);

		expect(result.scheduled).toHaveLength(0);
		expect(result.overCapacity).toEqual([
			{ taskId: "blocked", title: "Task 1" },
		]);
	});

	it("continues searching after a too-small gap before an event", () => {
		const prefs = {
			...basePrefs,
			workStartTime: "09:00",
			workEndTime: "12:00",
			sessionLength: 120,
			breakLength: 15,
		};

		const events = [
			{
				id: "ev-1",
				start: new Date(2030, 0, 7, 9, 30),
				end: new Date(2030, 0, 7, 10, 0o0),
			},
		];

		const result = scheduleTasks(
			[makeTask({ id: "gap-test", duration: 45 })],
			events,
			prefs,
			[MON],
		);

		expect(result.scheduled).toHaveLength(1);
		expect(result.scheduled[0].scheduledTime.getHours()).toBe(10);
		expect(result.scheduled[0].scheduledTime.getMinutes()).toBe(0);
	});
	it("sorts by shorter duration when easy-first tasks have the same priority", () => {
		const short = makeTask({
			id: "short",
			priority: "medium",
			duration: 30,
		});
		const long = makeTask({ id: "long", priority: "medium", duration: 90 });
		const prefs = { ...basePrefs, taskOrder: "easy-first" };

		const result = scheduleTasks([long, short], [], prefs, [MON]);

		expect(result.scheduled[0].taskId).toBe("short");
		expect(result.scheduled[1].taskId).toBe("long");
	});

	it("finishes the day when the next blocking event starts at work end", () => {
		const prefs = {
			...basePrefs,
			workStartTime: "09:00",
			workEndTime: "10:00",
		};

		const events = [
			{
				id: "ev-1",
				start: new Date(2030, 0, 7, 9, 30),
				end: new Date(2030, 0, 7, 10, 0),
			},
		];

		const result = scheduleTasks(
			[makeTask({ id: "too-long", duration: 45 })],
			events,
			prefs,
			[MON],
		);

		expect(result.scheduled).toHaveLength(0);
		expect(result.overCapacity).toEqual([
			{ taskId: "too-long", title: "Task 1" },
		]);
	});

	it("ends the day when a too-long task cannot fit before the only remaining block", () => {
		const prefs = {
			...basePrefs,
			workStartTime: "09:00",
			workEndTime: "10:00",
			sessionLength: 120,
			breakLength: 15,
		};

		const events = [
			{
				id: "ev-1",
				start: new Date(2030, 0, 7, 9, 30),
				end: new Date(2030, 0, 7, 10, 0),
			},
		];

		const result = scheduleTasks(
			[makeTask({ id: "too-long", duration: 45 })],
			events,
			prefs,
			[MON],
		);

		expect(result.scheduled).toHaveLength(0);
		expect(result.overCapacity).toEqual([
			{ taskId: "too-long", title: "Task 1" },
		]);
	});

	it("sorts by shorter duration when easy-first tasks have the same priority", () => {
		const short = makeTask({
			id: "short",
			priority: "medium",
			duration: 30,
		});
		const long = makeTask({ id: "long", priority: "medium", duration: 90 });
		const prefs = { ...basePrefs, taskOrder: "easy-first" };

		const result = scheduleTasks([long, short], [], prefs, [MON]);

		expect(result.scheduled[0].taskId).toBe("short");
		expect(result.scheduled[1].taskId).toBe("long");
	});
});
