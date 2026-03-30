/**
 * Testing for lib/map/utils
 */

import { calcCenter, formatDate, createPinSvg, injectLeafletCSS } from "../utils";

// calcCenter

describe("calcCenter", () => {
  it("returns DEFAULT_CENTER (London) when coords array is empty", () => {
    const result = calcCenter([]);
    expect(result).toEqual([51.505, -0.09]);
  });

  it("returns the single coordinate when only one point is given", () => {
    expect(calcCenter([[48.8566, 2.3522]])).toEqual([48.8566, 2.3522]);
  });

  it("returns the average of two points", () => {
    const result = calcCenter([
      [0, 0],
      [2, 4],
    ]);
    expect(result).toEqual([1, 2]);
  });

  it("returns the average of three points", () => {
    const result = calcCenter([
      [0, 0],
      [3, 6],
      [6, 12],
    ]);
    expect(result[0]).toBeCloseTo(3);
    expect(result[1]).toBeCloseTo(6);
  });

  it("handles negative coordinates correctly", () => {
    const result = calcCenter([
      [-10, -20],
      [10, 20],
    ]);
    expect(result).toEqual([0, 0]);
  });

  it("returns a tuple of length 2", () => {
    expect(calcCenter([[1, 2]])).toHaveLength(2);
  });
});

// formatDate 

describe("formatDate", () => {
  it("formats a valid ISO string into the expected pattern", () => {
    const result = formatDate("2025-01-06T14:30:00.000Z");
    expect(result).toMatch(/Mon/);
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/06/);
  });

  it("includes hours and minutes in the output", () => {
    const result = formatDate("2025-06-15T09:05:00.000Z");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("returns a non-empty string", () => {
    expect(formatDate("2025-03-01T00:00:00.000Z")).toBeTruthy();
  });
});

// createPinSvg 

describe("createPinSvg", () => {
  it("returns a string containing an svg element", () => {
    const result = createPinSvg("#ff0000", "Work");
    expect(result).toContain("<svg");
    expect(result).toContain("</svg>");
  });

  it("includes the provided color in the output", () => {
    const result = createPinSvg("#3b82f6", "W");
    expect(result).toContain("#3b82f6");
  });

  it("uses only the first letter of the label, uppercased", () => {
    const result = createPinSvg("#000", "work");
    expect(result).toContain("W");
  });

  it("uppercases the label letter", () => {
    const result = createPinSvg("#000", "exam");
    expect(result).toContain("E");
    expect(result).not.toContain(">e<");
  });

  it("handles a single character label", () => {
    const result = createPinSvg("#000", "D");
    expect(result).toContain("D");
  });

  it("produces valid SVG dimensions (32x42 viewBox)", () => {
    const result = createPinSvg("#000", "X");
    expect(result).toContain('width="32"');
    expect(result).toContain('height="42"');
  });
});

// injectLeafletCSS

describe("injectLeafletCSS", () => {
  beforeEach(() => {
    document.getElementById("leaflet-css")?.remove();
  });

  it("injects a link element with id leaflet-css into document.head", () => {
    injectLeafletCSS();
    const link = document.getElementById("leaflet-css");
    expect(link).not.toBeNull();
    expect(link!.tagName).toBe("LINK");
  });

  it("sets rel=stylesheet on the injected link", () => {
    injectLeafletCSS();
    const link = document.getElementById("leaflet-css") as HTMLLinkElement;
    expect(link.rel).toBe("stylesheet");
  });

  it("sets the correct Leaflet CDN href", () => {
    injectLeafletCSS();
    const link = document.getElementById("leaflet-css") as HTMLLinkElement;
    expect(link.href).toContain("leaflet");
  });

  it("does not inject a second link if called twice (idempotent)", () => {
    injectLeafletCSS();
    injectLeafletCSS();
    const links = document.querySelectorAll("#leaflet-css");
    expect(links).toHaveLength(1);
  });
});
