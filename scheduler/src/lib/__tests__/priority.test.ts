/**
 * Testing for lib/priority
 */

import { getPriorityStyle } from "../priority";

describe("getPriorityStyle", () => {
  /**
   * Validates the styling string returned for the "High" priority level.
   */
  it("returns the correct style for High priority", () => {
    const result = getPriorityStyle("High");
    expect(result).toBe("bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200");
  });

  /**
   * Validates the styling string returned for the "Medium" priority level.
   */
  it("returns the correct style for Medium priority", () => {
    const result = getPriorityStyle("Medium");
    expect(result).toBe("bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200");
  });

  /**
   * Validates the styling string returned for the "Low" priority level.
   */
  it("returns the correct style for Low priority", () => {
    const result = getPriorityStyle("Low");
    expect(result).toBe("bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200");
  });

  /**
   * Ensures that any unrecognized priority falls back to the default slate styling.
   */
  it("returns the default style for an unknown priority", () => {
    const result = getPriorityStyle("Urgent");
    expect(result).toBe("bg-slate-100 text-slate-700 border-slate-200");
  });

  /**
   * Ensures that an empty string also triggers the default fallback.
   */
  it("returns the default style for an empty string", () => {
    const result = getPriorityStyle("");
    expect(result).toBe("bg-slate-100 text-slate-700 border-slate-200");
  });
});