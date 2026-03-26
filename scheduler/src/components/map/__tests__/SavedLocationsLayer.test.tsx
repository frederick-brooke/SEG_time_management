import React, { useImperativeHandle, forwardRef } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import SetLocationModal from "../SetLocationModal";
import { useGeolocation } from "@/lib/map/useGeolocation";
import { useRouter } from "next/navigation";
import { updateUserLocation } from "@/app/actions/update-user-location";

// Leaflet mock 
jest.mock("leaflet", () => ({
  divIcon: jest.fn(() => ({ options: {} })),
  marker: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    getLatLng: jest.fn(() => ({ lat: 0, lng: 0 })),
  })),
}));

// react-leaflet mock 
const mockFlyTo = jest.fn();
const mockGetZoom = jest.fn(() => 12);

// Capture the dragend handler so tests can fire it manually
let capturedDragEnd: (() => void) | null = null;
let markerImperativeRef: {
  on: jest.Mock;
  off: jest.Mock;
  getLatLng: jest.Mock;
} | null = null;

jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  useMap: () => ({ flyTo: mockFlyTo, getZoom: mockGetZoom }),
  Marker: forwardRef(({ position, children }: any, ref: any) => {
    const markerMock = {
      on: jest.fn((event: string, handler: () => void) => {
        if (event === "dragend") capturedDragEnd = handler;
      }),
      off: jest.fn(),
      getLatLng: jest.fn(() => ({
        lat: Array.isArray(position) ? position[0] : position.lat,
        lng: Array.isArray(position) ? position[1] : position.lng,
      })),
    };
    useImperativeHandle(ref, () => {
      markerImperativeRef = markerMock;
      return markerMock;
    });
    return (
      <div data-testid="map-marker" data-pos={JSON.stringify(position)}>
        {children}
      </div>
    );
  }),
}));

// Next.js & server actions
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ refresh: mockRefresh })),
}));

jest.mock("@/lib/map/useGeolocation", () => ({
  useGeolocation: jest.fn(),
}));

jest.mock("@/app/actions/update-user-location", () => ({
  updateUserLocation: jest.fn(),
}));

global.fetch = jest.fn();

//  Fixtures 
const MOCK_LAT = 51.5;
const MOCK_LNG = -0.09;

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  initialLocation: null,
  initialHidden: false,
};

