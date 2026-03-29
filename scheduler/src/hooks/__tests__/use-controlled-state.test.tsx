import { renderHook, act } from "@testing-library/react";
import { useControlledState } from "../use-controlled-state";

/**
 * Tests the useControlledState hook for both controlled and uncontrolled component patterns,
 * ensuring internal state syncing and callback execution work as expected.
 */
describe("useControlledState", () => {
  it("initializes with defaultValue when uncontrolled", () => {
    const { result } = renderHook(() =>
      useControlledState({ defaultValue: "default" })
    );

    expect(result.current[0]).toBe("default");
  });

  it("initializes with value when controlled, ignoring defaultValue", () => {
    const { result } = renderHook(() =>
      useControlledState({ value: "controlled", defaultValue: "default" })
    );

    expect(result.current[0]).toBe("controlled");
  });

  it("updates internal state when setState is called (uncontrolled)", () => {
    const { result } = renderHook(() =>
      useControlledState({ defaultValue: 1 })
    );

    act(() => {
      result.current[1](2);
    });

    expect(result.current[0]).toBe(2);
  });

  it("calls onChange with the next value and additional arguments", () => {
    const onChangeMock = jest.fn();
    const { result } = renderHook(() =>
      useControlledState({ defaultValue: 1, onChange: onChangeMock })
    );

    act(() => {
      result.current[1](2, "extra-arg");
    });

    expect(onChangeMock).toHaveBeenCalledWith(2, "extra-arg");
  });

  it("syncs internal state when the external value prop changes", () => {
    const { result, rerender } = renderHook(
      (props: { value?: string }) => useControlledState(props),
      { initialProps: { value: "initial" } }
    );

    expect(result.current[0]).toBe("initial");

    rerender({ value: "updated" });

    expect(result.current[0]).toBe("updated");
  });

  it("does not overwrite internal state if the new external value is undefined", () => {
    const { result, rerender } = renderHook(
      (props: { value?: string }) => useControlledState(props),
      { initialProps: { value: "initial" } }
    );

    act(() => {
      result.current[1]("internal-update");
    });

    rerender({ value: undefined });

    expect(result.current[0]).toBe("internal-update");
  });
});