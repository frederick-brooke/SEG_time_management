/**
 * Tests for src/components/calendar/SavedLocationChips.tsx
 */

import React from "react";
import { Button } from "@/components/ui/Button";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SavedLocationChips from "../SavedLocationChips";
import { SavedLocation } from "hooks/useSavedLocations";

// ── Factory helpers 

function createLocation(overrides: Partial<SavedLocation> = {}): SavedLocation {
  return {
    id: "loc-1",
    label: "Home",
    address: "123 Main St, London",
    lat: 51.5,
    lng: -0.1,
    type: "HOME",
    ...overrides,
  };
}

// ── Tests 

describe("SavedLocationChips", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Empty state ──

  it("should render nothing when locations is empty", () => {
    const { container } = render(
      <SavedLocationChips locations={[]} onSelect={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  // ── Rendering ────

  it("should render one chip per location", () => {
    const locations = [
      createLocation({ id: "loc-1", label: "Home" }),
      createLocation({ id: "loc-2", label: "Office", type: "WORK" }),
    ];
    render(<SavedLocationChips locations={locations} onSelect={jest.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("should display the location label in each chip", () => {
    const locations = [createLocation({ label: "Home" })];
    render(<SavedLocationChips locations={locations} onSelect={jest.fn()} />);
    expect(screen.getByText(/Home/)).toBeInTheDocument();
  });

  it("should set the address as the button title", () => {
    const locations = [createLocation({ address: "123 Main St, London" })];
    render(<SavedLocationChips locations={locations} onSelect={jest.fn()} />);
    expect(screen.getByTitle("123 Main St, London")).toBeInTheDocument();
  });

  // ── Type icons ───

  it("should display the 🏠 icon for HOME type", () => {
    render(
      <SavedLocationChips
        locations={[createLocation({ type: "HOME", label: "Home" })]}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByText(/🏠/)).toBeInTheDocument();
  });

  it("should display the 🏢 icon for WORK type", () => {
    render(
      <SavedLocationChips
        locations={[createLocation({ type: "WORK", label: "Office" })]}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByText(/🏢/)).toBeInTheDocument();
  });

  it("should display the ⭐ icon for FAVOURITE type", () => {
    render(
      <SavedLocationChips
        locations={[createLocation({ type: "FAVOURITE", label: "Gym" })]}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByText(/⭐/)).toBeInTheDocument();
  });

  // ── Callbacks ────

  it("should call onSelect with the correct location when a chip is clicked", () => {
    const onSelect = jest.fn();
    const location = createLocation({ id: "loc-1", label: "Home" });
    render(<SavedLocationChips locations={[location]} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /Home/ }));

    expect(onSelect).toHaveBeenCalledWith(location);
  });

  it("should call onSelect with the correct location when the second chip is clicked", () => {
    const onSelect = jest.fn();
    const home = createLocation({ id: "loc-1", label: "Home", type: "HOME" });
    const work = createLocation({ id: "loc-2", label: "Office", type: "WORK", address: "1 Work St" });
    render(
      <SavedLocationChips locations={[home, work]} onSelect={onSelect} />
    );

    fireEvent.click(screen.getByRole("button", { name: /Office/ }));

    expect(onSelect).toHaveBeenCalledWith(work);
    expect(onSelect).not.toHaveBeenCalledWith(home);
  });

  it("should call onSelect once per click", () => {
    const onSelect = jest.fn();
    const location = createLocation();
    render(<SavedLocationChips locations={[location]} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /Home/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  // ── Multiple locations ───

  it("should render all three location types correctly", () => {
    const locations = [
      createLocation({ id: "l1", label: "Home", type: "HOME" }),
      createLocation({ id: "l2", label: "Office", type: "WORK", address: "1 Work St" }),
      createLocation({ id: "l3", label: "Gym", type: "FAVOURITE", address: "1 Gym Rd" }),
    ];
    render(<SavedLocationChips locations={locations} onSelect={jest.fn()} />);

    expect(screen.getByText(/Home/)).toBeInTheDocument();
    expect(screen.getByText(/Office/)).toBeInTheDocument();
    expect(screen.getByText(/Gym/)).toBeInTheDocument();
    expect(screen.getByText(/🏠/)).toBeInTheDocument();
    expect(screen.getByText(/🏢/)).toBeInTheDocument();
    expect(screen.getByText(/⭐/)).toBeInTheDocument();
  });
});