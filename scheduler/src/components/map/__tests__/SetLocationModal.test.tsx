import React, { useImperativeHandle, forwardRef } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import SetLocationModal from "../SetLocationModal";
import { useGeolocation, useLocationSearch } from "@/lib/map";
import { useRouter } from "next/navigation";
import { updateUserLocation } from "@/app/actions/update-user-location";

jest.mock("leaflet", () => ({
  divIcon: jest.fn(() => ({ options: {} })),
  marker: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    getLatLng: jest.fn(() => ({ lat: 0, lng: 0 })),
  })),
}));

jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }: any) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null,
  useMap: () => ({
    flyTo: jest.fn(),
    getZoom: jest.fn(() => 12),
  }),
  Marker: forwardRef(({ position, children }: any, ref: any) => {
    useImperativeHandle(ref, () => ({
      on: jest.fn(),
      off: jest.fn(),
      getLatLng: jest.fn(() => ({
        lat: Array.isArray(position) ? position[0] : position.lat,
        lng: Array.isArray(position) ? position[1] : position.lng,
      })),
    }));
    return (
      <div data-testid="map-marker" data-pos={JSON.stringify(position)}>
        {children}
      </div>
    );
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ refresh: jest.fn() })),
}));

jest.mock("@/lib/map", () => ({
  useGeolocation: jest.fn(),
  useLocationSearch: jest.fn(),
}));

jest.mock("@/app/actions/update-user-location", () => ({
  updateUserLocation: jest.fn(),
}));

global.fetch = jest.fn();

const MOCK_LAT = 51.5;
const MOCK_LNG = -0.09;

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  initialLocation: null,
  initialHidden: false,
};

const mockSuggestion = {
  geometry: { coordinates: [-0.1, 51.5] },
  properties: { name: "London", display: "London, UK" },
};

const mockSuggestionNoCoords = {
  geometry: {},
  properties: { name: "Bad", display: "Bad" },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  (useGeolocation as jest.Mock).mockReturnValue({
    userLocation: [MOCK_LAT, MOCK_LNG],
  });
  (useLocationSearch as jest.Mock).mockReturnValue({
    searchQuery: "",
    suggestions: [],
    handleLocationSearch: jest.fn(),
  });
  (updateUserLocation as jest.Mock).mockResolvedValue({ success: true });
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => [],
  });
});

afterEach(() => {
  jest.useRealTimers();
});

/**
 * Full test suite for SetLocationModal covering rendering, geolocation,
 * search input, suggestion selection, map interaction, save lifecycle,
 * error handling, and the visibility toggle.
 */
