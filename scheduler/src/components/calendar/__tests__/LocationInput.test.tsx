/**
 * Tests for src/components/calendar/LocationInput.tsx
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import LocationInput from "../LocationInput";

// ── Mocks ─────────

jest.mock("../SavedLocationChips", () => ({
  __esModule: true,
  default: ({ locations, onSelect }: any) => (
    <div data-testid="saved-location-chips">
      {locations.map((loc: any) => (
        <Button key={loc.id} onClick={() => onSelect(loc)}>
          {loc.label}
        </Button>
      ))}
    </div>
  ),
}));

jest.mock("../SaveLocationModal", () => ({
  __esModule: true,
  default: ({ address, onSave, onClose }: any) => (
    <div data-testid="save-location-modal">
      <span>{address}</span>
      <Button onClick={() => onSave("Home", "HOME")}>Save</Button>
      <Button onClick={onClose}>Close Modal</Button>
    </div>
  ),
}));

// ── Factory helpers 

/**
 * Creates a mock saved location.
 */
function createSavedLocation(overrides: Record<string, any> = {}) {
  return {
    id: "loc-1",
    label: "Home",
    address: "123 Main St",
    lat: 51.5,
    lng: -0.1,
    type: "HOME" as const,
    ...overrides,
  };
}

/**
 * Creates a mock suggestion.
 */
function createSuggestion(overrides: Record<string, any> = {}) {
  return {
    properties: {
      name: "King's Cross Station",
      city: "London",
      display: "King's Cross Station, London, UK",
    },
    ...overrides,
  };
}

/**
 * Default props for LocationInput.
 */
function createDefaultProps(overrides: Record<string, any> = {}) {
  return {
    label: "Start Location",
    placeholder: "Search for a place...",
    value: "",
    suggestions: [],
    pending: null,
    showSaveModal: false,
    locations: [],
    showCurrentLocation: false,
    onSearchChange: jest.fn(),
    onSelectSuggestion: jest.fn(),
    onSelectSaved: jest.fn(),
    onOpenSaveModal: jest.fn(),
    onCloseSaveModal: jest.fn(),
    onSaveLocation: jest.fn(),
    onUseCurrentLocation: jest.fn(),
    ...overrides,
  };
}

// ── Tests 

