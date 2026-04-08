/**
 * Testing for Rocket Progress component.
 */

import React from "react";
import { render, act } from "@testing-library/react";

let timeoutId = 0;
const rafCallbacks: FrameRequestCallback[] = [];

const requestAnimationFrameMock = jest.fn((cb: FrameRequestCallback) => {
	rafCallbacks.push(cb);
	return rafCallbacks.length;
});

const cancelAnimationFrameMock = jest.fn();

const setTimeoutMock = jest.fn((cb: (...args: any[]) => void) => {
	cb();
	timeoutId += 1;
	return timeoutId as unknown as ReturnType<typeof setTimeout>;
});

const clearTimeoutMock = jest.fn();

(global as any).requestAnimationFrame = requestAnimationFrameMock;
(global as any).cancelAnimationFrame = cancelAnimationFrameMock;
(global as any).setTimeout = setTimeoutMock;
(global as any).clearTimeout = clearTimeoutMock;

(globalThis as any).requestAnimationFrame = requestAnimationFrameMock;
(globalThis as any).cancelAnimationFrame = cancelAnimationFrameMock;
(globalThis as any).setTimeout = setTimeoutMock;
(globalThis as any).clearTimeout = clearTimeoutMock;

(window as any).requestAnimationFrame = requestAnimationFrameMock;
(window as any).cancelAnimationFrame = cancelAnimationFrameMock;
(window as any).setTimeout = setTimeoutMock;
(window as any).clearTimeout = clearTimeoutMock;

import { RocketProgress } from "../RocketProgress";

describe("RocketProgress Component", () => {
	const flushNextRaf = (time: number) => {
		const cb = rafCallbacks.shift();
		if (!cb) return;

		act(() => {
			cb(time);
		});
	};

	const normalizedText = (container: HTMLElement) =>
		(container.textContent ?? "").replace(/\s+/g, "");

	beforeEach(() => {
		timeoutId = 0;
		rafCallbacks.length = 0;
		requestAnimationFrameMock.mockClear();
		cancelAnimationFrameMock.mockClear();
		setTimeoutMock.mockClear();
		clearTimeoutMock.mockClear();

		jest.spyOn(performance, "now").mockReturnValue(0);

		Object.defineProperty(HTMLCanvasElement.prototype, "offsetWidth", {
			configurable: true,
			value: 200,
		});

		Object.defineProperty(HTMLCanvasElement.prototype, "offsetHeight", {
			configurable: true,
			value: 40,
		});

		HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
			beginPath: jest.fn(),
			arc: jest.fn(),
			fill: jest.fn(),
			fillStyle: "",
		})) as any;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("renders with default mission name", () => {
		const { container } = render(<RocketProgress progress={0} />);

		expect(normalizedText(container)).toContain("MISSIONSTART");
		expect(normalizedText(container)).toContain("100%REMAINING");
	});

	it("renders with custom mission name", () => {
		const { container } = render(
			<RocketProgress progress={25} missionName="MOON MISSION" />,
		);

		expect(normalizedText(container)).toContain("MOONMISSION");
	});

	it("applies custom height", () => {
		const { container } = render(
			<RocketProgress progress={10} height={60} />,
		);

		const track = container.querySelector(
			".relative.w-full.overflow-visible.rounded-full",
		);
		expect(track).toHaveStyle({ height: "60px" });
	});

	it("clamps progress below 0 to 0", () => {
		const { container } = render(<RocketProgress progress={-10} />);

		flushNextRaf(5000);

		expect(normalizedText(container)).toContain("0%");
		expect(normalizedText(container)).toContain("100%REMAINING");
	});

	it("clamps progress above 100 to 100", () => {
		const { container } = render(<RocketProgress progress={150} />);

		flushNextRaf(5000);

		expect(normalizedText(container)).toContain("100%");
		expect(normalizedText(container)).toContain("0%REMAINING");
	});

	it("shows launch status when progress is 50 or less", () => {
		const { container } = render(<RocketProgress progress={0} />);

		expect(normalizedText(container)).toContain("●LAUNCHSEQ");
	});

	it("shows completing tasks status when progress is above 50", () => {
		const { container } = render(<RocketProgress progress={70} />);

		flushNextRaf(5000);

		expect(normalizedText(container)).toContain("●COMPLETINGTASKS");
	});

	it("shows completed status when progress reaches 100", () => {
		const { container } = render(<RocketProgress progress={100} />);

		flushNextRaf(5000);

		expect(normalizedText(container)).toContain("●ALLTASKSACHIEVED");
	});

	it("shows the correct timer text for completed progress", () => {
		const { container } = render(<RocketProgress progress={100} />);

		flushNextRaf(5000);

		expect(normalizedText(container)).toContain("T+10:00");
	});

	it("renders the rocket emoji", () => {
		const { container } = render(<RocketProgress progress={10} />);

		expect(normalizedText(container)).toContain("🚀");
	});

	it("applies incomplete accent styling before completion", () => {
		const { container } = render(<RocketProgress progress={10} />);

		expect(container.querySelector(".text-sky-400")).toBeInTheDocument();
	});

	it("applies complete accent styling after completion", () => {
		const { container } = render(<RocketProgress progress={100} />);

		flushNextRaf(5000);

		expect(
			container.querySelector(".text-emerald-400"),
		).toBeInTheDocument();
	});

	it("handles null canvas context", () => {
		HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as any;

		const { container } = render(<RocketProgress progress={20} />);

		expect(normalizedText(container)).toContain("MISSIONSTART");
	});

	it("cancels animation frame and timeout on unmount", () => {
		const { unmount } = render(<RocketProgress progress={50} />);

		expect(requestAnimationFrameMock).toHaveBeenCalled();

		unmount();

		expect(cancelAnimationFrameMock).toHaveBeenCalled();
		expect(clearTimeoutMock).toHaveBeenCalled();
	});

	it("keeps requesting animation frames while animation is still in progress", () => {
		const { container } = render(<RocketProgress progress={80} />);

		flushNextRaf(100);

		expect(requestAnimationFrameMock).toHaveBeenCalledTimes(2);
		expect(normalizedText(container)).not.toContain("80%");
	});
	it("handles null canvas ref on unmount", () => {
		const { unmount } = render(<RocketProgress progress={20} />);

		expect(() => unmount()).not.toThrow();
	});
});
