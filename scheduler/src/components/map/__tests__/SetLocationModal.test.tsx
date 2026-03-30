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
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
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
    return <div data-testid="map-marker" data-pos={JSON.stringify(position)}>{children}</div>;
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
  properties: { name: "London", city: "London", display: "London, UK" },
};

/**
 * Tests for SetLocationModal covering all branches:
 * rendering, geolocation, search, suggestion selection,
 * map interaction, save success/failure, and the hidden toggle.
 */
describe("SetLocationModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useGeolocation as jest.Mock).mockReturnValue({ userLocation: [MOCK_LAT, MOCK_LNG] });
    (useLocationSearch as jest.Mock).mockReturnValue({
      searchQuery: "",
      suggestions: [],
      handleLocationSearch: jest.fn(),
    });
    (updateUserLocation as jest.Mock).mockResolvedValue({ success: true });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders nothing when isOpen is false", () => {
    render(<SetLocationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Set Your Location")).not.toBeInTheDocument();
  });

  it("renders and initializes with geolocation coordinates when no initialLocation", () => {
    render(<SetLocationModal {...defaultProps} />);
    expect(screen.getByTestId("map-marker").getAttribute("data-pos")).toBe(
      JSON.stringify([MOCK_LAT, MOCK_LNG])
    );
  });

  it("initializes with initialLocation when provided", () => {
    render(<SetLocationModal {...defaultProps} initialLocation={{ lat: 48.8, lng: 2.3 }} />);
    expect(screen.getByTestId("map-marker").getAttribute("data-pos")).toBe(
      JSON.stringify([48.8, 2.3])
    );
  });

  it("falls back to default coordinates when no geolocation and no initialLocation", () => {
    (useGeolocation as jest.Mock).mockReturnValue({ userLocation: null });
    render(<SetLocationModal {...defaultProps} />);
    expect(screen.getByTestId("map-marker").getAttribute("data-pos")).toBe(
      JSON.stringify([51.505, -0.09])
    );
  });

  it("calls onClose when the close button is clicked", () => {
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

  it("calls updateUserLocation and closes on successful save", async () => {
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

  it("shows error message when updateUserLocation returns success: false", async () => {
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

  it("shows fallback error message when result.error is undefined", async () => {
    (updateUserLocation as jest.Mock).mockResolvedValue({ success: false });

    render(<SetLocationModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Save Location"));

    await waitFor(() => {
      expect(screen.getByText("Failed to save location")).toBeInTheDocument();
    });
  });

  it("shows error message when updateUserLocation throws", async () => {
    (updateUserLocation as jest.Mock).mockRejectedValue(new Error("Network error"));

    render(<SetLocationModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Save Location"));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("shows generic error when a non-Error is thrown during save", async () => {
    (updateUserLocation as jest.Mock).mockRejectedValue("unexpected");

    render(<SetLocationModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Save Location"));

    await waitFor(() => {
      expect(screen.getByText("An error occurred")).toBeInTheDocument();
    });
  });

  it("toggles the hidden state when the toggle button is clicked", async () => {
    const onClose = jest.fn();
    render(<SetLocationModal {...defaultProps} onClose={onClose} initialHidden={false} />);

    fireEvent.click(screen.getByRole("button", { name: /hide location/i }));
    fireEvent.click(screen.getByText("Save Location"));

    await waitFor(() => {
      expect(updateUserLocation).toHaveBeenCalledWith(
        expect.objectContaining({ locationHidden: true })
      );
    });
  });

  it("initializes hidden toggle as true when initialHidden is true", async () => {
    const onClose = jest.fn();
    render(<SetLocationModal {...defaultProps} onClose={onClose} initialHidden={true} />);
    fireEvent.click(screen.getByText("Save Location"));

    await waitFor(() => {
      expect(updateUserLocation).toHaveBeenCalledWith(
        expect.objectContaining({ locationHidden: true })
      );
    });
  });

  it("updates search query when input changes", () => {
    const handleLocationSearch = jest.fn();
    (useLocationSearch as jest.Mock).mockReturnValue({
      searchQuery: "",
      suggestions: [],
      handleLocationSearch,
    });

    render(<SetLocationModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText("Search for a location..."), {
      target: { value: "Paris" },
    });

    expect(handleLocationSearch).toHaveBeenCalledWith("Paris");
  });

  it("renders suggestions dropdown when suggestions are present", () => {
    (useLocationSearch as jest.Mock).mockReturnValue({
      searchQuery: "Lon",
      suggestions: [mockSuggestion],
      handleLocationSearch: jest.fn(),
    });

    render(<SetLocationModal {...defaultProps} />);
    expect(screen.getByText("London")).toBeInTheDocument();
    expect(screen.getByText("London, UK")).toBeInTheDocument();
  });

  it("selects a suggestion and updates the map location", () => {
    const handleLocationSearch = jest.fn();
    (useLocationSearch as jest.Mock).mockReturnValue({
      searchQuery: "Lon",
      suggestions: [mockSuggestion],
      handleLocationSearch,
    });

    render(<SetLocationModal {...defaultProps} />);
    fireEvent.click(screen.getByText("London"));

    expect(handleLocationSearch).toHaveBeenCalledWith("");

    act(() => jest.advanceTimersByTime(100));
  });

  it("ignores suggestion click when feature has no coordinates", () => {
    const handleLocationSearch = jest.fn();
    const badSuggestion = { geometry: {}, properties: { name: "Bad", display: "Bad" } };

    (useLocationSearch as jest.Mock).mockReturnValue({
      searchQuery: "Bad",
      suggestions: [badSuggestion],
      handleLocationSearch,
    });

    render(<SetLocationModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId("suggestion-0"));
    expect(handleLocationSearch).not.toHaveBeenCalled();
  });

  it("sets location to user geolocation when 'My Location' is clicked", () => {
    render(<SetLocationModal {...defaultProps} />);
    fireEvent.click(screen.getByText("📍 My Location"));

    expect(screen.getByTestId("map-marker").getAttribute("data-pos")).toBe(
      JSON.stringify([MOCK_LAT, MOCK_LNG])
    );

    act(() => jest.advanceTimersByTime(100));
  });

  it("does nothing when 'My Location' is clicked but userLocation is null", () => {
    (useGeolocation as jest.Mock).mockReturnValue({ userLocation: null });
    render(<SetLocationModal {...defaultProps} />);

    fireEvent.click(screen.getByText("📍 My Location"));
    expect(screen.getByTestId("map-marker").getAttribute("data-pos")).toBe(
      JSON.stringify([51.505, -0.09])
    );
  });

  it("disables save and cancel buttons while saving", async () => {
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
});