describe("LocationInput", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Rendering ────

  describe("rendering", () => {
    it("should render the label", () => {
      render(<LocationInput {...createDefaultProps()} />);
      expect(screen.getByText("Start Location")).toBeInTheDocument();
    });

    it("should render the input with the correct placeholder", () => {
      render(<LocationInput {...createDefaultProps()} />);
      expect(
        screen.getByPlaceholderText("Search for a place...")
      ).toBeInTheDocument();
    });

    it("should render the input with the current value", () => {
      render(<LocationInput {...createDefaultProps({ value: "King's Cross" })} />);
      expect(screen.getByDisplayValue("King's Cross")).toBeInTheDocument();
    });

    it("should render the SavedLocationChips component", () => {
      render(<LocationInput {...createDefaultProps()} />);
      expect(screen.getByTestId("saved-location-chips")).toBeInTheDocument();
    });

    it("should pass locations to SavedLocationChips", () => {
      const locations = [createSavedLocation()];
      render(<LocationInput {...createDefaultProps({ locations })} />);
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });

  // ── Use My Location button ─────────

  describe("Use My Location button", () => {
    it("should show Use My Location when showCurrentLocation is true and handler provided", () => {
      render(
        <LocationInput
          {...createDefaultProps({ showCurrentLocation: true })}
        />
      );
      expect(screen.getByText("📍 Use My Location")).toBeInTheDocument();
    });

    it("should not show Use My Location when showCurrentLocation is false", () => {
      render(
        <LocationInput
          {...createDefaultProps({ showCurrentLocation: false })}
        />
      );
      expect(screen.queryByText("📍 Use My Location")).not.toBeInTheDocument();
    });

    it("should not show Use My Location when onUseCurrentLocation is not provided", () => {
      render(
        <LocationInput
          {...createDefaultProps({
            showCurrentLocation: true,
            onUseCurrentLocation: undefined,
          })}
        />
      );
      expect(screen.queryByText("📍 Use My Location")).not.toBeInTheDocument();
    });

    it("should call onUseCurrentLocation when clicked", () => {
      const onUseCurrentLocation = jest.fn();
      render(
        <LocationInput
          {...createDefaultProps({
            showCurrentLocation: true,
            onUseCurrentLocation,
          })}
        />
      );
      fireEvent.click(screen.getByText("📍 Use My Location"));
      expect(onUseCurrentLocation).toHaveBeenCalled();
    });
  });

  // ── Search input ─

  describe("search input", () => {
    it("should call onSearchChange when the input value changes", () => {
      const onSearchChange = jest.fn();
      render(<LocationInput {...createDefaultProps({ onSearchChange })} />);

      fireEvent.change(screen.getByPlaceholderText("Search for a place..."), {
        target: { value: "Waterloo" },
      });

      expect(onSearchChange).toHaveBeenCalledWith("Waterloo");
    });
  });

  // ── Save star button ─────

  describe("save star button", () => {
    it("should show the star button when a pending location is set", () => {
      render(
        <LocationInput
          {...createDefaultProps({
            pending: { lat: 51.5, lng: -0.1, address: "Waterloo" },
          })}
        />
      );
      expect(screen.getByTitle("Save this location")).toBeInTheDocument();
    });

    it("should not show the star button when pending is null", () => {
      render(<LocationInput {...createDefaultProps({ pending: null })} />);
      expect(
        screen.queryByTitle("Save this location")
      ).not.toBeInTheDocument();
    });

    it("should call onOpenSaveModal when the star button is clicked", () => {
      const onOpenSaveModal = jest.fn();
      render(
        <LocationInput
          {...createDefaultProps({
            pending: { lat: 51.5, lng: -0.1, address: "Waterloo" },
            onOpenSaveModal,
          })}
        />
      );
      fireEvent.click(screen.getByTitle("Save this location"));
      expect(onOpenSaveModal).toHaveBeenCalled();
    });
  });

  // ── Suggestions dropdown ─

  describe("suggestions dropdown", () => {
    it("should show the dropdown when suggestions are provided", () => {
      const suggestions = [createSuggestion()];
      render(<LocationInput {...createDefaultProps({ suggestions })} />);
      expect(screen.getByText("King's Cross Station")).toBeInTheDocument();
    });

    it("should not show the dropdown when suggestions is empty", () => {
      render(<LocationInput {...createDefaultProps({ suggestions: [] })} />);
      expect(
        screen.queryByText("King's Cross Station")
      ).not.toBeInTheDocument();
    });

    it("should display the suggestion name and city", () => {
      const suggestions = [createSuggestion()];
      render(<LocationInput {...createDefaultProps({ suggestions })} />);
      expect(screen.getByText("King's Cross Station")).toBeInTheDocument();
      expect(screen.getByText("(London)")).toBeInTheDocument();
    });

    it("should display the full display address", () => {
      const suggestions = [createSuggestion()];
      render(<LocationInput {...createDefaultProps({ suggestions })} />);
      expect(
        screen.getByText("King's Cross Station, London, UK")
      ).toBeInTheDocument();
    });

    it("should not display city when it is absent", () => {
      const suggestions = [
        createSuggestion({
          properties: {
            name: "Remote Place",
            city: undefined,
            display: "Remote Place, UK",
          },
        }),
      ];
      render(<LocationInput {...createDefaultProps({ suggestions })} />);
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
    });

    it("should call onSelectSuggestion with the correct feature when clicked", () => {
      const onSelectSuggestion = jest.fn();
      const suggestion = createSuggestion();
      render(
        <LocationInput
          {...createDefaultProps({ suggestions: [suggestion], onSelectSuggestion })}
        />
      );
      fireEvent.click(screen.getByText("King's Cross Station"));
      expect(onSelectSuggestion).toHaveBeenCalledWith(suggestion);
    });

    it("should render multiple suggestions", () => {
      const suggestions = [
        createSuggestion(),
        createSuggestion({
          properties: {
            name: "Paddington Station",
            city: "London",
            display: "Paddington Station, London, UK",
          },
        }),
      ];
      render(<LocationInput {...createDefaultProps({ suggestions })} />);
      expect(screen.getByText("King's Cross Station")).toBeInTheDocument();
      expect(screen.getByText("Paddington Station")).toBeInTheDocument();
    });
  });

  // ── SaveLocationModal ────

  describe("SaveLocationModal", () => {
    it("should show SaveLocationModal when showSaveModal is true and pending is set", () => {
      render(
        <LocationInput
          {...createDefaultProps({
            showSaveModal: true,
            pending: { lat: 51.5, lng: -0.1, address: "Waterloo Station" },
          })}
        />
      );
      expect(screen.getByTestId("save-location-modal")).toBeInTheDocument();
      expect(screen.getByText("Waterloo Station")).toBeInTheDocument();
    });

    it("should not show SaveLocationModal when showSaveModal is false", () => {
      render(
        <LocationInput
          {...createDefaultProps({
            showSaveModal: false,
            pending: { lat: 51.5, lng: -0.1, address: "Waterloo Station" },
          })}
        />
      );
      expect(
        screen.queryByTestId("save-location-modal")
      ).not.toBeInTheDocument();
    });

    it("should not show SaveLocationModal when pending is null even if showSaveModal is true", () => {
      render(
        <LocationInput
          {...createDefaultProps({ showSaveModal: true, pending: null })}
        />
      );
      expect(
        screen.queryByTestId("save-location-modal")
      ).not.toBeInTheDocument();
    });

    it("should call onCloseSaveModal when the modal close button is clicked", () => {
      const onCloseSaveModal = jest.fn();
      render(
        <LocationInput
          {...createDefaultProps({
            showSaveModal: true,
            pending: { lat: 51.5, lng: -0.1, address: "Waterloo" },
            onCloseSaveModal,
          })}
        />
      );
      fireEvent.click(screen.getByText("Close Modal"));
      expect(onCloseSaveModal).toHaveBeenCalled();
    });

    it("should call onSaveLocation when the save button is clicked in the modal", () => {
      const onSaveLocation = jest.fn();
      render(
        <LocationInput
          {...createDefaultProps({
            showSaveModal: true,
            pending: { lat: 51.5, lng: -0.1, address: "Waterloo" },
            onSaveLocation,
          })}
        />
      );
      fireEvent.click(screen.getByText("Save"));
      expect(onSaveLocation).toHaveBeenCalledWith("Home", "HOME");
    });
  });

  // ── SavedLocationChips callbacks ───

  describe("SavedLocationChips callbacks", () => {
    it("should call onSelectSaved when a saved location chip is clicked", () => {
      const onSelectSaved = jest.fn();
      const locations = [createSavedLocation({ id: "loc-1", label: "Home" })];
      render(
        <LocationInput
          {...createDefaultProps({ locations, onSelectSaved })}
        />
      );
      fireEvent.click(screen.getByText("Home"));
      expect(onSelectSaved).toHaveBeenCalledWith(
        expect.objectContaining({ id: "loc-1" })
      );
    });
  });
});