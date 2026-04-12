import React from "react";
import { render } from "@testing-library/react";

// react-leaflet mock 
jest.mock("react-leaflet", () => ({
  useMap: jest.fn(() => mockMapInstance),
}));

// leaflet mock 
const mockMarkerInstance = {
  addTo: jest.fn().mockReturnThis(),
  bindPopup: jest.fn().mockReturnThis(),
  remove: jest.fn(),
};

const mockPopupInstance = {
  setContent: jest.fn().mockReturnThis(),
};

const mockMapInstance = {
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  hasLayer: jest.fn(() => false),
  fitBounds: jest.fn(),
  setView: jest.fn(),
};

jest.mock("leaflet", () => {
  const MockIcon = jest.fn().mockImplementation((opts) => ({ opts }));
  return {
    __esModule: true,
    default: {
      marker: jest.fn(() => mockMarkerInstance),
      popup: jest.fn(() => mockPopupInstance),
      Icon: MockIcon,
    },
    Icon: MockIcon,
    marker: jest.fn(() => mockMarkerInstance),
    popup: jest.fn(() => mockPopupInstance),
  };
});

jest.mock("@/lib/map", () => ({
  USER_ICON_URL: "/user-icon.png",
  FRIEND_ICON_URL: "/friend-icon.png",
}));

jest.mock("@/lib/shop-catalogue", () => ({
  AVATAR_IMAGES: {
    "astronaut-pioneer": "/avatars/astronaut-pioneer.svg",
    "nebula-witch": "/avatars/nebula-witch.svg",
    "cosmic-explorer": "/avatars/cosmic-explorer.svg",
  },
}));

jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { FriendLayer } from "../FriendLayer";
import * as L from "leaflet";
import { useMap } from "react-leaflet";

// helpers 
const USER_LOCATION = { lat: 51.505, lng: -0.09 };

const makeFriend = (
  id: string,
  opts: Partial<{
    name: string;
    username: string;
    pfp: string | null;
    city: string | null;
    country: string | null;
    location: { lat: number; lng: number } | null;
    equippedAvatar: string | undefined;
  }> = {}
) => ({
  id,
  name: `Friend ${id}`,
  username: `user_${id}`,
  pfp: null,
  city: "London",
  country: "UK",
  location: { lat: 51.5, lng: -0.1 },
  ...opts,
});

const flushLeafletImport = () => Promise.resolve().then(() => Promise.resolve());

