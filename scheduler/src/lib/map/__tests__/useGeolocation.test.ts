/**
 * Testing for lib/map/useGeoLocation
 */

import { renderHook, act } from "@testing-library/react";
import { useGeolocation } from "../useGeolocation";

// Helpers

type GeoSuccessCallback = (position: GeolocationPosition) => void;
type GeoErrorCallback = (error: GeolocationPositionError) => void;

const mockGetCurrentPosition = jest.fn();

const mockGeolocation = {
  getCurrentPosition: mockGetCurrentPosition,
};

// Setup / Teardown

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(global.navigator, "geolocation", {
    value: mockGeolocation,
    configurable: true,
  });
});

//Tests

describe("useGeolocation", () => {
  it("starts in loading state with no location or error", () => {
    mockGetCurrentPosition.mockImplementation(() => {});
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.loading).toBe(true);
    expect(result.current.userLocation).toBeNull();
    expect(result.current.locationError).toBeNull();
  });

  it("sets userLocation and stops loading on success", () => {
    mockGetCurrentPosition.mockImplementation(
      (success: GeoSuccessCallback) => {
        success({
          coords: { latitude: 51.505, longitude: -0.09 },
        } as GeolocationPosition);
      }
    );

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.loading).toBe(false);
    expect(result.current.userLocation).toEqual([51.505, -0.09]);
    expect(result.current.locationError).toBeNull();
  });

  it("sets locationError and stops loading on geolocation failure", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetCurrentPosition.mockImplementation(
      (_success: GeoSuccessCallback, error: GeoErrorCallback) => {
        error({ code: 1, message: "denied" } as GeolocationPositionError);
      }
    );

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.loading).toBe(false);
    expect(result.current.userLocation).toBeNull();
    expect(result.current.locationError).toBe("Unable to retrieve your location");
    consoleSpy.mockRestore();
  });

  it("sets locationError and stops loading when geolocation is not supported", () => {
    Object.defineProperty(global.navigator, "geolocation", {
      value: undefined,
      configurable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.loading).toBe(false);
    expect(result.current.userLocation).toBeNull();
    expect(result.current.locationError).toBe(
      "Geolocation is not supported by your browser"
    );
  });

  it("calls navigator.geolocation.getCurrentPosition on mount", () => {
    mockGetCurrentPosition.mockImplementation(() => {});
    renderHook(() => useGeolocation());
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it("does not call getCurrentPosition more than once", () => {
    mockGetCurrentPosition.mockImplementation(() => {});
    const { rerender } = renderHook(() => useGeolocation());
    rerender();
    rerender();
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it("returns the exact coordinates provided by the browser", () => {
    mockGetCurrentPosition.mockImplementation(
      (success: GeoSuccessCallback) => {
        success({
          coords: { latitude: 48.8566, longitude: 2.3522 },
        } as GeolocationPosition);
      }
    );

    const { result } = renderHook(() => useGeolocation());
    expect(result.current.userLocation).toEqual([48.8566, 2.3522]);
  });
});

