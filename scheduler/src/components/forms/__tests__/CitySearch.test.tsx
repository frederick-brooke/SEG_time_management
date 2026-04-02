import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { CitySearch } from "../CitySearch"; 

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

window.HTMLElement.prototype.scrollIntoView = jest.fn();

jest.mock("@/components/ui/Popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockCitiesResponse = [
  {
    display_name: "London, Greater London, England, United Kingdom",
    lat: "51.5073219",
    lon: "-0.1276474",
    type: "city",
    importance: 0.9,
  },
  {
    display_name: "London, Middlesex County, Ontario, Canada",
    lat: "42.9836747",
    lon: "-81.2496068",
    type: "city",
    importance: 0.6,
  },
];

describe("CitySearch Component", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    act(() => { jest.runOnlyPendingTimers(); });
    jest.useRealTimers();
  });

  it("renders with the default placeholder when no value is provided", () => {
    render(<CitySearch onChange={mockOnChange} />);
    expect(screen.getByRole("button", { name: /search for a city/i })).toBeInTheDocument();
  });

  it("renders the provided city name when a value is passed", () => {
    const initialValue = { name: "Paris", lat: 48.85, lng: 2.35 };
    render(<CitySearch value={initialValue} onChange={mockOnChange} />);
    expect(screen.getByRole("button", { name: /paris/i })).toBeInTheDocument();
  });

  it("does not fetch if the search term is less than 2 characters", async () => {
    render(<CitySearch onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("Type a city name...");
    fireEvent.change(input, { target: { value: "L" } });

    act(() => { jest.advanceTimersByTime(300); });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches and displays cities after typing and debounce delay", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCitiesResponse,
    });

    render(<CitySearch onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("Type a city name...");
    fireEvent.change(input, { target: { value: "London" } });

    act(() => { jest.advanceTimersByTime(300); });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("q=London"), expect.any(Object));

    await waitFor(() => {
      expect(screen.getByText("London, Greater London, England, United Kingdom")).toBeInTheDocument();
      expect(screen.getByText("London, Middlesex County, Ontario, Canada")).toBeInTheDocument();
    });
  });

  it("calls onChange with correctly parsed data when a city is selected", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCitiesResponse,
    });

    render(<CitySearch onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("Type a city name...");
    fireEvent.change(input, { target: { value: "London" } });

    act(() => { jest.advanceTimersByTime(300); });

    await waitFor(() => {
      expect(screen.getByText("London, Greater London, England, United Kingdom")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("London, Greater London, England, United Kingdom"));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith({
      name: "London, Greater London, England, United Kingdom",
      lat: 51.5073219,
      lng: -0.1276474,
    });
  });

  it("handles fetch errors gracefully and shows error message", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));

    render(<CitySearch onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("Type a city name...");
    fireEvent.change(input, { target: { value: "InvalidCity" } });

    act(() => { jest.advanceTimersByTime(300); });

    await waitFor(() => {
      expect(screen.getByText("Failed to load cities. Please try again.")).toBeInTheDocument();
    });
  });
});