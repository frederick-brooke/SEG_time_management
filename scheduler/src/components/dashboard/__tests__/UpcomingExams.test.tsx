/**
 * Testing for Upcoming Exams component
 */

import { render, screen } from "@testing-library/react";
import { UpcomingExams, getUpcomingExams } from "../UpcomingExams";

// Mocks Next.js Link to render as a standard anchor tag for straightforward DOM testing
jest.mock("next/link", () => {
	return ({ children, href, className }) => (
		<a href={href} className={className}>
			{children}
		</a>
	);
});

describe("Upcoming Exams Module", () => {
	// Lock system time to guarantee deterministic date boundary testing
	const FIXED_SYSTEM_TIME = "2024-05-10T12:00:00Z"; // Today is May 10, 2024

	beforeAll(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(FIXED_SYSTEM_TIME));
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	// Comprehensive test data covering past, present, boundaries, and future
	const mockExams = [
		{
			id: "past-exam",
			title: "History 101",
			examDate: "2024-05-09T23:59:59Z", // Yesterday
			tasks: [1, 2, 3],
		},
		{
			id: "today-exam",
			title: "Biology 202",
			examDate: "2024-05-10T14:00:00Z", // Today
			tasks: [1],
		},
		{
			id: "boundary-exam",
			title: "Calculus III",
			examDate: "2024-05-24T23:59:59Z", // Exactly 14 days from today
			tasks: [1, 2],
		},
		{
			id: "future-exam",
			title: "Physics II",
			examDate: "2024-05-25T00:00:01Z", // 15 days away (should be excluded)
		},
		{
			id: "upcoming-exam",
			title: "Computer Science",
			examDate: "2024-05-15T10:00:00Z", // 5 days away
			tasks: [],
		},
	];

	describe("getUpcomingExams (Pure Business Logic)", () => {
		it("includes exams occurring exactly today", () => {
			const results = getUpcomingExams(mockExams);
			expect(results.some((e) => e.id === "today-exam")).toBe(true);
		});

		it("includes exams occurring exactly on the 14th day boundary", () => {
			const results = getUpcomingExams(mockExams);
			expect(results.some((e) => e.id === "boundary-exam")).toBe(true);
		});

		it("strictly excludes exams occurring 15 or more days away", () => {
			const results = getUpcomingExams(mockExams);
			expect(results.some((e) => e.id === "future-exam")).toBe(false);
		});

		it("strictly excludes past exams", () => {
			const results = getUpcomingExams(mockExams);
			expect(results.some((e) => e.id === "past-exam")).toBe(false);
		});

		it("sorts the filtered exams strictly chronologically", () => {
			const results = getUpcomingExams(mockExams);
			// Expected order: Today (May 10), Upcoming (May 15), Boundary (May 24)
			expect(results[0].id).toBe("today-exam");
			expect(results[1].id).toBe("upcoming-exam");
			expect(results[2].id).toBe("boundary-exam");
		});

		it("respects a custom daysWindow parameter", () => {
			// Using a 4-day window should exclude the 5-day and 14-day exams
			const results = getUpcomingExams(mockExams, 4);
			expect(results.length).toBe(1);
			expect(results[0].id).toBe("today-exam");
		});
	});

	describe("UpcomingExams Component (UI Integration)", () => {
		// Validates fallback states
		it("returns null and renders nothing if the exams array is completely empty", () => {
			const { container } = render(<UpcomingExams exams={[]} />);
			expect(container).toBeEmptyDOMElement();
		});

		it("returns null and renders nothing if no exams fall within the active time window", () => {
			// Passing only the past and far-future exams
			const { container } = render(
				<UpcomingExams exams={[mockExams[0], mockExams[3]]} />,
			);
			expect(container).toBeEmptyDOMElement();
		});

		// Validates correct rendering of valid data
		it("renders the component and heading when there are valid upcoming exams", () => {
			render(<UpcomingExams exams={mockExams} />);
			expect(screen.getByText("Exams Approaching")).toBeInTheDocument();
		});

		it("displays the correct task count, defaulting to 0 if the tasks array is missing or empty", () => {
			render(<UpcomingExams exams={mockExams} />);

			// Calculus III has 2 tasks
			expect(screen.getByText("2 Tasks remaining")).toBeInTheDocument();

			// Computer Science has an empty tasks array
			expect(
				screen.getAllByText("0 Tasks remaining")[0],
			).toBeInTheDocument();
		});

		it("formats the exam dates correctly using the en-GB locale", () => {
			render(<UpcomingExams exams={mockExams} />);

			// May 10, 2024 -> 10/05/2024
			expect(screen.getByText("10/05/2024")).toBeInTheDocument();

			// May 24, 2024 -> 24/05/2024
			expect(screen.getByText("24/05/2024")).toBeInTheDocument();
		});

		it("generates the correctly structured href paths for Next.js Links", () => {
			render(<UpcomingExams exams={mockExams} />);

			const links = screen.getAllByRole("link");

			// Sorted: Today (10th), Upcoming (15th), Boundary (24th)
			expect(links[0]).toHaveAttribute(
				"href",
				"/exam-planner/today-exam",
			);
			expect(links[1]).toHaveAttribute(
				"href",
				"/exam-planner/upcoming-exam",
			);
			expect(links[2]).toHaveAttribute(
				"href",
				"/exam-planner/boundary-exam",
			);
		});
	});

	it("excludes exams that do not have an examDate", () => {
		const results = getUpcomingExams([
			{ id: "no-date", title: "No Date Exam", tasks: [1, 2] },
			...mockExams,
		]);

		expect(results.some((e) => e.id === "no-date")).toBe(false);
	});

	it("shows 0 Tasks remaining when the tasks field is missing", () => {
		const examsWithMissingTasks = [
			{
				id: "missing-tasks",
				title: "Chemistry",
				examDate: "2024-05-12T10:00:00Z",
			},
		];

		render(<UpcomingExams exams={examsWithMissingTasks} />);
		expect(screen.getByText("0 Tasks remaining")).toBeInTheDocument();
	});

	it("uses the default empty exams array when exams prop is omitted", () => {
		const { container } = render(<UpcomingExams />);
		expect(container).toBeEmptyDOMElement();
	});
});
