/**
 * Testing for lib/map/constants
 */

import {
  DEFAULT_CENTER,
  CATEGORY_COLORS,
  TRANSPORT_ICONS,
  USER_ICON_URL,
  FRIEND_ICON_URL,
  MAP_HEIGHT,
} from "@/lib/map/constants";

describe("map constants", () => {
  // DEFAULT_CENTER 
  describe("DEFAULT_CENTER", () => {
    it("is a tuple of two numbers", () => {
      expect(Array.isArray(DEFAULT_CENTER)).toBe(true);
      expect(DEFAULT_CENTER).toHaveLength(2);
      DEFAULT_CENTER.forEach((v) => expect(typeof v).toBe("number"));
    });

    it("defaults to London [51.505, -0.09]", () => {
      expect(DEFAULT_CENTER).toEqual([51.505, -0.09]);
    });
  });

  // CATEGORY_COLORS 
  describe("CATEGORY_COLORS", () => {
    const EXPECTED: Record<string, string> = {
      Lecture: "#6366f1",
      "Individual Study": "#10b981",
      Exam: "#ef4444",
      Personal: "#f59e0b",
      Lab: "#8b5cf6",
      Google: "#3b82f6",
    };

    it("contains exactly the expected category keys", () => {
      expect(Object.keys(CATEGORY_COLORS).sort()).toEqual(
        Object.keys(EXPECTED).sort()
      );
    });

    Object.entries(EXPECTED).forEach(([category, color]) => {
      it(`maps "${category}" to "${color}"`, () => {
        expect(CATEGORY_COLORS[category]).toBe(color);
      });
    });
  });

  // TRANSPORT_ICONS 
  describe("TRANSPORT_ICONS", () => {
    const EXPECTED: Record<string, string> = {
      walking: "🚶",
      cycling: "🚴",
      driving: "🚗",
    };

    it("contains exactly the expected transport keys", () => {
      expect(Object.keys(TRANSPORT_ICONS).sort()).toEqual(
        Object.keys(EXPECTED).sort()
      );
    });

    Object.entries(EXPECTED).forEach(([mode, icon]) => {
      it(`maps "${mode}" to "${icon}"`, () => {
        expect(TRANSPORT_ICONS[mode]).toBe(icon);
      });
    });
  });

  //  Icon URLs
  describe("USER_ICON_URL", () => {
    it("is a non-empty string", () => {
      expect(typeof USER_ICON_URL).toBe("string");
      expect(USER_ICON_URL.length).toBeGreaterThan(0);
    });

    it("points to the expected flaticon URL", () => {
      expect(USER_ICON_URL).toBe(
        "https://cdn-icons-png.flaticon.com/128/684/684908.png"
      );
    });
  });

  describe("FRIEND_ICON_URL", () => {
    it("is a non-empty string", () => {
      expect(typeof FRIEND_ICON_URL).toBe("string");
      expect(FRIEND_ICON_URL.length).toBeGreaterThan(0);
    });

    it("points to the expected flaticon URL", () => {
      expect(FRIEND_ICON_URL).toBe(
        "https://cdn-icons-png.flaticon.com/128/1077/1077012.png"
      );
    });
  });

  // MAP_HEIGHT 
  describe("MAP_HEIGHT", () => {
    it("is a non-empty string", () => {
      expect(typeof MAP_HEIGHT).toBe("string");
      expect(MAP_HEIGHT.length).toBeGreaterThan(0);
    });

    it('equals "600px"', () => {
      expect(MAP_HEIGHT).toBe("600px");
    });
  });
});