// Tests
describe("SetLocationModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedDragEnd = null;
    markerImperativeRef = null;
    (useGeolocation as jest.Mock).mockReturnValue({ userLocation: [MOCK_LAT, MOCK_LNG] });
    (updateUserLocation as jest.Mock).mockResolvedValue({ success: true });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });
  });

  // Visibility
  describe("visibility", () => {
    it("renders modal content when isOpen is true", () => {
      render(<SetLocationModal {...defaultProps} />);
      expect(screen.getByText("Set Your Location")).toBeInTheDocument();
    });

    it("renders nothing when isOpen is false", () => {
      render(<SetLocationModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText("Set Your Location")).not.toBeInTheDocument();
    });
  });

  // Initialisation 
  describe("initialisation", () => {
    it("initialises pin from geolocation when initialLocation is null", () => {
      render(<SetLocationModal {...defaultProps} />);
      const marker = screen.getByTestId("map-marker");
      expect(marker.getAttribute("data-pos")).toBe(JSON.stringify([MOCK_LAT, MOCK_LNG]));
    });

    it("initialises pin from initialLocation when provided", () => {
      // precedence over geolocation when explicitly provided.
      render(
        <SetLocationModal
          {...defaultProps}
          initialLocation={{ lat: 48.85, lng: 2.35 }}
        />
      );
      const marker = screen.getByTestId("map-marker");
      const pos = JSON.parse(marker.getAttribute("data-pos")!);
      expect(pos).toEqual([48.85, 2.35]);
    });

    it("falls back to London default when no geolocation and no initialLocation", () => {
      (useGeolocation as jest.Mock).mockReturnValue({ userLocation: null });
      render(<SetLocationModal {...defaultProps} />);
      const marker = screen.getByTestId("map-marker");
      const pos = JSON.parse(marker.getAttribute("data-pos")!);
      expect(pos).toEqual([51.505, -0.09]);
    });

    it("initialises hidden toggle from initialHidden prop", () => {
      render(<SetLocationModal {...defaultProps} initialHidden={true} />);
      const label = screen.getByText("Hide location from friends");
      const toggle = label.parentElement!.querySelector("button") as HTMLElement;
      expect(toggle.firstElementChild).toHaveClass("translate-x-6");
    });
  });

  // Close button 
  describe("close button", () => {
    it("calls onClose when ✕ button is clicked", () => {
      const onClose = jest.fn();
      render(<SetLocationModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByLabelText("Close modal"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when Cancel button is clicked", () => {
      const onClose = jest.fn();
      render(<SetLocationModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText("Cancel"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // Location search
  describe("location search", () => {
    it("does not fetch when query is shorter than 3 chars", async () => {
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText("Search for a location..."), {
        target: { value: "Lo" },
      });
      await act(async () => { await new Promise((r) => setTimeout(r, 500)); });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("fetches suggestions after debounce when query >= 3 chars", async () => {
      const mockSuggestions = [
        {
          geometry: { coordinates: [-0.1, 51.5] },
          properties: { name: "London", city: "London", display: "London, UK" },
        },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSuggestions,
      });

      render(<SetLocationModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText("Search for a location..."), {
        target: { value: "Lon" },
      });

      await act(async () => { await new Promise((r) => setTimeout(r, 500)); });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/location/search?q=Lon")
      );
      await waitFor(() => expect(screen.getByText("London")).toBeInTheDocument());
    });

    it("clears suggestions when fetch returns non-ok response", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText("Search for a location..."), {
        target: { value: "xyz" },
      });
      await act(async () => { await new Promise((r) => setTimeout(r, 500)); });
      expect(screen.queryByRole("button", { name: /xyz/i })).not.toBeInTheDocument();
    });

    it("clears suggestions when fetch throws", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText("Search for a location..."), {
        target: { value: "abc" },
      });
      await act(async () => { await new Promise((r) => setTimeout(r, 500)); });
      // No suggestion list should appear
      expect(screen.queryByText("abc")).not.toBeInTheDocument();
    });

    it("selects a suggestion and updates the pin position", async () => {
      const mockSuggestions = [
        {
          geometry: { coordinates: [2.35, 48.85] },
          properties: { name: "Paris", city: "Paris", display: "Paris, France" },
        },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSuggestions,
      });

      render(<SetLocationModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText("Search for a location..."), {
        target: { value: "Par" },
      });
      await act(async () => { await new Promise((r) => setTimeout(r, 500)); });

      await waitFor(() => screen.getByText("Paris"));
      fireEvent.click(screen.getByText("Paris"));

      expect(screen.queryByText("Paris")).not.toBeInTheDocument();
      const marker = screen.getByTestId("map-marker");
      const pos = JSON.parse(marker.getAttribute("data-pos")!);
      expect(pos).toEqual([48.85, 2.35]);
    });

    it("ignores suggestion with no geometry coordinates", async () => {
      const badSuggestion = [{ geometry: {}, properties: { name: "Nowhere", display: "" } }];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => badSuggestion,
      });

      render(<SetLocationModal {...defaultProps} />);
      fireEvent.change(screen.getByPlaceholderText("Search for a location..."), {
        target: { value: "Now" },
      });
      await act(async () => { await new Promise((r) => setTimeout(r, 500)); });
      await waitFor(() => screen.getByText("Nowhere"));

      // Clicking should be a no-op — modal stays open, no crash
      fireEvent.click(screen.getByText("Nowhere"));
      expect(screen.getByText("Set Your Location")).toBeInTheDocument();
    });
  });

  // "Use My Location" button 
  describe("Use My Location button", () => {
    it("centres map and moves pin to user location", () => {
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByText("📍 My Location"));
      const marker = screen.getByTestId("map-marker");
      const pos = JSON.parse(marker.getAttribute("data-pos")!);
      expect(pos).toEqual([MOCK_LAT, MOCK_LNG]);
    });

    it("does nothing when userLocation is unavailable", () => {
      (useGeolocation as jest.Mock).mockReturnValue({ userLocation: null });
      render(<SetLocationModal {...defaultProps} />);
      // Should not throw
      fireEvent.click(screen.getByText("📍 My Location"));
      expect(screen.getByText("Set Your Location")).toBeInTheDocument();
    });
  });

  //  Hide location toggle 
  // We locate it by finding the label text and walking to the sibling button.
  const getToggleButton = () => {
    const label = screen.getByText("Hide location from friends");
    return label.parentElement!.querySelector("button") as HTMLElement;
  };

  describe("hide location toggle", () => {
    it("initialises toggle as OFF when initialHidden is false", () => {
      render(<SetLocationModal {...defaultProps} initialHidden={false} />);
      expect(getToggleButton().firstElementChild).toHaveClass("translate-x-1");
    });

    it("initialises toggle as ON when initialHidden is true", () => {
      render(<SetLocationModal {...defaultProps} initialHidden={true} />);
      expect(getToggleButton().firstElementChild).toHaveClass("translate-x-6");
    });

    it("toggles hidden state on click", () => {
      render(<SetLocationModal {...defaultProps} initialHidden={false} />);
      const toggle = getToggleButton();
      expect(toggle.firstElementChild).toHaveClass("translate-x-1");
      fireEvent.click(toggle);
      expect(toggle.firstElementChild).toHaveClass("translate-x-6");
    });

    it("passes locationHidden: true to updateUserLocation when toggled on", async () => {
      render(<SetLocationModal {...defaultProps} initialHidden={false} />);
      fireEvent.click(getToggleButton());
      fireEvent.click(screen.getByText("Save Location"));
      await waitFor(() =>
        expect(updateUserLocation).toHaveBeenCalledWith(
          expect.objectContaining({ locationHidden: true })
        )
      );
    });
  });

  // Save
  describe("save", () => {
    it("calls updateUserLocation with correct coords and closes modal", async () => {
      const onClose = jest.fn();
      render(<SetLocationModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText("Save Location"));
      await waitFor(() =>
        expect(updateUserLocation).toHaveBeenCalledWith(
          expect.objectContaining({
            latitude: MOCK_LAT,
            longitude: MOCK_LNG,
            locationHidden: false,
          })
        )
      );
      expect(onClose).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("shows Saving... while the request is in flight", async () => {
      // Never resolves so we can inspect mid-flight state
      (updateUserLocation as jest.Mock).mockReturnValue(new Promise(() => {}));
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByText("Save Location"));
      expect(await screen.findByText("Saving...")).toBeInTheDocument();
    });

    it("disables Cancel and Save buttons while saving", async () => {
      (updateUserLocation as jest.Mock).mockReturnValue(new Promise(() => {}));
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByText("Save Location"));
      await screen.findByText("Saving...");
      expect(screen.getByText("Cancel")).toBeDisabled();
      expect(screen.getByText("Saving...")).toBeDisabled();
    });

    it("shows server error message when success is false", async () => {
      (updateUserLocation as jest.Mock).mockResolvedValue({
        success: false,
        error: "Failed to save",
      });
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByText("Save Location"));
      await waitFor(() =>
        expect(screen.getByText("Failed to save")).toBeInTheDocument()
      );
    });

    it("shows fallback error message when error field is missing", async () => {
      (updateUserLocation as jest.Mock).mockResolvedValue({ success: false });
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByText("Save Location"));
      await waitFor(() =>
        expect(screen.getByText("Failed to save location")).toBeInTheDocument()
      );
    });

    it("shows error message when updateUserLocation throws", async () => {
      (updateUserLocation as jest.Mock).mockRejectedValue(new Error("Network down"));
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByText("Save Location"));
      await waitFor(() =>
        expect(screen.getByText("Network down")).toBeInTheDocument()
      );
    });

    it("shows generic error string for non-Error throws", async () => {
      (updateUserLocation as jest.Mock).mockRejectedValue("something bad");
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByText("Save Location"));
      await waitFor(() =>
        expect(screen.getByText("An error occurred")).toBeInTheDocument()
      );
    });

    it("does not close modal when save fails", async () => {
      const onClose = jest.fn();
      (updateUserLocation as jest.Mock).mockResolvedValue({
        success: false,
        error: "Oops",
      });
      render(<SetLocationModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText("Save Location"));
      await waitFor(() => screen.getByText("Oops"));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  //  MapCenterController
  describe("MapCenterController", () => {
    it("calls flyTo when 'Use My Location' is clicked", async () => {
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByText("📍 My Location"));
      await waitFor(() => expect(mockFlyTo).toHaveBeenCalled());
    });
  });
});