describe("SetLocationModal", () => {

  describe("Rendering", () => {
    it("renders nothing when isOpen is false", () => {
      render(<SetLocationModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText("Set Your Location")).not.toBeInTheDocument();
    });

    it("renders the modal when isOpen is true", () => {
      render(<SetLocationModal {...defaultProps} />);
      expect(screen.getByText("Set Your Location")).toBeInTheDocument();
    });

    it("renders the search input with correct placeholder", () => {
      render(<SetLocationModal {...defaultProps} />);
      expect(
        screen.getByPlaceholderText("Search for a location...")
      ).toBeInTheDocument();
    });

    it("renders the My Location button", () => {
      render(<SetLocationModal {...defaultProps} />);
      expect(screen.getByText("📍 My Location")).toBeInTheDocument();
    });

    it("renders the map container", () => {
      render(<SetLocationModal {...defaultProps} />);
      expect(screen.getByTestId("map-container")).toBeInTheDocument();
    });

    it("renders Cancel and Save Location buttons", () => {
      render(<SetLocationModal {...defaultProps} />);
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Save Location")).toBeInTheDocument();
    });
  });

  describe("Location initialisation", () => {
    it("initialises marker with geolocation when no initialLocation provided", () => {
      render(<SetLocationModal {...defaultProps} />);
      expect(
        screen.getByTestId("map-marker").getAttribute("data-pos")
      ).toBe(JSON.stringify([MOCK_LAT, MOCK_LNG]));
    });

    it("initialises marker with initialLocation when provided", () => {
      render(
        <SetLocationModal
          {...defaultProps}
          initialLocation={{ lat: 48.8, lng: 2.3 }}
        />
      );
      expect(
        screen.getByTestId("map-marker").getAttribute("data-pos")
      ).toBe(JSON.stringify([48.8, 2.3]));
    });

    it("falls back to default coordinates when no geolocation and no initialLocation", () => {
      (useGeolocation as jest.Mock).mockReturnValue({ userLocation: null });
      render(<SetLocationModal {...defaultProps} />);
      expect(
        screen.getByTestId("map-marker").getAttribute("data-pos")
      ).toBe(JSON.stringify([51.505, -0.09]));
    });
  });

  describe("Close behaviour", () => {
    it("calls onClose when the ✕ button is clicked", () => {
      const onClose = jest.fn();
      render(<SetLocationModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByLabelText("Close modal"));
      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when the Cancel button is clicked", () => {
      const onClose = jest.fn();
      render(<SetLocationModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText("Cancel"));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("Search input", () => {
    it("calls handleLocationSearch when the input changes", () => {
      const handleLocationSearch = jest.fn();
      (useLocationSearch as jest.Mock).mockReturnValue({
        searchQuery: "",
        suggestions: [],
        handleLocationSearch,
      });
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.change(
        screen.getByPlaceholderText("Search for a location..."),
        { target: { value: "Paris" } }
      );
      expect(handleLocationSearch).toHaveBeenCalledWith("Paris");
    });
  });

  describe("Suggestions dropdown", () => {
    it("renders suggestion display text when suggestions are present", () => {
      (useLocationSearch as jest.Mock).mockReturnValue({
        searchQuery: "Lon",
        suggestions: [mockSuggestion],
        handleLocationSearch: jest.fn(),
      });
      render(<SetLocationModal {...defaultProps} />);
      expect(screen.getByText("London, UK")).toBeInTheDocument();
    });

    it("adds data-testid to each suggestion button", () => {
      (useLocationSearch as jest.Mock).mockReturnValue({
        searchQuery: "Lon",
        suggestions: [mockSuggestion],
        handleLocationSearch: jest.fn(),
      });
      render(<SetLocationModal {...defaultProps} />);
      expect(screen.getByTestId("suggestion-0")).toBeInTheDocument();
    });

    it("calls handleLocationSearch with empty string when a valid suggestion is selected", () => {
      const handleLocationSearch = jest.fn();
      (useLocationSearch as jest.Mock).mockReturnValue({
        searchQuery: "Lon",
        suggestions: [mockSuggestion],
        handleLocationSearch,
      });
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByTestId("suggestion-0"));
      expect(handleLocationSearch).toHaveBeenCalledWith("");
      act(() => jest.advanceTimersByTime(100));
    });

    it("does not call handleLocationSearch when suggestion has no coordinates", () => {
      const handleLocationSearch = jest.fn();
      (useLocationSearch as jest.Mock).mockReturnValue({
        searchQuery: "Bad",
        suggestions: [mockSuggestionNoCoords],
        handleLocationSearch,
      });
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByTestId("suggestion-0"));
      expect(handleLocationSearch).not.toHaveBeenCalled();
    });
  });

  describe("My Location button", () => {
    it("updates the marker to user geolocation when clicked", () => {
      render(<SetLocationModal {...defaultProps} initialLocation={{ lat: 0, lng: 0 }} />);
      fireEvent.click(screen.getByText("📍 My Location"));
      expect(
        screen.getByTestId("map-marker").getAttribute("data-pos")
      ).toBe(JSON.stringify([MOCK_LAT, MOCK_LNG]));
      act(() => jest.advanceTimersByTime(100));
    });

    it("does nothing when userLocation is null", () => {
      (useGeolocation as jest.Mock).mockReturnValue({ userLocation: null });
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByText("📍 My Location"));
      expect(
        screen.getByTestId("map-marker").getAttribute("data-pos")
      ).toBe(JSON.stringify([51.505, -0.09]));
    });
  });

  describe("Visibility toggle", () => {
    it("shows Visible when initialHidden is false", () => {
      render(<SetLocationModal {...defaultProps} initialHidden={false} />);
      expect(screen.getByText("Visible")).toBeInTheDocument();
    });

    it("shows Hidden when initialHidden is true", () => {
      render(<SetLocationModal {...defaultProps} initialHidden={true} />);
      expect(screen.getByText("Hidden")).toBeInTheDocument();
    });

    it("toggles to hidden when the visibility button is clicked", async () => {
      const onClose = jest.fn();
      render(
        <SetLocationModal {...defaultProps} onClose={onClose} initialHidden={false} />
      );
      fireEvent.click(screen.getByRole("button", { name: /hide location/i }));
      fireEvent.click(screen.getByText("Save Location"));
      await waitFor(() => {
        expect(updateUserLocation).toHaveBeenCalledWith(
          expect.objectContaining({ locationHidden: true })
        );
      });
    });

    it("saves with locationHidden true when initialHidden is true", async () => {
      const onClose = jest.fn();
      render(
        <SetLocationModal {...defaultProps} onClose={onClose} initialHidden={true} />
      );
      fireEvent.click(screen.getByText("Save Location"));
      await waitFor(() => {
        expect(updateUserLocation).toHaveBeenCalledWith(
          expect.objectContaining({ locationHidden: true })
        );
      });
    });
  });

  describe("Save", () => {
    it("calls updateUserLocation with correct coordinates on save", async () => {
      const onClose = jest.fn();
      const mockRefresh = jest.fn();
      (useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh });
      render(<SetLocationModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText("Save Location"));
      await waitFor(() => {
        expect(updateUserLocation).toHaveBeenCalledWith(
          expect.objectContaining({
            latitude: MOCK_LAT,
            longitude: MOCK_LNG,
            locationHidden: false,
          })
        );
      });
      expect(onClose).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("shows Saving… and disables both buttons while saving", async () => {
      let resolveSave!: (v: any) => void;
      (updateUserLocation as jest.Mock).mockReturnValue(
        new Promise((res) => { resolveSave = res; })
      );
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByText("Save Location"));
      expect(screen.getByText("Saving...")).toBeDisabled();
      expect(screen.getByText("Cancel")).toBeDisabled();
      await act(async () => resolveSave({ success: true }));
    });

    it("shows error when updateUserLocation returns success false", async () => {
      (updateUserLocation as jest.Mock).mockResolvedValue({
        success: false,
        error: "Failed to save",
      });
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByText("Save Location"));
      await waitFor(() => {
        expect(screen.getByText("Failed to save")).toBeInTheDocument();
      });
    });

    it("shows fallback error when result.error is undefined", async () => {
      (updateUserLocation as jest.Mock).mockResolvedValue({ success: false });
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByText("Save Location"));
      await waitFor(() => {
        expect(screen.getByText("Failed to save location")).toBeInTheDocument();
      });
    });

    it("shows error message when updateUserLocation throws", async () => {
      (updateUserLocation as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByText("Save Location"));
      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("shows generic error when a non-Error is thrown", async () => {
      (updateUserLocation as jest.Mock).mockRejectedValue("unexpected");
      render(<SetLocationModal {...defaultProps} />);
      fireEvent.click(screen.getByText("Save Location"));
      await waitFor(() => {
        expect(screen.getByText("An error occurred")).toBeInTheDocument();
      });
    });
  });
});