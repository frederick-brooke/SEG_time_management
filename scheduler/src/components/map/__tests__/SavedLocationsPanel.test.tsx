import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mocks 

const mockUseSavedLocations = jest.fn();
const mockSaveLocation = jest.fn();

jest.mock("hooks/useSavedLocations", () => ({
  useSavedLocations: () => mockUseSavedLocations(),
}));

// Stub fetch for the address-search API
global.fetch = jest.fn();

import { SavedLocationsPanel } from "../SavedLocationsPanel";
import type { SavedLocation } from "hooks/useSavedLocations";

// Helpers 

const makeLoc = (
  id: string,
  type: "HOME" | "WORK" | "FAVOURITE" = "HOME",
  label = `Label ${id}`
): SavedLocation => ({
  id,
  type,
  label,
  address: `Address ${id}`,
  lat: 51.5,
  lng: -0.1,
});

function setupMocks({
  locations = [] as SavedLocation[],
  loading = false,
  home = null as SavedLocation | null,
  work = null as SavedLocation | null,
  favourites = [] as SavedLocation[],
} = {}) {
  const deleteLocation = jest.fn().mockResolvedValue(undefined);
  const renameLocation = jest.fn().mockResolvedValue(undefined);
  const refresh = jest.fn().mockResolvedValue(undefined);

  mockUseSavedLocations.mockReturnValue({
    locations,
    home,
    work,
    favourites,
    loading,
    deleteLocation,
    renameLocation,
    refresh,
    saveLocation: mockSaveLocation,
  });

  return { deleteLocation, renameLocation, refresh };
}

// Tests

