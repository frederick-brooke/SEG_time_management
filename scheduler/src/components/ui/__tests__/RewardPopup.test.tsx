import { render, screen, act } from "@testing-library/react";
import { RewardPopup } from "../RewardPopup";

describe("RewardPopup", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("renders the xp text", () => {
		render(<RewardPopup xp={25} onDone={jest.fn()} />);
		expect(screen.getByText("+25")).toBeInTheDocument();
	});

	it("starts in hidden stage styles", () => {
		const { container } = render(
			<RewardPopup xp={10} onDone={jest.fn()} />,
		);
		const wrapper = container.firstChild as HTMLElement;

		expect(wrapper).toHaveStyle({
			top: "120%",
			opacity: "1",
		});
		expect(wrapper.style.transform).toContain("scale(1)");
	});

	it("moves to center after 50ms", () => {
		const { container } = render(
			<RewardPopup xp={10} onDone={jest.fn()} />,
		);
		const wrapper = container.firstChild as HTMLElement;

		act(() => {
			jest.advanceTimersByTime(50);
		});

		expect(wrapper).toHaveStyle({ top: "50%" });
		expect(wrapper.style.transform).toContain("scale(1)");
		expect(wrapper).toHaveStyle({ opacity: "1" });
	});

	it("enters exit stage after 1500ms", () => {
		const { container } = render(
			<RewardPopup xp={10} onDone={jest.fn()} />,
		);
		const wrapper = container.firstChild as HTMLElement;

		act(() => {
			jest.advanceTimersByTime(1500);
		});

		expect(wrapper).toHaveStyle({ top: "50%" });
		expect(wrapper.style.transform).toContain("scale(0)");
		expect(wrapper).toHaveStyle({ opacity: "0" });
	});

	it("calls onDone after 2000ms", () => {
		const onDone = jest.fn();

		render(<RewardPopup xp={10} onDone={onDone} />);

		act(() => {
			jest.advanceTimersByTime(2000);
		});

		expect(onDone).toHaveBeenCalledTimes(1);
	});

	it("clears timers on unmount", () => {
		const onDone = jest.fn();

		const { unmount } = render(<RewardPopup xp={10} onDone={onDone} />);
		unmount();

		act(() => {
			jest.advanceTimersByTime(3000);
		});

		expect(onDone).not.toHaveBeenCalled();
	});
});
