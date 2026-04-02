import React from "react";
import { Button } from "@/components/ui/Button";
import { render } from "@testing-library/react";

// Mocks 

const mockPanTo = jest.fn();
const mockUseMap = jest.fn();

jest.mock("react-leaflet", () => ({
  MapContainer: ({
    children,
    center,
    zoom,
    style,
    className,
  }: {
    children: React.ReactNode;
    center: [number, number];
    zoom: number;
    style: React.CSSProperties;
    className: string;
  }) => (
    <div
      data-testid="map-container"
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
      style={style}
      className={className}
    >
      {children}
    </div>
  ),
  TileLayer: ({ url, attribution }: { url: string; attribution: string }) => (
    <div data-testid="tile-layer" data-url={url} data-attribution={attribution} />
  ),
  useMap: () => mockUseMap(),
}));

jest.mock("@/lib/map/constants", () => ({
  MAP_HEIGHT: "500px",
}));

import { BaseMap, LocationController } from "../BaseMap";

// Helpers

const CENTER: [number, number] = [51.505, -0.09];

// LocationController 

describe("LocationController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMap.mockReturnValue({ panTo: mockPanTo });
  });

  it("returns null (renders nothing)", () => {
    const { container } = render(<LocationController center={CENTER} />);
    expect(container.firstChild).toBeNull();
  });

  it("does NOT call panTo on the first render (isFirst guard)", () => {
    render(<LocationController center={CENTER} />);
    expect(mockPanTo).not.toHaveBeenCalled();
  });

  it("calls panTo when center prop changes after first render", () => {
    const { rerender } = render(<LocationController center={CENTER} />);
    expect(mockPanTo).not.toHaveBeenCalled();

    const newCenter: [number, number] = [48.8566, 2.3522];
    rerender(<LocationController center={newCenter} />);
    expect(mockPanTo).toHaveBeenCalledTimes(1);
    expect(mockPanTo).toHaveBeenCalledWith(newCenter);
  });

  it("does not call panTo again if center stays the same", () => {
    const { rerender } = render(<LocationController center={CENTER} />);
    rerender(<LocationController center={CENTER} />);
    expect(mockPanTo).not.toHaveBeenCalled();
  });

  it("calls panTo on every subsequent center change", () => {
    const { rerender } = render(<LocationController center={CENTER} />);

    const second: [number, number] = [48.8566, 2.3522];
    rerender(<LocationController center={second} />);

    const third: [number, number] = [40.7128, -74.006];
    rerender(<LocationController center={third} />);

    expect(mockPanTo).toHaveBeenCalledTimes(2);
    expect(mockPanTo).toHaveBeenNthCalledWith(1, second);
    expect(mockPanTo).toHaveBeenNthCalledWith(2, third);
  });
});

// BaseMap

describe("BaseMap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMap.mockReturnValue({ panTo: mockPanTo });
  });

  it("renders MapContainer with correct center and default zoom", () => {
    const { getByTestId } = render(
      <BaseMap center={CENTER}>
        <div data-testid="child" />
      </BaseMap>
    );

    const container = getByTestId("map-container");
    expect(JSON.parse(container.getAttribute("data-center")!)).toEqual(CENTER);
    expect(container.getAttribute("data-zoom")).toBe("12");
  });

  it("renders MapContainer with custom zoom", () => {
    const { getByTestId } = render(
      <BaseMap center={CENTER} zoom={5}>
        <span />
      </BaseMap>
    );
    expect(getByTestId("map-container").getAttribute("data-zoom")).toBe("5");
  });

  it("applies default MAP_HEIGHT to the container style", () => {
    const { getByTestId } = render(
      <BaseMap center={CENTER}>
        <span />
      </BaseMap>
    );
    expect(getByTestId("map-container")).toHaveStyle({ height: "500px", width: "100%" });
  });

  it("applies custom height when provided", () => {
    const { getByTestId } = render(
      <BaseMap center={CENTER} height="300px">
        <span />
      </BaseMap>
    );
    expect(getByTestId("map-container")).toHaveStyle({ height: "300px" });
  });

  it("includes default rounded/border classes in className", () => {
    const { getByTestId } = render(
      <BaseMap center={CENTER}>
        <span />
      </BaseMap>
    );
    const cls = getByTestId("map-container").className;
    expect(cls).toContain("rounded-xl");
    expect(cls).toContain("border");
    expect(cls).toContain("shadow-sm");
    expect(cls).toContain("overflow-hidden");
  });

  it("appends extra className to the container", () => {
    const { getByTestId } = render(
      <BaseMap center={CENTER} className="my-custom-class">
        <span />
      </BaseMap>
    );
    expect(getByTestId("map-container").className).toContain("my-custom-class");
  });

  it("renders children inside the map container", () => {
    const { getByTestId } = render(
      <BaseMap center={CENTER}>
        <div data-testid="inner-child">hello</div>
      </BaseMap>
    );
    expect(getByTestId("inner-child")).toBeInTheDocument();
  });

  it("renders a TileLayer with the OpenStreetMap URL", () => {
    const { getByTestId } = render(
      <BaseMap center={CENTER}>
        <span />
      </BaseMap>
    );
    const tile = getByTestId("tile-layer");
    expect(tile.getAttribute("data-url")).toBe(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    );
  });

  it("renders the TileLayer attribution containing OpenStreetMap", () => {
    const { getByTestId } = render(
      <BaseMap center={CENTER}>
        <span />
      </BaseMap>
    );
    expect(getByTestId("tile-layer").getAttribute("data-attribution")).toContain(
      "OpenStreetMap"
    );
  });

  it("renders LocationController (returns null) without throwing", () => {
    // LocationController renders null — just verify BaseMap mounts cleanly
    expect(() =>
      render(
        <BaseMap center={CENTER}>
          <span />
        </BaseMap>
      )
    ).not.toThrow();
  });
});