describe("SavedLocationsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => [],
    });
  });

  //  Header 

  it("renders the panel header with title", () => {
    setupMocks();
    render(<SavedLocationsPanel />);
    expect(screen.getByText("Saved Locations")).toBeInTheDocument();
  });

  it("shows the location count badge", () => {
    setupMocks({ locations: [makeLoc("1"), makeLoc("2")] });
    render(<SavedLocationsPanel />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows 0 in count badge when no locations", () => {
    setupMocks();
    render(<SavedLocationsPanel />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });


  it("is expanded by default", () => {
    setupMocks();
    render(<SavedLocationsPanel />);
    expect(screen.getByText(/Add a location/i)).toBeInTheDocument();
  });

  it("collapses content when header button is clicked", () => {
    setupMocks();
    render(<SavedLocationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Saved Locations/i }));
    expect(screen.queryByText(/Add a location/i)).not.toBeInTheDocument();
  });

  it("re-expands when header button is clicked again", () => {
    setupMocks();
    render(<SavedLocationsPanel />);
    const header = screen.getByRole("button", { name: /Saved Locations/i });
    fireEvent.click(header);
    fireEvent.click(header);
    expect(screen.getByText(/Add a location/i)).toBeInTheDocument();
  });

  it("shows ▲ when expanded", () => {
    setupMocks();
    render(<SavedLocationsPanel />);
    expect(screen.getByText("▲")).toBeInTheDocument();
  });

  it("shows ▼ when collapsed", () => {
    setupMocks();
    render(<SavedLocationsPanel />);
    fireEvent.click(screen.getByRole("button", { name: /Saved Locations/i }));
    expect(screen.getByText("▼")).toBeInTheDocument();
  });

  // Loading state 

  it("shows loading text when loading is true", () => {
    setupMocks({ loading: true });
    render(<SavedLocationsPanel />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  // Empty state

  it("shows empty-state message when no locations and not loading", () => {
    setupMocks({ locations: [], loading: false });
    render(<SavedLocationsPanel />);
    expect(
      screen.getByText(/No saved locations yet/i)
    ).toBeInTheDocument();
  });

  // LocationCards rendered in correct order 

  it("renders HOME card when home is present", () => {
    const home = makeLoc("h", "HOME", "My House");
    setupMocks({ locations: [home], home });
    render(<SavedLocationsPanel />);
    expect(screen.getByText("My House")).toBeInTheDocument();
  });

  it("renders WORK card when work is present", () => {
    const work = makeLoc("w", "WORK", "Office");
    setupMocks({ locations: [work], work });
    render(<SavedLocationsPanel />);
    expect(screen.getByText("Office")).toBeInTheDocument();
  });

  it("renders FAVOURITE cards", () => {
    const fav = makeLoc("f", "FAVOURITE", "Gym");
    setupMocks({
      locations: [fav],
      favourites: [fav],
    });
    render(<SavedLocationsPanel />);
    expect(screen.getByText("Gym")).toBeInTheDocument();
  });

  it("renders address for each location card", () => {
    const home = makeLoc("h", "HOME", "Home");
    setupMocks({ locations: [home], home });
    render(<SavedLocationsPanel />);
    expect(screen.getByText("Address h")).toBeInTheDocument();
  });

  // Delete

  it("calls deleteLocation when the delete button is clicked", async () => {
    const home = makeLoc("h", "HOME", "Home");
    const { deleteLocation } = setupMocks({ locations: [home], home });
    render(<SavedLocationsPanel />);
    fireEvent.click(screen.getByTitle("Remove"));
    await waitFor(() => expect(deleteLocation).toHaveBeenCalledWith("h"));
  });

  it("calls onLocationsChange after delete", async () => {
    const home = makeLoc("h", "HOME", "Home");
    const { deleteLocation } = setupMocks({ locations: [home], home });
    const onLocationsChange = jest.fn();
    render(<SavedLocationsPanel onLocationsChange={onLocationsChange} />);
    fireEvent.click(screen.getByTitle("Remove"));
    await waitFor(() => expect(onLocationsChange).toHaveBeenCalledTimes(1));
  });

  // Rename (editing)

  it("shows rename input when the edit button is clicked", () => {
    const home = makeLoc("h", "HOME", "Home");
    setupMocks({ locations: [home], home });
    render(<SavedLocationsPanel />);
    fireEvent.click(screen.getByTitle("Rename"));
    expect(screen.getByDisplayValue("Home")).toBeInTheDocument();
  });

  it("calls renameLocation when ✓ is clicked with a changed label", async () => {
    const home = makeLoc("h", "HOME", "Home");
    const { renameLocation } = setupMocks({ locations: [home], home });
    render(<SavedLocationsPanel />);
    fireEvent.click(screen.getByTitle("Rename"));
    fireEvent.change(screen.getByDisplayValue("Home"), {
      target: { value: "My Home" },
    });
    fireEvent.click(screen.getByText("✓"));
    await waitFor(() =>
      expect(renameLocation).toHaveBeenCalledWith("h", "My Home")
    );
  });

  it("does not call renameLocation when label is unchanged", async () => {
    const home = makeLoc("h", "HOME", "Home");
    const { renameLocation } = setupMocks({ locations: [home], home });
    render(<SavedLocationsPanel />);
    fireEvent.click(screen.getByTitle("Rename"));
    // label stays "Home"
    fireEvent.click(screen.getByText("✓"));
    await waitFor(() => expect(renameLocation).not.toHaveBeenCalled());
  });

  it("exits editing mode when Escape is pressed", () => {
    const home = makeLoc("h", "HOME", "Home");
    setupMocks({ locations: [home], home });
    render(<SavedLocationsPanel />);
    fireEvent.click(screen.getByTitle("Rename"));
    fireEvent.keyDown(screen.getByDisplayValue("Home"), { key: "Escape" });
    expect(screen.queryByDisplayValue("Home")).not.toBeInTheDocument();
  });

  it("submits rename on Enter key", async () => {
    const home = makeLoc("h", "HOME", "Home");
    const { renameLocation } = setupMocks({ locations: [home], home });
    render(<SavedLocationsPanel />);
    fireEvent.click(screen.getByTitle("Rename"));
    fireEvent.change(screen.getByDisplayValue("Home"), {
      target: { value: "New Name" },
    });
    fireEvent.keyDown(screen.getByDisplayValue("New Name"), { key: "Enter" });
    await waitFor(() =>
      expect(renameLocation).toHaveBeenCalledWith("h", "New Name")
    );
  });

  // AddLocationForm 

  it("renders the address search input", () => {
    setupMocks();
    render(<SavedLocationsPanel />);
    expect(
      screen.getByPlaceholderText("Search address…")
    ).toBeInTheDocument();
  });

  it("does not show label input before an address is selected", () => {
    setupMocks();
    render(<SavedLocationsPanel />);
    expect(
      screen.queryByPlaceholderText("Label (e.g. Home, Gym…)")
    ).not.toBeInTheDocument();
  });

  it("shows label input after a suggestion is picked", async () => {
    setupMocks();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => [
        {
          geometry: { coordinates: [-0.1, 51.5] },
          properties: { display: "London", name: "London, UK" },
        },
      ],
    });

    render(<SavedLocationsPanel />);
    fireEvent.change(screen.getByPlaceholderText("Search address…"), {
      target: { value: "Lond" },
    });

    await waitFor(() =>
      expect(screen.getByText("London, UK")).toBeInTheDocument()
    );

    fireEvent.mouseDown(screen.getByText("London, UK"));
    expect(
      screen.getByPlaceholderText("Label (e.g. Home, Gym…)")
    ).toBeInTheDocument();
  });

  it("shows type buttons (HOME / WORK / FAVOURITE) after picking a suggestion", async () => {
    setupMocks();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => [
        {
          geometry: { coordinates: [-0.1, 51.5] },
          properties: { display: "London", name: "London, UK" },
        },
      ],
    });

    render(<SavedLocationsPanel />);
    fireEvent.change(screen.getByPlaceholderText("Search address…"), {
      target: { value: "Lond" },
    });
    await waitFor(() => screen.getByText("London, UK"));
    fireEvent.mouseDown(screen.getByText("London, UK"));

    expect(screen.getByText(/🏠/)).toBeInTheDocument();
    expect(screen.getByText(/🏢/)).toBeInTheDocument();
    expect(screen.getByText(/⭐/)).toBeInTheDocument();
  });
});
