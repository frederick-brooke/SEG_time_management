import React from "react";
import { render, screen } from "@testing-library/react";

// Mocks (leaflet is auto-mocked via jest.config moduleNameMapper)

jest.mock("react-leaflet", () => ({
  Marker: ({
    children,
    position,
  }: {
    children: React.ReactNode;
    position: [number, number];
  }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)}>
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
}));

jest.mock("@/src/lib/map", () => ({
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

import { FriendLayer } from "../FriendLayer";
import * as leaflet from "leaflet";

// Get the mock Icon constructor from the leaflet mock
const mockIconConstructor = leaflet.Icon as unknown as jest.Mock;

//  Fixtures
const USER_LOCATION: [number, number] = [51.505, -0.09];

const makeFriend = (
  id: string,
  opts: Partial<{
    name: string;
    username: string;
    pfp: string | null;
    city: string | null;
    country: string | null;
    location: { lat: number; lng: number } | null;
    equippedAvatar?: string;
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

// Tests 

describe("FriendLayer", () => {
  // User marker
  it("renders a marker for userLocation when provided", () => {
    render(<FriendLayer friends={[]} userLocation={USER_LOCATION} />);
    const markers = screen.getAllByTestId("marker");
    expect(markers).toHaveLength(1);
    expect(JSON.parse(markers[0].getAttribute("data-position")!)).toEqual(USER_LOCATION);
  });

  it("shows 'You are here!' popup for the user marker", () => {
    render(<FriendLayer friends={[]} userLocation={USER_LOCATION} />);
    expect(screen.getByText("You are here!")).toBeInTheDocument();
  });

  it("renders nothing when userLocation is null and no friends", () => {
    const { container } = render(<FriendLayer friends={[]} userLocation={null} />);
    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
  });

  // Friend markers
  it("renders a marker for each friend that has a location", () => {
    const friends = [makeFriend("1"), makeFriend("2"), makeFriend("3")];
    render(<FriendLayer friends={friends} userLocation={null} />);
    expect(screen.getAllByTestId("marker")).toHaveLength(3);
  });

  it("does not render a marker for friends without a location", () => {
    const friends = [
      makeFriend("1"),
      makeFriend("2", { location: null }),
    ];
    render(<FriendLayer friends={friends} userLocation={null} />);
    expect(screen.getAllByTestId("marker")).toHaveLength(1);
  });

  it("positions friend markers at the correct lat/lng", () => {
    const friend = makeFriend("1", { location: { lat: 48.8566, lng: 2.3522 } });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    const marker = screen.getByTestId("marker");
    expect(JSON.parse(marker.getAttribute("data-position")!)).toEqual([48.8566, 2.3522]);
  });

  // Friend popup content
  it("shows friend name in popup", () => {
    const friend = makeFriend("1", { name: "Alice" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows city and country in popup when both are present", () => {
    const friend = makeFriend("1", { city: "Paris", country: "France" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    expect(screen.getByText("Paris, France")).toBeInTheDocument();
  });

  it("shows username when city or country is missing", () => {
    const friend = makeFriend("1", {
      city: null,
      country: null,
      username: "alice_99",
    });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    expect(screen.getByText("alice_99")).toBeInTheDocument();
  });

  it("shows username when city is present but country is null", () => {
    const friend = makeFriend("1", { city: "London", country: null, username: "londonuser" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    expect(screen.getByText("londonuser")).toBeInTheDocument();
  });

  it("shows username when country is present but city is null", () => {
    const friend = makeFriend("1", { city: null, country: "UK", username: "ukuser" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    expect(screen.getByText("ukuser")).toBeInTheDocument();
  });

  it("renders profile picture img when pfp is provided", () => {
    const friend = makeFriend("1", { pfp: "/avatar.jpg", name: "Bob" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/avatar.jpg");
    expect(img).toHaveAttribute("alt", "Bob");
  });

  it("does not render img when pfp is null", () => {
    const friend = makeFriend("1", { pfp: null });
    render(<FriendLayer friends={[friend]} userLocation={null} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  // Combined: user + friends
  it("renders user marker plus friend markers when both are present", () => {
    const friends = [makeFriend("1"), makeFriend("2")];
    render(<FriendLayer friends={friends} userLocation={USER_LOCATION} />);
    // 1 user + 2 friends = 3 markers
    expect(screen.getAllByTestId("marker")).toHaveLength(3);
  });

  it("renders all popups for every marker", () => {
    const friends = [makeFriend("1"), makeFriend("2")];
    render(<FriendLayer friends={friends} userLocation={USER_LOCATION} />);
    // 1 user popup + 2 friend popups
    expect(screen.getAllByTestId("popup")).toHaveLength(3);
  });

  // Edge cases
  it("handles an empty friends array without throwing", () => {
    expect(() =>
      render(<FriendLayer friends={[]} userLocation={USER_LOCATION} />)
    ).not.toThrow();
  });

  it("handles all friends missing location without rendering any friend markers", () => {
    const friends = [
      makeFriend("1", { location: null }),
      makeFriend("2", { location: null }),
    ];
    render(<FriendLayer friends={friends} userLocation={USER_LOCATION} />);
    // Only the user marker
    expect(screen.getAllByTestId("marker")).toHaveLength(1);
  });

  // Avatar icon tests
  it("creates an Icon with the correct avatar URL when friend has equippedAvatar", () => {
    mockIconConstructor.mockClear();
    const friend = makeFriend("1", { equippedAvatar: "astronaut-pioneer" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);

    // Should create icons for both user marker and friend marker
    expect(mockIconConstructor).toHaveBeenCalled();
    const iconCalls = mockIconConstructor.mock.calls;

    // Find the call with the avatar URL (not the user icon)
    const avatarCall = iconCalls.find(
      (call) => call[0].iconUrl === "/avatars/astronaut-pioneer.svg"
    );
    expect(avatarCall).toBeDefined();
    expect(avatarCall?.[0].iconSize).toEqual([32, 32]);
  });

  it("uses fallback FRIEND_ICON_URL when friend has no equippedAvatar", () => {
    mockIconConstructor.mockClear();
    const friend = makeFriend("1", { equippedAvatar: undefined });
    render(<FriendLayer friends={[friend]} userLocation={null} />);

    const iconCalls = mockIconConstructor.mock.calls;
    const fallbackCall = iconCalls.find(
      (call) => call[0].iconUrl === "/friend-icon.png"
    );
    expect(fallbackCall).toBeDefined();
  });

  it("uses fallback icon when equippedAvatar is not in AVATAR_IMAGES", () => {
    mockIconConstructor.mockClear();
    const friend = makeFriend("1", { equippedAvatar: "non-existent-avatar" });
    render(<FriendLayer friends={[friend]} userLocation={null} />);

    const iconCalls = mockIconConstructor.mock.calls;
    const fallbackCall = iconCalls.find(
      (call) => call[0].iconUrl === "/friend-icon.png"
    );
    expect(fallbackCall).toBeDefined();
  });

  it("creates different icons for friends with different avatars", () => {
    mockIconConstructor.mockClear();
    const friends = [
      makeFriend("1", { equippedAvatar: "astronaut-pioneer" }),
      makeFriend("2", { equippedAvatar: "nebula-witch" }),
      makeFriend("3", { equippedAvatar: "cosmic-explorer" }),
    ];
    render(<FriendLayer friends={friends} userLocation={null} />);

    const iconCalls = mockIconConstructor.mock.calls;
    const avatarUrls = iconCalls.map((call) => call[0].iconUrl);

    expect(avatarUrls).toContain("/avatars/astronaut-pioneer.svg");
    expect(avatarUrls).toContain("/avatars/nebula-witch.svg");
    expect(avatarUrls).toContain("/avatars/cosmic-explorer.svg");
  });


  it("renders multiple friends with mixed avatar presence", () => {
    mockIconConstructor.mockClear();
    const friends = [
      makeFriend("1", { equippedAvatar: "astronaut-pioneer", name: "Alice" }),
      makeFriend("2", { equippedAvatar: undefined, name: "Bob" }),
      makeFriend("3", { equippedAvatar: "nebula-witch", name: "Charlie" }),
    ];
    render(<FriendLayer friends={friends} userLocation={null} />);

    // Check all friends are rendered
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();

    // Check that correct icons were created
    const iconCalls = mockIconConstructor.mock.calls;
    const avatarUrls = iconCalls.map((call) => call[0].iconUrl);
    expect(avatarUrls).toContain("/avatars/astronaut-pioneer.svg");
    expect(avatarUrls).toContain("/avatars/nebula-witch.svg");
    expect(avatarUrls).toContain("/friend-icon.png"); // For Bob
  });
});
