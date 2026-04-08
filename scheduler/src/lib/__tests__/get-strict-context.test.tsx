import React from "react";
import { renderHook } from "@testing-library/react";
import { getStrictContext } from "../get-strict-context";

describe("getStrictContext", () => {
  it("returns the provided context value when used inside the provider", () => {
    const [TestProvider, useTestContext] = getStrictContext<string>("TestProvider");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestProvider value="hello">{children}</TestProvider>
    );

    const { result } = renderHook(() => useTestContext(), { wrapper });

    expect(result.current).toBe("hello");
  });

  it("throws the custom provider name when used outside the provider", () => {
    const [, useTestContext] = getStrictContext<string>("TestProvider");

    expect(() => renderHook(() => useTestContext())).toThrow(
      "useContext must be used within TestProvider"
    );
  });

  it('throws the fallback message when no provider name is given', () => {
    const [, useUnnamedContext] = getStrictContext<number>();

    expect(() => renderHook(() => useUnnamedContext())).toThrow(
      "useContext must be used within a Provider"
    );
  });

  it("works with non-string values too", () => {
    const value = { id: 1, name: "Deeti" };
    const [ObjectProvider, useObjectContext] =
      getStrictContext<{ id: number; name: string }>("ObjectProvider");

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ObjectProvider value={value}>{children}</ObjectProvider>
    );

    const { result } = renderHook(() => useObjectContext(), { wrapper });

    expect(result.current).toEqual(value);
  });
});