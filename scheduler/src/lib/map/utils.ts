import { format } from "date-fns";
import { DEFAULT_CENTER } from "./constants";

/**
 * Calculates the geographic center (average lat/lng) of a list of coordinate pairs.
 * Falls back to DEFAULT_CENTER if the list is empty which is London.
 */
export function calcCenter(coords: [number, number][]): [number, number] {
  if (coords.length === 0) return DEFAULT_CENTER;
  return [
    coords.reduce((sum, c) => sum + c[0], 0) / coords.length,
    coords.reduce((sum, c) => sum + c[1], 0) / coords.length,
  ];
}


export function formatDate(iso: string): string {
  return format(new Date(iso), "EEE dd MMM, HH:mm");
}

/**
 * Generates an SVG string for a map pin with the given color and label letter.
 */
export function createPinSvg(color: string, label: string): string {
  const letter = label.charAt(0).toUpperCase();
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26s16-16 16-26C32 7.163 24.837 0 16 0z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="9" fill="white" opacity="0.9"/>
      <text x="16" y="21" text-anchor="middle" font-size="11"
        font-family="system-ui, sans-serif" font-weight="bold" fill="${color}">${letter}</text>
    </svg>
  `;
}

/**
 * Injects the Leaflet CSS stylesheet into the document head .
 */
export function injectLeafletCSS(): void {
  if (typeof window === "undefined") return;
  if (document.getElementById("leaflet-css")) return;
  const link = document.createElement("link");
  link.id = "leaflet-css";
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
}
