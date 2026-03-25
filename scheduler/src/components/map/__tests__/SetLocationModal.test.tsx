import React, { useImperativeHandle, forwardRef } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SetLocationModal from "../SetLocationModal";
import { useGeolocation } from "@/lib/map/useGeolocation";
import { useRouter } from "next/navigation";
import { updateUserLocation } from "@/app/actions/update-user-location";

// 1. MOCK LEAFLET (Fixed for markerRef.current.on)
jest.mock("leaflet", () => ({
  divIcon: jest.fn(() => ({ options: {} })),
  marker: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    getLatLng: jest.fn(() => ({ lat: 0, lng: 0 })),
  })),
}));

// 2. MOCK REACT-LEAFLET (Fixed with useImperativeHandle)
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

// 3. MOCK NEXT.JS & ACTIONS
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ refresh: jest.fn() })),
}));

jest.mock("@/lib/map/useGeolocation", () => ({
  useGeolocation: jest.fn(),
}));

jest.mock("@/app/actions/update-user-location", () => ({
  updateUserLocation: jest.fn(),
}));

global.fetch = jest.fn();

describe("SetLocationModal", () => {
  const mockOnClose = jest.fn();
  
  // We match the Geolocation mock to what the test saw in the logs
  const MOCK_LAT = 51.5;
  const MOCK_LNG = -0.09;

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    initialLocation: null, // Let it use geolocation to match the log behavior
    initialHidden: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useGeolocation as jest.Mock).mockReturnValue({ userLocation: [MOCK_LAT, MOCK_LNG] });
    (updateUserLocation as jest.Mock).mockResolvedValue({ success: true });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  it("renders and initializes with geolocation coordinates", () => {
    render(<SetLocationModal {...defaultProps} />);
    const marker = screen.getByTestId("map-marker");
    expect(marker.getAttribute("data-pos")).toBe(JSON.stringify([MOCK_LAT, MOCK_LNG]));
  });

  it("calls updateUserLocation with expected parameters on save", async () => {
    render(<SetLocationModal {...defaultProps} />);
    
    const saveBtn = screen.getByText("Save Location");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      // Use expect.objectContaining to ignore null city/country fields
      expect(updateUserLocation).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: MOCK_LAT,
          longitude: MOCK_LNG,
          locationHidden: false,
        })
      );
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("handles the close action correctly", () => {
    render(<SetLocationModal {...defaultProps} />);
    const closeBtn = screen.getByLabelText("Close modal");
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows error UI when server action fails", async () => {
    (updateUserLocation as jest.Mock).mockResolvedValue({ 
      success: false, 
      error: "Failed to save" 
    });

    render(<SetLocationModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Save Location"));

    await waitFor(() => {
      expect(screen.getByText("Failed to save")).toBeInTheDocument();
    });
  });
});