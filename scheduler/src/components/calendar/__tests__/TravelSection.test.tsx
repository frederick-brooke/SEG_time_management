/**
 * Tests for src/components/calendar/TravelSection.tsx
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import TravelSection from "../TravelSection";

// ── Mocks ─────────

jest.mock("../LocationInput", () => ({
  __esModule: true,
  default: ({
    label,
    placeholder,
    value,
    onSearchChange,
    onSelectSuggestion,
    onSelectSaved,
    onOpenSaveModal,
    onCloseSaveModal,
    onSaveLocation,
    onUseCurrentLocation,
    suggestions,
    pending,
    showSaveModal,
  }: any) => (
    <div data-testid={`location-input-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <span>{label}</span>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onSearchChange(e.target.value)}
        data-testid={`search-input-${label}`}
      />
      {suggestions?.map((s: any, i: number) => (
        <Button key={i} onClick={() => onSelectSuggestion(s)}>
          Select {s.properties?.name}
        </Button>
      ))}
      <Button onClick={() => onSelectSaved({ id: "loc-1", label: "Home", lat: 51.5, lng: -0.1, address: "Home Addr", type: "HOME" })}>
        Select Saved
      </Button>
      <Button onClick={() => onSelectSuggestion({ properties: { name: "Bad" } })}>
        Bad Suggestion
      </Button>
      <Button onClick={onOpenSaveModal}>Open Save Modal</Button>
      <Button onClick={onCloseSaveModal}>Close Save Modal</Button>
      <Button onClick={() => onSaveLocation("My Label", "HOME")}>Save Location</Button>
      {onUseCurrentLocation && (
        <Button onClick={onUseCurrentLocation}>Use Current Location</Button>
      )}
    </div>
  ),
}));

const mockSaveLocation = jest.fn().mockResolvedValue(undefined);
const mockRefresh = jest.fn().mockResolvedValue(undefined);

jest.mock("hooks/useSavedLocations", () => ({
  useSavedLocations: jest.fn(() => ({
    locations: [],
    saveLocation: mockSaveLocation,
    refresh: mockRefresh,
  })),
}));

global.fetch = jest.fn();

// ── Factory helpers 

function createDefaultProps(overrides: Record<string, any> = {}) {
  return {
    startLocationName: "",
    destLocationName: "",
    transportMode: "driving" as const,
    travelPreview: null,
    isCalculating: false,
    onStartCoordsChange: jest.fn(),
    onDestCoordsChange: jest.fn(),
    onStartNameChange: jest.fn(),
    onDestNameChange: jest.fn(),
    onTransportModeChange: jest.fn(),
    travelTimeMode: "auto" as const,
    manualTravelTime: null,
    onTravelTimeModeChange: jest.fn(),
    onManualTravelTimeChange: jest.fn(),
    ...overrides,
  };
}

// ── Tests 

describe("TravelSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  // ── Travel time mode toggle ────────

  describe("travel time mode toggle", () => {
    it("should render Auto-calculate and Enter manually buttons", () => {
      render(<TravelSection {...createDefaultProps()} />);
      expect(screen.getByText("• Auto-calculate •")).toBeInTheDocument();
      expect(screen.getByText("• Enter manually •")).toBeInTheDocument();
    });

    it("should call onTravelTimeModeChange with 'manual' when Enter manually is clicked", () => {
      const onTravelTimeModeChange = jest.fn();
      render(
        <TravelSection {...createDefaultProps({ onTravelTimeModeChange })} />
      );
      fireEvent.click(screen.getByText("• Enter manually •"));
      expect(onTravelTimeModeChange).toHaveBeenCalledWith("manual");
    });

    it("should call onTravelTimeModeChange with 'auto' when Auto-calculate is clicked", () => {
      const onTravelTimeModeChange = jest.fn();
      render(
        <TravelSection
          {...createDefaultProps({
            travelTimeMode: "manual",
            onTravelTimeModeChange,
          })}
        />
      );
      fireEvent.click(screen.getByText("• Auto-calculate •"));
      expect(onTravelTimeModeChange).toHaveBeenCalledWith("auto");
    });
  });

  // ── Manual mode ──

  describe("manual mode", () => {
    it("should show the manual minutes input when travelTimeMode is 'manual'", () => {
      render(
        <TravelSection {...createDefaultProps({ travelTimeMode: "manual" })} />
      );
      expect(screen.getByPlaceholderText("e.g. 25")).toBeInTheDocument();
    });

    it("should not show the manual input in auto mode", () => {
      render(<TravelSection {...createDefaultProps({ travelTimeMode: "auto" })} />);
      expect(screen.queryByPlaceholderText("e.g. 25")).not.toBeInTheDocument();
    });

    it("should call onManualTravelTimeChange with the number when input changes", () => {
      const onManualTravelTimeChange = jest.fn();
      render(
        <TravelSection
          {...createDefaultProps({ travelTimeMode: "manual", onManualTravelTimeChange })}
        />
      );
      fireEvent.change(screen.getByPlaceholderText("e.g. 25"), {
        target: { value: "30" },
      });
      expect(onManualTravelTimeChange).toHaveBeenCalledWith(30);
    });

    it("should call onManualTravelTimeChange with null when input is cleared", () => {
      const onManualTravelTimeChange = jest.fn();
      render(
        <TravelSection
          {...createDefaultProps({
            travelTimeMode: "manual",
            manualTravelTime: 30,
            onManualTravelTimeChange,
          })}
        />
      );
      fireEvent.change(screen.getByPlaceholderText("e.g. 25"), {
        target: { value: "" },
      });
      expect(onManualTravelTimeChange).toHaveBeenCalledWith(null);
    });

    it("should show formatted preview when manualTravelTime is set and > 0", () => {
      render(
        <TravelSection
          {...createDefaultProps({ travelTimeMode: "manual", manualTravelTime: 90 })}
        />
      );
      expect(screen.getByText("1h 30m")).toBeInTheDocument();
    });

    it("should show minutes when manualTravelTime is less than 60", () => {
      render(
        <TravelSection
          {...createDefaultProps({ travelTimeMode: "manual", manualTravelTime: 45 })}
        />
      );
      expect(screen.getByText("45 mins")).toBeInTheDocument();
    });

    it("should not show formatted preview when manualTravelTime is 0", () => {
      render(
        <TravelSection
          {...createDefaultProps({ travelTimeMode: "manual", manualTravelTime: 0 })}
        />
      );
      expect(screen.queryByText(/^\d+ mins$|^\d+h( \d+m)?$/)).not.toBeInTheDocument();
    });

    it("should not show formatted preview when manualTravelTime is null", () => {
      render(
        <TravelSection
          {...createDefaultProps({ travelTimeMode: "manual", manualTravelTime: null })}
        />
      );
      expect(screen.queryByText(/^\d+ mins$|^\d+h( \d+m)?$/)).not.toBeInTheDocument();
    });
  });

  // ── Auto mode — location inputs ────

  describe("auto mode — location inputs", () => {
    it("should render the Starting Point LocationInput", () => {
      render(<TravelSection {...createDefaultProps()} />);
      expect(
        screen.getByTestId("location-input-starting-point")
      ).toBeInTheDocument();
    });

    it("should render the Destination LocationInput", () => {
      render(<TravelSection {...createDefaultProps()} />);
      expect(
        screen.getByTestId("location-input-destination")
      ).toBeInTheDocument();
    });

    it("should not render location inputs in manual mode", () => {
      render(
        <TravelSection {...createDefaultProps({ travelTimeMode: "manual" })} />
      );
      expect(
        screen.queryByTestId("location-input-starting-point")
      ).not.toBeInTheDocument();
    });

    it("should call onStartNameChange when start search input changes", () => {
      const onStartNameChange = jest.fn();
      render(<TravelSection {...createDefaultProps({ onStartNameChange })} />);

      fireEvent.change(
        screen.getByTestId("search-input-Starting Point"),
        { target: { value: "Waterloo" } }
      );

      expect(onStartNameChange).toHaveBeenCalledWith("Waterloo");
    });

    it("should call onDestNameChange when dest search input changes", () => {
      const onDestNameChange = jest.fn();
      render(<TravelSection {...createDefaultProps({ onDestNameChange })} />);

      fireEvent.change(
        screen.getByTestId("search-input-Destination"),
        { target: { value: "Paddington" } }
      );

      expect(onDestNameChange).toHaveBeenCalledWith("Paddington");
    });

    it("should call onStartCoordsChange and onStartNameChange when a suggestion is selected for start", () => {
      const onStartCoordsChange = jest.fn();
      const onStartNameChange = jest.fn();
      const { useSavedLocations } = require("hooks/useSavedLocations");
      useSavedLocations.mockReturnValue({
        locations: [],
        saveLocation: mockSaveLocation,
        refresh: mockRefresh,
      });

      render(
        <TravelSection
          {...createDefaultProps({ onStartCoordsChange, onStartNameChange })}
        />
      );

      fireEvent.click(screen.getAllByText("Select Saved")[0]);

      expect(onStartCoordsChange).toHaveBeenCalledWith({ lat: 51.5, lng: -0.1 });
      expect(onStartNameChange).toHaveBeenCalledWith("Home");
    });

    it("should call onDestCoordsChange and onDestNameChange when a saved location is selected for dest", () => {
      const onDestCoordsChange = jest.fn();
      const onDestNameChange = jest.fn();

      render(
        <TravelSection
          {...createDefaultProps({ onDestCoordsChange, onDestNameChange })}
        />
      );

      fireEvent.click(screen.getAllByText("Select Saved")[1]);

      expect(onDestCoordsChange).toHaveBeenCalledWith({ lat: 51.5, lng: -0.1 });
      expect(onDestNameChange).toHaveBeenCalledWith("Home");
    });
  });

  // ── Transport mode select 

  describe("transport mode select", () => {
    it("should render the Mode of Transport select", () => {
      render(<TravelSection {...createDefaultProps()} />);
      expect(screen.getByText("Mode of Transport")).toBeInTheDocument();
    });

    it("should show the current transport mode as selected", () => {
      render(<TravelSection {...createDefaultProps({ transportMode: "walking" })} />);
      expect(screen.getByDisplayValue("Walking")).toBeInTheDocument();
    });

    it("should call onTransportModeChange when the select changes", () => {
      const onTransportModeChange = jest.fn();
      render(
        <TravelSection {...createDefaultProps({ onTransportModeChange })} />
      );
      fireEvent.change(screen.getByDisplayValue("Driving"), {
        target: { value: "cycling" },
      });
      expect(onTransportModeChange).toHaveBeenCalledWith("cycling");
    });
  });

  // ── Travel preview ───────

  describe("travel preview", () => {
    it("should not show the preview when travelPreview is null", () => {
      render(<TravelSection {...createDefaultProps({ travelPreview: null })} />);
      expect(screen.queryByText(/Estimated/)).not.toBeInTheDocument();
    });

    it("should show the formatted travel time when travelPreview is set", () => {
      render(
        <TravelSection {...createDefaultProps({ travelPreview: 45 })} />
      );
      expect(screen.getByText(/Estimated/)).toBeInTheDocument();
      expect(screen.getByText("45 mins")).toBeInTheDocument();
    });

    it("should show hours and minutes for travel times >= 60", () => {
      render(
        <TravelSection {...createDefaultProps({ travelPreview: 75 })} />
      );
      expect(screen.getByText("1h 15m")).toBeInTheDocument();
    });

    it("should show 'Calculating new route...' when isCalculating is true", () => {
      render(
        <TravelSection
          {...createDefaultProps({ travelPreview: 30, isCalculating: true })}
        />
      );
      expect(screen.getByText("Calculating new route...")).toBeInTheDocument();
    });

    it("should not show the preview in manual mode even if travelPreview is set", () => {
      render(
        <TravelSection
          {...createDefaultProps({ travelPreview: 30, travelTimeMode: "manual" })}
        />
      );
      expect(screen.queryByText(/Estimated/)).not.toBeInTheDocument();
    });
  });

  // ── Use current location ─

  describe("use current location", () => {
    it("should call onStartCoordsChange with geolocation coords when Use Current Location is clicked", async () => {
      const onStartCoordsChange = jest.fn();
      const onStartNameChange = jest.fn();

      const mockGetCurrentPosition = jest.fn((success) =>
        success({ coords: { latitude: 51.5, longitude: -0.1 } })
      );
      Object.defineProperty(global.navigator, "geolocation", {
        value: { getCurrentPosition: mockGetCurrentPosition },
        configurable: true,
      });

      render(
        <TravelSection
          {...createDefaultProps({ onStartCoordsChange, onStartNameChange })}
        />
      );

      fireEvent.click(screen.getByText("Use Current Location"));

      expect(onStartCoordsChange).toHaveBeenCalledWith({ lat: 51.5, lng: -0.1 });
      expect(onStartNameChange).toHaveBeenCalledWith("📍 My Current Location");
    });
  });

  // ── handleSave ───

  describe("handleSave", () => {
    it("should call saveLocation when a location is saved from the start input", async () => {
      render(<TravelSection {...createDefaultProps()} />);

      fireEvent.click(screen.getAllByText("Select Saved")[0]);

      await act(async () => {
        fireEvent.click(screen.getAllByText("Save Location")[0]);
      });

      expect(mockSaveLocation).toHaveBeenCalledWith(
        expect.objectContaining({ label: "My Label", type: "HOME" })
      );
    });

    it("should call refresh after saving a location", async () => {
      render(<TravelSection {...createDefaultProps()} />);

      fireEvent.click(screen.getAllByText("Select Saved")[0]);

      await act(async () => {
        fireEvent.click(screen.getAllByText("Save Location")[0]);
      });

      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  // ── Location search debounce ───────

  describe("location search", () => {
    it("should not fetch when text is fewer than 3 characters", async () => {
      jest.useFakeTimers();
      render(<TravelSection {...createDefaultProps()} />);

      fireEvent.change(screen.getByTestId("search-input-Starting Point"), {
        target: { value: "AB" },
      });

      act(() => jest.advanceTimersByTime(500));

      expect(global.fetch).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it("should fetch suggestions when text is 3 or more characters", async () => {
      jest.useFakeTimers();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [{ properties: { name: "Waterloo" } }],
      });

      render(<TravelSection {...createDefaultProps()} />);

      fireEvent.change(screen.getByTestId("search-input-Starting Point"), {
        target: { value: "Wat" },
      });

      await act(async () => jest.advanceTimersByTime(500));

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/location/search?q=Wat")
      );
      jest.useRealTimers();
    });
  });

  // ── useCurrentLocation — geolocation not supported ───────
  describe("useCurrentLocation when geolocation unavailable", () => {
    it("should alert when geolocation is not supported", () => {
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});
      Object.defineProperty(global.navigator, "geolocation", {
        value: undefined,
        configurable: true,
      });

      render(<TravelSection {...createDefaultProps()} />);
      fireEvent.click(screen.getByText("Use Current Location"));

      expect(alertMock).toHaveBeenCalledWith("Geolocation not supported");
      alertMock.mockRestore();
    });
  });

  // ── handleSave early return when no pending location ─────
  describe("handleSave with no pending location", () => {
    it("should not call saveLocation when pendingStart is null", async () => {
      render(<TravelSection {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getAllByText("Save Location")[0]);
      });

      expect(mockSaveLocation).not.toHaveBeenCalled();
    });

    it("should not call saveLocation when pendingDest is null", async () => {
      render(<TravelSection {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.click(screen.getAllByText("Save Location")[1]);
      });

      expect(mockSaveLocation).not.toHaveBeenCalled();
    });
  });

  // ── fetch error branch ─────
  describe("location search fetch error", () => {
    it("should clear suggestions when fetch returns non-ok response", async () => {
      jest.useFakeTimers();
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      render(<TravelSection {...createDefaultProps()} />);

      fireEvent.change(screen.getByTestId("search-input-Starting Point"), {
        target: { value: "Abc" },
      });

      await act(async () => jest.advanceTimersByTime(500));

      // No suggestions rendered — fetch was called but returned not-ok
      expect(global.fetch).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it("should clear suggestions when fetch throws", async () => {
      jest.useFakeTimers();
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      render(<TravelSection {...createDefaultProps()} />);

      fireEvent.change(screen.getByTestId("search-input-Starting Point"), {
        target: { value: "Xyz" },
      });

      await act(async () => jest.advanceTimersByTime(500));

      expect(global.fetch).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });
  // ── formatMins exact hour ──
  describe("formatMins exact hour", () => {
    it("should show '1h' when manualTravelTime is exactly 60", () => {
      render(
        <TravelSection {...createDefaultProps({ travelTimeMode: "manual", manualTravelTime: 60 })} />
      );
      expect(screen.getByText("1h")).toBeInTheDocument();
    });

    it("should show '2h' when travelPreview is exactly 120", () => {
      render(<TravelSection {...createDefaultProps({ travelPreview: 120 })} />);
      expect(screen.getByText("2h")).toBeInTheDocument();
    });
  });

  // ── selectLocation dest branch ──────
  describe("selectLocation dest branch", () => {
    it("should call onDestCoordsChange and onDestNameChange when suggestion selected for dest", () => {
      const onDestCoordsChange = jest.fn();
      const onDestNameChange = jest.fn();
      render(<TravelSection {...createDefaultProps({ onDestCoordsChange, onDestNameChange })} />);
      fireEvent.click(screen.getAllByText("Select Saved")[1]);
      expect(onDestCoordsChange).toHaveBeenCalledWith({ lat: 51.5, lng: -0.1 });
      expect(onDestNameChange).toHaveBeenCalledWith("Home");
    });
  });

  // ── handleSave with pendingDest ──────
  describe("handleSave dest branch", () => {
    it("should call saveLocation when a location is saved from the dest input", async () => {
      render(<TravelSection {...createDefaultProps()} />);
      fireEvent.click(screen.getAllByText("Select Saved")[1]);
      await act(async () => {
        fireEvent.click(screen.getAllByText("Save Location")[1]);
      });
      expect(mockSaveLocation).toHaveBeenCalledWith(
        expect.objectContaining({ label: "My Label", type: "HOME" })
      );
    });

    it("should not call saveLocation when pendingDest is null", async () => {
      render(<TravelSection {...createDefaultProps()} />);
      await act(async () => {
        fireEvent.click(screen.getAllByText("Save Location")[1]);
      });
      expect(mockSaveLocation).not.toHaveBeenCalled();
    });
  });

  // ── selectLocation early return ──
  describe("selectLocation with missing geometry", () => {
    it("should not call onStartCoordsChange when suggestion has no geometry", () => {
      const onStartCoordsChange = jest.fn();
      render(<TravelSection {...createDefaultProps({ onStartCoordsChange })} />);
      fireEvent.click(screen.getAllByText("Bad Suggestion")[0]);
      expect(onStartCoordsChange).not.toHaveBeenCalled();
    });
  });

  // ── debounceTimer clearTimeout branch 
  describe("debounce timer cleanup", () => {
    it("should clear the previous timer when a new search is triggered quickly", async () => {
      jest.useFakeTimers();
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
      render(<TravelSection {...createDefaultProps()} />);

      fireEvent.change(screen.getByTestId("search-input-Starting Point"), {
        target: { value: "Abc" },
      });
      fireEvent.change(screen.getByTestId("search-input-Starting Point"), {
        target: { value: "Abcd" },
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
      jest.useRealTimers();
    });
  });
});