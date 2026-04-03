import * as React from "react";

/**
 * Hook that supports both controlled and uncontrolled state.
 *
 * If `value` is provided, it behaves as a controlled component.
 * Otherwise, it falls back to internal state initialized by `defaultValue`.
 *
 * Calls `onChange` whenever the state is updated.
 *
 * @param props.value - Controlled value (optional)
 * @param props.defaultValue - Initial uncontrolled value
 * @param props.onChange - Callback fired when state changes
 * @returns [state, setState] tuple similar to useState
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useControlledState(props: any) {
  const { value, defaultValue, onChange } = props;

  const [state, setInternalState] = React.useState(
    value !== undefined ? value : defaultValue
  );

  React.useEffect(() => {
    if (value !== undefined) setInternalState(value);
  }, [value]);

  const setState = React.useCallback(
    (next: any, ...args: any[]) => {
      setInternalState(next);
      onChange?.(next, ...args);
    },
    [onChange]
  );

  return [state, setState] as const;
}