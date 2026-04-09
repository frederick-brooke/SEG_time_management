import { render, screen, waitFor } from "@testing-library/react";
import { CalendarEvents } from "../CalendarEvents";

describe("CalendarEvents", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		global.fetch = jest.fn();
	});

	function mockDate(dateString: string) {
		jest.useFakeTimers().setSystemTime(new Date(dateString));
	}

	afterEach(() => {
		jest.useRealTimers();
	});

	it("shows loading initially", () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			json: async () => [],
		});

		render(<CalendarEvents />);
		expect(screen.getByText(/loading data/i)).toBeInTheDocument();
	});

	it("shows no events message when empty", async () => {
		mockDate("2026-01-01T10:00:00Z");

		(global.fetch as jest.Mock).mockResolvedValue({
			json: async () => [],
		});

		render(<CalendarEvents />);

		expect(
			await screen.findByText(/no events scheduled/i),
		).toBeInTheDocument();
	});

	it("renders filtered upcoming events within 7 days", async () => {
		mockDate("2026-01-01T10:00:00Z");

		const events = [
			{ title: "Valid Event", start: "2026-01-03T10:00:00Z" }, // valid
			{ title: "Too Far", start: "2026-01-20T10:00:00Z" }, // excluded
			{ title: "Past Event", start: "2025-12-20T10:00:00Z" }, // excluded
		];

		(global.fetch as jest.Mock).mockResolvedValue({
			json: async () => events,
		});

		render(<CalendarEvents />);

		expect(await screen.findByText("Valid Event")).toBeInTheDocument();
		expect(screen.queryByText("Too Far")).not.toBeInTheDocument();
		expect(screen.queryByText("Past Event")).not.toBeInTheDocument();
	});

	it("sorts events by date ascending", async () => {
		mockDate("2026-01-01T10:00:00Z");

		const events = [
			{ title: "Later", start: "2026-01-05T10:00:00Z" },
			{ title: "Sooner", start: "2026-01-02T10:00:00Z" },
		];

		(global.fetch as jest.Mock).mockResolvedValue({
			json: async () => events,
		});

		render(<CalendarEvents />);

		const rendered = await screen.findAllByText(/Sooner|Later/);
		expect(rendered[0]).toHaveTextContent("Sooner");
		expect(rendered[1]).toHaveTextContent("Later");
	});

	it("limits to 5 events", async () => {
		mockDate("2026-01-01T10:00:00Z");

		const events = Array.from({ length: 10 }).map((_, i) => ({
			title: `Event ${i}`,
			start: `2026-01-0${(i % 7) + 1}T10:00:00Z`,
		}));

		(global.fetch as jest.Mock).mockResolvedValue({
			json: async () => events,
		});

		render(<CalendarEvents />);

		const rendered = await screen.findAllByText(/Event/);
		expect(rendered.length).toBeLessThanOrEqual(5);
	});

	it("renders event category when present", async () => {
		mockDate("2026-01-01T10:00:00Z");

		const events = [
			{
				title: "Meeting",
				start: "2026-01-02T10:00:00Z",
				category: "Work",
			},
		];

		(global.fetch as jest.Mock).mockResolvedValue({
			json: async () => events,
		});

		render(<CalendarEvents />);

		expect(await screen.findByText("Meeting")).toBeInTheDocument();
		expect(screen.getByText("Work")).toBeInTheDocument();
	});

	it("handles fetch error gracefully", async () => {
		mockDate("2026-01-01T10:00:00Z");

		const consoleSpy = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});

		(global.fetch as jest.Mock).mockRejectedValue(new Error("fail"));

		render(<CalendarEvents />);

		await waitFor(() => {
			expect(
				screen.getByText(/no events scheduled/i),
			).toBeInTheDocument();
		});

		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});
});