// tests 
describe("FriendLayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useMap as jest.Mock).mockReturnValue(mockMapInstance);
    mockMarkerInstance.addTo.mockReturnThis();
    mockMarkerInstance.bindPopup.mockReturnThis();
    mockPopupInstance.setContent.mockReturnThis();
  });

  // user marker 

  it("creates a marker at userLocation when provided", async () => {
    render(<FriendLayer friends={[]} userLocation={USER_LOCATION} />);
    await flushLeafletImport();
    expect(L.marker).toHaveBeenCalledWith(
      [USER_LOCATION.lat, USER_LOCATION.lng],
      expect.objectContaining({ icon: expect.anything() })
    );
  });

  it("binds a popup containing 'You are here!' for the user marker", async () => {
    render(<FriendLayer friends={[]} userLocation={USER_LOCATION} />);
    await flushLeafletImport();
    const popupContent = mockPopupInstance.setContent.mock.calls[0]?.[0] ?? "";
    expect(popupContent).toContain("You are here!");
  });

  it("does not create any markers when userLocation is null and no friends", async () => {
    render(<FriendLayer friends={[]} userLocation={null} />);
    await flushLeafletImport();
    expect(L.marker).not.toHaveBeenCalled();
  });

  // friend markers

  it("creates a marker for each friend that has a location", async () => {
    const friends = [makeFriend("1"), makeFriend("2"), makeFriend("3")];
    render(<FriendLayer friends={friends} userLocation={null} />);
    await flushLeafletImport();
    expect(L.marker).toHaveBeenCalledTimes(3);
  });

  it("does not create a marker for friends without a location", async () => {
    const friends = [makeFriend("1"), makeFriend("2", { location: null })];
    render(<FriendLayer friends={friends} userLocation={null} />);
    await flushLeafletImport();
    expect(L.marker).toHaveBeenCalledTimes(1);
  });

  it("positions a friend marker at the correct lat/lng", async () => {
    const friend = makeFriend("1", { location: { lat: 48.8566, lng: 2.3522 } });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    await flushLeafletImport();
    expect(L.marker).toHaveBeenCalledWith(
      [48.8566, 2.3522],
      expect.objectContaining({ icon: expect.anything() })
    );
  });

  // friend popup content

  it("includes the friend's name in the popup", async () => {
    const friend = makeFriend("1", { name: "Alice" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    await flushLeafletImport();
    const popupContent = mockMarkerInstance.bindPopup.mock.calls[0]?.[0] ?? "";
    expect(popupContent).toContain("Alice");
  });

  it("shows city and country when both are present", async () => {
    const friend = makeFriend("1", { city: "Paris", country: "France" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    await flushLeafletImport();
    const popupContent = mockMarkerInstance.bindPopup.mock.calls[0]?.[0] ?? "";
    expect(popupContent).toContain("Paris, France");
  });

  it("shows username when both city and country are null", async () => {
    const friend = makeFriend("1", { city: null, country: null, username: "alice_99" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    await flushLeafletImport();
    const popupContent = mockMarkerInstance.bindPopup.mock.calls[0]?.[0] ?? "";
    expect(popupContent).toContain("alice_99");
  });

  it("shows username when city is present but country is null", async () => {
    const friend = makeFriend("1", { city: "London", country: null, username: "londonuser" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    await flushLeafletImport();
    const popupContent = mockMarkerInstance.bindPopup.mock.calls[0]?.[0] ?? "";
    expect(popupContent).toContain("londonuser");
  });

  it("shows username when country is present but city is null", async () => {
    const friend = makeFriend("1", { city: null, country: "UK", username: "ukuser" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    await flushLeafletImport();
    const popupContent = mockMarkerInstance.bindPopup.mock.calls[0]?.[0] ?? "";
    expect(popupContent).toContain("ukuser");
  });

  it("includes an img tag with the pfp src and name alt when pfp is provided", async () => {
    const friend = makeFriend("1", { pfp: "/avatar.jpg", name: "Bob" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    await flushLeafletImport();
    const popupContent = mockMarkerInstance.bindPopup.mock.calls[0]?.[0] ?? "";
    expect(popupContent).toContain('src="/avatar.jpg"');
    expect(popupContent).toContain('alt="Bob"');
  });

  it("does not include an img tag when pfp is null", async () => {
    const friend = makeFriend("1", { pfp: null });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    await flushLeafletImport();
    const popupContent = mockMarkerInstance.bindPopup.mock.calls[0]?.[0] ?? "";
    expect(popupContent).not.toContain("<img");
  });

  // combined

  it("creates user marker plus one marker per located friend", async () => {
    const friends = [makeFriend("1"), makeFriend("2")];
    render(<FriendLayer friends={friends} userLocation={USER_LOCATION} />);
    await flushLeafletImport();
    expect(L.marker).toHaveBeenCalledTimes(3);
  });

  it("binds a popup to every created marker", async () => {
    const friends = [makeFriend("1"), makeFriend("2")];
    render(<FriendLayer friends={friends} userLocation={USER_LOCATION} />);
    await flushLeafletImport();
    expect(mockMarkerInstance.bindPopup).toHaveBeenCalledTimes(3);
  });

  // edge cases 

  it("handles an empty friends array without throwing", async () => {
    await expect(async () => {
      render(<FriendLayer friends={[]} userLocation={USER_LOCATION} />);
      await flushLeafletImport();
    }).not.toThrow();
  });

  it("renders only the user marker when all friends lack a location", async () => {
    const friends = [
      makeFriend("1", { location: null }),
      makeFriend("2", { location: null }),
    ];
    render(<FriendLayer friends={friends} userLocation={USER_LOCATION} />);
    await flushLeafletImport();
    expect(L.marker).toHaveBeenCalledTimes(1);
  });

  // avatar icons 

  const MockIcon = L.Icon as unknown as jest.Mock;

  it("creates an Icon with the correct avatar URL when equippedAvatar matches", async () => {
    const friend = makeFriend("1", { equippedAvatar: "astronaut-pioneer" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    await flushLeafletImport();
    const urls = MockIcon.mock.calls.map((c) => c[0].iconUrl);
    expect(urls).toContain("/avatars/astronaut-pioneer.svg");
  });

  it("uses iconSize [32, 32] for friend icons", async () => {
    const friend = makeFriend("1", { equippedAvatar: "astronaut-pioneer" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    await flushLeafletImport();
    const avatarCall = MockIcon.mock.calls.find(
      (c) => c[0].iconUrl === "/avatars/astronaut-pioneer.svg"
    );
    expect(avatarCall?.[0].iconSize).toEqual([32, 32]);
  });

  it("falls back to FRIEND_ICON_URL when equippedAvatar is undefined", async () => {
    const friend = makeFriend("1", { equippedAvatar: undefined });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    await flushLeafletImport();
    const urls = MockIcon.mock.calls.map((c) => c[0].iconUrl);
    expect(urls).toContain("/friend-icon.png");
  });

  it("falls back to FRIEND_ICON_URL when equippedAvatar is not in AVATAR_IMAGES", async () => {
    const friend = makeFriend("1", { equippedAvatar: "non-existent-avatar" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    await flushLeafletImport();
    const urls = MockIcon.mock.calls.map((c) => c[0].iconUrl);
    expect(urls).toContain("/friend-icon.png");
  });

  it("creates distinct avatar icons for friends with different avatars", async () => {
    const friends = [
      makeFriend("1", { equippedAvatar: "astronaut-pioneer" }),
      makeFriend("2", { equippedAvatar: "nebula-witch" }),
      makeFriend("3", { equippedAvatar: "cosmic-explorer" }),
    ];
    render(<FriendLayer friends={friends} userLocation={null} />);
    await flushLeafletImport();
    const urls = MockIcon.mock.calls.map((c) => c[0].iconUrl);
    expect(urls).toContain("/avatars/astronaut-pioneer.svg");
    expect(urls).toContain("/avatars/nebula-witch.svg");
    expect(urls).toContain("/avatars/cosmic-explorer.svg");
  });

  it("handles mixed avatar presence across multiple friends", async () => {
    const friends = [
      makeFriend("1", { equippedAvatar: "astronaut-pioneer", name: "Alice" }),
      makeFriend("2", { equippedAvatar: undefined, name: "Bob" }),
      makeFriend("3", { equippedAvatar: "nebula-witch", name: "Charlie" }),
    ];
    render(<FriendLayer friends={friends} userLocation={null} />);
    await flushLeafletImport();

    const urls = MockIcon.mock.calls.map((c) => c[0].iconUrl);
    expect(urls).toContain("/avatars/astronaut-pioneer.svg");
    expect(urls).toContain("/avatars/nebula-witch.svg");
    expect(urls).toContain("/friend-icon.png");

    const popupCalls = mockMarkerInstance.bindPopup.mock.calls.map((c) => c[0] as string);
    expect(popupCalls.some((html) => html.includes("Alice"))).toBe(true);
    expect(popupCalls.some((html) => html.includes("Bob"))).toBe(true);
    expect(popupCalls.some((html) => html.includes("Charlie"))).toBe(true);
  });
});