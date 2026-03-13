import React from "react";
import { render, waitFor } from "@testing-library/react";
import { FriendMap } from "./map-client";

const mockMapContainer = jest.fn(({ children }) => (
  <div data-testid="map-container">{children}</div>
));

jest.mock("react-leaflet", () => ({
  MapContainer: (props: any) => mockMapContainer(props),
  TileLayer: ({ children }: any) => <div data-testid="tile-layer">{children}</div>,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    setView: jest.fn(),
  }),
}));

jest.mock("leaflet", () => ({
  Icon: jest.fn().mockImplementation((options) => ({ options })),
}));

describe("FriendMap (client component)", () => {
  const originalNavigator = global.navigator as Navigator;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock navigator.geolocation for each test
    global.navigator = {
      ...(originalNavigator as any),
      geolocation: {
        getCurrentPosition: jest.fn((success: PositionCallback) =>
          success({
            coords: {
              latitude: 40,
              longitude: -70,
            },
          } as GeolocationPosition),
        ),
      },
    } as any;
  });

  afterEach(() => {
    // Restore original navigator
    global.navigator = originalNavigator as any;
  });

  it("shows loading state while getting user location", () => {
    render(<FriendMap friends={[]} />);
  });

  it("renders map after geolocation succeeds and calculates center from user and friend locations", async () => {
    const friends = [
      {
        id: "friend-1",
        username: "friend1",
        name: "Friend One",
        city: "CityA",
        country: "CountryA",
        location: { lat: 10, lng: 20 },
        pfp: "friend1.png",
      },
      {
        id: "friend-2",
        username: "friend2",
        name: "Friend Two",
        city: "CityB",
        country: "CountryB",
        location: { lat: -5, lng: 30 },
        pfp: "friend2.png",
      },
    ];

    render(<FriendMap friends={friends} />);

    await waitFor(() => {
      expect(mockMapContainer).toHaveBeenCalled();
    });

    const props = mockMapContainer.mock.calls[0][0];

    // Center is average of friend locations when user location has not resolved yet
    const expectedLat = (10 - 5) / 2;
    const expectedLng = (20 + 30) / 2;

    expect(props.center[0]).toBeCloseTo(expectedLat);
    expect(props.center[1]).toBeCloseTo(expectedLng);
  });

  it("falls back to default center and shows error message when geolocation is unavailable", async () => {
    global.navigator = {
      ...(originalNavigator as any),
      geolocation: undefined,
    } as any;

    const { getByText } = render(<FriendMap friends={[]} />);

    await waitFor(() => {
      expect(
        getByText("Geolocation is not supported by your browser — showing default location"),
      ).toBeInTheDocument();
    });

    expect(mockMapContainer).toHaveBeenCalled();
    const props = mockMapContainer.mock.calls[0][0];
    expect(props.center).toEqual([51.505, -0.09]); // DEFAULT_CENTER
  });
});

