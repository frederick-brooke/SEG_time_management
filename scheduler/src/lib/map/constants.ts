export const DEFAULT_CENTER: readonly [number, number] = [51.505, -0.09] as const;

/** Event category colors */
export const CATEGORY_COLORS = {
  Lecture: "#6366f1",
  "Individual Study": "#10b981",
  Exam: "#ef4444",
  Personal: "#f59e0b",
  Lab: "#8b5cf6",
  Google: "#3b82f6",
} as const;

/** Transport mode icons */
export const TRANSPORT_ICONS = {
  walking: "🚶",
  cycling: "🚴",
  driving: "🚗",
} as const;

/** Default icons for user and friends */
export const USER_ICON_URL =
  "https://cdn-icons-png.flaticon.com/128/684/684908.png";
export const FRIEND_ICON_URL =
  "https://cdn-icons-png.flaticon.com/128/1077/1077012.png";

/** Map container height */
export const MAP_HEIGHT = "600px";