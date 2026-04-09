import {
	toUniqueDays,
	daysSinceMostRecent,
	countStreak,
	calculateStreak,
} from "../streak";

import { prisma } from "lib/prisma";

jest.mock("lib/prisma", () => ({
	prisma: {
		task: {
			findMany: jest.fn(),
		},
	},
}));

const mockedFindMany = prisma.task.findMany as jest.Mock;

describe("streak utilities", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		jest.setSystemTime(new Date("2026-04-06T12:00:00.000Z"));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("toUniqueDays", () => {
		it("returns unique normalized days sorted descending and ignores nulls", () => {
			const result = toUniqueDays([
				new Date("2026-04-06T10:30:00.000Z"),
				new Date("2026-04-06T23:59:00.000Z"), // same day, should dedupe
				null,
				new Date("2026-04-04T08:00:00.000Z"),
				new Date("2026-04-05T15:00:00.000Z"),
			]);

			expect(result).toEqual([
				new Date("2026-04-06T00:00:00.000Z").getTime(),
				new Date("2026-04-05T00:00:00.000Z").getTime(),
				new Date("2026-04-04T00:00:00.000Z").getTime(),
			]);
		});

		it("returns an empty array when all values are null", () => {
			expect(toUniqueDays([null, null])).toEqual([]);
		});
	});

	describe("daysSinceMostRecent", () => {
		it("returns Infinity when there are no completion days", () => {
			const today = new Date("2026-04-06T00:00:00.000Z").getTime();
			expect(daysSinceMostRecent([], today)).toBe(Infinity);
		});

		it("returns the number of days since the most recent completion", () => {
			const today = new Date("2026-04-06T00:00:00.000Z").getTime();
			const uniqueDays = [new Date("2026-04-04T00:00:00.000Z").getTime()];

			expect(daysSinceMostRecent(uniqueDays, today)).toBe(2);
		});
	});

	describe("countStreak", () => {
		it("counts a streak including today and previous consecutive days", () => {
			const today = new Date("2026-04-06T00:00:00.000Z").getTime();
			const uniqueDays = [
				new Date("2026-04-06T00:00:00.000Z").getTime(),
				new Date("2026-04-05T00:00:00.000Z").getTime(),
				new Date("2026-04-04T00:00:00.000Z").getTime(),
			];

			expect(countStreak(uniqueDays, today)).toBe(3);
		});

		it("counts a streak starting from yesterday when today is not completed", () => {
			const today = new Date("2026-04-06T00:00:00.000Z").getTime();
			const uniqueDays = [
				new Date("2026-04-05T00:00:00.000Z").getTime(),
				new Date("2026-04-04T00:00:00.000Z").getTime(),
			];

			expect(countStreak(uniqueDays, today)).toBe(2);
		});

		it("breaks the streak when the gap is greater than one day", () => {
			const today = new Date("2026-04-06T00:00:00.000Z").getTime();
			const uniqueDays = [
				new Date("2026-04-06T00:00:00.000Z").getTime(),
				new Date("2026-04-04T00:00:00.000Z").getTime(), // skips 2026-04-05
				new Date("2026-04-03T00:00:00.000Z").getTime(),
			];

			expect(countStreak(uniqueDays, today)).toBe(1);
		});

		it("returns 0 when there are no completion days", () => {
			const today = new Date("2026-04-06T00:00:00.000Z").getTime();
			expect(countStreak([], today)).toBe(0);
		});
	});

	describe("calculateStreak", () => {
		it("returns 0 when the user has no completed tasks", async () => {
			mockedFindMany.mockResolvedValue([]);

			await expect(calculateStreak("user-1")).resolves.toBe(0);

			expect(mockedFindMany).toHaveBeenCalledWith({
				where: {
					userId: "user-1",
					completed: true,
					completedAt: { not: null },
				},
				select: { completedAt: true },
			});
		});

		it("returns 0 when the most recent completion gap is greater than 2 days", async () => {
			mockedFindMany.mockResolvedValue([
				{ completedAt: new Date("2026-04-03T10:00:00.000Z") }, // gap = 3 from Apr 6
				{ completedAt: new Date("2026-04-02T10:00:00.000Z") },
			]);

			await expect(calculateStreak("user-2")).resolves.toBe(0);
		});

		it("returns the current streak when the gap is within the allowed range", async () => {
			mockedFindMany.mockResolvedValue([
				{ completedAt: new Date("2026-04-06T09:00:00.000Z") },
				{ completedAt: new Date("2026-04-05T14:00:00.000Z") },
				{ completedAt: new Date("2026-04-04T18:00:00.000Z") },
			]);

			await expect(calculateStreak("user-3")).resolves.toBe(3);
		});

		it("deduplicates multiple completed tasks on the same day when calculating streak", async () => {
			mockedFindMany.mockResolvedValue([
				{ completedAt: new Date("2026-04-06T09:00:00.000Z") },
				{ completedAt: new Date("2026-04-06T20:00:00.000Z") }, // same day
				{ completedAt: new Date("2026-04-05T10:00:00.000Z") },
			]);

			await expect(calculateStreak("user-4")).resolves.toBe(2);
		});
	});
});