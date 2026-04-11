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
    expect(result).toBe("bg-red-500/15 text-red-400 border-red-500/25 rounded-full");
  });

  /**
   * Validates the styling string returned for the "Medium" priority level.
   */
  it("returns the correct style for Medium priority", () => {
    const result = getPriorityStyle("Medium");
    expect(result).toBe("bg-orange-400/15 text-orange-400 border-orange-400/25 rounded-full");
  });

  /**
   * Validates the styling string returned for the "Low" priority level.
   */
  it("returns the correct style for Low priority", () => {
    const result = getPriorityStyle("Low");
    expect(result).toBe("bg-green-400/10 text-green-400 border-green-400/20 rounded-full");
  });

  /**
   * Ensures that any unrecognized priority falls back to the default slate styling.
   */
  it("returns the default style for an unknown priority", () => {
    const result = getPriorityStyle("Urgent");
    expect(result).toBe("bg-slate-500/10 text-slate-400 border-slate-500/20 rounded-full");
  });

  /**
   * Ensures that an empty string also triggers the default fallback.
   */
  it("returns the default style for an empty string", () => {
    const result = getPriorityStyle("");
    expect(result).toBe("bg-slate-500/10 text-slate-400 border-slate-500/20 rounded-full");
  });
});